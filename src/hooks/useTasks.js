import { useState, useEffect, useCallback, useRef } from 'react'
import {
  loadTasks, saveTasks, loadTheme, saveTheme,
  loadUserName, saveUserName,
  loadAuth, saveAuth,
  loadNotifications, saveNotifications,
} from '../storage'
import { uid, toKey, getWeekStart, addDays } from '../utils'
import { MAX_TASK_NAME, MAX_USER_NAME } from '../constants'
import { applyMidnightRollover, sealOrphanedSessions } from '../midnight'

export function useTasks() {
  const [tasks, setTasks]             = useState({})
  const [darkMode, setDarkMode]       = useState(false)
  const [loaded, setLoaded]           = useState(false)
  const [tick, setTick]               = useState(0)
  const [userName, setUserNameState]      = useState('')
  const [user, setUser]                   = useState(null)   // { name, email, photo }
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)

  const [todayKey, setTodayKey] = useState(() => toKey(new Date()))
  const [selDate, setSelDate]     = useState(() => toKey(new Date()))
  const selDateRef = useRef(selDate)
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()))
  const [selTaskId, setSelTaskId] = useState(null)

  // Load from AsyncStorage on mount
  useEffect(() => {
    Promise.all([
      loadTasks(), loadTheme(), loadUserName(), loadAuth(), loadNotifications(),
    ]).then(([savedTasks, isDark, savedName, savedUser, notifEnabled]) => {
      const sanitizedTasks = {}
      const nameToPId = {} // Link tasks by name if parentId is missing

      if (savedTasks && typeof savedTasks === 'object') {
        Object.keys(savedTasks).forEach(date => {
          const dayTasks = savedTasks[date]
          if (!Array.isArray(dayTasks)) return

          const seenIds = new Set()
          const cleanDay = []
          
          dayTasks.forEach(task => {
            if (task && task.id && !seenIds.has(task.id)) {
              seenIds.add(task.id)
              const seenSess = new Set()
              const cleanSess = []
              const sessions = Array.isArray(task.sessions) ? task.sessions : []
              
              sessions.forEach(sess => {
                if (!sess) return
                const sId = sess.id || sess.startTime
                if (sId && !seenSess.has(sId)) {
                  seenSess.add(sId)
                  cleanSess.push(sess)
                }
              })
              
              const pId = task.parentId || nameToPId[task.name] || task.id
              if (!nameToPId[task.name]) nameToPId[task.name] = pId

              cleanDay.push({ 
                ...task, 
                sessions: cleanSess,
                favorite: !!task.favorite,
                done: !!task.done,
                parentId: pId
              })
            }
          })
          sanitizedTasks[date] = cleanDay
        })
      }
      // Seal orphaned open sessions from previous days (app closed during active task)
      const sealed = sealOrphanedSessions(sanitizedTasks, toKey(new Date()))
      setTasks(sealed)
      setDarkMode(isDark)
      setUserNameState(savedName)
      setUser(savedUser)
      setNotificationsEnabled(notifEnabled)
      setLoaded(true)
    })
  }, [])

  // Keep selDateRef in sync so mutation callbacks always use the current date
  useEffect(() => { selDateRef.current = selDate }, [selDate])

  // Persist tasks on change
  useEffect(() => {
    if (loaded) saveTasks(tasks)
  }, [tasks, loaded])

  // 1-second tick for live timers
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000)
    return () => clearInterval(id)
  }, [])

  // Carry active tasks from any past day into the new day, then navigate there.
  // Uses no closed-over state: all reads are inside functional updaters or fresh Date calls.
  const runMidnightRollover = useCallback(() => {
    const now = new Date()
    const newDayKey  = toKey(now)
    const midnightTs = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()

    setTasks(prev => applyMidnightRollover(prev, newDayKey, midnightTs))
    setTodayKey(newDayKey)
    setSelDate(newDayKey)
    setWeekStart(getWeekStart(now))
  }, [])

  // Precise timeout fires at the exact midnight boundary
  useEffect(() => {
    const msUntilMidnight = () => {
      const now = new Date()
      return new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1) - now
    }
    const timeout = setTimeout(runMidnightRollover, msUntilMidnight())
    return () => clearTimeout(timeout)
  }, [todayKey, runMidnightRollover])

  // Fallback: check every 30s for date change (handles system clock changes and backgrounding)
  useEffect(() => {
    const interval = setInterval(() => {
      if (toKey(new Date()) !== todayKey) runMidnightRollover()
    }, 30000)
    return () => clearInterval(interval)
  }, [todayKey, runMidnightRollover])

  const toggleDarkMode = useCallback(() => {
    setDarkMode(d => {
      saveTheme(!d)
      return !d
    })
  }, [])

  const toggleNotifications = useCallback(() => {
    setNotificationsEnabled(prev => {
      saveNotifications(!prev)
      return !prev
    })
  }, [])

  // ── Auth ─────────────────────────────────────────────────────────────────

  const login = useCallback((userData) => {
    setUser(userData)
    saveAuth(userData)
    if (userData.name) {
      setUserNameState(userData.name)
      saveUserName(userData.name)
    }
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    setTasks({})
    setUserNameState('')
    setSelDate(toKey(new Date()))
    setSelTaskId(null)
    saveAuth(null)
    saveTasks({})
  }, [])

  // ── Navigation ───────────────────────────────────────────────────────────

  const prevWeek = useCallback(() => setWeekStart(ws => addDays(ws, -7)), [])
  const nextWeek = useCallback(() => setWeekStart(ws => addDays(ws, 7)), [])

  const goToday = useCallback(() => {
    const today = new Date()
    setWeekStart(getWeekStart(today))
    setSelDate(toKey(today))
    setSelTaskId(null)
  }, [])

  const selectDay = useCallback((key) => {
    setSelDate(key)
    setSelTaskId(null)
  }, [])

  const setUserName = useCallback((name) => {
    const trimmed = (name || '').trim().slice(0, MAX_USER_NAME)
    setUserNameState(trimmed)
    saveUserName(trimmed)
  }, [])

  // ── Task actions ─────────────────────────────────────────────────────────

  const addTask = useCallback((name, options = {}) => {
    const trimmed = (name || '').trim().slice(0, MAX_TASK_NAME)
    if (!trimmed) return null
    
    let finalParentId = options.parentId
    let finalTagId = options.tagId
    let isFavorite = false

    // Search for existing project properties
    const lowerName = trimmed.toLowerCase()
    outer: for (const dayTasks of Object.values(tasks)) {
      for (const t of dayTasks) {
        // If parentId matches OR name matches (and no parentId provided)
        const nameMatch = t.name.trim().toLowerCase() === lowerName
        const idMatch = finalParentId && (t.id === finalParentId || t.parentId === finalParentId)
        
        if (idMatch || (!finalParentId && nameMatch)) {
          finalParentId = t.parentId || t.id
          if (!finalTagId) finalTagId = t.tagId
          isFavorite = !!t.favorite
          break outer
        }
      }
    }

    const id = uid()
    const task = {
      id,
      parentId:  finalParentId || id,
      name:      trimmed,
      tagId:     finalTagId || 'other',
      sessions:  [],
      done:      false,
      favorite:  isFavorite,
      createdAt: Date.now(),
    }
    setTasks(prev => ({ ...prev, [selDate]: [...(prev[selDate] ?? []), task] }))
    return task.id
  }, [tasks, selDate])

  const updateTask = useCallback((id, updater) => {
    const dateKey = selDateRef.current
    setTasks(prev => ({
      ...prev,
      [dateKey]: (prev[dateKey] ?? []).map(t => t.id === id ? updater(t) : t),
    }))
  }, [])

  // Toggle favorite across ALL dates (favorite can be from any day)
  const toggleFavorite = useCallback((taskId) => {
    setTasks(prev => {
      // Find parentId of this task
      let pId = taskId
      outer: for (const dayTasks of Object.values(prev)) {
        for (const t of dayTasks) {
          if (t.id === taskId) {
            pId = t.parentId || t.id
            break outer
          }
        }
      }

      const next = {}
      Object.keys(prev).forEach(key => {
        next[key] = prev[key].map(t =>
          (t.id === taskId || (t.parentId && t.parentId === pId))
            ? { ...t, favorite: !t.favorite }
            : t
        )
      })
      return next
    })
  }, [])

  const startTask = useCallback((id) => {
    const now = Date.now()
    setTasks(prev => {
      const dayTasks = prev[selDate] ?? []
      return {
        ...prev,
        [selDate]: dayTasks.map(t => {
          if (t.id === id) {
            const sessions = t.sessions.map(s => s.endTime ? s : { ...s, endTime: now })
            return { ...t, sessions: [...sessions, { id: uid(), startTime: now, endTime: null }], done: false }
          }
          const hasLive = t.sessions.some(s => !s.endTime)
          if (hasLive) {
            return { ...t, sessions: t.sessions.map(s => s.endTime ? s : { ...s, endTime: now }) }
          }
          return t
        }),
      }
    })
  }, [selDate])

  const pauseTask = useCallback((id) => {
    const safeNow = Date.now()
    updateTask(id, t => ({
      ...t,
      sessions: t.sessions.map(s => s.endTime ? s : { ...s, endTime: safeNow }),
    }))
  }, [updateTask])

  const doneTask = useCallback((id) => {
    const safeNow = Date.now()
    updateTask(id, t => ({
      ...t,
      sessions: t.sessions.map(s => s.endTime ? s : { ...s, endTime: safeNow }),
      done: true,
    }))
  }, [updateTask])
  
  const deleteSession = useCallback((taskId, sessionId) => {
    updateTask(taskId, t => ({
      ...t,
      sessions: t.sessions.filter(s => (s.id || s.startTime) !== sessionId)
    }))
  }, [updateTask])

  const updateSession = useCallback((taskId, sessionId, startTime, endTime) => {
    const dateKey = selDateRef.current
    const now = Date.now()
    
    const safeStart = Math.min(startTime, now)
    const safeEnd   = endTime ? Math.min(endTime, now) : null
    const finalEnd  = safeEnd || now

    setTasks(prev => {
      const dayTasks = prev[dateKey] ?? []
      
      const newDayTasks = dayTasks.map(t => {
        // Filter out sessions that are FULLY included in the new range
        // AND clip sessions that partially overlap
        const cleanSessions = t.sessions
          .filter(s => {
            const sId = s.id || s.startTime
            if (sId === sessionId) return true // Keep the session we are editing
            
            const os = Number(s.startTime)
            const oe = s.endTime ? Number(s.endTime) : now
            
            // Delete if FULLY included: (os >= safeStart && oe <= finalEnd)
            const isFullyIncluded = os >= safeStart && oe <= finalEnd
            return !isFullyIncluded
          })
          .map(s => {
            const sId = s.id || s.startTime
            if (sId === sessionId) return { ...s, startTime: safeStart, endTime: safeEnd }
            
            let os = Number(s.startTime)
            let oe = s.endTime ? Number(s.endTime) : now
            
            // Clip if partially overlapping
            // Case A: new range starts inside this session -> clip end of this session
            if (safeStart > os && safeStart < oe) {
              oe = safeStart
            }
            // Case B: new range ends inside this session -> clip start of this session
            if (finalEnd > os && finalEnd < oe) {
              os = finalEnd
            }
            
            // If after clipping the session is invalid (start >= end), it should have been filtered
            // but we double check here just in case.
            return { ...s, startTime: os, endTime: s.endTime ? oe : null }
          })
          // Final safety filter for invalid sessions created by clipping
          .filter(s => {
             const sId = s.id || s.startTime
             if (sId === sessionId) return true
             const os = Number(s.startTime)
             const oe = s.endTime ? Number(s.endTime) : now
             return oe > os + 1000 // sessions must be at least 1s
          })

        return { ...t, sessions: cleanSessions }
      })

      return { ...prev, [dateKey]: newDayTasks }
    })
  }, [])

  const deleteTask = useCallback((id) => {
    const dateKey = selDateRef.current
    setTasks(prev => ({
      ...prev,
      [dateKey]: (prev[dateKey] ?? []).filter(t => t.id !== id),
    }))
    setSelTaskId(prev => prev === id ? null : prev)
  }, [])

  const reorderTasks = useCallback((fromIdx, toIdx) => {
    const dateKey = selDateRef.current
    setTasks(prev => {
      const dayTasks = [...(prev[dateKey] ?? [])]
      const [removed] = dayTasks.splice(fromIdx, 1)
      dayTasks.splice(toIdx, 0, removed)
      return { ...prev, [dateKey]: dayTasks }
    })
  }, [])

  const changeTaskTag = useCallback((id, tagId) => {
    updateTask(id, t => ({ ...t, tagId }))
  }, [updateTask])

  return {
    tasks, darkMode, loaded, tick,
    selDate, weekStart, selTaskId,
    userName, user,
    notificationsEnabled, toggleNotifications,
    setSelTaskId, toggleDarkMode, setUserName,
    login, logout,
    prevWeek, nextWeek, goToday, selectDay,
    addTask, startTask, pauseTask, doneTask, deleteTask, reorderTasks, changeTaskTag,
    toggleFavorite, deleteSession, updateSession,
  }
}

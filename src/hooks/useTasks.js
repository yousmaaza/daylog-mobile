import { useState, useEffect, useCallback } from 'react'
import {
  loadTasks, saveTasks, loadTheme, saveTheme,
  loadUserName, saveUserName,
  loadAuth, saveAuth,
} from '../storage'
import { uid, toKey, getWeekStart, addDays } from '../utils'
import { TASK_PALETTE } from '../constants'

export function useTasks() {
  const [tasks, setTasks]             = useState({})
  const [darkMode, setDarkMode]       = useState(false)
  const [loaded, setLoaded]           = useState(false)
  const [tick, setTick]               = useState(0)
  const [userName, setUserNameState]  = useState('')
  const [user, setUser]               = useState(null)   // { name, email, photo }

  const [todayKey, setTodayKey] = useState(() => toKey(new Date()))
  const [selDate, setSelDate]     = useState(() => toKey(new Date()))
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()))
  const [selTaskId, setSelTaskId] = useState(null)

  // Load from AsyncStorage on mount
  useEffect(() => {
    Promise.all([
      loadTasks(), loadTheme(), loadUserName(), loadAuth(),
    ]).then(([savedTasks, isDark, savedName, savedUser]) => {
      const sanitizedTasks = {}
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
              
              cleanDay.push({ 
                ...task, 
                sessions: cleanSess,
                favorite: !!task.favorite,
                done: !!task.done
              })
            }
          })
          sanitizedTasks[date] = cleanDay
        })
      }
      setTasks(sanitizedTasks)
      setDarkMode(isDark)
      setUserNameState(savedName)
      setUser(savedUser)
      setLoaded(true)
    })
  }, [])

  // Persist tasks on change
  useEffect(() => {
    if (loaded) saveTasks(tasks)
  }, [tasks, loaded])

  // 1-second tick for live timers
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000)
    return () => clearInterval(id)
  }, [])

  // Update todayKey at midnight so new tasks land on the correct date
  useEffect(() => {
    const msUntilMidnight = () => {
      const now = new Date()
      return new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1) - now
    }
    const timeout = setTimeout(() => {
      setTodayKey(toKey(new Date()))
    }, msUntilMidnight())
    return () => clearTimeout(timeout)
  }, [todayKey])

  const toggleDarkMode = useCallback(() => {
    setDarkMode(d => {
      saveTheme(!d)
      return !d
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
    setUserNameState(name)
    saveUserName(name)
  }, [])

  // ── Task actions ─────────────────────────────────────────────────────────

  const addTask = useCallback((name, options = {}) => {
    if (!name.trim()) return null
    const currentDayTasks = tasks[selDate] ?? []
    const task = {
      id:        uid(),
      name:      name.trim(),
      sessions:  [],
      done:      false,
      createdAt: Date.now(),
      tagId:     options.tagId ?? 'other',
      favorite:  false,
    }
    setTasks(prev => ({ ...prev, [selDate]: [...(prev[selDate] ?? []), task] }))
    return task.id
  }, [selDate, tasks])

  const updateTask = useCallback((id, updater) => {
    setTasks(prev => ({
      ...prev,
      [selDate]: (prev[selDate] ?? []).map(t => t.id === id ? updater(t) : t),
    }))
  }, [selDate])

  // Toggle favorite across ALL dates (favorite can be from any day)
  const toggleFavorite = useCallback((taskId) => {
    setTasks(prev => {
      const next = {}
      Object.keys(prev).forEach(key => {
        next[key] = prev[key].map(t =>
          t.id === taskId ? { ...t, favorite: !t.favorite } : t
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
    updateTask(id, t => ({
      ...t,
      sessions: t.sessions.map(s => s.endTime ? s : { ...s, endTime: Date.now() }),
    }))
  }, [updateTask])

  const doneTask = useCallback((id) => {
    updateTask(id, t => ({
      ...t,
      sessions: t.sessions.map(s => s.endTime ? s : { ...s, endTime: Date.now() }),
      done: true,
    }))
  }, [updateTask])

  const deleteTask = useCallback((id) => {
    setTasks(prev => ({
      ...prev,
      [selDate]: (prev[selDate] ?? []).filter(t => t.id !== id),
    }))
    setSelTaskId(prev => prev === id ? null : prev)
  }, [selDate])

  const reorderTasks = useCallback((fromIdx, toIdx) => {
    setTasks(prev => {
      const dayTasks = [...(prev[selDate] ?? [])]
      const [removed] = dayTasks.splice(fromIdx, 1)
      dayTasks.splice(toIdx, 0, removed)
      return { ...prev, [selDate]: dayTasks }
    })
  }, [selDate])

  const changeTaskTag = useCallback((id, tagId) => {
    updateTask(id, t => ({ ...t, tagId }))
  }, [updateTask])

  return {
    tasks, darkMode, loaded, tick,
    selDate, weekStart, selTaskId,
    userName, user,
    setSelTaskId, toggleDarkMode, setUserName,
    login, logout,
    prevWeek, nextWeek, goToday, selectDay,
    addTask, startTask, pauseTask, doneTask, deleteTask, reorderTasks, changeTaskTag,
    toggleFavorite,
  }
}

import { useState, useEffect, useCallback } from 'react'
import {
  loadTasks, saveTasks, loadTheme, saveTheme,
  loadTemplates, saveTemplates, loadUserName, saveUserName,
  loadAuth, saveAuth,
} from '../storage'
import { uid, toKey, getWeekStart, addDays } from '../utils'
import { TASK_PALETTE } from '../constants'

export function useTasks() {
  const [tasks, setTasks]             = useState({})
  const [darkMode, setDarkMode]       = useState(false)
  const [loaded, setLoaded]           = useState(false)
  const [tick, setTick]               = useState(0)
  const [templates, setTemplates]     = useState([])
  const [userName, setUserNameState]  = useState('')
  const [user, setUser]               = useState(null)   // { name, email, photo }

  const todayKey = toKey(new Date())
  const [selDate, setSelDate]     = useState(todayKey)
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()))
  const [selTaskId, setSelTaskId] = useState(null)

  // Load from AsyncStorage on mount
  useEffect(() => {
    Promise.all([
      loadTasks(), loadTheme(), loadTemplates(), loadUserName(), loadAuth(),
    ]).then(([savedTasks, isDark, savedTemplates, savedName, savedUser]) => {
      setTasks(savedTasks)
      setDarkMode(isDark)
      setTemplates(savedTemplates)
      setUserNameState(savedName)
      setUser(savedUser)
      setLoaded(true)
    })
  }, [])

  // Persist tasks on change
  useEffect(() => {
    if (loaded) saveTasks(tasks)
  }, [tasks, loaded])

  // Persist templates on change
  useEffect(() => {
    if (loaded) saveTemplates(templates)
  }, [templates, loaded])

  // 1-second tick for live timers
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000)
    return () => clearInterval(id)
  }, [])

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
    saveAuth(null)
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

  // ── Template actions ─────────────────────────────────────────────────────

  const addTemplate = useCallback((name) => {
    if (!name.trim()) return
    setTemplates(prev => {
      if (prev.includes(name.trim())) return prev
      return [...prev, name.trim()]
    })
  }, [])

  const removeTemplate = useCallback((name) => {
    setTemplates(prev => prev.filter(t => t !== name))
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
      colorIdx:  currentDayTasks.length % TASK_PALETTE.length,
      createdAt: Date.now(),
      tags:      options.tags ?? [],
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
      let latestEnd = 0
      dayTasks.forEach(t => {
        t.sessions.forEach(s => {
          if (s.endTime && s.endTime > latestEnd) latestEnd = s.endTime
        })
      })
      const startTime = latestEnd > 0 ? latestEnd : now
      return {
        ...prev,
        [selDate]: dayTasks.map(t => {
          if (t.id === id) {
            const sessions = t.sessions.map(s => s.endTime ? s : { ...s, endTime: startTime })
            return { ...t, sessions: [...sessions, { id: uid(), startTime, endTime: null }], done: false }
          }
          const hasLive = t.sessions.some(s => !s.endTime)
          if (hasLive) {
            return { ...t, sessions: t.sessions.map(s => s.endTime ? s : { ...s, endTime: startTime }) }
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

  return {
    tasks, darkMode, loaded, tick,
    selDate, weekStart, selTaskId,
    templates, userName, user,
    setSelTaskId, toggleDarkMode, setUserName,
    login, logout,
    prevWeek, nextWeek, goToday, selectDay,
    addTask, startTask, pauseTask, doneTask, deleteTask, reorderTasks,
    addTemplate, removeTemplate,
    toggleFavorite,
  }
}

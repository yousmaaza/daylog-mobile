import { useEffect, useRef } from 'react'
import { Platform } from 'react-native'
import { formatLive } from '../utils'

const NOTIF_ID = 'daylog-active-task'

let Notifications = null;
try {
  Notifications = require('expo-notifications');
  // Don't show banner pop-up when app is in foreground — only show in tray
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert:  false,
      shouldPlaySound:  false,
      shouldSetBadge:   false,
    }),
  })
} catch (err) {
  console.log('Expo notifications disabled or unavailable:', err);
}

export function useTaskNotification(tasks, tick) {
  const permRef        = useRef(false)
  const lastUpdateRef  = useRef(0)
  const lastTaskIdRef  = useRef(null)

  // ── Setup: permissions + Android channel ──────────────────────────────────
  useEffect(() => {
    if (!Notifications) return

    if (Platform.OS === 'android') {
      try {
        Notifications.setNotificationChannelAsync('task-timer', {
          name:           'Task Timer',
          importance:     Notifications.AndroidImportance.LOW,
          enableVibrate:  false,
          sound:          null,
        }).catch(() => {})
      } catch (err) {}
    }

    try {
      Notifications.requestPermissionsAsync()
        .then(({ status }) => { permRef.current = status === 'granted' })
        .catch(() => {})
    } catch (err) {}

    return () => {
      if (Notifications) {
        try { Notifications.dismissNotificationAsync(NOTIF_ID).catch(() => {}) } catch (e) {}
      }
    }
  }, [])

  // ── Update notification every ~30s when a task is live ────────────────────
  useEffect(() => {
    // Find the first live session across all dates
    let activeTask      = null
    let activeStartTime = null

    outer: for (const dayTasks of Object.values(tasks)) {
      for (const task of dayTasks) {
        const liveSession = task.sessions.find(s => !s.endTime)
        if (liveSession) {
          activeTask      = task
          activeStartTime = liveSession.startTime
          break outer
        }
      }
    }

    if (!activeTask) {
      if (Notifications) {
        try { Notifications.dismissNotificationAsync(NOTIF_ID).catch(() => {}) } catch (e) {}
      }
      lastTaskIdRef.current = null
      return
    }

    const elapsed      = Date.now() - activeStartTime
    const now          = Date.now()
    const taskChanged  = lastTaskIdRef.current !== activeTask.id
    const timeSinceLast = now - lastUpdateRef.current

    // Skip update if same task and less than 30 seconds since last update
    if (!taskChanged && timeSinceLast < 30000) return

    lastTaskIdRef.current = activeTask.id
    lastUpdateRef.current = now

    if (Notifications && permRef.current) {
      try {
        Notifications.scheduleNotificationAsync({
          identifier: NOTIF_ID,
          content: {
            title:    `⏱ ${activeTask.name}`,
            body:     `En cours · ${formatLive(elapsed)}`,
            sticky:   true,
            sound:    false,
            color:    '#7C5CFC',
            data:     { taskId: activeTask.id },
          },
          trigger: null,
        }).catch(() => {})
      } catch (e) {}
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, tasks])
}
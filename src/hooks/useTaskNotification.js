import { useEffect, useRef } from 'react'
import { Alert, AppState } from 'react-native'
import * as Notifications from 'expo-notifications'
import { getTaskStatus, getTotalMs } from '../utils'

const THREE_HOURS_MS = 3 * 60 * 60 * 1000

const TAG_EMOJI = {
  work:         '💼',
  sport:        '🏃',
  meeting:      '🤝',
  lunch_dinner: '🍽️',
  commute:      '🚗',
  study:        '📚',
  home:         '🏠',
  personal:     '🧘',
  other:        '⏱️',
}

function getEmoji(task) {
  const tagId = task.tagId || (task.tags && task.tags[0]) || 'other'
  return TAG_EMOJI[tagId] ?? '⏱️'
}

function findActiveTask(tasks) {
  for (const dateKey of Object.keys(tasks)) {
    for (const task of tasks[dateKey]) {
      if (getTaskStatus(task) === 'active') return task
    }
  }
  return null
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
})

export function useTaskNotification(tasks, tick, notificationsEnabled) {
  const alertedIds   = useRef(new Set())
  const permGranted  = useRef(false)
  const bgNotifId    = useRef(null)

  const tasksRef   = useRef(tasks)
  const enabledRef = useRef(notificationsEnabled)
  useEffect(() => { tasksRef.current = tasks },                   [tasks])
  useEffect(() => { enabledRef.current = notificationsEnabled },  [notificationsEnabled])

  // ── Permission request ────────────────────────────────────────────────────
  useEffect(() => {
    Notifications.requestPermissionsAsync().then(({ status }) => {
      permGranted.current = status === 'granted'
    })
  }, [])

  // ── Background: schedule a single notification at the 3h mark ────────────
  useEffect(() => {
    const sub = AppState.addEventListener('change', async (nextState) => {
      if (nextState.match(/inactive|background/)) {
        if (!enabledRef.current || !permGranted.current) return
        const active = findActiveTask(tasksRef.current)
        if (!active) return

        const elapsed  = getTotalMs(active, Date.now())
        const remaining = THREE_HOURS_MS - elapsed
        if (remaining <= 0) return // already past 3h, alert was shown in foreground

        const emoji = getEmoji(active)
        bgNotifId.current = await Notifications.scheduleNotificationAsync({
          content: {
            title: `${emoji} ${active.name}`,
            body:  'Tourne depuis plus de 3 heures.',
          },
          trigger: { seconds: Math.ceil(remaining / 1000) },
        }).catch(() => null)

      } else if (nextState === 'active') {
        if (bgNotifId.current) {
          await Notifications.cancelScheduledNotificationAsync(bgNotifId.current).catch(() => {})
          bgNotifId.current = null
        }
      }
    })
    return () => sub.remove()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Per-tick: show an in-app Alert once when a task hits 3h ──────────────
  useEffect(() => {
    if (!notificationsEnabled || !tasks) return
    const now        = Date.now()
    const activeTask = findActiveTask(tasks)

    if (!activeTask) {
      alertedIds.current.clear()
      return
    }

    if (alertedIds.current.has(activeTask.id)) return

    const elapsed = getTotalMs(activeTask, now)
    if (elapsed >= THREE_HOURS_MS) {
      alertedIds.current.add(activeTask.id)
      const emoji = getEmoji(activeTask)
      Alert.alert(
        `${emoji} Tâche longue`,
        `"${activeTask.name}" tourne depuis plus de 3 heures. Tu veux la terminer ?`,
        [
          { text: 'Continuer', style: 'cancel' },
          {
            text: 'Terminer',
            onPress: () => Alert.alert('', 'Appuie sur Terminer dans la carte de la tâche.'),
          },
        ],
      )
    }
  }, [tick, tasks, notificationsEnabled])
}

import { useEffect, useRef } from 'react'
import { Alert, AppState } from 'react-native'
import * as Notifications from 'expo-notifications'
import { getTaskStatus, getTotalMs, formatLive } from '../utils'

const THREE_HOURS_MS      = 3 * 60 * 60 * 1000
const BG_INTERVAL_SEC     = 5 * 60          // 5 minutes between each background notification
const BG_SLOTS            = 36              // 36 × 5min = 3 hours of coverage

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

// Show foreground notifications as banners
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
})

export function useTaskNotification(tasks, tick, notificationsEnabled) {
  const alertedIds     = useRef(new Set())
  const timerNotifId   = useRef(null)
  const lastMinuteTick = useRef(-1)
  const permGranted    = useRef(false)
  const bgNotifIds     = useRef([])

  // Stable refs so the AppState callback (registered once) always sees latest values
  const tasksRef   = useRef(tasks)
  const enabledRef = useRef(notificationsEnabled)
  useEffect(() => { tasksRef.current = tasks },              [tasks])
  useEffect(() => { enabledRef.current = notificationsEnabled }, [notificationsEnabled])

  // ── Permission request ────────────────────────────────────────────────────
  useEffect(() => {
    Notifications.requestPermissionsAsync().then(({ status }) => {
      permGranted.current = status === 'granted'
    })
  }, [])

  // ── Helpers ───────────────────────────────────────────────────────────────
  async function cancelBgNotifs() {
    for (const id of bgNotifIds.current) {
      await Notifications.cancelScheduledNotificationAsync(id).catch(() => {})
    }
    bgNotifIds.current = []
  }

  async function scheduleBgNotifs(task) {
    await cancelBgNotifs()
    if (!permGranted.current) return

    const now   = Date.now()
    const emoji = getEmoji(task)
    const ids   = []

    for (let i = 1; i <= BG_SLOTS; i++) {
      const seconds   = i * BG_INTERVAL_SEC
      const futureMs  = now + seconds * 1000
      const elapsed   = formatLive(getTotalMs(task, futureMs))

      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: `${emoji} ${task.name}`,
          body:  `En cours depuis ${elapsed}`,
        },
        trigger: { seconds },
      })
      ids.push(id)
    }
    bgNotifIds.current = ids
  }

  // ── AppState: background → schedule; foreground → cancel ─────────────────
  useEffect(() => {
    const sub = AppState.addEventListener('change', async (nextState) => {
      if (nextState.match(/inactive|background/)) {
        if (!enabledRef.current) return
        const active = findActiveTask(tasksRef.current)
        if (active) await scheduleBgNotifs(active)
      } else if (nextState === 'active') {
        await cancelBgNotifs()
        lastMinuteTick.current = -1  // force immediate foreground notification refresh
      }
    })
    return () => sub.remove()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Per-tick: 3h alert + foreground timer notification ────────────────────
  useEffect(() => {
    if (!tasks) return
    const now        = Date.now()
    const activeTask = findActiveTask(tasks)

    if (!activeTask) alertedIds.current.clear()

    // 3-hour in-app alert
    if (notificationsEnabled && activeTask && !alertedIds.current.has(activeTask.id)) {
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
    }

    // Foreground notification — update once per minute
    if (!permGranted.current) return
    const minute = Math.floor(tick / 60)

    if (activeTask && notificationsEnabled) {
      if (minute !== lastMinuteTick.current) {
        lastMinuteTick.current = minute
        const emoji   = getEmoji(activeTask)
        const elapsed = formatLive(getTotalMs(activeTask, now))

        ;(async () => {
          if (timerNotifId.current) {
            await Notifications.cancelScheduledNotificationAsync(timerNotifId.current).catch(() => {})
          }
          timerNotifId.current = await Notifications.scheduleNotificationAsync({
            content: {
              title: `${emoji} ${activeTask.name}`,
              body:  `En cours depuis ${elapsed}`,
            },
            trigger: null,
          })
        })()
      }
    } else {
      if (timerNotifId.current) {
        Notifications.cancelScheduledNotificationAsync(timerNotifId.current).catch(() => {})
        timerNotifId.current   = null
        lastMinuteTick.current = -1
      }
    }
  }, [tick, tasks, notificationsEnabled])

  // ── Cleanup on unmount ────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (timerNotifId.current) {
        Notifications.cancelScheduledNotificationAsync(timerNotifId.current).catch(() => {})
      }
      cancelBgNotifs()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
}

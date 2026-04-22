import { uid } from './utils'

/**
 * Closes any open sessions on past days at midnightTs and creates a
 * continuation task on newDayKey with a fresh session starting at midnightTs.
 *
 * Pure function — returns a new tasks object, never mutates the input.
 *
 * @param {Object} tasks       - { "YYYY-MM-DD": Task[] }
 * @param {string} newDayKey   - the new day key, e.g. "2026-04-23"
 * @param {number} midnightTs  - Unix timestamp of midnight (start of newDayKey)
 * @param {Function} generateId - optional ID generator (injectable for tests)
 */
export function applyMidnightRollover(tasks, newDayKey, midnightTs, generateId = uid) {
  const next = { ...tasks }

  Object.keys(tasks).forEach(dateKey => {
    if (dateKey === newDayKey) return

    next[dateKey] = tasks[dateKey].map(task => {
      if (!task.sessions.some(s => !s.endTime)) return task

      // Close the open session at midnight
      const closedTask = {
        ...task,
        sessions: task.sessions.map(s => s.endTime ? s : { ...s, endTime: midnightTs }),
      }

      // Add a continuation on the new day (idempotent: skip if already present)
      const newDayTasks = next[newDayKey] ?? []
      if (!newDayTasks.some(t => t.id === task.id)) {
        next[newDayKey] = [
          ...newDayTasks,
          {
            ...task,
            sessions: [{ id: generateId(), startTime: midnightTs, endTime: null }],
            done: false,
          },
        ]
      }

      return closedTask
    })
  })

  return next
}

/**
 * On app startup, closes any open sessions from days prior to todayKey.
 * The session is capped at midnight of the day after it started — we do NOT
 * auto-carry the task to today (the user decides whether to resume).
 *
 * Pure function — returns a new tasks object.
 *
 * @param {Object} tasks    - { "YYYY-MM-DD": Task[] }
 * @param {string} todayKey - today's key, e.g. "2026-04-23"
 */
export function sealOrphanedSessions(tasks, todayKey) {
  const result = { ...tasks }

  Object.keys(tasks).forEach(dateKey => {
    if (dateKey === todayKey) return

    const [y, m, d] = dateKey.split('-').map(Number)
    const nextDayMidnight = new Date(y, m - 1, d + 1).getTime()

    result[dateKey] = tasks[dateKey].map(task => {
      if (!task.sessions.some(s => !s.endTime)) return task
      return {
        ...task,
        sessions: task.sessions.map(s => s.endTime ? s : { ...s, endTime: nextDayMidnight }),
      }
    })
  })

  return result
}

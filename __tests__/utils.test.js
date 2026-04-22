import { toKey, getTotalMs, formatLive, formatShort, getTaskStatus } from '../src/utils'

// ── toKey ─────────────────────────────────────────────────────────────────────

describe('toKey', () => {
  test('formats date as YYYY-MM-DD', () => {
    expect(toKey(new Date(2026, 3, 23))).toBe('2026-04-23')
  })

  test('pads single-digit month and day', () => {
    expect(toKey(new Date(2026, 0, 5))).toBe('2026-01-05')
  })

  test('end of year', () => {
    expect(toKey(new Date(2025, 11, 31))).toBe('2025-12-31')
  })
})

// ── getTotalMs ────────────────────────────────────────────────────────────────

describe('getTotalMs', () => {
  const now = new Date(2026, 3, 23, 1, 0, 0).getTime() // 01:00:00

  test('no sessions → 0', () => {
    const task = { sessions: [] }
    expect(getTotalMs(task, now)).toBe(0)
  })

  test('one completed session', () => {
    const start = now - 5 * 60 * 1000
    const end   = now
    const task = { sessions: [{ startTime: start, endTime: end }] }
    expect(getTotalMs(task, now)).toBe(5 * 60 * 1000)
  })

  test('one active session uses `now` as end', () => {
    const start = now - 3 * 60 * 1000
    const task = { sessions: [{ startTime: start, endTime: null }] }
    expect(getTotalMs(task, now)).toBe(3 * 60 * 1000)
  })

  test('multiple sessions are summed', () => {
    const task = {
      sessions: [
        { startTime: now - 10 * 60 * 1000, endTime: now - 8 * 60 * 1000 }, // 2min
        { startTime: now - 5 * 60 * 1000,  endTime: now - 2 * 60 * 1000 }, // 3min
      ],
    }
    expect(getTotalMs(task, now)).toBe(5 * 60 * 1000)
  })

  test('closed + active sessions are summed, active uses `now`', () => {
    const task = {
      sessions: [
        { startTime: now - 10 * 60 * 1000, endTime: now - 8 * 60 * 1000 }, // 2min closed
        { startTime: now - 3 * 60 * 1000,  endTime: null },                  // 3min active
      ],
    }
    expect(getTotalMs(task, now)).toBe(5 * 60 * 1000)
  })
})

// ── formatLive ────────────────────────────────────────────────────────────────

describe('formatLive', () => {
  test('zero → 00:00', () => {
    expect(formatLive(0)).toBe('00:00')
  })

  test('negative → 00:00', () => {
    expect(formatLive(-1000)).toBe('00:00')
  })

  test('30 seconds → 00:30', () => {
    expect(formatLive(30 * 1000)).toBe('00:30')
  })

  test('1 minute → 01:00', () => {
    expect(formatLive(60 * 1000)).toBe('01:00')
  })

  test('59 minutes 59 seconds → 59:59', () => {
    expect(formatLive((59 * 60 + 59) * 1000)).toBe('59:59')
  })

  test('1 hour → 1:00:00', () => {
    expect(formatLive(3600 * 1000)).toBe('1:00:00')
  })

  test('1h 23m 45s → 1:23:45', () => {
    expect(formatLive((3600 + 23 * 60 + 45) * 1000)).toBe('1:23:45')
  })

  test('pads minutes and seconds with leading zeros', () => {
    expect(formatLive((3600 + 5 * 60 + 3) * 1000)).toBe('1:05:03')
  })
})

// ── formatShort ───────────────────────────────────────────────────────────────

describe('formatShort', () => {
  test('0 → 0s', () => {
    expect(formatShort(0)).toBe('0s')
  })

  test('45 seconds → 45s', () => {
    expect(formatShort(45 * 1000)).toBe('45s')
  })

  test('2 minutes → 2m', () => {
    expect(formatShort(2 * 60 * 1000)).toBe('2m')
  })

  test('1h 30m → 1h 30m', () => {
    expect(formatShort((3600 + 30 * 60) * 1000)).toBe('1h 30m')
  })

  test('exactly 1 hour → 1h', () => {
    expect(formatShort(3600 * 1000)).toBe('1h')
  })
})

// ── getTaskStatus ─────────────────────────────────────────────────────────────

describe('getTaskStatus', () => {
  test('no sessions → idle', () => {
    const task = { done: false, sessions: [] }
    expect(getTaskStatus(task)).toBe('idle')
  })

  test('done=true → done (regardless of sessions)', () => {
    const task = { done: true, sessions: [{ startTime: 1000, endTime: null }] }
    expect(getTaskStatus(task)).toBe('done')
  })

  test('last session open → active', () => {
    const task = { done: false, sessions: [{ startTime: 1000, endTime: null }] }
    expect(getTaskStatus(task)).toBe('active')
  })

  test('last session closed → idle', () => {
    const task = { done: false, sessions: [{ startTime: 1000, endTime: 2000 }] }
    expect(getTaskStatus(task)).toBe('idle')
  })

  test('multiple sessions, last open → active', () => {
    const task = {
      done: false,
      sessions: [
        { startTime: 1000, endTime: 2000 },
        { startTime: 3000, endTime: null },
      ],
    }
    expect(getTaskStatus(task)).toBe('active')
  })

  test('multiple sessions, all closed → idle', () => {
    const task = {
      done: false,
      sessions: [
        { startTime: 1000, endTime: 2000 },
        { startTime: 3000, endTime: 4000 },
      ],
    }
    expect(getTaskStatus(task)).toBe('idle')
  })
})

import { applyMidnightRollover, sealOrphanedSessions } from '../src/midnight'

// ── Timestamps ────────────────────────────────────────────────────────────────

const D22_2354  = new Date(2026, 3, 22, 23, 54, 0, 0).getTime()  // Wed April 22 23:54
const D22_2359  = new Date(2026, 3, 22, 23, 59, 0, 0).getTime()  // Wed April 22 23:59
const D23_MIDI  = new Date(2026, 3, 23,  0,  0, 0, 0).getTime()  // Thu April 23 00:00 — midnight
const D23_0003  = new Date(2026, 3, 23,  0,  3, 0, 0).getTime()  // Thu April 23 00:03
const D21_MIDI  = new Date(2026, 3, 22,  0,  0, 0, 0).getTime()  // Wed April 22 00:00 — midnight of Tue→Wed

const KEY_22 = '2026-04-22'
const KEY_23 = '2026-04-23'
const KEY_21 = '2026-04-21'

// Deterministic ID generator for tests
let _idCounter = 0
const fakeId = () => `test-id-${++_idCounter}`
beforeEach(() => { _idCounter = 0 })

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeTask(id, sessions, extra = {}) {
  return { id, name: `Task ${id}`, sessions, done: false, favorite: false, tagId: 'other', ...extra }
}

function makeSession(start, end = null, id = 'sess-1') {
  return { id, startTime: start, endTime: end }
}

// ── applyMidnightRollover ─────────────────────────────────────────────────────

describe('applyMidnightRollover', () => {
  test('no active sessions → tasks unchanged', () => {
    const task = makeTask('t1', [makeSession(D22_2354, D22_2359)])
    const tasks = { [KEY_22]: [task] }

    const result = applyMidnightRollover(tasks, KEY_23, D23_MIDI, fakeId)

    expect(result[KEY_22][0].sessions[0].endTime).toBe(D22_2359)
    expect(result[KEY_23]).toBeUndefined()
  })

  test('active session on old day → closed at midnight', () => {
    const task = makeTask('t1', [makeSession(D22_2354)])
    const tasks = { [KEY_22]: [task] }

    const result = applyMidnightRollover(tasks, KEY_23, D23_MIDI, fakeId)

    expect(result[KEY_22][0].sessions[0].endTime).toBe(D23_MIDI)
  })

  test('active session → continuation created on new day', () => {
    const task = makeTask('t1', [makeSession(D22_2354)])
    const tasks = { [KEY_22]: [task] }

    const result = applyMidnightRollover(tasks, KEY_23, D23_MIDI, fakeId)

    expect(result[KEY_23]).toHaveLength(1)
    const cont = result[KEY_23][0]
    expect(cont.id).toBe('t1')
    expect(cont.sessions).toHaveLength(1)
    expect(cont.sessions[0].startTime).toBe(D23_MIDI)
    expect(cont.sessions[0].endTime).toBeNull()
  })

  test('continuation task has done=false even if original was done', () => {
    const task = makeTask('t1', [makeSession(D22_2354)], { done: true })
    const tasks = { [KEY_22]: [task] }

    const result = applyMidnightRollover(tasks, KEY_23, D23_MIDI, fakeId)

    expect(result[KEY_23][0].done).toBe(false)
  })

  test('multiple active tasks on same day → all continued', () => {
    const t1 = makeTask('t1', [makeSession(D22_2354)])
    const t2 = makeTask('t2', [makeSession(D22_2359)])
    const tasks = { [KEY_22]: [t1, t2] }

    const result = applyMidnightRollover(tasks, KEY_23, D23_MIDI, fakeId)

    expect(result[KEY_22][0].sessions[0].endTime).toBe(D23_MIDI)
    expect(result[KEY_22][1].sessions[0].endTime).toBe(D23_MIDI)
    expect(result[KEY_23]).toHaveLength(2)
    expect(result[KEY_23].map(t => t.id).sort()).toEqual(['t1', 't2'])
  })

  test('inactive tasks on old day are not continued', () => {
    const active   = makeTask('active',   [makeSession(D22_2354)])
    const inactive = makeTask('inactive', [makeSession(D22_2354, D22_2359)])
    const tasks = { [KEY_22]: [active, inactive] }

    const result = applyMidnightRollover(tasks, KEY_23, D23_MIDI, fakeId)

    expect(result[KEY_23]).toHaveLength(1)
    expect(result[KEY_23][0].id).toBe('active')
  })

  test('idempotent: calling twice does not duplicate the continuation', () => {
    const task = makeTask('t1', [makeSession(D22_2354)])
    const tasks = { [KEY_22]: [task] }

    const once  = applyMidnightRollover(tasks,  KEY_23, D23_MIDI, fakeId)
    const twice = applyMidnightRollover(once,   KEY_23, D23_MIDI, fakeId)

    expect(twice[KEY_23]).toHaveLength(1)
  })

  test('task on old day that already has its session closed is left alone', () => {
    const task = makeTask('t1', [makeSession(D22_2354, D22_2359)])
    const tasks = { [KEY_22]: [task] }

    const result = applyMidnightRollover(tasks, KEY_23, D23_MIDI, fakeId)

    expect(result[KEY_22][0].sessions[0].endTime).toBe(D22_2359) // unchanged
    expect(result[KEY_23]).toBeUndefined()
  })

  test('only the open session is closed; closed sessions in same task untouched', () => {
    // task with a previous closed session + a new open session
    const task = makeTask('t1', [
      makeSession(D22_2354, D22_2359, 'sess-1'),
      makeSession(D22_2359, null, 'sess-2'),
    ])
    const tasks = { [KEY_22]: [task] }

    const result = applyMidnightRollover(tasks, KEY_23, D23_MIDI, fakeId)

    expect(result[KEY_22][0].sessions[0].endTime).toBe(D22_2359) // closed session unchanged
    expect(result[KEY_22][0].sessions[1].endTime).toBe(D23_MIDI) // open session closed
  })

  test('active task two days old is still carried to the new day', () => {
    const task  = makeTask('t1', [makeSession(D22_2354)])
    const tasks = { [KEY_21]: [task] }

    const result = applyMidnightRollover(tasks, KEY_23, D23_MIDI, fakeId)

    expect(result[KEY_21][0].sessions[0].endTime).toBe(D23_MIDI)
    expect(result[KEY_23]).toHaveLength(1)
    expect(result[KEY_23][0].id).toBe('t1')
  })

  test('tasks already on new day are not touched', () => {
    const existing = makeTask('today', [makeSession(D23_0003)])
    const active   = makeTask('carry',  [makeSession(D22_2354)])
    const tasks = { [KEY_23]: [existing], [KEY_22]: [active] }

    const result = applyMidnightRollover(tasks, KEY_23, D23_MIDI, fakeId)

    // Original Thursday task untouched
    expect(result[KEY_23].find(t => t.id === 'today')).toBeTruthy()
    // Carried task appended
    expect(result[KEY_23].find(t => t.id === 'carry')).toBeTruthy()
    expect(result[KEY_23]).toHaveLength(2)
  })

  test('continuation session id is generated by the injected generator', () => {
    const task  = makeTask('t1', [makeSession(D22_2354)])
    const tasks = { [KEY_22]: [task] }
    let called = 0
    const customId = () => { called++; return `custom-${called}` }

    const result = applyMidnightRollover(tasks, KEY_23, D23_MIDI, customId)

    expect(called).toBe(1)
    expect(result[KEY_23][0].sessions[0].id).toBe('custom-1')
  })

  test('original task metadata (name, tagId, favorite) preserved on continuation', () => {
    const task = makeTask('t1', [makeSession(D22_2354)], { tagId: 'study', favorite: true, name: 'Révision' })
    const tasks = { [KEY_22]: [task] }

    const result = applyMidnightRollover(tasks, KEY_23, D23_MIDI, fakeId)

    const cont = result[KEY_23][0]
    expect(cont.name).toBe('Révision')
    expect(cont.tagId).toBe('study')
    expect(cont.favorite).toBe(true)
  })

  test('input tasks object is not mutated', () => {
    const task  = makeTask('t1', [makeSession(D22_2354)])
    const tasks = { [KEY_22]: [task] }
    const origSession = tasks[KEY_22][0].sessions[0]

    applyMidnightRollover(tasks, KEY_23, D23_MIDI, fakeId)

    expect(origSession.endTime).toBeNull()  // original untouched
    expect(tasks[KEY_23]).toBeUndefined()
  })
})

// ── sealOrphanedSessions ──────────────────────────────────────────────────────

describe('sealOrphanedSessions', () => {
  test('today\'s open sessions untouched', () => {
    const task  = makeTask('t1', [makeSession(D23_0003)])
    const tasks = { [KEY_23]: [task] }

    const result = sealOrphanedSessions(tasks, KEY_23)

    expect(result[KEY_23][0].sessions[0].endTime).toBeNull()
  })

  test('past day open session sealed at that day\'s midnight', () => {
    const task  = makeTask('t1', [makeSession(D22_2354)])
    const tasks = { [KEY_22]: [task] }

    const result = sealOrphanedSessions(tasks, KEY_23)

    // Midnight = start of 2026-04-23
    expect(result[KEY_22][0].sessions[0].endTime).toBe(D23_MIDI)
  })

  test('past day closed sessions untouched', () => {
    const task  = makeTask('t1', [makeSession(D22_2354, D22_2359)])
    const tasks = { [KEY_22]: [task] }

    const result = sealOrphanedSessions(tasks, KEY_23)

    expect(result[KEY_22][0].sessions[0].endTime).toBe(D22_2359)
  })

  test('does NOT create a continuation for today', () => {
    const task  = makeTask('t1', [makeSession(D22_2354)])
    const tasks = { [KEY_22]: [task] }

    const result = sealOrphanedSessions(tasks, KEY_23)

    expect(result[KEY_23]).toBeUndefined()
  })

  test('multiple past days, all open sessions sealed at their own midnight', () => {
    const tWed = makeTask('wed', [makeSession(D22_2354)])
    const tTue = makeTask('tue', [makeSession(D21_MIDI + 60000)])  // 00:01 on April 21
    const tasks = { [KEY_22]: [tWed], [KEY_21]: [tTue] }

    const result = sealOrphanedSessions(tasks, KEY_23)

    // Wed session sealed at Thu midnight
    expect(result[KEY_22][0].sessions[0].endTime).toBe(D23_MIDI)
    // Tue session sealed at Wed midnight
    expect(result[KEY_21][0].sessions[0].endTime).toBe(D21_MIDI)
  })

  test('only open sessions are sealed; closed ones keep their endTime', () => {
    const task = makeTask('t1', [
      makeSession(D22_2354, D22_2359, 'sess-1'),
      makeSession(D22_2359, null,     'sess-2'),
    ])
    const tasks = { [KEY_22]: [task] }

    const result = sealOrphanedSessions(tasks, KEY_23)

    expect(result[KEY_22][0].sessions[0].endTime).toBe(D22_2359)  // unchanged
    expect(result[KEY_22][0].sessions[1].endTime).toBe(D23_MIDI)  // sealed
  })

  test('input tasks object is not mutated', () => {
    const task  = makeTask('t1', [makeSession(D22_2354)])
    const tasks = { [KEY_22]: [task] }

    sealOrphanedSessions(tasks, KEY_23)

    expect(tasks[KEY_22][0].sessions[0].endTime).toBeNull()
  })
})

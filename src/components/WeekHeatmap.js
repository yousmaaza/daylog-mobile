import React, { useState, useMemo } from 'react'
import { View, Text, TouchableOpacity, useWindowDimensions } from 'react-native'
import { COLORS, DEFAULT_TAGS } from '../constants'
import { toKey, addDays, getTotalMs, formatShort } from '../utils'

const AMBER_RGB = '124, 92, 252'
export const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function cellColor(iv) {
  if (iv <= 0) return `rgba(${AMBER_RGB}, 0.08)`
  return `rgba(${AMBER_RGB}, ${(0.2 + iv * 0.8).toFixed(2)})`
}

function iv(ms, maxMs) {
  if (!ms || !maxMs) return 0
  return Math.min(ms / maxMs, 1)
}

// Time tracked per hour for a day (distributes session overlap across hours)
export function getHourlyMs(dayTasks, dateKey, now) {
  const hourly = new Array(24).fill(0)
  const dayBase = new Date(dateKey + 'T00:00:00').getTime()
  dayTasks.forEach(task => {
    ;(task.sessions || []).forEach(s => {
      const start = Number(s.startTime)
      const end = s.endTime ? Number(s.endTime) : now
      for (let h = 0; h < 24; h++) {
        const hStart = dayBase + h * 3600000
        hourly[h] += Math.max(0, Math.min(end, hStart + 3600000) - Math.max(start, hStart))
      }
    })
  })
  return hourly
}

function domTag(dayTasks, now) {
  const tagTimes = {}
  dayTasks.forEach(t => {
    const id = t.tagId || (t.tags?.[0]) || 'other'
    tagTimes[id] = (tagTimes[id] || 0) + getTotalMs(t, now)
  })
  const id = Object.entries(tagTimes).sort((a, b) => b[1] - a[1])[0]?.[0]
  return DEFAULT_TAGS.find(t => t.id === id)
}

function Tooltip({ C, label, ms, taskCount, dominantTag, onClose }) {
  return (
    <TouchableOpacity activeOpacity={1} onPress={onClose}>
      <View style={{ marginTop: 10, borderRadius: 12, borderWidth: 1, padding: 12, backgroundColor: C.bgInput, borderColor: C.border }}>
        <Text style={{ fontSize: 11, fontWeight: '600', color: C.inkMuted, marginBottom: 6 }}>{label}</Text>
        {ms === 0 ? (
          <Text style={{ fontSize: 12, color: C.inkMuted, textAlign: 'center' }}>No activity</Text>
        ) : (
          <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 16 }}>
            {taskCount != null && <>
              <View style={{ alignItems: 'center' }}>
                <Text style={{ fontSize: 20, fontWeight: '800', color: C.inkPrimary }}>{taskCount}</Text>
                <Text style={{ fontSize: 10, fontWeight: '600', color: C.inkMuted }}>tasks</Text>
              </View>
              <View style={{ width: 1, height: 28, backgroundColor: C.border }} />
            </>}
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 20, fontWeight: '800', color: C.inkPrimary }}>{formatShort(ms)}</Text>
              <Text style={{ fontSize: 10, fontWeight: '600', color: C.inkMuted }}>tracked</Text>
            </View>
            {dominantTag && <>
              <View style={{ width: 1, height: 28, backgroundColor: C.border }} />
              <View style={{ alignItems: 'center', gap: 3 }}>
                <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: dominantTag.dot }} />
                <Text style={{ fontSize: 10, fontWeight: '700', color: dominantTag.dot }}>{dominantTag.label}</Text>
              </View>
            </>}
          </View>
        )}
      </View>
    </TouchableOpacity>
  )
}

// ── Day view: 4 rows × 6 cols (hours 0–23) ───────────────────────────────────
function DayHeatmap({ tasks, selDate, darkMode }) {
  const [sel, setSel] = useState(null)
  const C = darkMode ? COLORS.dark : COLORS.light
  const now = Date.now()
  const dayTasks = tasks[selDate] ?? []
  const hourly = useMemo(() => getHourlyMs(dayTasks, selDate, now), [selDate, tasks])
  const maxMs = Math.max(...hourly, 1)
  const { width } = useWindowDimensions()
  // 72 = 16*2 card marginHorizontal + 20*2 card padding
  const cell = Math.floor((width - 72 - 5 * 3) / 6)

  return (
    <View>
      <View style={{ gap: 3 }}>
        {[0, 1, 2, 3].map(r => (
          <View key={r} style={{ flexDirection: 'row', gap: 3 }}>
            {[0, 1, 2, 3, 4, 5].map(c => {
              const h = r * 6 + c
              const v = iv(hourly[h], maxMs)
              const isSel = sel === h
              return (
                <TouchableOpacity
                  key={h}
                  onPress={() => setSel(isSel ? null : h)}
                  style={[
                    { width: cell, height: cell, borderRadius: 4, backgroundColor: cellColor(v), alignItems: 'center', justifyContent: 'center' },
                    isSel && { borderWidth: 2, borderColor: C.amber },
                  ]}
                  activeOpacity={0.7}
                >
                  <Text style={{ fontSize: 9, fontWeight: '600', color: v > 0.5 ? '#FFF' : C.inkMuted }}>
                    {String(h).padStart(2, '0')}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </View>
        ))}
      </View>
      {sel !== null && (
        <Tooltip
          C={C}
          label={`${String(sel).padStart(2, '0')}:00 – ${String(sel + 1).padStart(2, '0')}:00`}
          ms={hourly[sel]}
          onClose={() => setSel(null)}
        />
      )}
    </View>
  )
}

// ── Week view: 1 row × 7 cols ─────────────────────────────────────────────────
function WeekHeatmapView({ tasks, weekStart, todayKey, darkMode }) {
  const [sel, setSel] = useState(null)
  const C = darkMode ? COLORS.dark : COLORS.light
  const now = Date.now()

  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const dateKey = toKey(addDays(weekStart, i))
    const dayTasks = tasks[dateKey] ?? []
    const ms = dayTasks.reduce((acc, t) => acc + getTotalMs(t, now), 0)
    return { dateKey, isToday: dateKey === todayKey, ms, taskCount: dayTasks.length, dominantTag: domTag(dayTasks, now) }
  }), [tasks, weekStart, todayKey])

  const maxMs = Math.max(...days.map(d => d.ms), 1)
  const { width } = useWindowDimensions()
  const cell = Math.floor((width - 72 - 6 * 4) / 7)

  return (
    <View>
      <View style={{ flexDirection: 'row', gap: 4, marginBottom: 4 }}>
        {days.map((d, i) => (
          <View key={i} style={{ width: cell, alignItems: 'center' }}>
            <Text style={{ fontSize: 9, fontWeight: d.isToday ? '800' : '500', color: d.isToday ? C.amber : C.inkMuted }}>
              {DAY_LABELS[i].slice(0, 1)}
            </Text>
          </View>
        ))}
      </View>
      <View style={{ flexDirection: 'row', gap: 4 }}>
        {days.map((d, i) => {
          const v = iv(d.ms, maxMs)
          const isSel = sel === i
          return (
            <TouchableOpacity
              key={d.dateKey}
              onPress={() => setSel(isSel ? null : i)}
              style={[
                { width: cell, height: cell, borderRadius: 4, backgroundColor: cellColor(v) },
                (d.isToday || isSel) && { borderWidth: 2, borderColor: C.amber },
              ]}
              activeOpacity={0.7}
            />
          )
        })}
      </View>
      <View style={{ flexDirection: 'row', gap: 4, marginTop: 3 }}>
        {days.map((d, i) => (
          <View key={i} style={{ width: cell, alignItems: 'center' }}>
            <Text style={{ fontSize: 8, color: C.inkMuted }}>{d.ms > 0 ? formatShort(d.ms) : ''}</Text>
          </View>
        ))}
      </View>
      {sel !== null && (
        <Tooltip C={C} label={DAY_LABELS[sel]} ms={days[sel].ms} taskCount={days[sel].taskCount} dominantTag={days[sel].dominantTag} onClose={() => setSel(null)} />
      )}
    </View>
  )
}

// ── Month view: 7 rows × N weeks (GitHub contribution graph) ─────────────────
function MonthHeatmapView({ tasks, selDate, todayKey, darkMode }) {
  const [sel, setSel] = useState(null)
  const C = darkMode ? COLORS.dark : COLORS.light
  const now = Date.now()

  const { weeks, month } = useMemo(() => {
    const d = new Date(selDate + 'T12:00:00')
    const year = d.getFullYear()
    const month = d.getMonth()
    const numDays = new Date(year, month + 1, 0).getDate()
    const firstDow = (new Date(year, month, 1).getDay() + 6) % 7 // Mon=0

    const cells = Array(firstDow).fill(null)
    for (let day = 1; day <= numDays; day++) {
      const dateKey = toKey(new Date(year, month, day))
      const dayTasks = tasks[dateKey] ?? []
      const ms = dayTasks.reduce((acc, t) => acc + getTotalMs(t, now), 0)
      cells.push({ day, dateKey, isToday: dateKey === todayKey, ms, taskCount: dayTasks.length, dominantTag: domTag(dayTasks, now) })
    }
    while (cells.length % 7 !== 0) cells.push(null)
    const weeks = Array.from({ length: cells.length / 7 }, (_, w) => cells.slice(w * 7, w * 7 + 7))
    return { weeks, month }
  }, [tasks, selDate])

  const allMs = weeks.flat().filter(Boolean).map(c => c.ms)
  const maxMs = Math.max(...allMs, 1)
  const { width } = useWindowDimensions()
  const LABEL_W = 24
  const GAP = 3
  const nw = weeks.length
  // cellW fills available card width; cellH capped at 36 so 7 rows ≤ 270px total
  const cellW = Math.floor((width - 72 - LABEL_W - nw * GAP) / nw)
  const cellH = Math.min(cellW, 36)

  return (
    <View>
      <View style={{ flexDirection: 'row', gap: GAP }}>
        {/* Day-of-week labels */}
        <View style={{ width: LABEL_W, gap: GAP }}>
          {DAY_LABELS.map((d, i) => (
            <View key={i} style={{ height: cellH, justifyContent: 'center' }}>
              {i % 2 === 0 && <Text style={{ fontSize: 8, color: C.inkMuted }}>{d.slice(0, 2)}</Text>}
            </View>
          ))}
        </View>
        {/* Week columns */}
        {weeks.map((week, w) => (
          <View key={w} style={{ gap: GAP }}>
            {week.map((c, row) => {
              if (!c) return <View key={row} style={{ width: cellW, height: cellH }} />
              const v = iv(c.ms, maxMs)
              const isSel = sel?.dateKey === c.dateKey
              return (
                <TouchableOpacity
                  key={c.dateKey}
                  onPress={() => setSel(isSel ? null : c)}
                  style={[
                    { width: cellW, height: cellH, borderRadius: 2, backgroundColor: cellColor(v) },
                    (c.isToday || isSel) && { borderWidth: 2, borderColor: C.amber },
                  ]}
                  activeOpacity={0.7}
                />
              )
            })}
          </View>
        ))}
      </View>
      {sel && (
        <Tooltip
          C={C}
          label={`${String(sel.day).padStart(2, '0')}/${String(month + 1).padStart(2, '0')}`}
          ms={sel.ms}
          taskCount={sel.taskCount}
          dominantTag={sel.dominantTag}
          onClose={() => setSel(null)}
        />
      )}
    </View>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function ActivityHeatmap({ mode, tasks, selDate, weekStart, todayKey, darkMode }) {
  if (mode === 'day')  return <DayHeatmap tasks={tasks} selDate={selDate} darkMode={darkMode} />
  if (mode === 'week') return <WeekHeatmapView tasks={tasks} weekStart={weekStart} todayKey={todayKey} darkMode={darkMode} />
  return <MonthHeatmapView tasks={tasks} selDate={selDate} todayKey={todayKey} darkMode={darkMode} />
}

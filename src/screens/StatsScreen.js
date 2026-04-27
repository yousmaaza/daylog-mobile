import React, { useState, useMemo } from 'react'
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native'
import * as XLSX from 'xlsx'
import * as FileSystem from 'expo-file-system/legacy'
import * as Sharing from 'expo-sharing'

import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTaskContext } from '../context/TaskContext'
import { COLORS, DEFAULT_TAGS, getTaskPalette } from '../constants'
import { getTaskStatus, getTotalMs, formatShort, formatLive, toKey, addDays } from '../utils'
import DonutChart from '../components/DonutChart'
import ActivityHeatmap, { DAY_LABELS, getHourlyMs } from '../components/WeekHeatmap'

const MODES = ['Day', 'Week', 'Month']

// ── Excel export (3 sheets: Jour / Semaine / Mois) ───────────────────────────
function buildDaySheet(tasks, selDate) {
  const now = Date.now()
  const dayTasks = tasks[selDate] ?? []
  const rows = [['Début', 'Fin', 'Tâche', 'Tag', 'Durée (min)', 'Statut']]
  dayTasks.forEach(t => {
    const tagId = t.tagId || (t.tags?.[0]) || 'other'
    const tag = DEFAULT_TAGS.find(tg => tg.id === tagId)
    const status = t.done ? 'Terminée' : getTaskStatus(t) === 'active' ? 'En cours' : 'En pause'
    ;(t.sessions || []).forEach(s => {
      const start = new Date(Number(s.startTime))
      const end = s.endTime ? new Date(Number(s.endTime)) : new Date(now)
      rows.push([
        start.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        end.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        t.name,
        tag?.label ?? 'Other',
        Math.round((end - start) / 60000),
        status,
      ])
    })
  })
  rows.sort((a, b) => (a[0] > b[0] ? 1 : -1))
  return XLSX.utils.aoa_to_sheet(rows)
}

function buildWeekSheet(tasks, weekStart) {
  const now = Date.now()
  const rows = [['Date', 'Jour', 'Tâche', 'Tag', 'Durée (min)', 'Statut']]
  for (let i = 0; i < 7; i++) {
    const date = addDays(weekStart, i)
    const dateKey = toKey(date)
    const label = date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
    ;(tasks[dateKey] ?? []).forEach(t => {
      const tagId = t.tagId || (t.tags?.[0]) || 'other'
      const tag = DEFAULT_TAGS.find(tg => tg.id === tagId)
      const status = t.done ? 'Terminée' : getTaskStatus(t) === 'active' ? 'En cours' : 'En pause'
      rows.push([label, DAY_LABELS[i], t.name, tag?.label ?? 'Other', Math.round(getTotalMs(t, now) / 60000), status])
    })
  }
  return XLSX.utils.aoa_to_sheet(rows)
}

function buildMonthSheet(tasks, selDate) {
  const now = Date.now()
  const d = new Date(selDate + 'T12:00:00')
  const year = d.getFullYear()
  const month = d.getMonth()
  const rows = [['Date', 'Tâche', 'Tag', 'Durée (min)', 'Statut']]
  Object.keys(tasks).sort().forEach(key => {
    const [y, m] = key.split('-').map(Number)
    if (y !== year || m - 1 !== month) return
    const label = new Date(key + 'T12:00:00').toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
    ;(tasks[key] ?? []).forEach(t => {
      const tagId = t.tagId || (t.tags?.[0]) || 'other'
      const tag = DEFAULT_TAGS.find(tg => tg.id === tagId)
      const status = t.done ? 'Terminée' : getTaskStatus(t) === 'active' ? 'En cours' : 'En pause'
      rows.push([label, t.name, tag?.label ?? 'Other', Math.round(getTotalMs(t, now) / 60000), status])
    })
  })
  return XLSX.utils.aoa_to_sheet(rows)
}

async function exportXLSX(tasks, selDate, weekStart) {
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, buildDaySheet(tasks, selDate), 'Jour')
  XLSX.utils.book_append_sheet(wb, buildWeekSheet(tasks, weekStart), 'Semaine')
  XLSX.utils.book_append_sheet(wb, buildMonthSheet(tasks, selDate), 'Mois')

  const b64 = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' })
  const fileUri = `${FileSystem.cacheDirectory}daylog-${toKey(new Date())}.xlsx`
  await FileSystem.writeAsStringAsync(fileUri, b64, { encoding: FileSystem.EncodingType.Base64 })
  await Sharing.shareAsync(fileUri, {
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    dialogTitle: 'Export Daylog',
    UTI: 'com.microsoft.excel.xlsx',
  })
}

// ── Screen ────────────────────────────────────────────────────────────────────
export default function StatsScreen() {
  const insets = useSafeAreaInsets()
  const { tasks, darkMode, tick, selDate, weekStart, toggleDarkMode } = useTaskContext()
  const todayKey = toKey(new Date())
  const C = darkMode ? COLORS.dark : COLORS.light

  const [modeIdx, setModeIdx] = useState(0)
  const mode = MODES[modeIdx].toLowerCase()
  const now = Date.now()

  const filteredTasks = useMemo(() => {
    let result = []
    if (mode === 'day') {
      result = (tasks[selDate] ?? []).map(t => ({ ...t, _dateKey: selDate }))
    } else if (mode === 'week') {
      for (let i = 0; i < 7; i++) {
        const dateKey = toKey(addDays(weekStart, i))
        result.push(...(tasks[dateKey] ?? []).map(t => ({ ...t, _dateKey: dateKey })))
      }
    } else {
      const d = new Date(selDate + 'T12:00:00')
      const year = d.getFullYear()
      const month = d.getMonth()
      Object.keys(tasks).forEach(key => {
        const [y, m] = key.split('-').map(Number)
        if (y === year && m - 1 === month) {
          result.push(...(tasks[key] ?? []).map(t => ({ ...t, _dateKey: key })))
        }
      })
    }
    return result
  }, [tasks, selDate, weekStart, mode, tick])

  const taskGroups = useMemo(() => {
    const groups = new Map()
    filteredTasks.forEach(t => {
      const key = (t.name || '').trim().toLowerCase()
      if (!groups.has(key)) {
        groups.set(key, { ...t, ms: getTotalMs(t, now) })
      } else {
        const g = groups.get(key)
        g.ms += getTotalMs(t, now)
        if (t.done) g.done = true
      }
    })
    return Array.from(groups.values()).sort((a, b) => b.ms - a.ms)
  }, [filteredTasks, now])

  const done   = taskGroups.filter(g => g.done).length
  const active = taskGroups.filter(g => getTaskStatus(g) === 'active').length
  const idle   = taskGroups.length - done - active
  const total  = taskGroups.length

  const totalTrackedMs = taskGroups.reduce((acc, g) => acc + g.ms, 0)
  const todayTasks     = tasks[toKey(new Date())] ?? []
  const activeTask     = todayTasks.find(t => getTaskStatus(t) === 'active')
  const activeDuration = activeTask ? formatLive(getTotalMs(activeTask, now)) : '—'

  const handleExport = async () => {
    try {
      const ok = await Sharing.isAvailableAsync()
      if (!ok) { Alert.alert('Indisponible', 'Le partage n\'est pas disponible sur cet appareil.'); return }
      await exportXLSX(tasks, selDate, weekStart)
    } catch (e) {
      Alert.alert('Erreur export', e.message)
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: C.bgApp }}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: insets.bottom + 140 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 14, backgroundColor: C.bgApp }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: C.inkPrimary }]}>Overview</Text>
            <Text style={[styles.subtitle, { color: C.inkMuted }]}>Your productivity at a glance</Text>
          </View>
          <TouchableOpacity onPress={toggleDarkMode} style={[styles.iconBtn, { backgroundColor: C.bgPanel }]}>
            <Text style={{ fontSize: 17 }}>{darkMode ? '☀️' : '🌙'}</Text>
          </TouchableOpacity>
        </View>

        {/* Mode toggle */}
        <View style={[styles.modeWrap, { backgroundColor: C.bgPanel, marginHorizontal: 16, marginBottom: 14 }]}>
          {MODES.map((m, i) => (
            <TouchableOpacity
              key={m}
              style={[styles.modeBtn, modeIdx === i && { backgroundColor: C.amber }]}
              onPress={() => setModeIdx(i)}
              activeOpacity={0.75}
            >
              <Text style={[styles.modeBtnText, { color: modeIdx === i ? '#FFFFFF' : C.inkMuted }]}>{m}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Summary — first */}
        <View style={[styles.card, { backgroundColor: C.bgPanel, marginHorizontal: 16, marginBottom: 14 }]}>
          <Text style={[styles.cardTitle, { color: C.inkPrimary }]}>Summary</Text>
          <View style={styles.statsRow}>
            {[
              { label: 'Total',   value: String(total) },
              { label: 'Tracked', value: totalTrackedMs > 0 ? formatShort(totalTrackedMs) : '—' },
              { label: 'Live',    value: activeDuration },
            ].map((item, i) => (
              <View
                key={item.label}
                style={[styles.statCell, { borderColor: C.border }, i < 2 && { borderRightWidth: StyleSheet.hairlineWidth }]}
              >
                <Text style={[styles.statValue, { color: C.inkPrimary }]}>{item.value}</Text>
                <Text style={[styles.statLabel, { color: C.inkMuted }]}>{item.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Heatmap (mode-aware) */}
        <View style={[styles.card, { backgroundColor: C.bgPanel, marginHorizontal: 16, marginBottom: 14 }]}>
          <Text style={[styles.cardTitle, { color: C.inkPrimary }]}>Activity</Text>
          <ActivityHeatmap
            mode={mode}
            tasks={tasks}
            selDate={selDate}
            weekStart={weekStart}
            todayKey={todayKey}
            darkMode={darkMode}
          />
        </View>

        {/* Distribution */}
        <View style={[styles.card, { backgroundColor: C.bgPanel, marginHorizontal: 16, marginBottom: 14 }]}>
          <Text style={[styles.cardTitle, { color: C.inkPrimary }]}>Distribution</Text>
          <View style={styles.donutRow}>
            <DonutChart darkMode={darkMode} done={done} active={active} idle={idle} />
            <View style={styles.legend}>
              {[
                { label: 'Done',   value: done,   color: C.emerald  },
                { label: 'Active', value: active, color: C.amber    },
                { label: 'Idle',   value: idle,   color: C.inkFaint },
              ].map(item => (
                <View key={item.label} style={styles.legendRow}>
                  <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                  <Text style={[styles.legendLabel, { color: C.inkMuted }]}>{item.label}</Text>
                  <Text style={[styles.legendValue, { color: C.inkPrimary }]}>{item.value}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Time by Tag */}
        {filteredTasks.length > 0 && (() => {
          const tagTimes = DEFAULT_TAGS.map(tag => ({
            tag,
            ms: filteredTasks
              .filter(t => (t.tagId || (t.tags?.[0]) || 'other') === tag.id)
              .reduce((acc, t) => acc + getTotalMs(t, now), 0),
          })).filter(item => item.ms > 0).sort((a, b) => b.ms - a.ms)
          if (!tagTimes.length) return null
          return (
            <View style={[styles.card, { backgroundColor: C.bgPanel, marginHorizontal: 16, marginBottom: 14 }]}>
              <Text style={[styles.cardTitle, { color: C.inkPrimary }]}>Time by Tag</Text>
              {tagTimes.map((item, i) => (
                <React.Fragment key={item.tag.id}>
                  {i > 0 && <View style={{ height: 1, backgroundColor: C.border }} />}
                  <View style={styles.taskRow}>
                    <View style={[styles.taskDot, { backgroundColor: item.tag.dot }]} />
                    <Text style={[styles.taskName, { color: C.inkPrimary }]} numberOfLines={1}>{item.tag.label}</Text>
                    <Text style={[styles.taskTime, { color: C.inkMuted }]}>{formatShort(item.ms)}</Text>
                  </View>
                </React.Fragment>
              ))}
            </View>
          )
        })()}

        {/* Tasks */}
        {taskGroups.length > 0 && (
          <View style={[styles.card, { backgroundColor: C.bgPanel, marginHorizontal: 16, marginBottom: 14 }]}>
            <Text style={[styles.cardTitle, { color: C.inkPrimary }]}>Tasks</Text>
            {taskGroups.map((task, i) => {
              const palette = getTaskPalette(task) || { dot: '#7C5CFC' }
              return (
                <React.Fragment key={task.parentId || task.id}>
                  {i > 0 && <View style={{ height: 1, backgroundColor: C.border }} />}
                  <View style={styles.taskRow}>
                    <View style={[styles.taskDot, { backgroundColor: palette.dot }]} />
                    <Text style={[styles.taskName, { color: C.inkPrimary }]} numberOfLines={1}>{task.name}</Text>
                    <Text style={[styles.taskTime, { color: C.inkMuted }]}>
                      {task.ms > 0 ? formatShort(task.ms) : '—'}
                    </Text>
                  </View>
                </React.Fragment>
              )
            })}
          </View>
        )}
      </ScrollView>

      {/* Floating Action Button — export */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: C.amber, bottom: insets.bottom + 90 }]}
        onPress={handleExport}
        activeOpacity={0.85}
      >
        <Text style={styles.fabIcon}>⬆</Text>
        <Text style={styles.fabLabel}>Export</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    flexDirection:     'row',
    alignItems:        'flex-start',
    justifyContent:    'space-between',
    paddingHorizontal: 20,
    paddingBottom:     18,
  },
  title:    { fontSize: 28, fontWeight: '800' },
  subtitle: { fontSize: 14, marginTop: 4 },

  iconBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 2,
  },

  modeWrap: { flexDirection: 'row', borderRadius: 16, padding: 4, gap: 4 },
  modeBtn:  { flex: 1, paddingVertical: 10, borderRadius: 13, alignItems: 'center' },
  modeBtnText: { fontSize: 13, fontWeight: '700' },

  card: {
    borderRadius: 20, padding: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05, shadowRadius: 12, elevation: 2,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', marginBottom: 16 },

  donutRow:   { flexDirection: 'row', alignItems: 'center', gap: 24 },
  legend:     { flex: 1, gap: 14 },
  legendRow:  { flexDirection: 'row', alignItems: 'center', gap: 10 },
  legendDot:  { width: 10, height: 10, borderRadius: 5 },
  legendLabel: { flex: 1, fontSize: 13, fontWeight: '600' },
  legendValue: { fontSize: 20, fontWeight: '800', lineHeight: 24 },

  statsRow: { flexDirection: 'row', borderRadius: 14, overflow: 'hidden' },
  statCell: { flex: 1, paddingVertical: 16, alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: '800', lineHeight: 28 },
  statLabel: { fontSize: 11, fontWeight: '600', marginTop: 4 },

  taskRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 10 },
  taskDot:  { width: 10, height: 10, borderRadius: 5, flexShrink: 0 },
  taskName: { flex: 1, fontSize: 14, fontWeight: '500' },
  taskTime: { fontSize: 12, fontFamily: 'monospace' },

  fab: {
    position:       'absolute',
    right:          20,
    width:          64,
    height:         64,
    borderRadius:   32,
    alignItems:     'center',
    justifyContent: 'center',
    shadowColor:    '#000',
    shadowOffset:   { width: 0, height: 6 },
    shadowOpacity:  0.25,
    shadowRadius:   10,
    elevation:      8,
    gap:             2,
  },
  fabIcon:  { fontSize: 18, color: '#FFF' },
  fabLabel: { fontSize: 9, fontWeight: '800', color: '#FFF', letterSpacing: 0.5 },
})

import React, { useState, useMemo } from 'react'
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native'

import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTaskContext } from '../context/TaskContext'
import { COLORS, DEFAULT_TAGS, getTaskPalette } from '../constants'
import { getTaskStatus, getTotalMs, formatShort, formatLive, toKey, addDays } from '../utils'
import DonutChart from '../components/DonutChart'

const MODES = ['Day', 'Week', 'Month']

export default function StatsScreen() {
  const insets = useSafeAreaInsets()
  const { tasks, darkMode, tick, selDate, weekStart, toggleDarkMode } = useTaskContext()
  
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
        const d = addDays(weekStart, i)
        const dateKey = toKey(d)
        const dayTasks = tasks[dateKey] ?? []
        result.push(...dayTasks.map(t => ({ ...t, _dateKey: dateKey })))
      }
    } else {
      const selDateObj = new Date(selDate + 'T12:00:00')
      const year  = selDateObj.getFullYear()
      const month = selDateObj.getMonth()
      Object.keys(tasks).forEach(key => {
        const [y, m] = key.split('-')
        if (parseInt(y) === year && (parseInt(m) - 1) === month) {
          const dayTasks = tasks[key]
          if (Array.isArray(dayTasks)) {
            result.push(...dayTasks.map(t => ({ ...t, _dateKey: key })))
          }
        }
      })
    }
    return result
  }, [tasks, selDate, weekStart, mode, tick])

  const taskGroups = useMemo(() => {
    const groups = new Map()
    filteredTasks.forEach(t => {
      // Direct grouping by name is the most reliable for users
      const key = (t.name || '').trim().toLowerCase()

      if (!groups.has(key)) {
        groups.set(key, { ...t, ms: getTotalMs(t, now) })
      } else {
        const g = groups.get(key)
        g.ms += getTotalMs(t, now)
        if (t.done) g.done = true
      }
    })
    return Array.from(groups.values()).sort((a,b) => b.ms - a.ms)
  }, [filteredTasks, now])

  const done   = taskGroups.filter(g => g.done).length
  const active = taskGroups.filter(g => getTaskStatus(g) === 'active').length
  const idle   = taskGroups.length - done - active
  const total  = taskGroups.length

  const totalTrackedMs = taskGroups.reduce((acc, g) => acc + g.ms, 0)
  const todayTasks  = tasks[toKey(new Date())] ?? []
  const activeTask  = todayTasks.find(t => getTaskStatus(t) === 'active')
  const activeDuration = activeTask ? formatLive(getTotalMs(activeTask, now)) : '—'

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: C.bgApp }]}
      contentContainerStyle={{ paddingBottom: insets.bottom + 110 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 14, backgroundColor: C.bgApp }]}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: C.inkPrimary }]}>Overview</Text>
          <Text style={[styles.subtitle, { color: C.inkMuted }]}>Your productivity at a glance</Text>
        </View>
        <TouchableOpacity
          onPress={toggleDarkMode}
          style={[styles.themeBtn, { backgroundColor: C.bgPanel }]}
        >
          <Text style={{ fontSize: 17 }}>{darkMode ? '☀️' : '🌙'}</Text>
        </TouchableOpacity>
      </View>

      {/* Mode toggle */}
      <View style={[styles.modeWrap, { backgroundColor: C.bgPanel, marginHorizontal: 16, marginBottom: 14 }]}>
        {MODES.map((m, i) => (
          <TouchableOpacity
            key={m}
            style={[
              styles.modeBtn,
              modeIdx === i && { backgroundColor: C.amber },
            ]}
            onPress={() => setModeIdx(i)}
            activeOpacity={0.75}
          >
            <Text style={[
              styles.modeBtnText,
              { color: modeIdx === i ? '#FFFFFF' : C.inkMuted },
            ]}>
              {m}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Donut + legend */}
      <View style={[styles.card, { backgroundColor: C.bgPanel, marginHorizontal: 16, marginBottom: 14 }]}>
        <Text style={[styles.cardTitle, { color: C.inkPrimary }]}>Distribution</Text>

        <View style={styles.donutRow}>
          <DonutChart darkMode={darkMode} done={done} active={active} idle={idle}  />

          <View style={styles.legend}>
            {[
              { label: 'Done',   value: done,   color: C.emerald },
              { label: 'Active', value: active, color: C.amber   },
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

      {/* Summary stats */}
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
              style={[
                styles.statCell,
                { borderColor: C.border },
                i < 2 && { borderRightWidth: StyleSheet.hairlineWidth },
              ]}
            >
              <Text style={[styles.statValue, { color: C.inkPrimary }]}>{item.value}</Text>
              <Text style={[styles.statLabel, { color: C.inkMuted }]}>{item.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Time by Tag */}
      {filteredTasks.length > 0 && (() => {
        const tagTimes = DEFAULT_TAGS.map(tag => ({
          tag,
          ms: filteredTasks
              .filter(t => (t.tagId || (t.tags && t.tags[0]) || 'other') === tag.id)
              .reduce((acc, t) => acc + getTotalMs(t, now), 0)
        })).filter(item => item.ms > 0).sort((a,b) => b.ms - a.ms)

        if (tagTimes.length === 0) return null

        return (
          <View style={[styles.card, { backgroundColor: C.bgPanel, marginHorizontal: 16, marginBottom: 14 }]}>
            <Text style={[styles.cardTitle, { color: C.inkPrimary }]}>Time by Tag</Text>
            {tagTimes.map((item, i) => (
              <React.Fragment key={item.tag.id}>
                {i > 0 && <View style={{ height: 1, backgroundColor: C.border }} />}
                <View style={styles.taskRow}>
                  <View style={[styles.taskDot, { backgroundColor: item.tag.dot }]} />
                  <Text style={[styles.taskName, { color: C.inkPrimary }]} numberOfLines={1}>
                    {item.tag.label}
                  </Text>
                  <Text style={[styles.taskTime, { color: C.inkMuted }]}>
                    {formatShort(item.ms)}
                  </Text>
                </View>
              </React.Fragment>
            ))}
          </View>
        )
      })()}

      {/* Task breakdown */}
      {taskGroups.length > 0 && (
        <View style={[styles.card, { backgroundColor: C.bgPanel, marginHorizontal: 16, marginBottom: 14 }]}>
          <Text style={[styles.cardTitle, { color: C.inkPrimary }]}>Tasks</Text>
          {taskGroups.map((task, i) => {
            const palette = getTaskPalette(task) || { dot: '#7C5CFC', bg: '#F1E9FF', border: '#DDD6FE' }
            return (
              <React.Fragment key={task.parentId || task.id}>
                {i > 0 && <View style={{ height: 1, backgroundColor: C.border }} />}
                <View style={styles.taskRow}>
                  <View style={[styles.taskDot, { backgroundColor: palette.dot }]} />
                  <Text style={[styles.taskName, { color: C.inkPrimary }]} numberOfLines={1}>
                    {task.name}
                  </Text>
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
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    flexDirection:    'row',
    alignItems:       'flex-start',
    justifyContent:   'space-between',
    paddingHorizontal: 20,
    paddingBottom:    18,
  },
  title: {
    fontSize:   28,
    fontWeight: '800',
  },
  subtitle: {
    fontSize:   14,
    fontWeight: '400',
    marginTop:   4,
  },
  themeBtn: {
    width:          40,
    height:         40,
    borderRadius:   20,
    alignItems:     'center',
    justifyContent: 'center',
    shadowColor:    '#000',
    shadowOffset:   { width: 0, height: 2 },
    shadowOpacity:  0.08,
    shadowRadius:   8,
    elevation:      2,
  },

  modeWrap: {
    flexDirection: 'row',
    borderRadius:  16,
    padding:        4,
    gap:            4,
  },
  modeBtn: {
    flex:            1,
    paddingVertical: 10,
    borderRadius:    13,
    alignItems:      'center',
  },
  modeBtnText: {
    fontSize:   13,
    fontWeight: '700',
  },

  card: {
    borderRadius:  20,
    padding:       20,
    shadowColor:   '#000',
    shadowOffset:  { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius:  12,
    elevation:     2,
  },
  cardTitle: {
    fontSize:     16,
    fontWeight:   '700',
    marginBottom: 16,
  },

  donutRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           24,
  },
  legend: {
    flex: 1,
    gap:  14,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           10,
  },
  legendDot: {
    width:        10,
    height:       10,
    borderRadius: 5,
  },
  legendLabel: {
    flex:       1,
    fontSize:   13,
    fontWeight: '600',
  },
  legendValue: {
    fontSize:   20,
    fontWeight: '800',
    lineHeight: 24,
  },

  statsRow: {
    flexDirection: 'row',
    borderRadius:  14,
    overflow:      'hidden',
    borderWidth:   StyleSheet.hairlineWidth,
    borderColor:   'transparent',
  },
  statCell: {
    flex:            1,
    paddingVertical: 16,
    alignItems:      'center',
  },
  statValue: {
    fontSize:   24,
    fontWeight: '800',
    lineHeight: 28,
  },
  statLabel: {
    fontSize:   11,
    fontWeight: '600',
    marginTop:   4,
  },

  taskRow: {
    flexDirection:  'row',
    alignItems:     'center',
    paddingVertical: 12,
    gap:             10,
  },
  taskDot: {
    width:        10,
    height:       10,
    borderRadius: 5,
    flexShrink:   0,
  },
  taskName: {
    flex:       1,
    fontSize:   14,
    fontWeight: '500',
  },
  taskTime: {
    fontSize:   12,
    fontFamily: 'monospace',
  },
})

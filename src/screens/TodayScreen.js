import React, { useCallback } from 'react'
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTaskContext } from '../context/TaskContext'
import { COLORS, DAY_FULL, MONTH_FULL } from '../constants'
import { toKey } from '../utils'
import WeekPicker from '../components/WeekPicker'
import TaskCard from '../components/TaskCard'

// onAddTask prop is called when the user taps the "add" hint in the empty state
export default function TodayScreen() {
  const insets = useSafeAreaInsets()
  const {
    tasks, darkMode, tick,
    selDate, weekStart, selTaskId,
    setSelTaskId, toggleDarkMode,
    prevWeek, nextWeek, goToday, selectDay,
    startTask, pauseTask, doneTask, deleteTask, toggleFavorite, changeTaskTag,
  } = useTaskContext()

  const C = darkMode ? COLORS.dark : COLORS.light

  const dayTasks   = tasks[selDate] ?? []
  const isToday    = selDate === toKey(new Date())
  const selDateObj = new Date(selDate + 'T12:00:00')
  const dayName    = DAY_FULL[selDateObj.getDay()]
  const dayNum     = selDateObj.getDate()
  const monthStr   = MONTH_FULL[selDateObj.getMonth()]

  const doneCount  = dayTasks.filter(t => t.done).length
  const totalCount = dayTasks.length

  const renderItem = useCallback(({ item, index }) => (
    <TaskCard
      task={item}
      index={index}
      tick={tick}
      isExpanded={selTaskId === item.id}
      isToday={isToday}
      colors={C}
      onPress={() => setSelTaskId(prev => prev === item.id ? null : item.id)}
      onStart={() => startTask(item.id)}
      onPause={() => pauseTask(item.id)}
      onDone={() => doneTask(item.id)}
      onDelete={() => deleteTask(item.id)}
      onToggleFavorite={() => toggleFavorite(item.id)}
      onChangeTag={(tagId) => changeTaskTag(item.id, tagId)}
    />
  ), [selTaskId, tick, C, isToday, startTask, pauseTask, doneTask, deleteTask, setSelTaskId, toggleFavorite, changeTaskTag])

  const keyExtractor = useCallback((item, index) => `${item.id}-${index}`, [])

  return (
    <View style={[styles.container, { backgroundColor: C.bgApp }]}>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <View style={[styles.header, { paddingTop: insets.top + 14, backgroundColor: C.bgApp }]}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.greeting, { color: C.inkMuted }]}>
            {isToday ? 'Good day!' : dayName}
          </Text>
          <Text style={[styles.heroText, { color: C.inkPrimary }]}>
            {totalCount === 0
              ? `Nothing\nscheduled`
              : `You have ${totalCount}\ntask${totalCount > 1 ? 's' : ''} today`
            }
          </Text>
        </View>

        <View style={styles.headerRight}>
          {!isToday && (
            <TouchableOpacity
              onPress={goToday}
              style={[styles.todayBtn, { backgroundColor: C.amber }]}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.todayBtnText}>Today</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={toggleDarkMode}
            style={[styles.themeBtn, { backgroundColor: C.bgPanel }]}
          >
            <Text style={{ fontSize: 17 }}>{darkMode ? '☀️' : '🌙'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Date + progress strip ──────────────────────────────────────── */}
      <View style={[styles.dateStrip, { backgroundColor: C.bgPanel, marginHorizontal: 16, marginBottom: 8 }]}>
        <Text style={[styles.dateLabel, { color: C.inkMuted }]}>
          {dayName}, {dayNum} {monthStr}
        </Text>
        {totalCount > 0 && (
          <View style={[styles.progressBadge, { backgroundColor: C.amberLight }]}>
            <Text style={[styles.progressText, { color: C.amber }]}>
              {doneCount}/{totalCount} done
            </Text>
          </View>
        )}
      </View>

      {/* ── Week picker ─────────────────────────────────────────────────── */}
      <WeekPicker
        weekStart={weekStart}
        selDate={selDate}
        tasks={tasks}
        colors={C}
        onPrevWeek={prevWeek}
        onNextWeek={nextWeek}
        onSelectDay={selectDay}
      />

      {/* ── Tasks label ─────────────────────────────────────────────────── */}
      {totalCount > 0 && (
        <View style={[styles.sectionRow, { paddingHorizontal: 20 }]}>
          <Text style={[styles.sectionLabel, { color: C.inkPrimary }]}>Tasks</Text>
          <Text style={[styles.sectionCount, { color: C.inkMuted }]}>{totalCount}</Text>
        </View>
      )}

      {/* ── Task list ───────────────────────────────────────────────────── */}
      <FlatList
        data={dayTasks}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingTop: 4, paddingBottom: insets.bottom + 140 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={[styles.emptyCard, { backgroundColor: C.bgPanel }]}>
              <Text style={[styles.emptyEmoji, { color: C.inkFaint }]}>✦</Text>
              <Text style={[styles.emptyTitle, { color: C.inkPrimary }]}>No tasks yet</Text>
              <Text style={[styles.emptyHint, { color: C.inkMuted }]}>
                Tap + below to add your first task
              </Text>
            </View>
          </View>
        }
      />
    </View>
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
  greeting: {
    fontSize:      14,
    fontWeight:    '500',
    marginBottom:   4,
  },
  heroText: {
    fontSize:   28,
    fontWeight: '800',
    lineHeight: 34,
  },
  headerRight: {
    alignItems: 'flex-end',
    gap:        10,
    paddingTop:  4,
  },
  todayBtn: {
    paddingHorizontal: 14,
    paddingVertical:    7,
    borderRadius:      20,
  },
  todayBtnText: {
    color:      '#FFFFFF',
    fontSize:   12,
    fontWeight: '700',
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

  dateStrip: {
    flexDirection:    'row',
    alignItems:       'center',
    justifyContent:   'space-between',
    paddingHorizontal: 16,
    paddingVertical:   10,
    borderRadius:      14,
  },
  dateLabel: {
    fontSize:   13,
    fontWeight: '600',
  },
  progressBadge: {
    paddingHorizontal: 12,
    paddingVertical:    5,
    borderRadius:      20,
  },
  progressText: {
    fontSize:   12,
    fontWeight: '700',
  },

  sectionRow: {
    flexDirection:  'row',
    alignItems:     'baseline',
    gap:             8,
    paddingVertical: 10,
  },
  sectionLabel: {
    fontSize:   18,
    fontWeight: '800',
  },
  sectionCount: {
    fontSize:   13,
    fontWeight: '600',
  },

  empty: {
    paddingHorizontal: 16,
    paddingTop:        20,
  },
  emptyCard: {
    borderRadius:  24,
    padding:       48,
    alignItems:    'center',
    gap:            8,
    shadowColor:   '#000',
    shadowOffset:  { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius:  16,
    elevation:     2,
  },
  emptyEmoji: {
    fontSize:    40,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize:   18,
    fontWeight: '700',
  },
  emptyHint: {
    fontSize:  14,
    marginTop:  2,
    textAlign: 'center',
  },
})

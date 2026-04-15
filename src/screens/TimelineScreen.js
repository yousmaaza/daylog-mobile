import React, { useRef, useEffect, useMemo } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, useWindowDimensions, Animated,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTaskContext } from '../context/TaskContext'
import {
  COLORS, HOUR_H, TIMELINE_START, TIMELINE_END,
  DEFAULT_TAGS, DAY_FULL, MONTH_FULL, getTaskPalette,
} from '../constants'
import { toKey, formatShort, formatLive, getTotalMs } from '../utils'
import WeekPicker from '../components/WeekPicker'

const LABEL_W   = 52
const NOW_COLOR = '#F43F5E'
const BLOCK_MIN = 32   // minimum block height so new tasks are always visible

// ── Column layout (no overlap) ────────────────────────────────────────────────

function buildColumns(blocks) {
  const sorted = [...blocks].sort((a, b) => a.startY - b.startY)
  const cols = []
  return sorted.map(block => {
    let colIdx = cols.findIndex(col => {
      const last = col[col.length - 1]
      return last.realEndY <= block.startY + 0.5
    })
    if (colIdx === -1) {
      colIdx = cols.length
      cols.push([])
    }
    cols[colIdx].push({ realEndY: block.realEndY })
    return { ...block, col: colIdx }
  })
}

// ── Live pulse indicator ───────────────────────────────────────────────────────

function LiveDot({ color }) {
  const anim = useRef(new Animated.Value(0.3)).current

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1,   duration: 800, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    )
    loop.start()
    return () => loop.stop()
  }, [anim])

  return (
    <Animated.View
      style={{
        width: 6, height: 6, borderRadius: 3,
        backgroundColor: color,
        opacity: anim,
        position: 'absolute',
        top: 5, right: 5,
      }}
    />
  )
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function TimelineScreen() {
  const insets = useSafeAreaInsets()
  const { width: screenWidth } = useWindowDimensions()
  const {
    tasks, darkMode, tick,
    selDate, weekStart,
    prevWeek, nextWeek, selectDay, toggleDarkMode,
  } = useTaskContext()

  const C         = darkMode ? COLORS.dark : COLORS.light
  const scrollRef = useRef(null)

  // `tick` drives live updates — recalculate `now` every second
  const now       = Date.now()
  const todayKey  = toKey(new Date())
  const timelineW = screenWidth - LABEL_W - 16

  const nowDate  = new Date(now)
  const nowHours = nowDate.getHours() + nowDate.getMinutes() / 60 + nowDate.getSeconds() / 3600
  const nowTop   = (nowHours - TIMELINE_START) * HOUR_H
  const totalH   = (TIMELINE_END - TIMELINE_START) * HOUR_H

  // Auto-scroll to current time when viewing today
  // nowTop is recalculated inside the effect so returning to this screen
  // always scrolls to the actual current time, not the time at mount
  useEffect(() => {
    if (selDate !== todayKey) return
    const timer = setTimeout(() => {
      const currentDate = new Date()
      const currentNowTop = ((currentDate.getHours() - TIMELINE_START) + currentDate.getMinutes() / 60) * HOUR_H
      scrollRef.current?.scrollTo({ y: Math.max(0, currentNowTop - 180), animated: true })
    }, 400)
    return () => clearTimeout(timer)
  }, [selDate, todayKey])

  const dayTasks = tasks[selDate] ?? []

  // ── Build session blocks ─────────────────────────────────────────────────
  const rawBlocks = useMemo(() => {
    const liveNowTop = (nowHours - TIMELINE_START) * HOUR_H
    const blocks = []

    dayTasks.forEach((task, taskIdx) => {
      const paletteLen = (DEFAULT_TAGS && DEFAULT_TAGS.length) || 1
      const colorIdx = task.colorIdx ?? (taskIdx % paletteLen)
      task.sessions.forEach(sess => {
        const start  = new Date(sess.startTime)
        const end    = sess.endTime ? new Date(sess.endTime) : new Date(now)
        const startH = start.getHours() + start.getMinutes() / 60 + start.getSeconds() / 3600
        const endH   = end.getHours()   + end.getMinutes()   / 60 + end.getSeconds()   / 3600

        const clampedStart = Math.max(startH, TIMELINE_START)
        const startY = (clampedStart - TIMELINE_START) * HOUR_H

        let height, realEndY
        if (!sess.endTime) {
          const liveEndY = Math.max(liveNowTop, startY)
          height   = liveEndY - startY
          realEndY = liveEndY
        } else {
          const clampedEnd = Math.min(endH, TIMELINE_END)
          if (clampedEnd <= clampedStart) return
          const rawH = (clampedEnd - clampedStart) * HOUR_H
          height   = Math.max(rawH, 2)
          realEndY = startY + rawH
        }

        const blockId = sess.id ? `${sess.id}` : `${task.id}-${sess.startTime}`
        blocks.push({
          id: blockId, taskId: task.id, name: task.name, task, colorIdx,
          isLive:  !sess.endTime,
          isDone:  task.done,
          startY, height, realEndY,
          startTime: sess.startTime, endTime: sess.endTime,
          tagId: task.tagId, tags: task.tags,
        })
      })
    })
    return blocks
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dayTasks, tick])

  const blocksWithCols = useMemo(() => buildColumns(rawBlocks), [rawBlocks])

  const numColsForBlock = useMemo(() => {
    return blocksWithCols.map(block => {
      const overlapping = blocksWithCols.filter(b =>
        b.startY < block.realEndY - 0.5 && b.realEndY > block.startY + 0.5
      )
      return Math.max(...overlapping.map(b => b.col + 1), 1)
    })
  }, [blocksWithCols])

  const hours = useMemo(() => {
    const arr = []
    for (let h = TIMELINE_START; h <= TIMELINE_END; h++) arr.push(h)
    return arr
  }, [])

  const selDateObj = new Date(selDate + 'T12:00:00')
  const dayLabel   = `${DAY_FULL[selDateObj.getDay()]}, ${selDateObj.getDate()} ${MONTH_FULL[selDateObj.getMonth()]}`

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <View style={[styles.container, { backgroundColor: C.bgApp }]}>

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <View style={[styles.header, { backgroundColor: C.bgApp, paddingTop: insets.top + 14 }]}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: C.inkPrimary }]}>Timeline</Text>
          <Text style={[styles.dayLabel, { color: C.inkMuted }]}>{dayLabel}</Text>
        </View>
        <TouchableOpacity
          onPress={toggleDarkMode}
          style={[styles.themeBtn, { backgroundColor: C.bgPanel }]}
        >
          <Text style={{ fontSize: 17 }}>{darkMode ? '☀️' : '🌙'}</Text>
        </TouchableOpacity>
      </View>

      {/* ── Week picker ──────────────────────────────────────────────────────── */}
      <WeekPicker
        weekStart={weekStart}
        selDate={selDate}
        tasks={tasks}
        colors={C}
        onPrevWeek={prevWeek}
        onNextWeek={nextWeek}
        onSelectDay={selectDay}
      />

      {/* ── Timeline scroll ──────────────────────────────────────────────────── */}
      <ScrollView
        ref={scrollRef}
        style={{ flex: 1, backgroundColor: C.bgApp }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 110 }}
      >
        <View style={{ height: totalH, position: 'relative', marginTop: 8 }}>

          {/* ── Hour grid ─────────────────────────────────────────────────── */}
          {hours.map(h => {
            const top    = (h - TIMELINE_START) * HOUR_H
            const label  = h === 12 ? '12' : h > 12 ? `${h - 12}` : `${h}`
            const suffix = h >= 12 ? 'pm' : 'am'
            return (
              <View key={h} style={[styles.hourRow, { top, borderTopColor: C.border }]}>
                <View style={styles.hourLabelWrap}>
                  <Text style={[styles.hourNum, { color: C.inkMuted }]}>{label}</Text>
                  <Text style={[styles.hourSuffix, { color: C.inkFaint }]}>{suffix}</Text>
                </View>
                <View style={[styles.hourLine, { backgroundColor: C.border }]} />
              </View>
            )
          })}

          {/* ── Session blocks ────────────────────────────────────────────── */}
          <View style={{ position: 'absolute', top: 0, left: LABEL_W, right: 8, bottom: 0 }}>

            {blocksWithCols.map((block, idx) => {
              const numCols    = numColsForBlock[idx]
              const colWidth   = timelineW / numCols
              const leftOff    = block.col * colWidth
              const palette    = getTaskPalette(block)
              const blockH     = Math.max(block.height, 2)
              const sessionMs  = block.endTime
                ? block.endTime - block.startTime
                : now - block.startTime

              const isTiny     = blockH < 22
              const showName     = !block.isLive && !isTiny
              const showDuration = !block.isLive && blockH >= 44

              return (
                <View
                  key={`${block.id}-${idx}`}
                  style={[
                    styles.block,
                    {
                      top:             block.startY,
                      height:          blockH,
                      left:            leftOff + 3,
                      width:           colWidth - 6,
                      backgroundColor: block.isLive ? palette.dot : palette.bg,
                      borderColor:     palette.border,
                      padding:         isTiny || block.isLive ? 0 : 4,
                      opacity:         block.isDone && !block.isLive ? 0.5 : 1,
                    },
                    block.isLive && styles.blockLive,
                   ]}
                >
                  {/* Status badge — top row */}
                  {(showName || block.isDone) && (
                    <View style={styles.blockHeader}>
                      {showName && (
                        <Text
                          style={[styles.blockName, { color: palette.dot }]}
                          numberOfLines={1}
                        >
                          {block.name}
                        </Text>
                      )}
                      {block.isDone && (
                        <Text style={[styles.doneCheck, { color: palette.dot }]}>✓</Text>
                      )}
                    </View>
                  )}

                  {showDuration && (
                    <Text style={[styles.blockDuration, { color: palette.dot }]}>
                      {formatLive(sessionMs)}
                    </Text>
                  )}

                  {/* Animated live pulse dot */}
                  {block.isLive && <LiveDot color={palette.dot} />}
                </View>
              )
            })}

            {/* ── Live session pointers — name + bar + live timer ──────────── */}
            {blocksWithCols
              .map((block, idx) => ({ block, idx }))
              .filter(({ block }) => block.isLive)
              .map(({ block, idx }) => {
                const palette   = getTaskPalette(block)
                const liveTask  = block.task
                const totalMs   = liveTask ? getTotalMs(liveTask, now) : (now - block.startTime)
                const numCols   = numColsForBlock[idx]
                const colWidth  = timelineW / numCols
                const leftOff   = block.col * colWidth

                return (
                  <View
                    key={`ptr-${block.id}`}
                    style={[
                      styles.pointer,
                      { top: nowTop + 5, left: leftOff + 3, width: colWidth - 6 },
                    ]}
                  >
                    <View style={[styles.pointerDot, {
                      backgroundColor: palette.dot,
                      shadowColor:     palette.dot,
                    }]} />
                    <Text
                      style={[styles.pointerName, { color: C.inkPrimary }]}
                      numberOfLines={1}
                    >
                      {block.name}
                    </Text>
                    <View style={[styles.pointerBar, { backgroundColor: C.inkFaint }]} />
                    <Text style={[styles.pointerTime, { color: palette.dot }]}>
                      {formatLive(totalMs)}
                    </Text>
                  </View>
                )
              })}

            {/* ── Current time line (red, today only) ─────────────────────── */}
            {selDate === todayKey && nowTop >= 0 && nowTop <= totalH && (
              <View style={[styles.nowLine, { top: nowTop, left: -LABEL_W }]}>
                <View style={[styles.nowDot, { left: LABEL_W - 5 }]} />
              </View>
            )}

          </View>
        </View>
      </ScrollView>
    </View>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    flexDirection:     'row',
    alignItems:        'flex-start',
    justifyContent:    'space-between',
    paddingHorizontal: 20,
    paddingBottom:     14,
  },
  title: {
    fontSize:   28,
    fontWeight: '800',
  },
  dayLabel: {
    fontSize:   13,
    fontWeight: '500',
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

  // Hour grid
  hourRow: {
    position:       'absolute',
    left:            0,
    right:           0,
    height:          HOUR_H,
    flexDirection:  'row',
    alignItems:     'flex-start',
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  hourLabelWrap: {
    width:          LABEL_W,
    flexDirection:  'row',
    alignItems:     'baseline',
    justifyContent: 'flex-end',
    paddingRight:    10,
    paddingTop:      4,
    gap:             2,
  },
  hourNum: {
    fontSize:   12,
    fontWeight: '600',
    lineHeight: 16,
  },
  hourSuffix: {
    fontSize:   9,
    lineHeight: 14,
  },
  hourLine: {
    flex:      1,
    height:    StyleSheet.hairlineWidth,
    marginTop: 7,
  },

  // Session block
  block: {
    position:        'absolute',
    borderWidth:     1,
    borderRadius:    6,
    padding:         4,
    overflow:        'hidden',
  },
  blockLive: {
    padding:         0,
    shadowColor:    '#7C5CFC',
    shadowOffset:   { width: 0, height: 0 },
    shadowOpacity:  0.25,
    shadowRadius:   6,
    elevation:      3,
  },
  blockHeader: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    gap:             4,
  },
  blockName: {
    fontSize:      10,
    fontWeight:    '700',
    letterSpacing:  0.1,
    flex:           1,
  },
  doneCheck: {
    fontSize:   11,
    fontWeight: '700',
    flexShrink: 0,
  },
  blockDuration: {
    fontSize:   9,
    fontWeight: '500',
    marginTop:  2,
    opacity:    0.75,
  },

  // Live pointer label (name + bar + timer)
  pointer: {
    position:       'absolute',
    flexDirection:  'row',
    alignItems:     'center',
    gap:             4,
    overflow:       'hidden',
  },
  pointerDot: {
    width:         7,
    height:        7,
    borderRadius:  3.5,
    flexShrink:    0,
    shadowOffset:  { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius:  4,
    elevation:     3,
  },
  pointerName: {
    fontSize:   10,
    fontWeight: '700',
    flexShrink: 1,
    flexGrow:   1,
  },
  pointerBar: {
    width:      1,
    height:     10,
    flexShrink: 0,
  },
  pointerTime: {
    fontSize:    10,
    fontWeight:  '600',
    fontVariant: ['tabular-nums'],
    flexShrink:  0,
  },

  // Current time line — red
  nowLine: {
    position:        'absolute',
    right:           0,
    height:          1.5,
    backgroundColor: NOW_COLOR,
    zIndex:          10,
  },
  nowDot: {
    position:        'absolute',
    top:             -4,
    width:           10,
    height:          10,
    borderRadius:    5,
    backgroundColor: NOW_COLOR,
    shadowColor:     NOW_COLOR,
    shadowOffset:    { width: 0, height: 0 },
    shadowOpacity:   0.5,
    shadowRadius:    4,
    elevation:       4,
  },
})
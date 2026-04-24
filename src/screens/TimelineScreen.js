import React, { useRef, useEffect, useMemo } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, useWindowDimensions, Animated,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTaskContext } from '../context/TaskContext'
import { 
  COLORS, DAY_FULL, MONTH_FULL, getTaskPalette, 
  HOUR_H, TIMELINE_START, TIMELINE_END, DEFAULT_TAGS 
} from '../constants'
import { toKey, formatShort, formatLive, getTotalMs } from '../utils'
import WeekPicker from '../components/WeekPicker'

const LABEL_W   = 52
const NOW_COLOR = '#F43F5E'

// ── Column layout (no overlap) ────────────────────────────────────────────────

function buildColumns(blocks) {
  const sorted = [...blocks].sort((a, b) => a.startY - b.startY)
  const cols = []
  return sorted.map(block => {
    // Tolerance of 2px handles floating-point gaps between chained sessions
    let colIdx = cols.findIndex(col => {
      const last = col[col.length - 1]
      return last.realEndY <= block.startY + 2
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

  
  const scrollRef = useRef(null)

  // `tick` drives live updates — recalculate `now` every second
  const now       = Date.now()
  const todayKey  = toKey(new Date())
  const timelineW = screenWidth - LABEL_W - 16

  const nowDate  = new Date(now)
  const nowHours = nowDate.getHours() + nowDate.getMinutes() / 60 + (nowDate.getSeconds() + nowDate.getMilliseconds() / 1000) / 3600
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
    const dayStart    = new Date(selDate + 'T00:00:00').getTime()
    const msPerHour   = 3600000
    const timelineStartMs = TIMELINE_START * msPerHour

    const getYFromMs = (ms) => {
      const relativeMs = ms - dayStart - timelineStartMs
      return (relativeMs / msPerHour) * HOUR_H
    }

    const blocks = []
    dayTasks.forEach((task, taskIdx) => {
      const paletteLen = (DEFAULT_TAGS && DEFAULT_TAGS.length) || 1
      const colorIdx = task.colorIdx ?? (taskIdx % paletteLen)
      
      const displaySessions = [...(task.sessions || [])]
      displaySessions.forEach(sess => {
        const sTime = sess.startTime
        let eTime   = sess.endTime || now
        
        // CORTEX: Zero Future Rule
        if (selDate === todayKey && eTime > now) {
          eTime = now
        }

        const startY = getYFromMs(sTime)
        const endY   = getYFromMs(eTime)
        
        // A live session that crossed midnight
        const hasCrossedMidnight = !sess.endTime && eTime < sTime

        let height, realEndY
        if (!sess.endTime) {
          const liveEndY = hasCrossedMidnight
            ? (TIMELINE_END - TIMELINE_START) * HOUR_H
            : Math.max(nowTop, startY)
          height   = Math.max(0, liveEndY - startY)
          realEndY = liveEndY
        } else {
          // Normal session
          const clampedStart = Math.max(startY, 0)
          const clampedEnd   = Math.min(endY, totalH)
          if (clampedEnd <= clampedStart) return
          
          let h = clampedEnd - clampedStart
          // Strict clipping for today
          if (selDate === todayKey && (clampedStart + h) > nowTop) {
            h = Math.max(0, nowTop - clampedStart)
          }

          height   = h
          realEndY = clampedStart + h
        }

        const blockId = sess.id ? `${sess.id}` : `${task.id}-${sess.startTime}`
        blocks.push({
          id: blockId, taskId: task.id, name: task.name, task, colorIdx,
          isLive:  !sess.endTime,
          hasCrossedMidnight,
          isDone:  task.done,
          startY, height, realEndY,
          startTime: sess.startTime, endTime: sess.endTime,
          tagId: task.tagId, tags: task.tags,
        })
      })
    })
    return blocks
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dayTasks, tick, selDate, nowTop, todayKey, totalH, now])

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
    <View style={[styles.container, { backgroundColor: '#F8F9FA' }]}>

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <View style={[styles.header, { backgroundColor: '#F8F9FA', paddingTop: insets.top + 14 }]}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: '#1A1A1A' }]}>Timeline</Text>
          <Text style={[styles.dayLabel, { color: ( (typeof darkMode !== 'undefined' && darkMode) ? COLORS.dark : COLORS.light).inkMuted }]}>{dayLabel}</Text>
        </View>
        <TouchableOpacity
          onPress={toggleDarkMode}
          style={[styles.themeBtn, { backgroundColor: '#FFFFFF' }]}
        >
          <Text style={{ fontSize: 17 }}>{darkMode ? '☀️' : '🌙'}</Text>
        </TouchableOpacity>
      </View>

      {/* ── Week picker ──────────────────────────────────────────────────────── */}
      <WeekPicker darkMode={darkMode}
        weekStart={weekStart}
        selDate={selDate}
        tasks={tasks}
        
        onPrevWeek={prevWeek}
        onNextWeek={nextWeek}
        onSelectDay={selectDay}
      />

      {/* ── Timeline scroll ──────────────────────────────────────────────────── */}
      <ScrollView
        ref={scrollRef}
        style={{ flex: 1, backgroundColor: '#F8F9FA' }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 110 }}
      >
        <View style={{ height: totalH, position: 'relative', marginTop: 8 }}>

          {/* ── Hour grid ─────────────────────────────────────────────────── */}
          {hours.map(h => {
            const top    = (h - TIMELINE_START) * HOUR_H
            const label = `${String(h).padStart(2, '0')}:00`
            return (
              <View key={h} style={[styles.hourRow, { top, borderTopColor: '#E5E7EB' }]}>
                <View style={styles.hourLabelWrap}>
                  <Text style={[styles.hourNum, { color: ( (typeof darkMode !== 'undefined' && darkMode) ? COLORS.dark : COLORS.light).inkMuted, fontSize: 11 }]}>{label}</Text>
                </View>
                <View style={[styles.hourLine, { backgroundColor: '#E5E7EB' }]} />
              </View>
            )
          })}

          {/* ── Session blocks (Clipped at nowLine) ───────────────────────── */}
          <View 
            style={{ 
              position: 'absolute', top: 0, left: LABEL_W, right: 8, bottom: 0,
              height: (selDate === todayKey && nowTop > 0) ? nowTop : totalH,
              overflow: 'hidden',
              zIndex: 1,
            }}
          >
            {blocksWithCols.map((block, idx) => {
              const numCols    = numColsForBlock[idx]
              const colWidth   = timelineW / numCols
              const leftOff    = block.col * colWidth
              const palette    = getTaskPalette(block) || { dot: '#7C5CFC', bg: '#F1E9FF', border: '#DDD6FE' }
              
              const sessionMs  = block.endTime
                ? block.endTime - block.startTime
                : now - block.startTime

              const isCompact    = block.height < 36
              const showDuration = !block.isLive && !isCompact && block.height >= 48

              return (
                <View
                  key={`${block.id}-${idx}`}
                  style={[
                    styles.block,
                    {
                      top:             block.startY + 2,
                      height:          Math.max(4, block.height - 4),
                      left:            leftOff + 3,
                      width:           colWidth - 6,
                      backgroundColor: palette.dot,
                      borderWidth:     0,
                      padding:          8,
                      borderRadius:    4,
                      opacity:         1,
                      zIndex:          block.isLive ? 3 : 1,
                      minHeight:       0,
                      borderBottomWidth: 0,
                      // No shadow for finished blocks to keep them flat and distinct
                      shadowOpacity:   (typeof darkMode !== 'undefined' && darkMode) ? 0.3 : 0,
                      elevation:       block.isLive ? 3 : 0,
                    },
                   ]}
                >
                  {/* Compact row: name + done check on one line */}
                  {!block.isLive && isCompact && (
                    <View style={styles.blockCompactRow}>
                      <Text
                        style={[styles.blockNameCompact, { color: '#FFF' }]}
                        numberOfLines={1}
                      >
                        {block.name}
                      </Text>
                      {block.isDone && (
                        <Text style={[styles.doneCheckCompact, { color: '#FFF' }]}>✓</Text>
                      )}
                    </View>
                  )}

                  {/* Normal row: name + done check */}
                  {!block.isLive && !isCompact && (
                    <View style={styles.blockHeader}>
                      <Text
                        style={[styles.blockName, { color: '#FFF' }]}
                        numberOfLines={1}
                      >
                        {block.name}
                      </Text>
                      {block.isDone && (
                        <Text style={[styles.doneCheck, { color: '#FFF' }]}>✓</Text>
                      )}
                    </View>
                  )}

                  {showDuration && (
                    <Text style={[styles.blockDuration, { color: '#FFF', opacity: 0.9 }]}>
                      {formatLive(sessionMs)}
                    </Text>
                  )}

                  {/* Animated live pulse dot */}
                  {block.isLive && <LiveDot color="#FFF" />}
                </View>
              )
            })}
          </View>

          {/* ── Overlays (Pointers & nowLine) ────────────────────────────── */}
          <View style={{ position: 'absolute', top: 0, left: LABEL_W, right: 8, bottom: 0, pointerEvents: 'none', zIndex: 10 }}>
            {/* ── Live session pointer — name + bar + live timer ──────────── */}
            {blocksWithCols.map((block, idx) => {
              if (!block.isLive || block.hasCrossedMidnight) return null
              const palette = getTaskPalette(block.task) || { dot: '#7C5CFC', bg: '#F1E9FF', border: '#DDD6FE' }
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
                    style={[styles.pointerName, { color: (typeof darkMode !== 'undefined' && darkMode) ? COLORS.dark.inkPrimary : COLORS.light.inkPrimary }]}
                    numberOfLines={1}
                  >
                    {block.name}
                  </Text>
                  <View style={[styles.pointerBar, { backgroundColor: (typeof darkMode !== 'undefined' && darkMode) ? COLORS.dark.inkFaint : COLORS.light.inkFaint }]} />
                  <Text style={[styles.pointerTime, { color: palette.dot }]}>
                    {formatLive(totalMs)}
                  </Text>
                </View>
              )
            })}

            {/* ── Current time line (red, today only) ─────────────────────── */}
            {selDate === todayKey && nowTop >= 0 && nowTop <= totalH && (
              <View style={[styles.nowLine, { top: nowTop, left: -5 }]}>
                <View style={[styles.nowDot, { left: -5 }]} />
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
    borderRadius:    4,
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
  blockCompactRow: {
    flex:           1,
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    gap:             2,
    overflow:       'hidden',
  },
  blockNameCompact: {
    fontSize:      9,
    fontWeight:    '700',
    letterSpacing:  0.1,
    flex:           1,
  },
  doneCheckCompact: {
    fontSize:   9,
    fontWeight: '700',
    flexShrink: 0,
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
    height:          2,
    backgroundColor: NOW_COLOR,
    zIndex:          1000,
  },
  nowDot: {
    position:        'absolute',
    top:             -4,
    width:           10,
    height:          10,
    borderRadius:    5,
    backgroundColor: NOW_COLOR,
  },
})
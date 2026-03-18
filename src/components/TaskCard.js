import React, { memo, useCallback } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { TASK_PALETTE, DEFAULT_TAGS } from '../constants'
import { getTaskStatus, getTotalMs, formatLive, formatShort } from '../utils'

const TaskCard = memo(function TaskCard({
  task, index, tick, isExpanded, colors: C,
  onPress, onStart, onPause, onDone, onDelete, onToggleFavorite,
}) {
  const now     = Date.now()
  const status  = getTaskStatus(task)
  const totalMs = getTotalMs(task, now)
  const palette = TASK_PALETTE[task.colorIdx ?? (index % TASK_PALETTE.length)]

  let timeText = '—'
  if (status === 'active') timeText = formatLive(totalMs)
  else if (totalMs > 0)    timeText = formatShort(totalMs)

  const isActive   = status === 'active'
  const isDone     = status === 'done'
  const isFavorite = task.favorite ?? false

  const statusLabel = isActive ? 'In Progress' : isDone ? 'Done' : 'Paused'

  const taskTags = (task.tags ?? [])
    .map(id => DEFAULT_TAGS.find(t => t.id === id))
    .filter(Boolean)

  const handleFavorite = useCallback((e) => {
    e.stopPropagation?.()
    onToggleFavorite?.()
  }, [onToggleFavorite])

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={onPress}
      style={styles.wrapper}
    >
      <View style={[
        styles.card,
        { backgroundColor: palette.bg, borderColor: palette.border },
        isDone && { opacity: 0.75 },
      ]}>
        {/* Top row: status pill + time + heart */}
        <View style={styles.topRow}>
          <View style={[styles.statusPill, { backgroundColor: palette.dot }]}>
            <Text style={styles.statusPillText}>{statusLabel}</Text>
          </View>
          <View style={styles.topRight}>
            <View style={styles.timeWrap}>
              {isActive && <View style={[styles.liveDot, { backgroundColor: palette.dot }]} />}
              <Text style={[styles.timeText, { color: palette.textColor }]}>{timeText}</Text>
            </View>
            <TouchableOpacity onPress={handleFavorite} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={[styles.heart, isFavorite && styles.heartActive]}>
                {isFavorite ? '♥' : '♡'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Task name */}
        <Text
          style={[
            styles.taskName,
            { color: palette.textColor },
            isDone && { textDecorationLine: 'line-through' },
          ]}
          numberOfLines={2}
        >
          {task.name}
        </Text>

        {/* Tags */}
        {taskTags.length > 0 && (
          <View style={styles.tagsRow}>
            {taskTags.map(tag => (
              <View key={tag.id} style={[styles.tagChip, { backgroundColor: tag.bg, borderColor: tag.color + '40' }]}>
                <Text style={[styles.tagText, { color: tag.color }]}>{tag.label}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Expanded actions */}
        {isExpanded && (
          <View style={[styles.actions, { borderTopColor: `${palette.dot}30` }]}>
            {status === 'idle' && (
              <TouchableOpacity
                style={[styles.btn, { backgroundColor: palette.dot }]}
                onPress={onStart}
                activeOpacity={0.8}
              >
                <Text style={styles.btnText}>
                  {task.sessions.length === 0 ? 'Start' : 'Resume'}
                </Text>
              </TouchableOpacity>
            )}
            {status === 'active' && (
              <>
                <TouchableOpacity
                  style={[styles.btnOutline, { borderColor: palette.dot }]}
                  onPress={onPause}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.btnOutlineText, { color: palette.dot }]}>Pause</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.btn, { backgroundColor: C.emerald }]}
                  onPress={onDone}
                  activeOpacity={0.8}
                >
                  <Text style={styles.btnText}>Done ✓</Text>
                </TouchableOpacity>
              </>
            )}
            {status === 'done' && (
              <TouchableOpacity
                style={[styles.btnOutline, { borderColor: palette.dot }]}
                onPress={onStart}
                activeOpacity={0.75}
              >
                <Text style={[styles.btnOutlineText, { color: palette.dot }]}>Reopen</Text>
              </TouchableOpacity>
            )}
            <View style={{ flex: 1 }} />
            <TouchableOpacity
              style={[styles.deleteBtn, { borderColor: `${palette.dot}40` }]}
              onPress={onDelete}
              activeOpacity={0.7}
            >
              <Text style={[styles.deleteBtnText, { color: palette.dot, opacity: 0.5 }]}>✕</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </TouchableOpacity>
  )
})

export default TaskCard

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 16,
    paddingVertical:    6,
  },
  card: {
    borderRadius:  20,
    borderWidth:   1.5,
    padding:       18,
    shadowColor:   '#000',
    shadowOffset:  { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius:  12,
    elevation:     2,
  },
  topRow: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    marginBottom:   12,
  },
  statusPill: {
    paddingHorizontal: 12,
    paddingVertical:    5,
    borderRadius:      20,
  },
  statusPillText: {
    color:      '#FFFFFF',
    fontSize:   11,
    fontWeight: '700',
  },
  topRight: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           10,
  },
  timeWrap: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           5,
  },
  liveDot: {
    width:        7,
    height:       7,
    borderRadius: 3.5,
  },
  timeText: {
    fontSize:   14,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  heart: {
    fontSize:  20,
    color:     '#C4BEE0',
    lineHeight: 24,
  },
  heartActive: {
    color: '#F472B6',
  },
  taskName: {
    fontSize:   20,
    fontWeight: '800',
    lineHeight: 26,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap:      'wrap',
    gap:            6,
    marginTop:      8,
  },
  tagChip: {
    paddingHorizontal: 10,
    paddingVertical:    4,
    borderRadius:      20,
    borderWidth:        1,
  },
  tagText: {
    fontSize:   11,
    fontWeight: '700',
  },
  actions: {
    flexDirection:  'row',
    alignItems:     'center',
    flexWrap:       'wrap',
    gap:             8,
    marginTop:      16,
    paddingTop:     16,
    borderTopWidth: 1,
  },
  btn: {
    paddingHorizontal: 20,
    paddingVertical:    10,
    borderRadius:      20,
  },
  btnText: {
    color:      '#FFFFFF',
    fontSize:   13,
    fontWeight: '700',
  },
  btnOutline: {
    paddingHorizontal: 20,
    paddingVertical:    10,
    borderRadius:      20,
    borderWidth:        2,
  },
  btnOutlineText: {
    fontSize:   13,
    fontWeight: '700',
  },
  deleteBtn: {
    width:          38,
    height:         38,
    borderRadius:   19,
    borderWidth:    1.5,
    alignItems:     'center',
    justifyContent: 'center',
  },
  deleteBtnText: {
    fontSize:   14,
    fontWeight: '600',
  },
})

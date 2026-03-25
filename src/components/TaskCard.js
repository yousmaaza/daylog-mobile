import React, { memo, useCallback } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { getTaskPalette, DEFAULT_TAGS } from '../constants'
import { getTaskStatus, getTotalMs, formatLive, formatShort } from '../utils'

const TaskCard = memo(function TaskCard({
  task, index, tick, isExpanded, colors: C, isToday,
  onPress, onStart, onPause, onDone, onDelete, onToggleFavorite, onChangeTag,
}) {
  const now     = Date.now()
  const status  = getTaskStatus(task)
  const totalMs = getTotalMs(task, now)
  const palette = getTaskPalette(task)

  let timeText = '—'
  if (totalMs > 0) timeText = formatLive(totalMs)

  const isActive   = status === 'active'
  const isDone     = status === 'done'
  const isFavorite = task.favorite ?? false

  const statusLabel = isActive ? 'In Progress' : isDone ? 'Done' : 'Paused'

  const actualTagId = task.tagId || (task.tags && task.tags[0]) || 'other'
  const taskTag = DEFAULT_TAGS.find(t => t.id === actualTagId)

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

        {/* Task name + Quick Actions */}
        <View style={styles.nameRow}>
          <Text
            style={[
              styles.taskName,
              { color: palette.textColor, flex: 1 },
              isDone && { textDecorationLine: 'line-through' },
            ]}
            numberOfLines={2}
          >
            {task.name}
          </Text>

          {/* Quick Actions (Always visible) */}
          <View style={styles.quickActions}>
            {status === 'idle' && (
              <TouchableOpacity
                style={[styles.miniBtn, { backgroundColor: isToday ? palette.dot : C.border }]}
                onPress={onStart}
                activeOpacity={0.8}
                disabled={!isToday}
              >
                <Text style={styles.miniBtnText}>
                  {(task.sessions?.length ?? 0) === 0 ? 'Start' : 'Resume'}
                </Text>
              </TouchableOpacity>
            )}
            {status === 'active' && (
              <View style={{ flexDirection: 'row', gap: 6 }}>
                <TouchableOpacity
                  style={[styles.miniBtnOutline, { borderColor: palette.dot }]}
                  onPress={onPause}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.miniBtnOutlineText, { color: palette.dot }]}>Pause</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.miniBtn, { backgroundColor: C.emerald }]}
                  onPress={onDone}
                  activeOpacity={0.8}
                >
                  <Text style={styles.miniBtnText}>Done</Text>
                </TouchableOpacity>
              </View>
            )}
            {status === 'done' && isToday && (
              <View style={{ flexDirection: 'row', gap: 6 }}>
                <TouchableOpacity
                  style={[styles.miniBtnOutline, { borderColor: palette.dot }]}
                  onPress={onStart}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.miniBtnOutlineText, { color: palette.dot }]}>Reopen</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.miniBtnOutline, { borderColor: `${palette.dot}40`, paddingHorizontal: 8 }]}
                  onPress={onDelete}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.miniBtnOutlineText, { color: palette.dot, opacity: 0.5 }]}>✕</Text>
                </TouchableOpacity>
              </View>
            )}
            {/* If idle or active, show x only when expanded? No, user said "after done". Let's show consistently in quickActions if needed, or only when expanded. 
               Actually, let's keep it simple: if expanded, show it after the main buttons in the quickActions Row! */}
            {isExpanded && status !== 'done' && (
              <TouchableOpacity
                style={[styles.miniBtnOutline, { borderColor: `${palette.dot}40`, marginLeft: 6, paddingHorizontal: 8 }]}
                onPress={onDelete}
                activeOpacity={0.7}
              >
                <Text style={[styles.miniBtnOutlineText, { color: palette.dot, opacity: 0.5 }]}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Tags */}
        {taskTag && (
          <View style={styles.tagsRow}>
            <View style={[styles.tagChip, { backgroundColor: taskTag.bg, borderColor: taskTag.dot + '40' }]}>
              <Text style={[styles.tagText, { color: taskTag.dot }]}>{taskTag.label}</Text>
            </View>
          </View>
        )}

        {/* Expanded actions */}
        {isExpanded && (
          <View>
            <View style={[styles.actions, { borderTopColor: `${palette.dot}30` }]}>
              <View style={{ flex: 1 }} />
            </View>

            <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: `${palette.dot}30` }}>
              <Text style={{ fontSize: 11, fontWeight: '600', color: C.inkMuted, marginBottom: 8, letterSpacing: 0.5 }}>Change Tag</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {DEFAULT_TAGS.map(t => {
                  const active = t.id === actualTagId
                  return (
                    <TouchableOpacity
                      key={t.id}
                      onPress={() => onChangeTag && onChangeTag(t.id)}
                      style={{
                        paddingHorizontal: 12, paddingVertical: 6,
                        borderRadius: 20, borderWidth: 1,
                        backgroundColor: active ? t.dot : C.bgInput,
                        borderColor: active ? t.dot : C.border,
                      }}
                    >
                      <Text style={{ fontSize: 11, fontWeight: '700', color: active ? '#FFF' : C.inkMuted }}>
                        {t.label}
                      </Text>
                    </TouchableOpacity>
                  )
                })}
              </View>
            </View>
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
  nameRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           12,
  },
  taskName: {
    fontSize:   20,
    fontWeight: '800',
    lineHeight: 26,
  },
  quickActions: {
    flexDirection: 'row',
    alignItems:    'center',
  },
  miniBtn: {
    paddingHorizontal: 12,
    paddingVertical:    6,
    borderRadius:      12,
  },
  miniBtnText: {
    color:      '#FFFFFF',
    fontSize:   12,
    fontWeight: '700',
  },
  miniBtnOutline: {
    paddingHorizontal: 12,
    paddingVertical:    6,
    borderRadius:      12,
    borderWidth:        1.5,
  },
  miniBtnOutlineText: {
    fontSize:   12,
    fontWeight: '700',
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

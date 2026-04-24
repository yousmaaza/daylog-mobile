import React, { memo, useCallback } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, TextInput } from 'react-native'
import { COLORS,  getTaskPalette, DEFAULT_TAGS } from '../constants'
import { getTaskStatus, getTotalMs, formatLive, formatShort, formatTime } from '../utils'

const TaskCard = memo(function TaskCard({ darkMode, 
  task, index, tick, isExpanded,  isToday,
  onPress, onStart, onPause, onDone, onDelete, onDeleteSession, onUpdateSession, onToggleFavorite, onChangeTag,
}) {
  const now     = Date.now()
  const [showAllSess, setShowAllSess] = React.useState(false)
  const [editingId, setEditingId]     = React.useState(null)
  const [editStart, setEditStart]     = React.useState('')
  const [editEnd, setEditEnd]         = React.useState('')

  const handleEdit = (group) => {
    setEditingId(group.groupKey)
    setEditStart(formatTime(group.startTime))
    setEditEnd(group.endTime ? formatTime(group.endTime) : '')
  }

  const saveEdit = (group) => {
    // We update the primary session of the group
    const base = new Date(group.startTime)
    const parse = (str) => {
      const [h, m] = str.split(':').map(Number)
      const d = new Date(base)
      d.setHours(h || 0, m || 0, 0, 0)
      let ts = d.getTime()
      // Rule: no session exceeds the current time
      if (isToday && ts > now) return now
      return ts
    }
    const newStart = parse(editStart)
    const newEnd   = editEnd ? parse(editEnd) : null
    onUpdateSession?.(group.sessionIds[0], newStart, newEnd)
    setEditingId(null)
  }
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
              <View style={{ flexDirection: 'row', gap: 6 }}>
                <TouchableOpacity
                  style={[styles.miniBtn, { backgroundColor: isToday ? palette.dot : ( (typeof darkMode !== 'undefined' && darkMode) ? COLORS.dark : COLORS.light).border }]}
                  onPress={onStart}
                  activeOpacity={0.8}
                  disabled={!isToday}
                >
                  <Text style={styles.miniBtnText}>
                    {(task.sessions?.length ?? 0) === 0 ? '▶ Start' : '▶ Resume'}
                  </Text>
                </TouchableOpacity>
                {(task.sessions?.length ?? 0) > 0 && (
                  <TouchableOpacity
                    style={[styles.miniBtn, { backgroundColor: ( (typeof darkMode !== 'undefined' && darkMode) ? COLORS.dark : COLORS.light).emerald }]}
                    onPress={onDone}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.miniBtnText}>✓ Done</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[styles.miniBtnOutline, { borderColor: `${palette.dot}40`, paddingHorizontal: 8 }]}
                  onPress={onDelete}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.miniBtnOutlineText, { color: palette.dot, opacity: 0.5 }]}>✕</Text>
                </TouchableOpacity>
              </View>
            )}
            {status === 'active' && (
              <View style={{ flexDirection: 'row', gap: 6 }}>
                <TouchableOpacity
                  style={[styles.miniBtnOutline, { borderColor: palette.dot }]}
                  onPress={onPause}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.miniBtnOutlineText, { color: palette.dot }]}>|| Pause</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.miniBtn, { backgroundColor: ( (typeof darkMode !== 'undefined' && darkMode) ? COLORS.dark : COLORS.light).emerald }]}
                  onPress={onDone}
                  activeOpacity={0.8}
                >
                  <Text style={styles.miniBtnText}>✓ Done</Text>
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
          </View>
        </View>

        {/* Tags (only if not expanded) */}
        {!isExpanded && taskTag && (
          <View style={styles.tagsRow}>
            <View style={[styles.tagChip, { backgroundColor: taskTag.bg, borderColor: taskTag.dot + '40' }]}>
              <Text style={[styles.tagText, { color: taskTag.dot }]}>{taskTag.label}</Text>
            </View>
          </View>
        )}

        {/* Expanded content */}
        {isExpanded && (
          <View style={{ marginTop: 16 }}>
            <View style={{ height: 1, backgroundColor: `${palette.dot}30`, marginBottom: 16 }} />

            {/* Tags (if expanded) */}
            {taskTag && (
              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 11, fontWeight: '600', color: ( (typeof darkMode !== 'undefined' && darkMode) ? COLORS.dark : COLORS.light).inkMuted, marginBottom: 8, letterSpacing: 0.5 }}>CURRENT TAG</Text>
                <View style={styles.tagsRow}>
                  <View style={[styles.tagChip, { backgroundColor: taskTag.bg, borderColor: taskTag.dot + '40' }]}>
                    <Text style={[styles.tagText, { color: taskTag.dot }]}>{taskTag.label}</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Sessions List */}
            {task.sessions && task.sessions.length > 0 && (
              <View style={{ marginBottom: 16 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <Text style={{ fontSize: 11, fontWeight: '600', color: ( (typeof darkMode !== 'undefined' && darkMode) ? COLORS.dark : COLORS.light).inkMuted, letterSpacing: 0.5 }}>
                    SESSIONS (LAST 5 OF {task.sessions.length})
                  </Text>
                </View>
                {(() => {
                  const grouped = []
                  task.sessions.forEach(s => {
                    const startKey = formatTime(s.startTime)
                    const endKey   = s.endTime ? formatTime(s.endTime) : 'Active'
                    const groupKey = `${startKey}-${endKey}`
                    const existing = grouped.find(g => g.groupKey === groupKey)
                    const duration = (s.endTime ? s.endTime : now) - s.startTime
                    if (existing && s.endTime) {
                      existing.totalDuration += duration
                      existing.sessionIds.push(s.id || s.startTime)
                    } else {
                      grouped.push({ ...s, groupKey, totalDuration: duration, sessionIds: [s.id || s.startTime] })
                    }
                  })

                  const displayList = grouped.slice(-5)

                  return displayList.map((group) => {
                    const sId = group.id || group.startTime
                    const isEditing = editingId === group.groupKey

                    return (
                      <View key={sId} style={{ marginBottom: 8, backgroundColor: ( (typeof darkMode !== 'undefined' && darkMode) ? COLORS.dark : COLORS.light).bgInput, padding: 8, borderRadius: 10 }}>
                        {isEditing ? (
                          <View style={{ gap: 8 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                              <TextInput
                                style={{ flex: 1, height: 36, backgroundColor: ( (typeof darkMode !== 'undefined' && darkMode) ? COLORS.dark : COLORS.light).bgApp, borderRadius: 6, paddingHorizontal: 8, fontSize: 14, color: ( (typeof darkMode !== 'undefined' && darkMode) ? COLORS.dark : COLORS.light).inkPrimary, fontWeight: '700' }}
                                value={editStart}
                                onChangeText={setEditStart}
                                placeholder="Start"
                              />
                              <Text style={{ color: ( (typeof darkMode !== 'undefined' && darkMode) ? COLORS.dark : COLORS.light).inkMuted }}>to</Text>
                              <TextInput
                                style={{ flex: 1, height: 36, backgroundColor: ( (typeof darkMode !== 'undefined' && darkMode) ? COLORS.dark : COLORS.light).bgApp, borderRadius: 6, paddingHorizontal: 8, fontSize: 14, color: ( (typeof darkMode !== 'undefined' && darkMode) ? COLORS.dark : COLORS.light).inkPrimary, fontWeight: '700' }}
                                value={editEnd}
                                onChangeText={setEditEnd}
                                placeholder="End"
                              />
                            </View>
                            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8 }}>
                              <TouchableOpacity onPress={() => setEditingId(null)} style={{ padding: 6 }}>
                                <Text style={{ color: ( (typeof darkMode !== 'undefined' && darkMode) ? COLORS.dark : COLORS.light).inkMuted, fontSize: 12, fontWeight: '700' }}>Cancel</Text>
                              </TouchableOpacity>
                              <TouchableOpacity onPress={() => saveEdit(group)} style={{ backgroundColor: palette.dot, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 }}>
                                <Text style={{ color: '#FFF', fontSize: 12, fontWeight: '700' }}>Save</Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        ) : (
                          <TouchableOpacity 
                            activeOpacity={0.7} 
                            onPress={() => handleEdit(group)}
                            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
                          >
                            <Text style={{ fontSize: 13, color: palette.textColor, fontWeight: '600' }}>
                              {formatTime(group.startTime)}  <Text style={{ color: palette.dot, opacity: 0.6 }}>to</Text>  {group.endTime ? formatTime(group.endTime) : <Text style={{ color: palette.dot, fontStyle: 'italic' }}>Active now</Text>}
                            </Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                              <Text style={{ fontSize: 12, color: ( (typeof darkMode !== 'undefined' && darkMode) ? COLORS.dark : COLORS.light).inkMuted }}>{formatShort(group.totalDuration)}</Text>
                              <TouchableOpacity 
                                onPress={() => {
                                  group.sessionIds.forEach(id => onDeleteSession && onDeleteSession(id))
                                }} 
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                              >
                                <View style={{ backgroundColor: `${( (typeof darkMode !== 'undefined' && darkMode) ? COLORS.dark : COLORS.light).red}15`, width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
                                  <Text style={{ color: ( (typeof darkMode !== 'undefined' && darkMode) ? COLORS.dark : COLORS.light).red, fontSize: 12, fontWeight: '800' }}>✕</Text>
                                </View>
                              </TouchableOpacity>
                            </View>
                          </TouchableOpacity>
                        )}
                      </View>
                    )
                  })
                })()}
              </View>
            )}

            <View style={{ marginTop: 12 }}>
              <Text style={{ fontSize: 11, fontWeight: '600', color: ( (typeof darkMode !== 'undefined' && darkMode) ? COLORS.dark : COLORS.light).inkMuted, marginBottom: 8, letterSpacing: 0.5 }}>CHANGE TAG</Text>
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
                        backgroundColor: active ? t.dot : ( (typeof darkMode !== 'undefined' && darkMode) ? COLORS.dark : COLORS.light).bgInput,
                        borderColor: active ? t.dot : ( (typeof darkMode !== 'undefined' && darkMode) ? COLORS.dark : COLORS.light).border,
                      }}
                    >
                      <Text style={{ fontSize: 11, fontWeight: '700', color: active ? '#FFF' : ( (typeof darkMode !== 'undefined' && darkMode) ? COLORS.dark : COLORS.light).inkMuted }}>
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
    backgroundColor: ( (typeof darkMode !== 'undefined' && darkMode) ? COLORS.dark : COLORS.light).bgCard,
    padding:       18,
    borderWidth:   1,
    borderColor:   ( (typeof darkMode !== 'undefined' && darkMode) ? COLORS.dark : COLORS.light).border,
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
})

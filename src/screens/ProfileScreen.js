import React, { useState, useMemo } from 'react'
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  StyleSheet, Switch,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Svg, { Path, Circle, Rect } from 'react-native-svg'
import { useTaskContext } from '../context/TaskContext'
import { COLORS, DEFAULT_TAGS, getTaskPalette, MAX_USER_NAME } from '../constants'
import { getTotalMs, formatShort } from '../utils'

// ── Small chevron icon ────────────────────────────────────────────────────────
const Chevron = ({ color }) => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Path d="M9 18l6-6-6-6" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
)

// ── Menu row component ────────────────────────────────────────────────────────
function MenuRow({ icon, label, right, onPress, danger, colors: C, noBorder }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      style={[
        styles.menuRow,
        !noBorder && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.border },
        danger && { backgroundColor: '#FFF1F1' },
      ]}
    >
      {icon && (
        <View style={[styles.menuIcon, { backgroundColor: danger ? '#FFE4E4' : C.bgInput }]}>
          {icon}
        </View>
      )}
      <Text style={[styles.menuLabel, { color: danger ? '#EF4444' : C.inkPrimary }]}>{label}</Text>
      <View style={styles.menuRight}>
        {right}
        {onPress && <Chevron color={danger ? '#EF4444' : C.inkFaint} />}
      </View>
    </TouchableOpacity>
  )
}

// ── Profile Screen ────────────────────────────────────────────────────────────
export default function ProfileScreen() {
  const insets = useSafeAreaInsets()
  const {
    darkMode, toggleDarkMode,
    notificationsEnabled, toggleNotifications,
    userName, setUserName,
    user, logout,
    tasks,
    toggleFavorite,
  } = useTaskContext()
  const C = darkMode ? COLORS.dark : COLORS.light

  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput]     = useState(userName)
  const [showFavorites, setShowFavorites] = useState(true)

  // Collect all favorited tasks across all days, deduplicating by parentId
  // Tasks that span midnight share the same parentId — merge their sessions.
  const favoriteTasks = useMemo(() => {
    const byParent = new Map()
    Object.keys(tasks).forEach(dateKey => {
      tasks[dateKey].forEach(task => {
        if (!task.favorite) return
        const key = task.parentId || task.id
        if (byParent.has(key)) {
          const existing = byParent.get(key)
          byParent.set(key, {
            ...existing,
            sessions: [...existing.sessions, ...task.sessions],
          })
        } else {
          byParent.set(key, { ...task, dateKey })
        }
      })
    })
    return Array.from(byParent.values()).sort((a, b) => b.createdAt - a.createdAt)
  }, [tasks])

  const displayName = (user?.name || userName || 'Your Name').trim()
  const displayEmail = user?.email || ''
  const initials    = displayName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  const handleSaveName = () => {
    setUserName(nameInput.trim())
    setEditingName(false)
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: C.bgApp }]}
      contentContainerStyle={{ paddingBottom: insets.bottom + 110 }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <View style={[styles.header, { paddingTop: insets.top + 14, backgroundColor: C.bgApp }]}>
        <Text style={[styles.headerTitle, { color: C.inkPrimary }]}>Profile</Text>
        <TouchableOpacity
          onPress={toggleDarkMode}
          style={[styles.headerBtn, { backgroundColor: C.bgPanel }]}
        >
          <Text style={{ fontSize: 17 }}>{darkMode ? '☀️' : '🌙'}</Text>
        </TouchableOpacity>
      </View>

      {/* ── User card ───────────────────────────────────────────────────── */}
      <View style={[styles.userCard, { backgroundColor: C.bgPanel, marginHorizontal: 16, marginBottom: 12 }]}>
        <View style={[styles.avatarCircle, { backgroundColor: C.amber }]}>
          <Text style={styles.avatarText}>{initials || '?'}</Text>
        </View>

        <View style={{ flex: 1, gap: 2 }}>
          {editingName ? (
            <TextInput
              style={[styles.nameInput, { color: C.inkPrimary, borderBottomColor: C.amber }]}
              value={nameInput}
              onChangeText={setNameInput}
              onSubmitEditing={handleSaveName}
              onBlur={handleSaveName}
              autoFocus
              selectionColor={C.amber}
              maxLength={MAX_USER_NAME}
            />
          ) : (
            <Text style={[styles.userName, { color: C.inkPrimary }]}>{displayName}</Text>
          )}
          {displayEmail ? (
            <Text style={[styles.userEmail, { color: C.inkMuted }]}>{displayEmail}</Text>
          ) : (
            <Text style={[styles.userEmail, { color: C.inkFaint }]}>No email set</Text>
          )}
        </View>

        <TouchableOpacity
          style={[styles.editBtn, { backgroundColor: C.amber }]}
          onPress={() => { setNameInput(displayName); setEditingName(true) }}
        >
          <Text style={styles.editBtnText}>✎</Text>
        </TouchableOpacity>
      </View>

      {/* ── Favorites ───────────────────────────────────────────────────── */}
      <View style={[styles.section, { backgroundColor: C.bgPanel, marginHorizontal: 16, marginBottom: 12 }]}>
        <MenuRow
          icon={<Text style={{ fontSize: 16 }}>♥</Text>}
          label={`Favorites${favoriteTasks.length > 0 ? `  ·  ${favoriteTasks.length}` : ''}`}
          right={favoriteTasks.length > 0 && (
            <Text style={[styles.badge, { backgroundColor: C.amberLight, color: C.amber }]}>
              {favoriteTasks.length}
            </Text>
          )}
          onPress={favoriteTasks.length > 0 ? () => setShowFavorites(v => !v) : undefined}
          colors={C}
          noBorder={showFavorites && favoriteTasks.length > 0}
        />

        {showFavorites && favoriteTasks.length > 0 && (
          <View style={styles.favoritesList}>
            {favoriteTasks.map((task, i) => {
              const palette  = getTaskPalette(task)
              const tagId    = task.tagId || (task.tags && task.tags[0]) || 'other'
              const tagItem  = DEFAULT_TAGS.find(t => t.id === tagId)
              const ms       = getTotalMs(task, Date.now())
              return (
                <View
                  key={`${task.id}-${task.dateKey}-${i}`}
                  style={[
                    styles.favRow,
                    { borderTopColor: C.border },
                    i > 0 && { borderTopWidth: StyleSheet.hairlineWidth },
                  ]}
                >
                  <View style={[styles.favDot, { backgroundColor: palette.dot }]} />
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text style={[styles.favName, { color: C.inkPrimary }]} numberOfLines={1}>
                      {task.name}
                    </Text>
                    {tagItem && (
                      <View style={styles.favTags}>
                        <View style={[styles.miniTag, { backgroundColor: tagItem.bg }]}>
                          <Text style={[styles.miniTagText, { color: tagItem.dot }]}>{tagItem.label}</Text>
                        </View>
                      </View>
                    )}
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 4 }}>
                    {ms > 0 && (
                      <Text style={[styles.favTime, { color: C.inkMuted }]}>{formatShort(ms)}</Text>
                    )}
                    <TouchableOpacity onPress={() => toggleFavorite(task.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <Text style={{ fontSize: 16, color: '#F472B6' }}>♥</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )
            })}
          </View>
        )}

        {favoriteTasks.length === 0 && (
          <View style={[styles.emptyFav, { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.border }]}>
            <Text style={[styles.emptyFavText, { color: C.inkFaint }]}>
              Tap ♡ on any task to add it here
            </Text>
          </View>
        )}
      </View>

      {/* ── Settings ────────────────────────────────────────────────────── */}
      <View style={[styles.section, { backgroundColor: C.bgPanel, marginHorizontal: 16, marginBottom: 12 }]}>
        <MenuRow
          icon={<Text style={{ fontSize: 16 }}>{darkMode ? '☀️' : '🌙'}</Text>}
          label="Dark Mode"
          right={
            <Switch
              value={darkMode}
              onValueChange={toggleDarkMode}
              trackColor={{ false: C.border, true: C.amber }}
              thumbColor="#FFFFFF"
            />
          }
          colors={C}
        />
        <MenuRow
          icon={<Text style={{ fontSize: 16 }}>🔔</Text>}
          label="Notifications"
          right={
            <Switch
              value={notificationsEnabled}
              onValueChange={toggleNotifications}
              trackColor={{ false: C.border, true: C.amber }}
              thumbColor="#FFFFFF"
            />
          }
          colors={C}
          noBorder={true}
        />
      </View>

      {/* ── Sign out ─────────────────────────────────────────────────────── */}
      <View style={[styles.section, { backgroundColor: C.bgPanel, marginHorizontal: 16, marginBottom: 12 }]}>
        <MenuRow
          icon={<Text style={{ fontSize: 16 }}>→</Text>}
          label="Sign Out"
          onPress={logout}
          danger
          colors={C}
          noBorder={true}
        />
      </View>

      {/* App info */}
      <Text style={[styles.appVer, { color: C.inkFaint }]}>Echo  ·  v1.0</Text>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    flexDirection:    'row',
    alignItems:       'center',
    justifyContent:   'space-between',
    paddingHorizontal: 20,
    paddingBottom:    18,
  },
  headerTitle: {
    fontSize:   28,
    fontWeight: '800',
  },
  headerBtn: {
    width:          40,
    height:         40,
    borderRadius:   20,
    alignItems:     'center',
    justifyContent: 'center',
    shadowColor:    '#000',
    shadowOffset:   { width: 0, height: 2 },
    shadowOpacity:  0.07,
    shadowRadius:   6,
    elevation:      2,
  },

  userCard: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           14,
    borderRadius:  20,
    padding:       18,
    shadowColor:   '#000',
    shadowOffset:  { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius:  12,
    elevation:     2,
  },
  avatarCircle: {
    width:          56,
    height:         56,
    borderRadius:   28,
    alignItems:     'center',
    justifyContent: 'center',
    flexShrink:     0,
  },
  avatarText: {
    color:      '#FFFFFF',
    fontSize:   20,
    fontWeight: '800',
  },
  userName: {
    fontSize:   17,
    fontWeight: '700',
  },
  userEmail: {
    fontSize: 13,
  },
  nameInput: {
    fontSize:          17,
    fontWeight:        '700',
    borderBottomWidth: 2,
    paddingBottom:     2,
    paddingHorizontal: 0,
  },
  editBtn: {
    width:          36,
    height:         36,
    borderRadius:   18,
    alignItems:     'center',
    justifyContent: 'center',
    flexShrink:     0,
  },
  editBtnText: {
    color:      '#FFFFFF',
    fontSize:   18,
    lineHeight: 20,
  },

  section: {
    borderRadius:  20,
    overflow:      'hidden',
    shadowColor:   '#000',
    shadowOffset:  { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius:  12,
    elevation:     2,
  },
  menuRow: {
    flexDirection:    'row',
    alignItems:       'center',
    paddingHorizontal: 16,
    paddingVertical:   14,
    gap:               12,
  },
  menuIcon: {
    width:          36,
    height:         36,
    borderRadius:   12,
    alignItems:     'center',
    justifyContent: 'center',
    flexShrink:     0,
  },
  menuLabel: {
    flex:       1,
    fontSize:   15,
    fontWeight: '600',
  },
  menuRight: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical:   3,
    borderRadius:     20,
    fontSize:          12,
    fontWeight:        '700',
    overflow:         'hidden',
  },

  favoritesList: {
    paddingHorizontal: 16,
  },
  favRow: {
    flexDirection:  'row',
    alignItems:     'flex-start',
    gap:             10,
    paddingVertical: 12,
  },
  favDot: {
    width:        10,
    height:       10,
    borderRadius: 5,
    marginTop:    4,
    flexShrink:   0,
  },
  favName: {
    fontSize:   14,
    fontWeight: '600',
    lineHeight: 20,
  },
  favTime: {
    fontSize:   11,
    fontFamily: 'monospace',
  },
  favTags: {
    flexDirection: 'row',
    flexWrap:      'wrap',
    gap:            4,
  },
  miniTag: {
    paddingHorizontal: 8,
    paddingVertical:   3,
    borderRadius:     20,
  },
  miniTagText: {
    fontSize:   10,
    fontWeight: '700',
  },
  emptyFav: {
    padding:   16,
    alignItems: 'center',
  },
  emptyFavText: {
    fontSize:  13,
    textAlign: 'center',
  },

  appVer: {
    textAlign: 'center',
    fontSize:  12,
    marginTop: 8,
  },
})

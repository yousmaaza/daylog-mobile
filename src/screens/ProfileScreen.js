import React, { useState, useMemo } from 'react'
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  StyleSheet, Switch,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Svg, { Path, Circle, Rect } from 'react-native-svg'
import { useTaskContext } from '../context/TaskContext'
import { COLORS, TASK_PALETTE, DEFAULT_TAGS } from '../constants'
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
    templates, addTemplate, removeTemplate,
    userName, setUserName,
    user, logout,
    tasks,
    toggleFavorite,
  } = useTaskContext()
  const C = darkMode ? COLORS.dark : COLORS.light

  const [editingName, setEditingName]     = useState(false)
  const [nameInput, setNameInput]         = useState(userName)
  const [newTemplate, setNewTemplate]     = useState('')
  const [addingTemplate, setAddingTemplate] = useState(false)
  const [showFavorites, setShowFavorites] = useState(true)
  const [showTemplates, setShowTemplates] = useState(false)

  // Collect all favorited tasks across all days
  const favoriteTasks = useMemo(() => {
    const all = []
    Object.keys(tasks).forEach(dateKey => {
      tasks[dateKey].forEach(task => {
        if (task.favorite) all.push({ ...task, dateKey })
      })
    })
    return all.sort((a, b) => b.createdAt - a.createdAt)
  }, [tasks])

  const displayName = (user?.name || userName || 'Your Name').trim()
  const displayEmail = user?.email || ''
  const initials    = displayName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  const handleSaveName = () => {
    setUserName(nameInput.trim())
    setEditingName(false)
  }

  const handleAddTemplate = () => {
    if (newTemplate.trim()) {
      addTemplate(newTemplate.trim())
      setNewTemplate('')
      setAddingTemplate(false)
    }
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
              const palette  = TASK_PALETTE[task.colorIdx ?? (i % TASK_PALETTE.length)]
              const tagItems = (task.tags ?? []).map(id => DEFAULT_TAGS.find(t => t.id === id)).filter(Boolean)
              const ms       = getTotalMs(task, Date.now())
              return (
                <View
                  key={task.id}
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
                    {tagItems.length > 0 && (
                      <View style={styles.favTags}>
                        {tagItems.map(tag => (
                          <View key={tag.id} style={[styles.miniTag, { backgroundColor: tag.bg }]}>
                            <Text style={[styles.miniTagText, { color: tag.color }]}>{tag.label}</Text>
                          </View>
                        ))}
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

      {/* ── Quick Tasks / Templates ──────────────────────────────────────── */}
      <View style={[styles.section, { backgroundColor: C.bgPanel, marginHorizontal: 16, marginBottom: 12 }]}>
        <MenuRow
          icon={<Text style={{ fontSize: 16 }}>🏷</Text>}
          label={`Quick Tasks${templates.length > 0 ? `  ·  ${templates.length}` : ''}`}
          right={templates.length > 0 && (
            <Text style={[styles.badge, { backgroundColor: C.amberLight, color: C.amber }]}>
              {templates.length}
            </Text>
          )}
          onPress={() => setShowTemplates(v => !v)}
          colors={C}
          noBorder={showTemplates}
        />

        {showTemplates && (
          <View style={[styles.templateBody, { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.border }]}>
            {/* Add new template */}
            {addingTemplate ? (
              <View style={[styles.addRow, { borderColor: C.border }]}>
                <TextInput
                  style={[styles.templateInput, { color: C.inkPrimary }]}
                  value={newTemplate}
                  onChangeText={setNewTemplate}
                  onSubmitEditing={handleAddTemplate}
                  placeholder="Template name…"
                  placeholderTextColor={C.inkMuted}
                  autoFocus
                  selectionColor={C.amber}
                />
                <TouchableOpacity
                  style={[styles.addConfirmBtn, { backgroundColor: newTemplate.trim() ? C.amber : C.bgInput }]}
                  onPress={handleAddTemplate}
                >
                  <Text style={[styles.addConfirmText, { color: newTemplate.trim() ? '#FFFFFF' : C.inkMuted }]}>Add</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.cancelCircle, { backgroundColor: C.bgInput }]}
                  onPress={() => { setAddingTemplate(false); setNewTemplate('') }}
                >
                  <Text style={[{ color: C.inkMuted, fontSize: 14 }]}>✕</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.addTplBtn, { borderColor: C.border }]}
                onPress={() => setAddingTemplate(true)}
              >
                <Text style={[styles.addTplText, { color: C.amber }]}>+ Add template</Text>
              </TouchableOpacity>
            )}

            {templates.length === 0 && !addingTemplate && (
              <Text style={[styles.emptyTpl, { color: C.inkFaint }]}>
                No templates yet. Add some to speed up task creation.
              </Text>
            )}

            {templates.map((tpl, i) => {
              const palette = TASK_PALETTE[i % TASK_PALETTE.length]
              return (
                <View
                  key={tpl}
                  style={[
                    styles.tplRow,
                    { borderTopWidth: i === 0 && !addingTemplate ? 0 : StyleSheet.hairlineWidth, borderTopColor: C.border },
                  ]}
                >
                  <View style={[styles.tplDot, { backgroundColor: palette.dot }]} />
                  <Text style={[styles.tplName, { color: C.inkPrimary }]} numberOfLines={1}>{tpl}</Text>
                  <TouchableOpacity
                    onPress={() => removeTemplate(tpl)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text style={{ color: C.inkFaint, fontSize: 14 }}>✕</Text>
                  </TouchableOpacity>
                </View>
              )
            })}
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
      <Text style={[styles.appVer, { color: C.inkFaint }]}>Daylog  ·  v1.0</Text>
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

  templateBody: {
    paddingHorizontal: 16,
    paddingTop:        4,
    paddingBottom:     8,
  },
  addRow: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             8,
    borderWidth:     1.5,
    borderRadius:    14,
    paddingHorizontal: 12,
    paddingVertical:  8,
    marginVertical:   8,
  },
  templateInput: {
    flex:     1,
    fontSize: 15,
    padding:  0,
  },
  addConfirmBtn: {
    paddingHorizontal: 12,
    paddingVertical:    6,
    borderRadius:      20,
  },
  addConfirmText: {
    fontSize:   13,
    fontWeight: '700',
  },
  cancelCircle: {
    width:          30,
    height:         30,
    borderRadius:   15,
    alignItems:     'center',
    justifyContent: 'center',
  },
  addTplBtn: {
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginBottom:   4,
  },
  addTplText: {
    fontSize:   14,
    fontWeight: '600',
  },
  emptyTpl: {
    fontSize:     13,
    paddingVertical: 12,
    textAlign:    'center',
  },
  tplRow: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:             10,
    paddingVertical: 10,
  },
  tplDot: {
    width:        8,
    height:       8,
    borderRadius: 4,
    flexShrink:   0,
  },
  tplName: {
    flex:       1,
    fontSize:   14,
    fontWeight: '600',
  },

  appVer: {
    textAlign: 'center',
    fontSize:  12,
    marginTop: 8,
  },
})

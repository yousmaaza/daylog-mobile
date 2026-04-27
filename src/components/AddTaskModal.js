import React, { useState, useMemo } from 'react'
import { 
  Modal, View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, KeyboardAvoidingView, Platform, Pressable,
} from 'react-native'
import { useTaskContext } from '../context/TaskContext'
import { COLORS, DEFAULT_TAGS, MAX_TASK_NAME } from '../constants'

export default function AddTaskModal({ darkMode,  visible,  insets, onAdd, onClose }) {
  const { tasks } = useTaskContext()
  const [value, setValue]                 = useState('')
  const [selectedTagId, setSelectedTagId] = useState('other')
  const [selectedParentId, setSelectedParentId] = useState(null)

  const favoriteTasks = useMemo(() => {
    const all = []
    Object.values(tasks).forEach(dayTasks => {
      dayTasks.forEach(t => { if (t.favorite) all.push(t) })
    })
    const seenIds = new Set()
    const seenNames = new Set()
    return all
      .sort((a, b) => b.createdAt - a.createdAt)
      .filter(t => { 
        if (seenIds.has(t.id) || seenNames.has(t.name)) return false; 
        seenIds.add(t.id);
        seenNames.add(t.name);
        return true;
      })
  }, [tasks])

  const reset = () => {
    setValue('')
    setSelectedTagId('other')
    setSelectedParentId(null)
  }

  const handleAdd = () => {
    if (value.trim()) {
      onAdd(value.trim(), { tagId: selectedTagId, parentId: selectedParentId })
      reset()
    }
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const selectTag = (tagId) => {
    setSelectedTagId(tagId)
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <Pressable style={styles.backdrop} onPress={handleClose} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={[
          styles.sheet,
          { backgroundColor: ( (typeof darkMode !== 'undefined' && darkMode) ? COLORS.dark : COLORS.light).bgPanel, paddingBottom: insets.bottom + 24 },
        ]}>
          {/* Handle */}
          <View style={[styles.handle, { backgroundColor: ( (typeof darkMode !== 'undefined' && darkMode) ? COLORS.dark : COLORS.light).border }]} />

          {/* Title */}
          <Text style={[styles.title, { color: ( (typeof darkMode !== 'undefined' && darkMode) ? COLORS.dark : COLORS.light).inkPrimary }]}>New Task</Text>
          <Text style={[styles.subtitle, { color: ( (typeof darkMode !== 'undefined' && darkMode) ? COLORS.dark : COLORS.light).inkMuted }]}>
            What do you need to get done?
          </Text>

          {/* Favorites quick pick */}
          {favoriteTasks.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: ( (typeof darkMode !== 'undefined' && darkMode) ? COLORS.dark : COLORS.light).inkMuted }]}>♥ Favorites</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipsRow}
              >
                {favoriteTasks.map((fav, i) => {
                  const isSelected = value === fav.name
                  const favTagId   = fav.tagId || 'other'
                  const tag        = DEFAULT_TAGS.find(t => t.id === favTagId)
                  return (
                    <TouchableOpacity
                      key={`${fav.id}-${i}`}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: isSelected ? (tag?.dot ?? ( (typeof darkMode !== 'undefined' && darkMode) ? COLORS.dark : COLORS.light).amber) : ( (typeof darkMode !== 'undefined' && darkMode) ? COLORS.dark : COLORS.light).bgInput,
                          borderColor:     isSelected ? (tag?.dot ?? ( (typeof darkMode !== 'undefined' && darkMode) ? COLORS.dark : COLORS.light).amber) : ( (typeof darkMode !== 'undefined' && darkMode) ? COLORS.dark : COLORS.light).border,
                        },
                      ]}
                      onPress={() => {
                        setValue(fav.name)
                        setSelectedTagId(favTagId)
                        setSelectedParentId(fav.parentId || fav.id)
                      }}
                      activeOpacity={0.75}
                    >
                      <Text style={[
                        styles.chipText,
                        { color: isSelected ? '#FFFFFF' : ( (typeof darkMode !== 'undefined' && darkMode) ? COLORS.dark : COLORS.light).inkSecondary },
                      ]}>
                        {fav.name}
                      </Text>
                    </TouchableOpacity>
                  )
                })}
              </ScrollView>
            </View>
          )}

          {/* Input */}
          <View style={[
            styles.inputWrap,
            { borderColor: value.trim() ? ( (typeof darkMode !== 'undefined' && darkMode) ? COLORS.dark : COLORS.light).amber : ( (typeof darkMode !== 'undefined' && darkMode) ? COLORS.dark : COLORS.light).border, backgroundColor: ( (typeof darkMode !== 'undefined' && darkMode) ? COLORS.dark : COLORS.light).bgInput },
          ]}>
            <TextInput
              style={[styles.input, { color: ( (typeof darkMode !== 'undefined' && darkMode) ? COLORS.dark : COLORS.light).inkPrimary }]}
              placeholder="Task name…"
              placeholderTextColor={( (typeof darkMode !== 'undefined' && darkMode) ? COLORS.dark : COLORS.light).inkMuted}
              value={value}
              onChangeText={(text) => {
                setValue(text)
                setSelectedParentId(null)
              }}
              onSubmitEditing={handleAdd}
              returnKeyType="done"
              autoFocus
              selectionColor={( (typeof darkMode !== 'undefined' && darkMode) ? COLORS.dark : COLORS.light).amber}
              maxLength={MAX_TASK_NAME}
            />
          </View>

          {/* Tags */}
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: ( (typeof darkMode !== 'undefined' && darkMode) ? COLORS.dark : COLORS.light).inkMuted }]}>Tags</Text>
            <View style={styles.tagsGrid}>
              {DEFAULT_TAGS.map(tag => {
                const active = selectedTagId === tag.id
                return (
                  <TouchableOpacity
                    key={tag.id}
                    style={[
                      styles.tagBtn,
                      {
                        backgroundColor: active ? tag.dot : ( (typeof darkMode !== 'undefined' && darkMode) ? COLORS.dark : COLORS.light).bgInput,
                        borderColor:     active ? tag.dot : ( (typeof darkMode !== 'undefined' && darkMode) ? COLORS.dark : COLORS.light).border,
                      },
                    ]}
                    onPress={() => selectTag(tag.id)}
                    activeOpacity={0.75}
                  >
                    <Text style={[
                      styles.tagBtnText,
                      { color: active ? '#FFFFFF' : ( (typeof darkMode !== 'undefined' && darkMode) ? COLORS.dark : COLORS.light).inkMuted },
                    ]}>
                      {tag.label}
                    </Text>
                  </TouchableOpacity>
                )
              })}
            </View>
          </View>

          {/* Add button */}
          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: value.trim() ? ( (typeof darkMode !== 'undefined' && darkMode) ? COLORS.dark : COLORS.light).amber : ( (typeof darkMode !== 'undefined' && darkMode) ? COLORS.dark : COLORS.light).bgInput }]}
            onPress={handleAdd}
            disabled={!value.trim()}
            activeOpacity={0.85}
          >
            <Text style={[
              styles.addBtnText,
              { color: value.trim() ? '#FFFFFF' : ( (typeof darkMode !== 'undefined' && darkMode) ? COLORS.dark : COLORS.light).inkMuted },
            ]}>
              Add Task
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex:            1,
    backgroundColor: 'rgba(10,6,24,0.5)',
  },
  keyboardView: {
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius:  28,
    borderTopRightRadius: 28,
    paddingHorizontal:    24,
    paddingTop:           12,
  },
  handle: {
    width:        44,
    height:       4,
    borderRadius: 2,
    alignSelf:    'center',
    marginBottom: 24,
  },
  title: {
    fontSize:     26,
    fontWeight:   '800',
    marginBottom:  6,
  },
  subtitle: {
    fontSize:     14,
    marginBottom: 16,
  },
  section: {
    marginBottom: 14,
  },
  sectionLabel: {
    fontSize:     11,
    fontWeight:   '600',
    marginBottom:  8,
    letterSpacing: 0.5,
  },
  chipsRow: {
    flexDirection: 'row',
    gap:           8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical:    8,
    borderRadius:      20,
    borderWidth:       1.5,
  },
  chipText: {
    fontSize:   13,
    fontWeight: '600',
  },
  inputWrap: {
    borderWidth:  2,
    borderRadius: 16,
    marginBottom: 14,
    overflow:     'hidden',
  },
  input: {
    paddingHorizontal: 18,
    paddingVertical:   16,
    fontSize:          17,
    minHeight:         56,
  },
  tagsGrid: {
    flexDirection: 'row',
    flexWrap:      'wrap',
    gap:            8,
  },
  tagBtn: {
    paddingHorizontal: 14,
    paddingVertical:    7,
    borderRadius:      20,
    borderWidth:       1.5,
  },
  tagBtnText: {
    fontSize:   12,
    fontWeight: '700',
  },
  addBtn: {
    borderRadius:    16,
    paddingVertical: 18,
    alignItems:      'center',
    marginTop:       4,
  },
  addBtnText: {
    fontSize:   16,
    fontWeight: '800',
  },
})

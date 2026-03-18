import React, { useState } from 'react'
import {
  Modal, View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, KeyboardAvoidingView, Platform, Pressable,
} from 'react-native'
import { useTaskContext } from '../context/TaskContext'
import { DEFAULT_TAGS } from '../constants'

export default function AddTaskModal({ visible, colors: C, insets, onAdd, onClose }) {
  const { templates } = useTaskContext()
  const [value, setValue]         = useState('')
  const [selectedTags, setSelectedTags] = useState([])

  const reset = () => {
    setValue('')
    setSelectedTags([])
  }

  const handleAdd = () => {
    if (value.trim()) {
      onAdd(value.trim(), { tags: selectedTags })
      reset()
    }
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const toggleTag = (tagId) => {
    setSelectedTags(prev =>
      prev.includes(tagId) ? prev.filter(t => t !== tagId) : [...prev, tagId]
    )
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
          { backgroundColor: C.bgPanel, paddingBottom: insets.bottom + 24 },
        ]}>
          {/* Handle */}
          <View style={[styles.handle, { backgroundColor: C.border }]} />

          {/* Title */}
          <Text style={[styles.title, { color: C.inkPrimary }]}>New Task</Text>
          <Text style={[styles.subtitle, { color: C.inkMuted }]}>
            What do you need to get done?
          </Text>

          {/* Template quick picks */}
          {templates.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: C.inkMuted }]}>Quick pick</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipsRow}
              >
                {templates.map(tpl => (
                  <TouchableOpacity
                    key={tpl}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: value === tpl ? C.amber : C.bgInput,
                        borderColor:     value === tpl ? C.amber : C.border,
                      },
                    ]}
                    onPress={() => setValue(tpl)}
                    activeOpacity={0.75}
                  >
                    <Text style={[
                      styles.chipText,
                      { color: value === tpl ? '#FFFFFF' : C.inkSecondary },
                    ]}>
                      {tpl}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Input */}
          <View style={[
            styles.inputWrap,
            { borderColor: value.trim() ? C.amber : C.border, backgroundColor: C.bgInput },
          ]}>
            <TextInput
              style={[styles.input, { color: C.inkPrimary }]}
              placeholder="Task name…"
              placeholderTextColor={C.inkMuted}
              value={value}
              onChangeText={setValue}
              onSubmitEditing={handleAdd}
              returnKeyType="done"
              autoFocus
              selectionColor={C.amber}
            />
          </View>

          {/* Tags */}
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: C.inkMuted }]}>Tags</Text>
            <View style={styles.tagsGrid}>
              {DEFAULT_TAGS.map(tag => {
                const active = selectedTags.includes(tag.id)
                return (
                  <TouchableOpacity
                    key={tag.id}
                    style={[
                      styles.tagBtn,
                      {
                        backgroundColor: active ? tag.color : C.bgInput,
                        borderColor:     active ? tag.color : C.border,
                      },
                    ]}
                    onPress={() => toggleTag(tag.id)}
                    activeOpacity={0.75}
                  >
                    <Text style={[
                      styles.tagBtnText,
                      { color: active ? '#FFFFFF' : C.inkMuted },
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
            style={[styles.addBtn, { backgroundColor: value.trim() ? C.amber : C.bgInput }]}
            onPress={handleAdd}
            disabled={!value.trim()}
            activeOpacity={0.85}
          >
            <Text style={[
              styles.addBtnText,
              { color: value.trim() ? '#FFFFFF' : C.inkMuted },
            ]}>
              Add Task{selectedTags.length > 0 ? ` · ${selectedTags.length} tag${selectedTags.length > 1 ? 's' : ''}` : ''}
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

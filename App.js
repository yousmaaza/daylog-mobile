import { enableScreens } from 'react-native-screens'
// Disable native screen wrappers — prevents sheetAllowedDetents cast crash on iOS 26
enableScreens(false)

import React, { useRef, useState, useCallback } from 'react'
import {
  View, ScrollView, TouchableOpacity, Text,
  StyleSheet, useWindowDimensions, ActivityIndicator,
} from 'react-native'
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import Svg, { Path, Rect, Circle, Line } from 'react-native-svg'

import { TaskProvider, useTaskContext } from './src/context/TaskContext'
import { useTaskNotification } from './src/hooks/useTaskNotification'
import LoginScreen    from './src/screens/LoginScreen'
import TodayScreen    from './src/screens/TodayScreen'
import TimelineScreen from './src/screens/TimelineScreen'
import StatsScreen    from './src/screens/StatsScreen'
import ProfileScreen  from './src/screens/ProfileScreen'
import AddTaskModal   from './src/components/AddTaskModal'
import { COLORS } from './src/constants'

// ── SVG Tab Icons ─────────────────────────────────────────────────────────────

const HomeIcon = ({ color, size = 24 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M10.55 2.53a2 2 0 0 1 2.9 0l7.5 7.72C21.62 10.98 22 11.72 22 12.5V20a2 2 0 0 1-2 2h-4.5a.5.5 0 0 1-.5-.5V16a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v5.5a.5.5 0 0 1-.5.5H4a2 2 0 0 1-2-2v-7.5c0-.78.38-1.52 1.05-2.25l7.5-7.72z"
      fill={color}
    />
  </Svg>
)

const CalendarIcon = ({ color, size = 24 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="3" y="5" width="18" height="16" rx="3" stroke={color} strokeWidth="2" fill="none" />
    <Line x1="3" y1="10" x2="21" y2="10" stroke={color} strokeWidth="2" />
    <Line x1="8"  y1="3" x2="8"  y2="7" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    <Line x1="16" y1="3" x2="16" y2="7" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    <Circle cx="8"  cy="15" r="1.5" fill={color} />
    <Circle cx="12" cy="15" r="1.5" fill={color} />
    <Circle cx="16" cy="15" r="1.5" fill={color} />
  </Svg>
)

const ChartIcon = ({ color, size = 24 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="3"    y="13" width="4.5" height="8"  rx="1.5" fill={color} />
    <Rect x="9.75" y="8"  width="4.5" height="13" rx="1.5" fill={color} />
    <Rect x="16.5" y="3"  width="4.5" height="18" rx="1.5" fill={color} />
  </Svg>
)

const PersonIcon = ({ color, size = 24 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="8" r="4" fill={color} />
    <Path
      d="M4 20c0-4 3.58-7 8-7s8 3 8 7"
      stroke={color} strokeWidth="2" strokeLinecap="round" fill="none"
    />
  </Svg>
)

// ── Tab configuration ─────────────────────────────────────────────────────────

const LEFT_TABS  = [
  { pageIdx: 0, Icon: HomeIcon     },
  { pageIdx: 1, Icon: CalendarIcon },
]
const RIGHT_TABS = [
  { pageIdx: 2, Icon: ChartIcon  },
  { pageIdx: 3, Icon: PersonIcon },
]

// ── App ───────────────────────────────────────────────────────────────────────

function AppContent() {
  const { width, height } = useWindowDimensions()
  const insets   = useSafeAreaInsets()
  const { darkMode, addTask, user, loaded, tasks, tick } = useTaskContext()
  useTaskNotification(tasks, tick)
  const C = darkMode ? COLORS.dark : COLORS.light

  const pagerRef = useRef(null)
  const [activePage, setActivePage] = useState(0)
  const [modalVisible, setModalVisible] = useState(false)

  const scrollToPage = useCallback((index) => {
    pagerRef.current?.scrollTo({ x: index * width, animated: true })
    setActivePage(index)
  }, [width])

  const handleMomentumEnd = useCallback((event) => {
    const page = Math.round(event.nativeEvent.contentOffset.x / width)
    setActivePage(page)
  }, [width])

  const handleAddTask = useCallback((name, options) => {
    addTask(name, options)
    setModalVisible(false)
  }, [addTask])

  // The bar sits at the very bottom; its visible icon area is TAB_H px,
  // plus insets.bottom for the home indicator region.
  const TAB_H = 60

  // 1. Show loading spinner while reading from storage
  if (!loaded) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bgApp, justifyContent: 'center', alignItems: 'center' }}>
        <StatusBar style={C.statusBar} />
        <ActivityIndicator size="large" color={C.amber} />
      </View>
    )
  }

  // 2. Show login screen if not authenticated
  if (!user) {
    return (
      <>
        <StatusBar style={C.statusBar} />
        <LoginScreen />
      </>
    )
  }

  return (
    <View style={{ flex: 1, backgroundColor: C.bgApp }}>
      <StatusBar style={C.statusBar} />

      {/* ── Swipeable pager ─────────────────────────────────────────────── */}
      <ScrollView
        ref={pagerRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleMomentumEnd}
        scrollEventThrottle={32}
        style={{ flex: 1 }}
        decelerationRate="fast"
      >
        <View style={{ width, height }}><TodayScreen /></View>
        <View style={{ width, height }}><TimelineScreen /></View>
        <View style={{ width, height }}><StatsScreen /></View>
        <View style={{ width, height }}><ProfileScreen /></View>
      </ScrollView>

      {/* ── Fixed bottom tab bar ────────────────────────────────────────── */}
      <View
        style={[
          styles.tabBar,
          {
            backgroundColor: C.bgPanel,
            borderTopColor:  C.border,
            paddingBottom:   insets.bottom,
            height:          TAB_H + insets.bottom,
          },
        ]}
      >
        {/* Left tabs */}
        {LEFT_TABS.map(({ pageIdx, Icon }) => {
          const active = activePage === pageIdx
          return (
            <TouchableOpacity
              key={pageIdx}
              style={styles.tabBtn}
              onPress={() => scrollToPage(pageIdx)}
              activeOpacity={0.7}
            >
              <Icon color={active ? C.amber : C.inkFaint} size={24} />
              {active && <View style={[styles.activeDot, { backgroundColor: C.amber }]} />}
            </TouchableOpacity>
          )
        })}

        {/* Center FAB */}
        <View style={styles.fabSlot}>
          <TouchableOpacity
            style={[styles.fab, { backgroundColor: C.inkPrimary }]}
            onPress={() => setModalVisible(true)}
            activeOpacity={0.85}
          >
            <Text style={[styles.fabPlus, { color: C.bgApp }]}>+</Text>
          </TouchableOpacity>
        </View>

        {/* Right tabs */}
        {RIGHT_TABS.map(({ pageIdx, Icon }) => {
          const active = activePage === pageIdx
          return (
            <TouchableOpacity
              key={pageIdx}
              style={styles.tabBtn}
              onPress={() => scrollToPage(pageIdx)}
              activeOpacity={0.7}
            >
              <Icon color={active ? C.amber : C.inkFaint} size={24} />
              {active && <View style={[styles.activeDot, { backgroundColor: C.amber }]} />}
            </TouchableOpacity>
          )
        })}
      </View>

      {/* ── Global AddTask modal ─────────────────────────────────────────── */}
      <AddTaskModal
        visible={modalVisible}
        colors={C}
        insets={insets}
        onAdd={handleAddTask}
        onClose={() => setModalVisible(false)}
      />
    </View>
  )
}

export default function App() {
  return (
    <SafeAreaProvider>
      <TaskProvider>
        <AppContent />
      </TaskProvider>
    </SafeAreaProvider>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  tabBar: {
    flexDirection:    'row',
    alignItems:       'center',
    borderTopWidth:   StyleSheet.hairlineWidth,
    shadowColor:      '#000',
    shadowOffset:     { width: 0, height: -3 },
    shadowOpacity:    0.06,
    shadowRadius:     8,
    elevation:        8,
  },

  tabBtn: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
    paddingTop:     14,
    paddingBottom:   6,
    gap:             4,
  },
  activeDot: {
    width:        4,
    height:       4,
    borderRadius: 2,
  },

  fabSlot: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
    paddingTop:     8,
    paddingBottom:  4,
  },
  fab: {
    width:          52,
    height:         52,
    borderRadius:   26,
    alignItems:     'center',
    justifyContent: 'center',
    shadowColor:    '#000',
    shadowOffset:   { width: 0, height: 4 },
    shadowOpacity:  0.22,
    shadowRadius:   8,
    elevation:      6,
  },
  fabPlus: {
    fontSize:   30,
    fontWeight: '300',
    lineHeight: 34,
    marginTop:  -2,
  },
})

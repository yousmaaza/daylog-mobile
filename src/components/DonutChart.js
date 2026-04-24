import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import Svg, { Circle } from 'react-native-svg'
import { COLORS } from '../constants'

export default function DonutChart({ darkMode,  done, active, idle, colors: currentTheme }) {
  const size = 140
  const r    = size * 0.36
  const sw   = size * 0.13
  const C2   = 2 * Math.PI * r
  const cx   = size / 2
  const cy   = size / 2

  const total     = done + active + idle
  const safeTotal = total === 0 ? 1 : total

  const doneLen   = (done   / safeTotal) * C2
  const activeLen = (active / safeTotal) * C2
  const idleLen   = (idle   / safeTotal) * C2

  const doneOffset   = C2
  const activeOffset = C2 - doneLen
  const idleOffset   = C2 - (doneLen + activeLen)

  const pct = total > 0 ? Math.round((done / total) * 100) : 0

  return (
    <View style={styles.container}>
      <Svg
        width={size}
        height={size}
        style={{ transform: [{ rotate: '-90deg' }] }}
      >
        {/* Track */}
        <Circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke={( (typeof darkMode !== 'undefined' && darkMode) ? COLORS.dark : COLORS.light).border}
          strokeWidth={sw}
        />
        {total > 0 && (
          <>
            {idleLen > 0 && (
              <Circle
                cx={cx} cy={cy} r={r}
                fill="none"
                stroke={( (typeof darkMode !== 'undefined' && darkMode) ? COLORS.dark : COLORS.light).inkFaint}
                strokeWidth={sw}
                strokeDasharray={[idleLen, C2 - idleLen]}
                strokeDashoffset={idleOffset}
                strokeLinecap="butt"
              />
            )}
            {activeLen > 0 && (
              <Circle
                cx={cx} cy={cy} r={r}
                fill="none"
                stroke={( (typeof darkMode !== 'undefined' && darkMode) ? COLORS.dark : COLORS.light).amber}
                strokeWidth={sw}
                strokeDasharray={[activeLen, C2 - activeLen]}
                strokeDashoffset={activeOffset}
                strokeLinecap="butt"
              />
            )}
            {doneLen > 0 && (
              <Circle
                cx={cx} cy={cy} r={r}
                fill="none"
                stroke={( (typeof darkMode !== 'undefined' && darkMode) ? COLORS.dark : COLORS.light).emerald}
                strokeWidth={sw}
                strokeDasharray={[doneLen, C2 - doneLen]}
                strokeDashoffset={doneOffset}
                strokeLinecap="butt"
              />
            )}
          </>
        )}
      </Svg>

      <View style={styles.center}>
        <Text style={[styles.pct, { color: ( (typeof darkMode !== 'undefined' && darkMode) ? COLORS.dark : COLORS.light).inkPrimary }]}>{pct}</Text>
        <Text style={[styles.pctSymbol, { color: ( (typeof darkMode !== 'undefined' && darkMode) ? COLORS.dark : COLORS.light).amber }]}>%</Text>
        <Text style={[styles.label, { color: ( (typeof darkMode !== 'undefined' && darkMode) ? COLORS.dark : COLORS.light).inkMuted }]}>done</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems:     'center',
    justifyContent: 'center',
  },
  center: {
    position:       'absolute',
    alignItems:     'center',
    justifyContent: 'center',
  },
  pct: {
    fontSize:   28,
    fontWeight: '800',
    lineHeight: 30,
  },
  pctSymbol: {
    fontSize:   11,
    fontWeight: '700',
    marginTop:  -2,
  },
  label: {
    fontSize:   10,
    fontWeight: '600',
    marginTop:   2,
  },
})

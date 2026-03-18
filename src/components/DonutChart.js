import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import Svg, { Circle } from 'react-native-svg'

export default function DonutChart({ done, active, idle, colors: C }) {
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
          stroke={C.border}
          strokeWidth={sw}
        />
        {total > 0 && (
          <>
            {idleLen > 0 && (
              <Circle
                cx={cx} cy={cy} r={r}
                fill="none"
                stroke={C.inkFaint}
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
                stroke={C.amber}
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
                stroke={C.emerald}
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
        <Text style={[styles.pct, { color: C.inkPrimary }]}>{pct}</Text>
        <Text style={[styles.pctSymbol, { color: C.amber }]}>%</Text>
        <Text style={[styles.label, { color: C.inkMuted }]}>done</Text>
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

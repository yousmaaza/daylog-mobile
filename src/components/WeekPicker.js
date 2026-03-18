import React, { useMemo } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { DAY_SHORT, MONTH_FULL } from '../constants'
import { addDays, toKey } from '../utils'

export default function WeekPicker({ weekStart, selDate, tasks, colors: C, onPrevWeek, onNextWeek, onSelectDay }) {
  const todayKey = toKey(new Date())

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = addDays(weekStart, i)
      return {
        key:        toKey(d),
        shortLabel: DAY_SHORT[d.getDay()],
        dayNum:     d.getDate(),
        month:      d.getMonth(),
        year:       d.getFullYear(),
      }
    })
  }, [weekStart])

  const selDateObj = new Date(selDate + 'T12:00:00')
  const monthLabel = `${MONTH_FULL[selDateObj.getMonth()]} ${selDateObj.getFullYear()}`

  return (
    <View style={[styles.wrapper, { backgroundColor: C.bgPanel }]}>
      {/* Month header + arrows */}
      <View style={styles.header}>
        <Text style={[styles.monthLabel, { color: C.inkPrimary }]}>{monthLabel}</Text>
        <View style={styles.arrows}>
          <TouchableOpacity
            onPress={onPrevWeek}
            style={[styles.arrowBtn, { backgroundColor: C.bgInput }]}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={[styles.arrowText, { color: C.inkMuted }]}>‹</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onNextWeek}
            style={[styles.arrowBtn, { backgroundColor: C.bgInput }]}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={[styles.arrowText, { color: C.inkMuted }]}>›</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Day columns */}
      <View style={styles.daysRow}>
        {weekDays.map(day => {
          const isSelected = day.key === selDate
          const isToday    = day.key === todayKey
          const hasTasks   = (tasks[day.key]?.length ?? 0) > 0

          return (
            <TouchableOpacity
              key={day.key}
              onPress={() => onSelectDay(day.key)}
              style={styles.dayCol}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.dayName,
                { color: isSelected ? C.amber : C.inkMuted },
              ]}>
                {day.shortLabel}
              </Text>

              <View style={[
                styles.dayCircle,
                isSelected && { backgroundColor: C.amber },
                !isSelected && isToday && { borderWidth: 2, borderColor: C.amber },
              ]}>
                <Text style={[
                  styles.dayNum,
                  {
                    color: isSelected
                      ? '#FFFFFF'
                      : isToday
                        ? C.amber
                        : C.inkPrimary,
                  },
                ]}>
                  {day.dayNum}
                </Text>
              </View>

              <View style={styles.dotSlot}>
                {hasTasks && !isSelected && (
                  <View style={[styles.dot, { backgroundColor: C.amber }]} />
                )}
              </View>
            </TouchableOpacity>
          )
        })}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 16,
    paddingBottom:     14,
  },
  header: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  monthLabel: {
    fontSize:   16,
    fontWeight: '700',
  },
  arrows: {
    flexDirection: 'row',
    gap:           8,
  },
  arrowBtn: {
    width:          32,
    height:         32,
    borderRadius:   16,
    alignItems:     'center',
    justifyContent: 'center',
  },
  arrowText: {
    fontSize:   20,
    fontWeight: '500',
    lineHeight: 24,
  },
  daysRow: {
    flexDirection:  'row',
    justifyContent: 'space-between',
  },
  dayCol: {
    flex:       1,
    alignItems: 'center',
    gap:        4,
  },
  dayName: {
    fontSize:   10,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  dayCircle: {
    width:          36,
    height:         36,
    borderRadius:   18,
    alignItems:     'center',
    justifyContent: 'center',
  },
  dayNum: {
    fontSize:   15,
    fontWeight: '700',
    lineHeight: 19,
  },
  dotSlot: {
    height:         6,
    alignItems:     'center',
    justifyContent: 'center',
  },
  dot: {
    width:        5,
    height:       5,
    borderRadius: 2.5,
  },
})

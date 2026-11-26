// src/screens/main/CalendarScreen.tsx
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { ScreenContainer } from '../../components/ui';
import { DayDetailSheet } from '../../components/DayDetailSheet';
import { colors, spacing, fontSize, borderRadius } from '../../theme';
import { getDatesWithNotes } from '../../db/repositories/dayNotes';

const SCREEN_WIDTH = Dimensions.get('window').width;
const DAY_SIZE = (SCREEN_WIDTH - spacing.lg * 2 - spacing.xs * 6) / 7;

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function CalendarScreen() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [datesWithNotes, setDatesWithNotes] = useState<Set<string>>(new Set());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const notes = await getDatesWithNotes();
      setDatesWithNotes(notes);
    } catch (error) {
      console.error('Failed to load calendar data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handlePrevMonth = () => {
    setCurrentMonth((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() - 1);
      return newDate;
    });
  };

  const handleNextMonth = () => {
    setCurrentMonth((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + 1);
      return newDate;
    });
  };

  const handleDayPress = (date: string) => {
    setSelectedDate(date);
    setSheetVisible(true);
  };

  const handleNoteChanged = () => {
    loadData();
  };

  const renderCalendarGrid = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    // First day of the month (0 = Sunday, adjust to Monday = 0)
    const firstDay = new Date(year, month, 1);
    let startDayOfWeek = firstDay.getDay() - 1; // Monday = 0
    if (startDayOfWeek < 0) startDayOfWeek = 6; // Sunday becomes 6

    // Number of days in the month
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Build the grid
    const days: (number | null)[] = [];

    // Empty cells before the first day
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }

    // Days of the month
    for (let d = 1; d <= daysInMonth; d++) {
      days.push(d);
    }

    // Split into weeks
    const weeks: (number | null)[][] = [];
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7));
    }

    // Ensure last week has 7 cells
    const lastWeek = weeks[weeks.length - 1];
    while (lastWeek.length < 7) {
      lastWeek.push(null);
    }

    return weeks.map((week, weekIndex) => (
      <View key={weekIndex} style={styles.weekRow}>
        {week.map((day, dayIndex) => {
          if (day === null) {
            return <View key={dayIndex} style={styles.dayCell} />;
          }

          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const hasNote = datesWithNotes.has(dateStr);
          const isToday = isDateToday(dateStr);

          return (
            <TouchableOpacity
              key={dayIndex}
              style={[
                styles.dayCell,
                isToday && styles.dayCellToday,
              ]}
              onPress={() => handleDayPress(dateStr)}
            >
              <Text
                style={[
                  styles.dayText,
                  isToday && styles.dayTextToday,
                ]}
              >
                {day}
              </Text>
              {hasNote && <View style={styles.noteDot} />}
            </TouchableOpacity>
          );
        })}
      </View>
    ));
  };

  if (loading) {
    return (
      <ScreenContainer>
        <View style={styles.centered}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </ScreenContainer>
    );
  }

  const monthYear = currentMonth.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <ScreenContainer>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Calendar</Text>
        <Text style={styles.calendarHint}>Select any date to add or edit a note.</Text>
      </View>

      {/* Month Navigation */}
      <View style={styles.monthNav}>
        <TouchableOpacity onPress={handlePrevMonth} style={styles.navButton}>
          <Text style={styles.navButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.monthText}>{monthYear}</Text>
        <TouchableOpacity onPress={handleNextMonth} style={styles.navButton}>
          <Text style={styles.navButtonText}>→</Text>
        </TouchableOpacity>
      </View>

      {/* Weekday Headers */}
      <View style={styles.weekdayRow}>
        {WEEKDAYS.map((day) => (
          <View key={day} style={styles.weekdayCell}>
            <Text style={styles.weekdayText}>{day}</Text>
          </View>
        ))}
      </View>

      {/* Calendar Grid */}
      <View style={styles.calendarGrid}>{renderCalendarGrid()}</View>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.noteDot]} />
          <Text style={styles.legendText}>Has note</Text>
        </View>
      </View>

      {/* Day Detail Sheet */}
      {selectedDate && (
        <DayDetailSheet
          visible={sheetVisible}
          onClose={() => {
            setSheetVisible(false);
            setSelectedDate(null);
          }}
          date={selectedDate}
          onNoteChanged={handleNoteChanged}
        />
      )}
    </ScreenContainer>
  );
}

function isDateToday(dateStr: string): boolean {
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  return dateStr === todayStr;
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  header: {
    paddingVertical: spacing.lg,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  calendarHint: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  navButton: {
    padding: spacing.sm,
  },
  navButtonText: {
    fontSize: fontSize.xl,
    color: colors.accent,
    fontWeight: '600',
  },
  monthText: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  weekdayRow: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  weekdayCell: {
    width: DAY_SIZE,
    alignItems: 'center',
  },
  weekdayText: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  calendarGrid: {
    marginBottom: spacing.lg,
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: spacing.xs,
  },
  dayCell: {
    width: DAY_SIZE,
    height: DAY_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.md,
  },
  dayCellToday: {
    borderWidth: 2,
    borderColor: colors.accent,
  },
  dayText: {
    fontSize: fontSize.md,
    color: colors.textPrimary,
  },
  dayTextToday: {
    fontWeight: '700',
    color: colors.accent,
  },
  noteDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accent,
    position: 'absolute',
    bottom: 4,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendBox: {
    width: 16,
    height: 16,
    borderRadius: borderRadius.sm,
  },
  legendText: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
});

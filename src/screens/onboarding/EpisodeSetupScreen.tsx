// src/screens/onboarding/EpisodeSetupScreen.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Alert } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { ScreenContainer, Button, TextInput, Select } from '../../components/ui';
import { colors, spacing, fontSize } from '../../theme';
import { OnboardingScreenProps } from '../../navigation/types';
import { EpisodeType } from '../../types';
import { getQuarterLabel, getQuarterEndDate, formatDateISO, formatDateDisplay } from '../../utils/dates';
import { useOnboarding } from '../../context/OnboardingContext';

const EPISODE_TYPE_OPTIONS: { label: string; value: EpisodeType }[] = [
  { label: 'Observational', value: 'observational' },
  { label: 'Intervention', value: 'intervention' },
];

export function EpisodeSetupScreen({ navigation }: OnboardingScreenProps<'EpisodeSetup'>) {
  const { state, updateEpisode } = useOnboarding();

  const today = new Date();
  const defaultTitle = getQuarterLabel(today);
  const defaultEndDate = formatDateISO(getQuarterEndDate(today));
  const defaultStartDate = formatDateISO(today);

  const [title, setTitle] = useState(state.episode.title ?? defaultTitle);
  const [startDate, setStartDate] = useState(state.episode.start_date ?? defaultStartDate);
  const [endDate, setEndDate] = useState(state.episode.end_date ?? defaultEndDate);
  const [type, setType] = useState<EpisodeType>(state.episode.type ?? 'observational');
  const [specialSummary, setSpecialSummary] = useState(state.episode.special_summary ?? '');

  // Date picker state
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const handleStartDateChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowStartPicker(false);
    if (selectedDate) {
      const newStart = formatDateISO(selectedDate);
      setStartDate(newStart);
      if (newStart > endDate) {
        setEndDate(formatDateISO(getQuarterEndDate(selectedDate)));
      }
    }
  };

  const handleEndDateChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowEndPicker(false);
    if (selectedDate) {
      const newEnd = formatDateISO(selectedDate);
      if (newEnd < startDate) {
        Alert.alert('Invalid date', 'End date must be after start date.');
        return;
      }
      setEndDate(newEnd);
    }
  };

  const handleNext = () => {
    updateEpisode({
      title,
      start_date: startDate,
      end_date: endDate,
      type,
      special_summary: specialSummary || undefined,
    });

    if (type === 'intervention') {
      navigation.navigate('InterventionSetup');
    } else {
      navigation.navigate('ReminderSetup');
    }
  };

  return (
    <ScreenContainer scrollable safeBottom>
      <View style={styles.header}>
        <Text style={styles.title}>Your First Episode</Text>
        <Text style={styles.subtitle}>
          Episodes are bounded periods you want to summarize.{'\n'}
          Default: runs to end of current quarter.
        </Text>
      </View>

      <View style={styles.form}>
        <TextInput
          label="Episode title"
          value={title}
          onChangeText={setTitle}
          placeholder={defaultTitle}
        />

        <View style={styles.dateRow}>
          <View style={styles.dateField}>
            <Text style={styles.label}>Start</Text>
            <TouchableOpacity
              style={styles.dateDisplay}
              onPress={() => setShowStartPicker(true)}
            >
              <Text style={styles.dateText}>{formatDateDisplay(startDate)}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.dateField}>
            <Text style={styles.label}>End</Text>
            <TouchableOpacity
              style={styles.dateDisplay}
              onPress={() => setShowEndPicker(true)}
            >
              <Text style={styles.dateText}>{formatDateDisplay(endDate)}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {showStartPicker && (
          <DateTimePicker
            value={new Date(startDate + 'T00:00:00')}
            mode="date"
            display={Platform.OS === 'ios' ? 'inline' : 'default'}
            onChange={handleStartDateChange}
            themeVariant="dark"
          />
        )}
        {showEndPicker && (
          <DateTimePicker
            value={new Date(endDate + 'T00:00:00')}
            mode="date"
            display={Platform.OS === 'ios' ? 'inline' : 'default'}
            onChange={handleEndDateChange}
            minimumDate={new Date(startDate + 'T00:00:00')}
            themeVariant="dark"
          />
        )}

        <View style={styles.typeSection}>
          <Text style={styles.sectionTitle}>What kind of episode is this?</Text>
          
          <Select
            options={EPISODE_TYPE_OPTIONS}
            value={type}
            onChange={setType}
          />

          <View style={styles.typeExplanation}>
            {type === 'observational' ? (
              <Text style={styles.explanationText}>
                📊 <Text style={styles.bold}>Observational:</Text> A normal period with nothing 
                special to track. Good for establishing baselines.
              </Text>
            ) : (
              <Text style={styles.explanationText}>
                💊 <Text style={styles.bold}>Intervention:</Text> You're intentionally trying 
                something (supplement, habit change, etc.) and want to track adherence.
              </Text>
            )}
          </View>
        </View>

        {type === 'intervention' && (
          <TextInput
            label="Brief summary (optional)"
            value={specialSummary}
            onChangeText={setSpecialSummary}
            placeholder="e.g., NMN 500mg daily experiment"
            multiline
          />
        )}
      </View>

      <View style={styles.footer}>
        <Button title="Continue" onPress={handleNext} />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  form: {
    flex: 1,
  },
  dateRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xs,
  },
  dateField: {
    flex: 1,
  },
  label: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  dateDisplay: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.md,
  },
  dateText: {
    fontSize: fontSize.md,
    color: colors.textPrimary,
  },
  typeSection: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  typeExplanation: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 8,
    marginTop: spacing.md,
  },
  explanationText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  bold: {
    fontWeight: '600',
    color: colors.textPrimary,
  },
  footer: {
    paddingVertical: spacing.lg,
  },
});

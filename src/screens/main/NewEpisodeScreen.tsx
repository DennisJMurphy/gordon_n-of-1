// src/screens/main/NewEpisodeScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity, Platform } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { ScreenContainer, Button, TextInput, Select } from '../../components/ui';
import { colors, spacing, fontSize } from '../../theme';
import { HomeStackScreenProps } from '../../navigation/types';
import { EpisodeType } from '../../types';
import { getQuarterEndDate, formatDateISO, formatDateDisplay, getDefaultEpisodeTitle } from '../../utils/dates';
import { createEpisode, getAllEpisodes } from '../../db/repositories/episodes';

const EPISODE_TYPE_OPTIONS: { label: string; value: EpisodeType }[] = [
  { label: 'Observational', value: 'observational' },
  { label: 'Intervention', value: 'intervention' },
];

type Props = HomeStackScreenProps<'NewEpisode'>;

export function NewEpisodeScreen({ navigation }: Props) {
  const today = new Date();
  const defaultEndDate = formatDateISO(getQuarterEndDate(today));
  const defaultStartDate = formatDateISO(today);

  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState(defaultStartDate);
  const [endDate, setEndDate] = useState(defaultEndDate);
  const [type, setType] = useState<EpisodeType>('observational');
  const [specialSummary, setSpecialSummary] = useState('');
  const [saving, setSaving] = useState(false);
  const [titleWasEdited, setTitleWasEdited] = useState(false);

  // Date picker state
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  // Load default title based on existing episodes
  useEffect(() => {
    (async () => {
      if (!titleWasEdited) {
        const episodes = await getAllEpisodes();
        const defaultTitle = getDefaultEpisodeTitle(
          new Date(startDate + 'T00:00:00'),
          episodes
        );
        setTitle(defaultTitle);
      }
    })();
  }, [startDate, titleWasEdited]);

  const handleStartDateChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') setShowStartPicker(false);
    if (selectedDate) {
      const newStart = formatDateISO(selectedDate);
      setStartDate(newStart);
      // If new start is after current end, push end date forward
      if (newStart > endDate) {
        setEndDate(formatDateISO(getQuarterEndDate(selectedDate)));
      }
    }
  };

  const handleEndDateChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') setShowEndPicker(false);
    if (selectedDate) {
      const newEnd = formatDateISO(selectedDate);
      if (newEnd < startDate) {
        Alert.alert('Invalid date', 'End date must be after start date.');
        return;
      }
      setEndDate(newEnd);
    }
  };

  const handleTitleChange = (text: string) => {
    setTitle(text);
    setTitleWasEdited(true);
  };

  const handleCreate = async () => {
    if (!title.trim()) {
      Alert.alert('Title required', 'Please enter a title for your episode.');
      return;
    }

    setSaving(true);
    try {
      const episode = await createEpisode({
        title: title.trim(),
        start_date: startDate,
        end_date: endDate,
        type,
        special_summary: specialSummary.trim() || undefined,
        status: 'active',
      });

      if (type === 'intervention') {
        navigation.replace('InterventionSetup', { episodeId: episode.id });
      } else {
        navigation.goBack();
      }
    } catch (error) {
      console.error('Failed to create episode:', error);
      Alert.alert('Error', 'Failed to create episode. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScreenContainer scrollable>
      <View style={styles.header}>
        <Text style={styles.title}>New Episode</Text>
        <Text style={styles.subtitle}>
          Episodes are bounded periods you want to summarize.{'\n'}
          Default: runs to end of current quarter.
        </Text>
      </View>

      <View style={styles.form}>
        <TextInput
          label="Episode title"
          value={title}
          onChangeText={handleTitleChange}
          placeholder="e.g. Q1 2026"
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
        <Button 
          title={saving ? 'Creating...' : 'Create Episode'} 
          onPress={handleCreate}
          disabled={saving}
        />
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
    padding: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
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
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 8,
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
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
  },
});

// src/screens/main/WeeklyCheckinScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenContainer, Button } from '../../components/ui';
import { colors, spacing, fontSize, borderRadius } from '../../theme';
import { HomeStackParamList } from '../../navigation/types';
import {
  WeeklyCheckin,
  AdherenceBin,
  Confidence,
  Intervention,
} from '../../types';
import {
  createCheckin,
  updateCheckin,
  getCheckinById,
  getCurrentWeekStart,
} from '../../db/repositories/weeklyCheckins';
import { getInterventionsByEpisode } from '../../db/repositories/interventions';

type Props = NativeStackScreenProps<HomeStackParamList, 'WeeklyCheckin'>;

const ADHERENCE_OPTIONS: { value: AdherenceBin; label: string; emoji: string }[] = [
  { value: 'every_day', label: 'Every day', emoji: '✅' },
  { value: 'most_days', label: 'Most days', emoji: '👍' },
  { value: 'some_days', label: 'Some days', emoji: '🤷' },
  { value: 'rarely', label: 'Rarely', emoji: '😅' },
  { value: 'not_at_all', label: 'Not at all', emoji: '❌' },
];

const CHANGE_FLAGS = [
  { key: 'diet', label: 'Diet', emoji: '🍽️' },
  { key: 'exercise', label: 'Exercise', emoji: '🏃' },
  { key: 'sleep', label: 'Sleep', emoji: '😴' },
  { key: 'supplements', label: 'Other Supplements', emoji: '💊' },
  { key: 'illness', label: 'Illness', emoji: '🤒' },
  { key: 'travel', label: 'Travel', emoji: '✈️' },
  { key: 'stress', label: 'Stress', emoji: '😰' },
] as const;

const CONFIDENCE_OPTIONS: { value: Confidence; label: string; emoji: string }[] = [
  { value: 'sure', label: "I'm sure", emoji: '💯' },
  { value: 'mostly', label: 'Mostly sure', emoji: '👍' },
  { value: 'guessing', label: 'Guessing', emoji: '🤷' },
];

export function WeeklyCheckinScreen({ navigation, route }: Props) {
  const { episodeId, checkinId } = route.params;
  const isEdit = !!checkinId;

  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [adherence, setAdherence] = useState<Record<string, AdherenceBin>>({});
  const [changes, setChanges] = useState<Record<string, boolean>>({});
  const [events, setEvents] = useState<string[]>([]);
  const [newEvent, setNewEvent] = useState('');
  const [confidence, setConfidence] = useState<Confidence | undefined>();
  const [weekStartDate, setWeekStartDate] = useState(getCurrentWeekStart());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load interventions for this episode
      const episodeInterventions = await getInterventionsByEpisode(episodeId);
      setInterventions(episodeInterventions);

      // If editing, load existing check-in
      if (checkinId) {
        const existing = await getCheckinById(checkinId);
        if (existing) {
          setAdherence(existing.adherence);
          setChanges(existing.changes);
          setEvents(existing.events);
          setConfidence(existing.confidence);
          setWeekStartDate(existing.week_start_date);
        }
      } else {
        // Initialize adherence for all interventions
        const initialAdherence: Record<string, AdherenceBin> = {};
        episodeInterventions.forEach((i) => {
          initialAdherence[i.compound] = 'every_day';
        });
        setAdherence(initialAdherence);
      }
    } catch (error) {
      console.error('Failed to load check-in data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdherenceChange = (compound: string, value: AdherenceBin) => {
    setAdherence((prev) => ({ ...prev, [compound]: value }));
  };

  const handleChangeToggle = (key: string) => {
    setChanges((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleAddEvent = () => {
    if (newEvent.trim()) {
      setEvents((prev) => [...prev, newEvent.trim()]);
      setNewEvent('');
    }
  };

  const handleRemoveEvent = (index: number) => {
    setEvents((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (isEdit && checkinId) {
        await updateCheckin(checkinId, {
          week_start_date: weekStartDate,
          adherence,
          changes,
          events,
          confidence,
        });
      } else {
        await createCheckin({
          episode_id: episodeId,
          week_start_date: weekStartDate,
          adherence,
          changes,
          events,
          confidence,
        });
      }
      navigation.goBack();
    } catch (error) {
      console.error('Failed to save check-in:', error);
      Alert.alert('Error', 'Failed to save check-in. Please try again.');
    } finally {
      setSaving(false);
    }
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

  return (
    <ScreenContainer>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Week indicator */}
        <View style={styles.weekIndicator}>
          <Text style={styles.weekLabel}>Week of</Text>
          <Text style={styles.weekDate}>{formatWeekDate(weekStartDate)}</Text>
        </View>

        {/* Adherence Section */}
        {interventions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Adherence</Text>
            <Text style={styles.sectionHint}>
              How consistently did you take each compound?
            </Text>
            {interventions.map((intervention) => (
              <View key={intervention.id} style={styles.adherenceItem}>
                <Text style={styles.compoundName}>
                  {intervention.compound.toUpperCase()}
                  {intervention.dose && ` ${intervention.dose}${intervention.unit || 'mg'}`}
                </Text>
                <View style={styles.adherenceOptions}>
                  {ADHERENCE_OPTIONS.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.adherenceOption,
                        adherence[intervention.compound] === option.value &&
                          styles.adherenceOptionSelected,
                      ]}
                      onPress={() =>
                        handleAdherenceChange(intervention.compound, option.value)
                      }
                    >
                      <Text style={styles.adherenceEmoji}>{option.emoji}</Text>
                      <Text
                        style={[
                          styles.adherenceLabel,
                          adherence[intervention.compound] === option.value &&
                            styles.adherenceLabelSelected,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Changes Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notable Changes</Text>
          <Text style={styles.sectionHint}>
            Did anything unusual happen this week?
          </Text>
          <View style={styles.changesGrid}>
            {CHANGE_FLAGS.map((flag) => (
              <TouchableOpacity
                key={flag.key}
                style={[
                  styles.changeChip,
                  changes[flag.key] && styles.changeChipSelected,
                ]}
                onPress={() => handleChangeToggle(flag.key)}
              >
                <Text style={styles.changeEmoji}>{flag.emoji}</Text>
                <Text
                  style={[
                    styles.changeLabel,
                    changes[flag.key] && styles.changeLabelSelected,
                  ]}
                >
                  {flag.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Events Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notable Events</Text>
          <Text style={styles.sectionHint}>
            Brief notes about anything significant
          </Text>
          <View style={styles.eventInputRow}>
            <TextInput
              style={styles.eventInput}
              placeholder="Add an event..."
              placeholderTextColor={colors.textMuted}
              value={newEvent}
              onChangeText={setNewEvent}
              onSubmitEditing={handleAddEvent}
              returnKeyType="done"
            />
            <TouchableOpacity
              style={styles.addEventButton}
              onPress={handleAddEvent}
              disabled={!newEvent.trim()}
            >
              <Text style={styles.addEventButtonText}>Add</Text>
            </TouchableOpacity>
          </View>
          {events.length > 0 && (
            <View style={styles.eventsList}>
              {events.map((event, index) => (
                <View key={index} style={styles.eventItem}>
                  <Text style={styles.eventText}>{event}</Text>
                  <TouchableOpacity
                    onPress={() => handleRemoveEvent(index)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Text style={styles.removeEventText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Confidence Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Confidence</Text>
          <Text style={styles.sectionHint}>
            How accurate do you think this check-in is?
          </Text>
          <View style={styles.confidenceOptions}>
            {CONFIDENCE_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.confidenceOption,
                  confidence === option.value && styles.confidenceOptionSelected,
                ]}
                onPress={() => setConfidence(option.value)}
              >
                <Text style={styles.confidenceEmoji}>{option.emoji}</Text>
                <Text
                  style={[
                    styles.confidenceLabel,
                    confidence === option.value && styles.confidenceLabelSelected,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Save Button */}
        <View style={styles.footer}>
          <Button 
            title={isEdit ? 'Update Check-in' : 'Save Check-in'} 
            onPress={handleSave} 
            loading={saving} 
          />
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

function formatWeekDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  weekIndicator: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: spacing.lg,
  },
  weekLabel: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  weekDate: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: spacing.xs,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  sectionHint: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  adherenceItem: {
    marginBottom: spacing.lg,
  },
  compoundName: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.accent,
    marginBottom: spacing.sm,
  },
  adherenceOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  adherenceOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  adherenceOptionSelected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  adherenceEmoji: {
    fontSize: 14,
    marginRight: spacing.xs,
  },
  adherenceLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  adherenceLabelSelected: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
  changesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  changeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  changeChipSelected: {
    backgroundColor: colors.warning,
    borderColor: colors.warning,
  },
  changeEmoji: {
    fontSize: 16,
    marginRight: spacing.xs,
  },
  changeLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  changeLabelSelected: {
    color: colors.background,
    fontWeight: '600',
  },
  eventInputRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  eventInput: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: fontSize.md,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  addEventButton: {
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
  },
  addEventButtonText: {
    color: colors.textPrimary,
    fontWeight: '600',
    fontSize: fontSize.md,
  },
  eventsList: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  eventItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  eventText: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.textPrimary,
  },
  removeEventText: {
    fontSize: fontSize.md,
    color: colors.textMuted,
    paddingLeft: spacing.md,
  },
  confidenceOptions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  confidenceOption: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  confidenceOptionSelected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  confidenceEmoji: {
    fontSize: 24,
    marginBottom: spacing.xs,
  },
  confidenceLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  confidenceLabelSelected: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
  footer: {
    paddingVertical: spacing.xl,
  },
});

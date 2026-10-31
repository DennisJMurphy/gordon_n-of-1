import React, { useCallback, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button, ScreenContainer, Select, TextInput } from '../../components/ui';
import { HomeStackParamList } from '../../navigation/types';
import { Concern, ConcernCertainty, ConcernEventType, ConcernUpdate } from '../../types';
import { addConcernUpdate, getConcernById, getConcernUpdates } from '../../db/repositories/concerns';
import { formatApproximateDate, formatDateISO, getElapsedCalendarDays, isValidApproximateDate } from '../../utils/dates';
import { colors, fontSize, spacing, borderRadius } from '../../theme';

type Props = NativeStackScreenProps<HomeStackParamList, 'ConcernDetail'>;

const UPDATE_OPTIONS: { label: string; value: 'observation' | 'interpretation' }[] = [
  { label: 'Observation', value: 'observation' },
  { label: 'Interpretation', value: 'interpretation' },
];

const CERTAINTY_OPTIONS: { label: string; value: ConcernCertainty }[] = [
  { label: 'Unknown', value: 'unknown' },
  { label: 'Suspected', value: 'suspected' },
  { label: 'Confirmed', value: 'confirmed' },
];

export function ConcernDetailScreen({ route }: Props) {
  const { concernId } = route.params;
  const [concern, setConcern] = useState<Concern | null>(null);
  const [updates, setUpdates] = useState<ConcernUpdate[]>([]);
  const [eventDate, setEventDate] = useState(formatDateISO(new Date()));
  const [eventType, setEventType] = useState<'observation' | 'interpretation'>('observation');
  const [label, setLabel] = useState('');
  const [certainty, setCertainty] = useState<ConcernCertainty | undefined>();
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [record, history] = await Promise.all([
        getConcernById(concernId),
        getConcernUpdates(concernId),
      ]);
      setConcern(record);
      setUpdates(history);
    } catch (error) {
      console.error('Failed to load concern:', error);
      Alert.alert('Error', 'Could not load this concern.');
    } finally {
      setLoading(false);
    }
  }, [concernId]);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const resetUpdateForm = () => {
    setEventDate(formatDateISO(new Date()));
    setEventType('observation');
    setLabel('');
    setCertainty(undefined);
    setNote('');
  };

  const handleAddUpdate = async () => {
    if (!eventDate.trim() || !isValidApproximateDate(eventDate.trim())) {
      Alert.alert('Check the date', 'Use YYYY, YYYY-MM or YYYY-MM-DD.');
      return;
    }
    if (!label.trim() && !note.trim()) {
      Alert.alert('Add an update', 'Enter an observation or interpretation.');
      return;
    }

    setSaving(true);
    try {
      await addConcernUpdate({
        concern_id: concernId,
        event_date: eventDate.trim(),
        event_type: eventType,
        label: label || undefined,
        certainty,
        note: note || undefined,
      });
      resetUpdateForm();
      await loadData();
    } catch (error) {
      console.error('Failed to save concern update:', error);
      Alert.alert('Error', 'Could not save this update. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (eventType: 'resolved' | 'reopened') => {
    setSaving(true);
    try {
      await addConcernUpdate({
        concern_id: concernId,
        event_date: formatDateISO(new Date()),
        event_type: eventType,
      });
      await loadData();
    } catch (error) {
      console.error('Failed to update concern status:', error);
      Alert.alert('Error', 'Could not update this concern. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <ScreenContainer><Text style={styles.muted}>Loading concern...</Text></ScreenContainer>;
  }
  if (!concern) {
    return <ScreenContainer><Text style={styles.muted}>This concern is unavailable.</Text></ScreenContainer>;
  }

  const resolutions = updates.filter((item) => item.event_type === 'resolved');
  const resolution = resolutions[resolutions.length - 1];
  const durationEnd = concern.status === 'resolved'
    ? resolution?.event_date
    : formatDateISO(new Date());
  const elapsedDays = getElapsedCalendarDays(concern.onset_date, durationEnd);
  const timeline = [
    {
      id: 'initial',
      event_date: concern.onset_date,
      event_type: 'observation' as ConcernEventType,
      label: concern.title,
      note: concern.initial_note,
      certainty: undefined,
      recorded_at: concern.created_at,
    },
    ...updates,
  ].sort((a, b) => {
    const dateOrder = (a.event_date ?? '9999').localeCompare(b.event_date ?? '9999');
    return dateOrder || a.recorded_at.localeCompare(b.recorded_at);
  });

  return (
    <ScreenContainer scrollable>
      <View style={styles.header}>
        <Text style={styles.title}>{concern.title}</Text>
        <Text style={[styles.status, concern.status === 'resolved' && styles.resolved]}>
          {concern.status === 'open' ? 'Ongoing' : 'Resolved'}
        </Text>
        <Text style={styles.muted}>Onset: {formatApproximateDate(concern.onset_date)}</Text>
        {elapsedDays !== null && (
          <Text style={styles.duration}>
            Elapsed span: {elapsedDays} {elapsedDays === 1 ? 'day' : 'days'}
            {concern.status === 'open' ? ' so far' : ''}
          </Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>History</Text>
        {timeline.map((item) => (
          <View key={item.id} style={styles.timelineItem}>
            <View style={styles.timelineMarker} />
            <View style={styles.timelineContent}>
              <Text style={styles.eventHeading}>{eventTitle(item.event_type, item.label)}</Text>
              <Text style={styles.eventDate}>{formatApproximateDate(item.event_date)}</Text>
              {item.event_date !== item.recorded_at.slice(0, 10) && (
                <Text style={styles.eventRecorded}>Recorded {formatApproximateDate(item.recorded_at.slice(0, 10))}</Text>
              )}
              {item.certainty && item.certainty !== 'unknown' && (
                <Text style={styles.eventMeta}>{item.certainty}</Text>
              )}
              {item.note && <Text style={styles.eventNote}>{item.note}</Text>}
            </View>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Add to history</Text>
        <Select label="Entry type" options={UPDATE_OPTIONS} value={eventType} onChange={setEventType} />
        <TextInput
          label={eventType === 'interpretation' ? 'Interpretation' : 'Observation'}
          value={label}
          onChangeText={setLabel}
          placeholder={eventType === 'interpretation' ? 'e.g. Flu' : 'e.g. Fever and fatigue'}
          maxLength={100}
        />
        {eventType === 'interpretation' && (
          <Select label="Certainty" options={CERTAINTY_OPTIONS} value={certainty} onChange={setCertainty} />
        )}
        <TextInput
          label="Event date"
          value={eventDate}
          onChangeText={setEventDate}
          placeholder="YYYY, YYYY-MM or YYYY-MM-DD"
          autoCapitalize="none"
          maxLength={10}
        />
        <TextInput
          label="Note (optional)"
          value={note}
          onChangeText={setNote}
          placeholder="Additional details"
          multiline
          textAlignVertical="top"
          style={styles.noteInput}
          maxLength={500}
        />
        <Button title="Save update" onPress={handleAddUpdate} loading={saving} />
      </View>

      <TouchableOpacity
        style={styles.statusAction}
        onPress={() => handleStatusChange(concern.status === 'open' ? 'resolved' : 'reopened')}
        disabled={saving}
      >
        <Text style={styles.statusActionText}>
          {concern.status === 'open' ? 'Mark resolved' : 'Reopen concern'}
        </Text>
      </TouchableOpacity>
      {elapsedDays !== null && (
        <Text style={styles.footerNote}>
          Elapsed span does not mean the concern was continuously active or establish a cause or diagnosis.
        </Text>
      )}
    </ScreenContainer>
  );
}

function eventTitle(type: ConcernEventType, label?: string): string {
  if (type === 'resolved') return 'Marked resolved';
  if (type === 'reopened') return 'Reopened';
  return label || (type === 'interpretation' ? 'Interpretation updated' : 'Observation');
}

const styles = StyleSheet.create({
  header: {
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: spacing.lg,
  },
  title: { color: colors.textPrimary, fontSize: fontSize.xl, fontWeight: '700' },
  status: { color: colors.accent, fontSize: fontSize.sm, marginTop: spacing.sm, textTransform: 'capitalize' },
  resolved: { color: colors.success },
  muted: { color: colors.textSecondary, fontSize: fontSize.sm, marginTop: spacing.sm },
  duration: { color: colors.textPrimary, fontSize: fontSize.md, fontWeight: '600', marginTop: spacing.sm },
  section: { marginBottom: spacing.xl },
  sectionTitle: { color: colors.textPrimary, fontSize: fontSize.lg, fontWeight: '600', marginBottom: spacing.md },
  timelineItem: { flexDirection: 'row', marginBottom: spacing.md },
  timelineMarker: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.accent, marginTop: 5, marginRight: spacing.md },
  timelineContent: { flex: 1, borderLeftWidth: 1, borderLeftColor: colors.border, paddingLeft: spacing.md, paddingBottom: spacing.sm },
  eventHeading: { color: colors.textPrimary, fontSize: fontSize.md, fontWeight: '600' },
  eventDate: { color: colors.accent, fontSize: fontSize.sm, marginTop: spacing.xs },
  eventRecorded: { color: colors.textMuted, fontSize: fontSize.xs, marginTop: spacing.xs },
  eventMeta: { color: colors.textMuted, fontSize: fontSize.xs, marginTop: spacing.xs, textTransform: 'capitalize' },
  eventNote: { color: colors.textSecondary, fontSize: fontSize.sm, marginTop: spacing.sm, lineHeight: 20 },
  noteInput: { minHeight: 96, paddingTop: spacing.md },
  statusAction: { paddingVertical: spacing.md, alignItems: 'center', borderTopWidth: 1, borderTopColor: colors.border },
  statusActionText: { color: colors.accent, fontSize: fontSize.md, fontWeight: '600' },
  footerNote: { color: colors.textMuted, fontSize: fontSize.xs, lineHeight: 18, marginBottom: spacing.lg },
});
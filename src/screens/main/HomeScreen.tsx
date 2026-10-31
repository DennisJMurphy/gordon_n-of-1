import React, { useCallback, useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Button, ScreenContainer } from '../../components/ui';
import { HomeStackScreenProps } from '../../navigation/types';
import { Concern, Intervention, WeeklyCheckin } from '../../types';
import { getAllConcerns } from '../../db/repositories/concerns';
import { getAllInterventions } from '../../db/repositories/interventions';
import { getAllCheckins, getCurrentWeekStart } from '../../db/repositories/weeklyCheckins';
import { formatApproximateDate, formatDateDisplay } from '../../utils/dates';
import { colors, fontSize, spacing, borderRadius } from '../../theme';

type Props = HomeStackScreenProps<'HomeMain'>;

export function HomeScreen({ navigation }: Props) {
  const [concerns, setConcerns] = useState<Concern[]>([]);
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [checkins, setCheckins] = useState<WeeklyCheckin[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [concernRows, interventionRows, checkinRows] = await Promise.all([
        getAllConcerns(),
        getAllInterventions(),
        getAllCheckins(),
      ]);
      setConcerns(concernRows);
      setInterventions(interventionRows.filter((item) => !item.end_date));
      setCheckins(checkinRows.slice(0, 3));
    } catch (error) {
      console.error('Failed to load home data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const currentWeek = getCurrentWeekStart();
  const currentWeekCheckin = checkins.find((item) => item.week_start_date === currentWeek);

  if (loading) {
    return <ScreenContainer><Text style={styles.muted}>Loading...</Text></ScreenContainer>;
  }

  return (
    <ScreenContainer scrollable>
      <View style={styles.header}>
        <Image source={require('../../../assets/icon.png')} style={styles.icon} />
        <Text style={styles.greeting}>Gordon</Text>
      </View>

      <View style={styles.actionRow}>
        <View style={styles.actionPrimary}>
          <Button title="Record a concern" onPress={() => navigation.navigate('NewConcern')} />
        </View>
        <TouchableOpacity style={styles.smallAction} onPress={() => navigation.navigate('InterventionSetup')}>
          <Text style={styles.smallActionText}>Add intervention</Text>
        </TouchableOpacity>
      </View>

      <Section title="Concerns" />
      {concerns.length === 0 ? (
        <Text style={styles.emptyText}>No concerns recorded.</Text>
      ) : concerns.map((concern) => (
        <TouchableOpacity
          key={concern.id}
          style={styles.listRow}
          onPress={() => navigation.navigate('ConcernDetail', { concernId: concern.id })}
        >
          <View style={styles.rowCopy}>
            <Text style={styles.rowTitle}>{concern.title}</Text>
            <Text style={styles.rowDetail}>Onset: {formatApproximateDate(concern.onset_date)}</Text>
          </View>
          <Text style={[styles.status, concern.status === 'resolved' && styles.resolved]}>
            {concern.status === 'open' ? 'Ongoing' : 'Resolved'}
          </Text>
        </TouchableOpacity>
      ))}

      <Section title="Ongoing interventions" />
      {interventions.length === 0 ? (
        <Text style={styles.emptyText}>No ongoing interventions recorded.</Text>
      ) : interventions.map((item) => (
        <View key={item.id} style={styles.listRow}>
          <View style={styles.rowCopy}>
            <Text style={styles.rowTitle}>{interventionName(item)}</Text>
            <Text style={styles.rowDetail}>Since {formatApproximateDate(item.start_date)}</Text>
          </View>
        </View>
      ))}

      <Section title="Check-ins" action="View all" onAction={() => navigation.navigate('CheckinHistory')} />
      <Button
        title={currentWeekCheckin ? 'Edit this week’s check-in' : 'Optional weekly check-in'}
        variant="secondary"
        onPress={() => navigation.navigate('WeeklyCheckin', { checkinId: currentWeekCheckin?.id })}
      />
      {checkins.map((checkin) => (
        <TouchableOpacity
          key={checkin.id}
          style={styles.checkinRow}
          onPress={() => navigation.navigate('WeeklyCheckin', { checkinId: checkin.id })}
        >
          <Text style={styles.rowTitle}>Week of {formatDateDisplay(checkin.week_start_date)}</Text>
          <Text style={styles.rowDetail}>{checkin.events.length} note{checkin.events.length === 1 ? '' : 's'}</Text>
        </TouchableOpacity>
      ))}
    </ScreenContainer>
  );
}

function Section({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action && onAction && (
        <TouchableOpacity onPress={onAction}>
          <Text style={styles.sectionAction}>{action}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function interventionName(item: Intervention): string {
  const name = item.compound === 'other' && item.custom_name
    ? item.custom_name
    : item.compound.toUpperCase();
  return `${name}${item.dose ? ` ${item.dose}${item.unit || ''}` : ''}`;
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.lg },
  icon: { width: 32, height: 32, marginRight: spacing.sm },
  greeting: { color: colors.textPrimary, fontSize: fontSize.xl, fontWeight: '700' },
  actionRow: { gap: spacing.sm, marginBottom: spacing.lg },
  actionPrimary: { width: '100%' },
  smallAction: { paddingVertical: spacing.sm },
  smallActionText: { color: colors.accent, fontSize: fontSize.md, fontWeight: '600', textAlign: 'center' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.lg, marginBottom: spacing.sm },
  sectionTitle: { color: colors.textMuted, fontSize: fontSize.sm, fontWeight: '600', textTransform: 'uppercase' },
  sectionAction: { color: colors.accent, fontSize: fontSize.sm },
  listRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md, padding: spacing.md, marginBottom: spacing.sm, backgroundColor: colors.surface, borderRadius: borderRadius.md },
  rowCopy: { flex: 1 },
  rowTitle: { color: colors.textPrimary, fontSize: fontSize.md, fontWeight: '600' },
  rowDetail: { color: colors.textSecondary, fontSize: fontSize.sm, marginTop: spacing.xs },
  status: { color: colors.accent, fontSize: fontSize.xs, fontWeight: '600' },
  resolved: { color: colors.success },
  emptyText: { color: colors.textMuted, fontSize: fontSize.sm, paddingVertical: spacing.md },
  checkinRow: { paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  muted: { color: colors.textSecondary, fontSize: fontSize.md },
});
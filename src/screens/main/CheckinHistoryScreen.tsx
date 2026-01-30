// src/screens/main/CheckinHistoryScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { ScreenContainer } from '../../components/ui';
import { colors, spacing, fontSize, borderRadius } from '../../theme';
import { HomeStackParamList } from '../../navigation/types';
import { WeeklyCheckin } from '../../types';
import {
  getCheckinsByEpisode,
  deleteCheckin,
} from '../../db/repositories/weeklyCheckins';

type Props = NativeStackScreenProps<HomeStackParamList, 'CheckinHistory'>;

export function CheckinHistoryScreen({ navigation, route }: Props) {
  const { episodeId } = route.params;
  const [checkins, setCheckins] = useState<WeeklyCheckin[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCheckins = useCallback(async () => {
    try {
      const data = await getCheckinsByEpisode(episodeId);
      setCheckins(data);
    } catch (error) {
      console.error('Failed to load check-ins:', error);
    } finally {
      setLoading(false);
    }
  }, [episodeId]);

  useFocusEffect(
    useCallback(() => {
      loadCheckins();
    }, [loadCheckins])
  );

  const handleEdit = (checkin: WeeklyCheckin) => {
    navigation.navigate('WeeklyCheckin', {
      episodeId,
      checkinId: checkin.id,
    });
  };

  const handleDelete = (checkin: WeeklyCheckin) => {
    Alert.alert(
      'Delete Check-in',
      `Are you sure you want to delete the check-in for ${formatWeekDate(checkin.week_start_date)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCheckin(checkin.id);
              loadCheckins();
            } catch (error) {
              console.error('Failed to delete check-in:', error);
              Alert.alert('Error', 'Failed to delete check-in');
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: WeeklyCheckin }) => {
    const changesCount = Object.values(item.changes).filter(Boolean).length;
    const eventsCount = item.events.length;

    return (
      <View style={styles.checkinCard}>
        <TouchableOpacity
          style={styles.cardContent}
          onPress={() => handleEdit(item)}
        >
          <View style={styles.cardHeader}>
            <Text style={styles.weekDate}>{formatWeekDate(item.week_start_date)}</Text>
            {item.confidence && (
              <View style={styles.confidenceBadge}>
                <Text style={styles.confidenceText}>
                  {item.confidence === 'sure' ? '💯' : item.confidence === 'mostly' ? '👍' : '🤷'}
                </Text>
              </View>
            )}
          </View>

          {/* Adherence summary */}
          <View style={styles.adherenceSummary}>
            {Object.entries(item.adherence).map(([compound, level]) => (
              <View key={compound} style={styles.adherenceChip}>
                <Text style={styles.adherenceCompound}>{compound.toUpperCase()}</Text>
                <Text style={styles.adherenceLevel}>{getAdherenceEmoji(level)}</Text>
              </View>
            ))}
          </View>

          {/* Changes/Events indicators */}
          <View style={styles.indicators}>
            {changesCount > 0 && (
              <Text style={styles.indicator}>
                ⚠️ {changesCount} change{changesCount > 1 ? 's' : ''}
              </Text>
            )}
            {eventsCount > 0 && (
              <Text style={styles.indicator}>
                📝 {eventsCount} event{eventsCount > 1 ? 's' : ''}
              </Text>
            )}
          </View>
        </TouchableOpacity>

        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleEdit(item)}
          >
            <Text style={styles.actionButtonText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDelete(item)}
          >
            <Text style={[styles.actionButtonText, styles.deleteButtonText]}>
              Delete
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
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
      {checkins.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>No check-ins yet</Text>
          <Text style={styles.emptyHint}>
            Complete your first weekly check-in to see it here
          </Text>
        </View>
      ) : (
        <FlatList
          data={checkins}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </ScreenContainer>
  );
}

function formatWeekDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function getAdherenceEmoji(level: string): string {
  const emojis: Record<string, string> = {
    every_day: '✅',
    most_days: '👍',
    some_days: '🤷',
    rarely: '😅',
    not_at_all: '❌',
  };
  return emojis[level] || '?';
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
  emptyText: {
    fontSize: fontSize.lg,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  emptyHint: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  list: {
    paddingVertical: spacing.md,
  },
  checkinCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  cardContent: {
    padding: spacing.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  weekDate: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  confidenceBadge: {
    backgroundColor: colors.surfaceElevated,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  confidenceText: {
    fontSize: fontSize.sm,
  },
  adherenceSummary: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  adherenceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  adherenceCompound: {
    fontSize: fontSize.xs,
    color: colors.accent,
    fontWeight: '600',
  },
  adherenceLevel: {
    fontSize: fontSize.sm,
  },
  indicators: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  indicator: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  cardActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actionButton: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: fontSize.sm,
    color: colors.accent,
    fontWeight: '500',
  },
  deleteButton: {
    borderLeftWidth: 1,
    borderLeftColor: colors.border,
  },
  deleteButtonText: {
    color: colors.error,
  },
});

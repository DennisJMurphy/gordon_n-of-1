// src/screens/main/HomeScreen.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, FlatList } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenContainer } from '../../components/ui';
import { colors, spacing, fontSize, borderRadius } from '../../theme';
import { HomeStackParamList } from '../../navigation/types';
import { Episode, Intervention, WeeklyCheckin } from '../../types';
import { getActiveEpisode } from '../../db/repositories/episodes';
import { getInterventionsByEpisode } from '../../db/repositories/interventions';
import { getCheckinsByEpisode, getLatestCheckin, getCurrentWeekStart } from '../../db/repositories/weeklyCheckins';
import { formatDateDisplay } from '../../utils/dates';

type Props = NativeStackScreenProps<HomeStackParamList, 'HomeMain'>;

export function HomeScreen({ navigation }: Props) {
  const [episode, setEpisode] = useState<Episode | null>(null);
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [recentCheckins, setRecentCheckins] = useState<WeeklyCheckin[]>([]);
  const [hasCurrentWeekCheckin, setHasCurrentWeekCheckin] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const activeEpisode = await getActiveEpisode();
      setEpisode(activeEpisode);

      if (activeEpisode) {
        const [episodeInterventions, checkins, latestCheckin] = await Promise.all([
          getInterventionsByEpisode(activeEpisode.id),
          getCheckinsByEpisode(activeEpisode.id),
          getLatestCheckin(activeEpisode.id),
        ]);
        setInterventions(episodeInterventions);
        setRecentCheckins(checkins.slice(0, 3)); // Show last 3

        // Check if we have a check-in for the current week
        const currentWeek = getCurrentWeekStart();
        setHasCurrentWeekCheckin(latestCheckin?.week_start_date === currentWeek);
      }
    } catch (error) {
      console.error('Failed to load episode:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleStartCheckin = () => {
    if (episode) {
      navigation.navigate('WeeklyCheckin', { episodeId: episode.id });
    }
  };

  const handleViewHistory = () => {
    if (episode) {
      navigation.navigate('CheckinHistory', { episodeId: episode.id });
    }
  };

  const handleEditCheckin = (checkin: WeeklyCheckin) => {
    if (episode) {
      navigation.navigate('WeeklyCheckin', { 
        episodeId: episode.id, 
        checkinId: checkin.id 
      });
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
      <View style={styles.header}>
        <View style={styles.greetingRow}>
          <Image 
            source={require('../../../assets/icon.png')} 
            style={styles.headerIcon}
          />
          <Text style={styles.greeting}>Gordon</Text>
        </View>
      </View>

      {episode ? (
        <View style={styles.content}>
          {/* Episode Card */}
          <View style={styles.episodeCard}>
            <View style={styles.episodeHeader}>
              <Text style={styles.episodeTitle}>{episode.title}</Text>
              <View style={[styles.badge, episode.type === 'intervention' ? styles.badgeIntervention : styles.badgeObservational]}>
                <Text style={styles.badgeText}>{episode.type}</Text>
              </View>
            </View>

            <Text style={styles.dateRange}>
              {formatDateDisplay(episode.start_date)} → {formatDateDisplay(episode.end_date)}
            </Text>

            {episode.special_summary && (
              <Text style={styles.summary}>{episode.special_summary}</Text>
            )}

            {interventions.length > 0 && (
              <View style={styles.interventionsPreview}>
                <Text style={styles.interventionsLabel}>Tracking:</Text>
                <Text style={styles.interventionsList}>
                  {interventions.map((i) => i.compound.toUpperCase()).join(', ')}
                </Text>
              </View>
            )}
          </View>

          {/* Next Check-in */}
          <View style={[styles.checkinCard, hasCurrentWeekCheckin && styles.checkinCardCompleted]}>
            <View style={styles.checkinHeader}>
              <Text style={styles.checkinLabel}>Weekly Check-in</Text>
              {hasCurrentWeekCheckin && (
                <Text style={styles.checkinBadge}>✅ Done</Text>
              )}
            </View>
            <Text style={styles.checkinHint}>
              {hasCurrentWeekCheckin 
                ? 'You\'ve completed this week\'s check-in' 
                : 'Less than 60 seconds to record your week'
              }
            </Text>
            <TouchableOpacity 
              style={styles.checkinButton}
              onPress={handleStartCheckin}
            >
              <Text style={styles.checkinButtonText}>
                {hasCurrentWeekCheckin ? 'Edit Check-in →' : 'Start Check-in →'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Recent Check-ins */}
          {recentCheckins.length > 0 && (
            <View style={styles.recentSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Recent Check-ins</Text>
                <TouchableOpacity onPress={handleViewHistory}>
                  <Text style={styles.viewAllLink}>View All</Text>
                </TouchableOpacity>
              </View>
              {recentCheckins.map((checkin) => (
                <TouchableOpacity
                  key={checkin.id}
                  style={styles.recentCheckinCard}
                  onPress={() => handleEditCheckin(checkin)}
                >
                  <View style={styles.recentCheckinHeader}>
                    <Text style={styles.recentCheckinDate}>
                      {formatWeekDate(checkin.week_start_date)}
                    </Text>
                    <Text style={styles.recentCheckinConfidence}>
                      {checkin.confidence === 'sure' ? '💯' : checkin.confidence === 'mostly' ? '👍' : '🤷'}
                    </Text>
                  </View>
                  <View style={styles.adherencePreview}>
                    {Object.entries(checkin.adherence).slice(0, 3).map(([compound, level]) => (
                      <View key={compound} style={styles.adherenceChip}>
                        <Text style={styles.adherenceCompound}>{compound.toUpperCase()}</Text>
                        <Text style={styles.adherenceLevel}>{getAdherenceEmoji(level)}</Text>
                      </View>
                    ))}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Quick Actions */}
          <View style={styles.actionsSection}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.actionsGrid}>
              <TouchableOpacity style={styles.actionCard}>
                <Text style={styles.actionIcon}>📝</Text>
                <Text style={styles.actionLabel}>Add Note</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.actionCard}
                onPress={handleViewHistory}
              >
                <Text style={styles.actionIcon}>📋</Text>
                <Text style={styles.actionLabel}>Check-in History</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.centered}>
          <Text style={styles.noEpisodeText}>No active episode</Text>
          <Text style={styles.noEpisodeHint}>Create a new episode to get started</Text>
        </View>
      )}
    </ScreenContainer>
  );
}

function formatWeekDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
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
  header: {
    paddingVertical: spacing.lg,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    width: 32,
    height: 32,
    marginRight: spacing.sm,
  },
  greeting: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  content: {
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
  noEpisodeText: {
    fontSize: fontSize.lg,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  noEpisodeHint: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  episodeCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  episodeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  episodeTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.textPrimary,
    flex: 1,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  badgeObservational: {
    backgroundColor: colors.border,
  },
  badgeIntervention: {
    backgroundColor: colors.accent,
  },
  badgeText: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: colors.textPrimary,
    textTransform: 'capitalize',
  },
  dateRange: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  summary: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  interventionsPreview: {
    flexDirection: 'row',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  interventionsLabel: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginRight: spacing.sm,
  },
  interventionsList: {
    fontSize: fontSize.sm,
    color: colors.accent,
    fontWeight: '600',
  },
  checkinCard: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  checkinCardCompleted: {
    borderColor: colors.success,
    backgroundColor: colors.surface,
  },
  checkinHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  checkinBadge: {
    fontSize: fontSize.sm,
    color: colors.success,
    fontWeight: '600',
  },
  checkinLabel: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  checkinHint: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  checkinButton: {
    marginTop: spacing.md,
  },
  checkinButtonText: {
    fontSize: fontSize.md,
    color: colors.accent,
    fontWeight: '600',
  },
  actionsSection: {
    marginTop: spacing.md,
  },
  recentSection: {
    marginBottom: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  viewAllLink: {
    fontSize: fontSize.sm,
    color: colors.accent,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  recentCheckinCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  recentCheckinHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  recentCheckinDate: {
    fontSize: fontSize.md,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  recentCheckinConfidence: {
    fontSize: fontSize.md,
  },
  adherencePreview: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
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
  actionsGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  actionCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  actionIcon: {
    fontSize: 24,
    marginBottom: spacing.xs,
  },
  actionLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
});

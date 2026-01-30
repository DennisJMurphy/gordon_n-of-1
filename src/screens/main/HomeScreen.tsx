// src/screens/main/HomeScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { ScreenContainer } from '../../components/ui';
import { colors, spacing, fontSize, borderRadius } from '../../theme';
import { MainTabScreenProps } from '../../navigation/types';
import { Episode, Intervention } from '../../types';
import { getActiveEpisode } from '../../db/repositories/episodes';
import { getInterventionsByEpisode } from '../../db/repositories/interventions';
import { formatDateDisplay } from '../../utils/dates';

export function HomeScreen({ navigation }: MainTabScreenProps<'Home'>) {
  const [episode, setEpisode] = useState<Episode | null>(null);
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const activeEpisode = await getActiveEpisode();
      setEpisode(activeEpisode);

      if (activeEpisode) {
        const episodeInterventions = await getInterventionsByEpisode(activeEpisode.id);
        setInterventions(episodeInterventions);
      }
    } catch (error) {
      console.error('Failed to load episode:', error);
    } finally {
      setLoading(false);
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
          <View style={styles.checkinCard}>
            <Text style={styles.checkinLabel}>Weekly Check-in</Text>
            <Text style={styles.checkinHint}>
              Less than 60 seconds to record your week
            </Text>
            <TouchableOpacity style={styles.checkinButton}>
              <Text style={styles.checkinButtonText}>Start Check-in →</Text>
            </TouchableOpacity>
          </View>

          {/* Quick Actions */}
          <View style={styles.actionsSection}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.actionsGrid}>
              <TouchableOpacity style={styles.actionCard}>
                <Text style={styles.actionIcon}>📝</Text>
                <Text style={styles.actionLabel}>Add Note</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionCard}>
                <Text style={styles.actionIcon}>📊</Text>
                <Text style={styles.actionLabel}>View Reports</Text>
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
  sectionTitle: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
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

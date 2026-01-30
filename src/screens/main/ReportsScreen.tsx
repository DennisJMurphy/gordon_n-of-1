// src/screens/main/ReportsScreen.tsx
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Share,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { ScreenContainer } from '../../components/ui';
import { colors, spacing, fontSize, borderRadius } from '../../theme';
import { MainTabScreenProps } from '../../navigation/types';
import { Report, Episode } from '../../types';
import { getAllEpisodes } from '../../db/repositories/episodes';
import { getReportsByEpisode, deleteReport } from '../../db/repositories/reports';
import { ShareSafeReport } from '../../services/reportBuilder';

interface ReportWithEpisode {
  report: Report;
  episode: Episode;
  shareSafe: ShareSafeReport;
}

export function ReportsScreen({ navigation }: MainTabScreenProps<'Reports'>) {
  const [reports, setReports] = useState<ReportWithEpisode[]>([]);
  const [loading, setLoading] = useState(true);

  const loadReports = useCallback(async () => {
    try {
      const episodes = await getAllEpisodes();
      const closedEpisodes = episodes.filter(e => e.status === 'closed');
      
      const allReports: ReportWithEpisode[] = [];
      
      for (const episode of closedEpisodes) {
        const episodeReports = await getReportsByEpisode(episode.id);
        for (const report of episodeReports) {
          allReports.push({
            report,
            episode,
            shareSafe: JSON.parse(report.report_json),
          });
        }
      }
      
      // Sort by generated_at descending
      allReports.sort((a, b) => 
        b.report.generated_at.localeCompare(a.report.generated_at)
      );
      
      setReports(allReports);
    } catch (error) {
      console.error('Failed to load reports:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadReports();
    }, [loadReports])
  );

  const handleShare = async (report: Report) => {
    try {
      await Share.share({
        message: report.report_json,
        title: 'Gordon n-of-1 Report',
      });
    } catch (error) {
      console.error('Failed to share:', error);
    }
  };

  const handleDelete = (report: Report) => {
    Alert.alert(
      'Delete Report',
      'Are you sure you want to delete this report? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteReport(report.id);
              loadReports();
            } catch (error) {
              console.error('Failed to delete report:', error);
              Alert.alert('Error', 'Failed to delete report');
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateStr: string): string => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const renderItem = ({ item }: { item: ReportWithEpisode }) => {
    const { report, episode, shareSafe } = item;
    
    return (
      <View style={styles.reportCard}>
        <View style={styles.reportHeader}>
          <Text style={styles.episodeTitle}>{episode.title}</Text>
          <View style={styles.typeBadge}>
            <Text style={styles.typeBadgeText}>{episode.type}</Text>
          </View>
        </View>
        
        <Text style={styles.generatedDate}>
          Generated {formatDate(report.generated_at)}
        </Text>
        
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{shareSafe.episode.duration_days}</Text>
            <Text style={styles.statLabel}>days</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{shareSafe.interventions.length}</Text>
            <Text style={styles.statLabel}>interventions</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>
              {shareSafe.adherence_summary[0]?.weeks_tracked ?? 0}
            </Text>
            <Text style={styles.statLabel}>check-ins</Text>
          </View>
        </View>
        
        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleShare(report)}
          >
            <Text style={styles.actionButtonText}>Share</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteAction]}
            onPress={() => handleDelete(report)}
          >
            <Text style={[styles.actionButtonText, styles.deleteActionText]}>
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
          <Text style={styles.loadingText}>Loading reports...</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={styles.title}>Reports</Text>
        <Text style={styles.subtitle}>
          {reports.length === 0 
            ? 'No reports yet' 
            : `${reports.length} report${reports.length > 1 ? 's' : ''}`
          }
        </Text>
      </View>

      {reports.length === 0 ? (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderIcon}>📊</Text>
          <Text style={styles.placeholderText}>
            Generated reports will appear here.{'\n\n'}
            Close an episode to generate a share-safe summary.
          </Text>
        </View>
      ) : (
        <FlatList
          data={reports}
          renderItem={renderItem}
          keyExtractor={(item) => item.report.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
        />
      )}
    </ScreenContainer>
  );
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
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  placeholderIcon: {
    fontSize: 64,
    marginBottom: spacing.lg,
  },
  placeholderText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  list: {
    paddingBottom: spacing.xl,
  },
  reportCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  episodeTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
  },
  typeBadge: {
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  typeBadgeText: {
    fontSize: fontSize.xs,
    color: colors.textPrimary,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  generatedDate: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: spacing.md,
    gap: spacing.lg,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  cardActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: spacing.sm,
    paddingTop: spacing.md,
    gap: spacing.md,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    backgroundColor: colors.surfaceElevated,
    borderRadius: borderRadius.md,
  },
  actionButtonText: {
    fontSize: fontSize.sm,
    color: colors.accent,
    fontWeight: '500',
  },
  deleteAction: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.error,
  },
  deleteActionText: {
    color: colors.error,
  },
});

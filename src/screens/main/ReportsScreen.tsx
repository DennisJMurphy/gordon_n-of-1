// src/screens/main/ReportsScreen.tsx
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { ScreenContainer } from '../../components/ui';
import { colors, spacing, fontSize, borderRadius } from '../../theme';
import { MainTabScreenProps } from '../../navigation/types';
import { Report, Episode } from '../../types';
import { getAllEpisodes } from '../../db/repositories/episodes';
import { getReportsByEpisode, deleteReport, markReportExported } from '../../db/repositories/reports';
import { ShareSafeReport } from '../../services/reportBuilder';
import { shareReportAsFile } from '../../services/reportSharing';

interface ReportWithEpisode {
  report: Report;
  episode: Episode;
  shareSafe: ShareSafeReport;
}

export function ReportsScreen({ navigation }: MainTabScreenProps<'Reports'>) {
  const [reports, setReports] = useState<ReportWithEpisode[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedReportId, setExpandedReportId] = useState<string | null>(null);
  const [showJsonForReport, setShowJsonForReport] = useState<string | null>(null);

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

  const handleShare = async (item: ReportWithEpisode) => {
    try {
      await shareReportAsFile(item.report, item.episode.title);
      await markReportExported(item.report.id, 'share_sheet');
      loadReports(); // Refresh to show export status
    } catch (error) {
      console.error('Failed to share:', error);
      Alert.alert('Error', 'Failed to share report.');
    }
  };

  const handleToggleExpand = (reportId: string) => {
    setExpandedReportId(prev => prev === reportId ? null : reportId);
    // Reset JSON preview when collapsing
    if (expandedReportId === reportId) {
      setShowJsonForReport(null);
    }
  };

  const handleToggleJson = (reportId: string) => {
    setShowJsonForReport(prev => prev === reportId ? null : reportId);
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
    const isExpanded = expandedReportId === report.id;
    const showJson = showJsonForReport === report.id;
    
    return (
      <TouchableOpacity 
        style={styles.reportCard}
        onPress={() => handleToggleExpand(report.id)}
        activeOpacity={0.8}
      >
        <View style={styles.reportHeader}>
          <Text style={styles.episodeTitle}>{episode.title}</Text>
          <View style={styles.typeBadge}>
            <Text style={styles.typeBadgeText}>{episode.type}</Text>
          </View>
        </View>
        
        <Text style={styles.generatedDate}>
          Generated {formatDate(report.generated_at)}
        </Text>
        
        {/* Export Status */}
        {report.exported_at ? (
          <View style={styles.exportStatus}>
            <Text style={styles.exportStatusText}>
              ✓ Exported {formatDate(report.exported_at)}
            </Text>
          </View>
        ) : (
          <View style={[styles.exportStatus, styles.exportStatusPending]}>
            <Text style={styles.exportStatusTextPending}>Not yet exported</Text>
          </View>
        )}
        
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
        
        {/* Expand indicator */}
        <Text style={styles.expandHint}>
          {isExpanded ? '▲ Tap to collapse' : '▼ Tap to view details'}
        </Text>
        
        {/* Expanded Detail View */}
        {isExpanded && (
          <View style={styles.detailSection}>
            {/* Human-readable Summary */}
            <View style={styles.summarySection}>
              <Text style={styles.sectionTitle}>Summary</Text>
              
              {shareSafe.interventions.length > 0 && (
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Interventions:</Text>
                  {shareSafe.interventions.map((intervention, idx) => (
                    <Text key={idx} style={styles.summaryText}>
                      • {intervention.compound.toUpperCase()}
                      {intervention.dose ? ` ${intervention.dose}${intervention.unit || ''}` : ''}
                      {intervention.route ? ` (${intervention.route})` : ''}
                    </Text>
                  ))}
                </View>
              )}
              
              {shareSafe.adherence_summary.length > 0 && (
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Adherence:</Text>
                  {shareSafe.adherence_summary.map((adherence, idx) => (
                    <Text key={idx} style={styles.summaryText}>
                      • {adherence.compound.toUpperCase()}: {adherence.average_adherence}
                      {adherence.weeks_tracked > 0 && ` (${adherence.weeks_tracked} weeks tracked)`}
                    </Text>
                  ))}
                </View>
              )}
              
              {shareSafe.changes_summary && (
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Changes Reported:</Text>
                  {shareSafe.changes_summary.diet_changes > 0 && (
                    <Text style={styles.summaryText}>• Diet: {shareSafe.changes_summary.diet_changes} changes</Text>
                  )}
                  {shareSafe.changes_summary.exercise_changes > 0 && (
                    <Text style={styles.summaryText}>• Exercise: {shareSafe.changes_summary.exercise_changes} changes</Text>
                  )}
                  {shareSafe.changes_summary.sleep_changes > 0 && (
                    <Text style={styles.summaryText}>• Sleep: {shareSafe.changes_summary.sleep_changes} changes</Text>
                  )}
                  {shareSafe.changes_summary.illness_days > 0 && (
                    <Text style={styles.summaryText}>• Illness: {shareSafe.changes_summary.illness_days} days</Text>
                  )}
                  {shareSafe.changes_summary.travel_days > 0 && (
                    <Text style={styles.summaryText}>• Travel: {shareSafe.changes_summary.travel_days} days</Text>
                  )}
                  {shareSafe.changes_summary.stress_periods > 0 && (
                    <Text style={styles.summaryText}>• Stress: {shareSafe.changes_summary.stress_periods} periods</Text>
                  )}
                </View>
              )}
              
              {shareSafe.participant && (
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Participant Context:</Text>
                  {shareSafe.participant.age_bracket && (
                    <Text style={styles.summaryText}>• Age: {shareSafe.participant.age_bracket}</Text>
                  )}
                  {shareSafe.participant.sex && (
                    <Text style={styles.summaryText}>• Sex: {shareSafe.participant.sex}</Text>
                  )}
                  {shareSafe.participant.typical_cardio_min_per_week !== undefined && (
                    <Text style={styles.summaryText}>
                      • Cardio: {shareSafe.participant.typical_cardio_min_per_week} min/week
                    </Text>
                  )}
                </View>
              )}
            </View>
            
            {/* Collapsible JSON Preview */}
            <TouchableOpacity
              style={styles.jsonToggle}
              onPress={() => handleToggleJson(report.id)}
            >
              <Text style={styles.jsonToggleText}>
                {showJson ? '▲ Hide JSON' : '▼ Show JSON'}
              </Text>
            </TouchableOpacity>
            
            {showJson && (
              <ScrollView 
                style={styles.jsonPreview} 
                horizontal={false}
                nestedScrollEnabled
              >
                <Text style={styles.jsonText}>
                  {JSON.stringify(shareSafe, null, 2)}
                </Text>
              </ScrollView>
            )}
            
            {/* Actions */}
            <View style={styles.cardActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleShare(item)}
              >
                <Text style={styles.actionButtonText}>Export / Share</Text>
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
        )}
      </TouchableOpacity>
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
  exportStatus: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.success + '20',
    borderRadius: borderRadius.sm,
    alignSelf: 'flex-start',
    marginBottom: spacing.md,
  },
  exportStatusPending: {
    backgroundColor: colors.textMuted + '20',
  },
  exportStatusText: {
    fontSize: fontSize.xs,
    color: colors.success,
    fontWeight: '500',
  },
  exportStatusTextPending: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  expandHint: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  detailSection: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  summarySection: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  summaryItem: {
    marginBottom: spacing.sm,
  },
  summaryLabel: {
    fontSize: fontSize.sm,
    fontWeight: '500',
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  summaryText: {
    fontSize: fontSize.sm,
    color: colors.textPrimary,
    marginLeft: spacing.sm,
    lineHeight: 20,
  },
  jsonToggle: {
    paddingVertical: spacing.sm,
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.sm,
  },
  jsonToggleText: {
    fontSize: fontSize.sm,
    color: colors.accent,
    fontWeight: '500',
  },
  jsonPreview: {
    maxHeight: 200,
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  jsonText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    fontFamily: 'monospace',
  },
});

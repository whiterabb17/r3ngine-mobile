import React from 'react';
import { StyleSheet, ScrollView } from 'react-native';
import { CheckCircle2, Shield, Settings, Info } from 'lucide-react-native';
import { Text, View } from '@/components/Themed';
import { Theme } from '../../constants/Theme';

interface ScanReviewProps {
  targetName: string;
  engineName: string;
  config: {
    importSubdomainTextArea: string;
    outOfScopeSubdomainTextarea: string;
    customDorkSwitch: boolean;
    spiderfoot_scan: boolean;
  };
}

export default function ScanReview({ targetName, engineName, config }: ScanReviewProps) {
  const hasAdvanced = config.importSubdomainTextArea || 
                      config.outOfScopeSubdomainTextarea || 
                      config.customDorkSwitch || 
                      config.spiderfoot_scan;

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Review Scan Request</Text>
      <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
        
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <CheckCircle2 size={18} color={Theme.colors.success} />
            <View style={styles.summaryText}>
              <Text style={styles.summaryLabel}>Target Asset</Text>
              <Text style={styles.summaryValue}>{targetName}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.summaryRow}>
            <Shield size={18} color={Theme.colors.primary} />
            <View style={styles.summaryText}>
              <Text style={styles.summaryLabel}>Selected Engine</Text>
              <Text style={styles.summaryValue}>{engineName || 'Not Selected'}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.subSectionTitle}>Configuration Details</Text>
        
        <View style={styles.detailsCard}>
          <View style={styles.detailItem}>
            <Settings size={14} color={Theme.colors.textMuted} />
            <Text style={styles.detailLabel}>Advanced Options:</Text>
            <Text style={[styles.detailValue, { color: hasAdvanced ? Theme.colors.warning : Theme.colors.textMuted }]}>
              {hasAdvanced ? 'Customized' : 'Default'}
            </Text>
          </View>

          {config.spiderfoot_scan && (
            <View style={styles.badgeRow}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>Spiderfoot OSINT</Text>
              </View>
            </View>
          )}

          {config.customDorkSwitch && (
            <View style={styles.badgeRow}>
              <View style={[styles.badge, { backgroundColor: Theme.colors.primary + '22' }]}>
                <Text style={[styles.badgeText, { color: Theme.colors.primary }]}>Custom Dorks Enabled</Text>
              </View>
            </View>
          )}

          {!hasAdvanced && (
            <View style={styles.emptyState}>
              <Info size={14} color={Theme.colors.textMuted} />
              <Text style={styles.emptyText}>Standard scan parameters will be applied.</Text>
            </View>
          )}
        </View>

        <View style={styles.warningBox}>
          <Text style={styles.warningText}>
            Note: Scan execution time depends on target size and engine complexity. You can monitor progress in the Tactical Feed after initiation.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scroll: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    color: Theme.colors.text,
    fontFamily: 'Bangers',
    letterSpacing: 1,
    marginBottom: 16,
  },
  subSectionTitle: {
    fontSize: 14,
    color: Theme.colors.textMuted,
    fontFamily: 'Bangers',
    letterSpacing: 0.5,
    marginBottom: 12,
    marginTop: 8,
  },
  summaryCard: {
    backgroundColor: Theme.colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: 'transparent',
  },
  summaryText: {
    backgroundColor: 'transparent',
  },
  summaryLabel: {
    fontSize: 11,
    color: Theme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '800',
    color: Theme.colors.text,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: Theme.colors.border,
    marginVertical: 16,
  },
  detailsCard: {
    backgroundColor: Theme.colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    marginBottom: 20,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'transparent',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 13,
    color: Theme.colors.textMuted,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
    backgroundColor: 'transparent',
  },
  badge: {
    backgroundColor: Theme.colors.warning + '22',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Theme.colors.warning,
  },
  emptyState: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'transparent',
    marginTop: 4,
  },
  emptyText: {
    fontSize: 12,
    color: Theme.colors.textMuted,
    fontStyle: 'italic',
  },
  warningBox: {
    backgroundColor: Theme.colors.surface,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderStyle: 'dashed',
  },
  warningText: {
    fontSize: 11,
    color: Theme.colors.textMuted,
    lineHeight: 16,
    textAlign: 'center',
  },
});

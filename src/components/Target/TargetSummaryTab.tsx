import React from 'react';
import { StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { ShieldAlert, Globe, Activity, ChevronRight, Target as TargetIcon } from 'lucide-react-native';
import { Text, View } from '@/components/Themed';
import { Theme } from '../../constants/Theme';
import GeoMap from '../Dashboard/GeoMap';

interface TargetSummaryTabProps {
  data: any;
}

export default function TargetSummaryTab({ data }: TargetSummaryTabProps) {
  if (!data) return null;

  const severityData = [
    { label: 'Critical', count: data.critical_count || 0, color: '#ff003c' },
    { label: 'High', count: data.high_count || 0, color: '#ff6b00' },
    { label: 'Medium', count: data.medium_count || 0, color: '#ffbc00' },
    { label: 'Low', count: data.low_count || 0, color: '#00ff62' },
    { label: 'Info', count: data.info_count || 0, color: '#00f3ff' },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Severity Breakdown */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <ShieldAlert size={18} color={Theme.colors.text} />
          <Text style={styles.sectionTitle}>Vulnerability Distribution</Text>
        </View>
        <View style={styles.severityContainer}>
          {severityData.map((sev, index) => (
            <View key={index} style={[styles.severityCard, { borderColor: sev.color + '33' }]}>
              <View style={[styles.severityIndicator, { backgroundColor: sev.color }]} />
              <Text style={styles.severityLabel}>{sev.label}</Text>
              <Text style={[styles.severityCount, { color: sev.color }]}>{sev.count}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Target Stats */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Globe size={20} color={Theme.colors.primary} />
          <Text style={styles.statValue}>{data.subdomain_count || 0}</Text>
          <Text style={styles.statLabel}>Subdomains</Text>
        </View>
        <View style={styles.statCard}>
          <Activity size={20} color={Theme.colors.info} />
          <Text style={styles.statValue}>{data.endpoint_count || 0}</Text>
          <Text style={styles.statLabel}>Endpoints</Text>
        </View>
      </View>

      {/* GeoMap */}
      {data.asset_countries && data.asset_countries.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Globe size={18} color={Theme.colors.text} />
            <Text style={styles.sectionTitle}>Asset Distribution</Text>
          </View>
          <GeoMap data={data.asset_countries} />
        </View>
      )}

      {/* Important Subdomains */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Globe size={18} color={Theme.colors.text} />
          <Text style={styles.sectionTitle}>Key Assets</Text>
        </View>
        <View style={styles.card}>
          {data.important_subdomains && data.important_subdomains.length > 0 ? (
            data.important_subdomains.map((sub: any, index: number) => (
              <View key={index} style={styles.assetRow}>
                <View style={styles.assetInfo}>
                  <Text style={styles.assetName} numberOfLines={1}>{sub.name}</Text>
                  <Text style={styles.assetTitle} numberOfLines={1}>{sub.page_title || 'No Title'}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: sub.http_status === 200 ? Theme.colors.success + '22' : Theme.colors.warning + '22' }]}>
                  <Text style={[styles.statusText, { color: sub.http_status === 200 ? Theme.colors.success : Theme.colors.warning }]}>{sub.http_status}</Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No key assets identified yet</Text>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  content: {
    padding: Theme.spacing.md,
    paddingBottom: 40,
  },
  section: {
    marginBottom: Theme.spacing.lg,
    backgroundColor: 'transparent',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    backgroundColor: 'transparent',
  },
  sectionTitle: {
    fontSize: 16,
    color: Theme.colors.textMuted,
    textTransform: 'uppercase',
    marginBottom: Theme.spacing.sm,
    fontFamily: 'Bangers',
    letterSpacing: 0.5,
  },
  severityContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    backgroundColor: 'transparent',
  },
  severityCard: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: Theme.colors.surface,
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  severityIndicator: {
    width: '100%',
    height: 2,
    borderRadius: 1,
    marginBottom: 8,
  },
  severityLabel: {
    fontSize: 10,
    color: Theme.colors.textMuted,
    textTransform: 'uppercase',
    fontWeight: 'bold',
    marginBottom: 2,
  },
  severityCount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: Theme.spacing.md,
    marginBottom: Theme.spacing.lg,
    backgroundColor: 'transparent',
  },
  statCard: {
    flex: 1,
    backgroundColor: Theme.colors.surface,
    borderRadius: 12,
    padding: Theme.spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Theme.colors.text,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: Theme.colors.textMuted,
    marginTop: 2,
  },
  card: {
    backgroundColor: Theme.colors.surface,
    borderRadius: 12,
    padding: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  assetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
    backgroundColor: 'transparent',
  },
  assetInfo: {
    flex: 1,
    marginRight: 10,
    backgroundColor: 'transparent',
  },
  assetName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Theme.colors.text,
  },
  assetTitle: {
    fontSize: 12,
    color: Theme.colors.textMuted,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  emptyText: {
    color: Theme.colors.textMuted,
    textAlign: 'center',
    fontStyle: 'italic',
    paddingVertical: 10,
  }
});

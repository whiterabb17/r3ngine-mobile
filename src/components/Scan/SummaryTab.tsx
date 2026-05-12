import React from 'react';
import { StyleSheet, useWindowDimensions, ScrollView } from 'react-native';
import { 
  Activity, 
  Globe, 
  ShieldAlert, 
  Layers, 
  Target, 
  Bug, 
  Key,
  Database,
  Cpu,
  Timer,
  Search,
  FileText
} from 'lucide-react-native';

import { Text, View } from '@/components/Themed';
import { Theme } from '../../constants/Theme';

interface SummaryTabProps {
  data: any;
}

export default function SummaryTab({ data }: SummaryTabProps) {
  const { width } = useWindowDimensions();
  const cardWidth = (width - Theme.spacing.md * 3) / 2;

  const KpiCard = ({ title, value, subtitle, color, icon: Icon }: any) => (
    <View style={[styles.kpiCard, { width: cardWidth }]}>
      <View style={styles.kpiHeader}>
        <View style={[styles.kpiIconBox, { backgroundColor: color + '15' }]}>
          <Icon size={14} color={color} />
        </View>
        <Text style={styles.kpiTitle}>{title}</Text>
      </View>
      <Text style={[styles.kpiValue, { color: color }]}>{value || 0}</Text>
      <Text style={styles.kpiSubtitle}>{subtitle}</Text>
    </View>
  );

  const InfoRow = ({ label, value, color = Theme.colors.text }: any) => (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, { color }]}>{value || 'N/A'}</Text>
    </View>
  );

  const severityCounts = [
    { label: 'CRITICAL', count: data.critical_count || 0, color: Theme.colors.vulnerabilities.critical },
    { label: 'HIGH', count: data.high_count || 0, color: Theme.colors.vulnerabilities.high },
    { label: 'MEDIUM', count: data.medium_count || 0, color: Theme.colors.vulnerabilities.medium },
    { label: 'LOW', count: data.low_count || 0, color: Theme.colors.vulnerabilities.low },
    { label: 'INFO', count: data.info_count || 0, color: Theme.colors.vulnerabilities.info },
  ];

  const totalVulns = data.vulnerability_count || 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* KPI Grid */}
      <View style={styles.grid}>
        <KpiCard 
          title="SUBDOMAINS" 
          value={data.subdomain_count} 
          subtitle={`${data.alive_count || 0} ACTIVE`} 
          color="#7000ff" 
          icon={Layers} 
        />
        <KpiCard 
          title="ENDPOINTS" 
          value={data.endpoint_count} 
          subtitle={`${data.endpoint_alive_count || 0} ALIVE`} 
          color="#ff00f7" 
          icon={Target} 
        />
        <KpiCard 
          title="VULNS" 
          value={data.vulnerability_count} 
          subtitle={`${data.critical_count || 0} CRITICAL`} 
          color="#ff003c" 
          icon={Bug} 
        />
        <KpiCard 
          title="LEAKS" 
          value={data.secret_leaks_count} 
          subtitle="SENSITIVE DATA" 
          color="#fffc00" 
          icon={Key} 
        />
      </View>

      {/* Target Information */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Search size={16} color={Theme.colors.primary} />
          <Text style={styles.sectionTitle}>TARGET INFORMATION</Text>
        </View>
        <View style={styles.sectionContent}>
          <InfoRow label="DOMAIN" value={data.target_info?.name} color={Theme.colors.error} />
          <InfoRow label="REGISTRAR" value={data.domain_info?.registrar?.name} color={Theme.colors.primary} />
          <InfoRow label="EXPIRES" value={data.domain_info?.expires?.split('T')[0]} />
          <InfoRow label="DNSSEC" value={data.domain_info?.dnssec} />
        </View>
      </View>

      {/* Severity Breakdown Chart */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <ShieldAlert size={16} color={Theme.colors.error} />
          <Text style={styles.sectionTitle}>SEVERITY BREAKDOWN</Text>
        </View>
        <View style={styles.chartContainer}>
          {severityCounts.map((item) => (
            <View key={item.label} style={styles.chartRow}>
              <View style={styles.chartLabelContainer}>
                <Text style={styles.chartLabel}>{item.label}</Text>
                <Text style={styles.chartValue}>{item.count}</Text>
              </View>
              <View style={styles.barBg}>
                <View 
                  style={[
                    styles.barFill, 
                    { 
                      width: totalVulns > 0 ? `${(item.count / totalVulns) * 100}%` : '0%',
                      backgroundColor: item.color 
                    }
                  ]} 
                />
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Additional Discovery Modules */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Layers size={16} color={Theme.colors.secondary} />
          <Text style={styles.sectionTitle}>ADDITIONAL FINDINGS</Text>
        </View>
        <View style={styles.sectionContent}>
          <InfoRow label="TOTAL ENDPOINTS" value={data.endpoint_count} />
          <InfoRow label="SECRET LEAKS" value={data.secret_leaks_count} color={data.secret_leaks_count > 0 ? Theme.colors.error : Theme.colors.text} />
          <InfoRow label="S3 BUCKETS" value={data.buckets_count} />
          <InfoRow label="OSINT RESULTS" value={data.osint_count} />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContent: {
    padding: Theme.spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Theme.spacing.md,
    backgroundColor: 'transparent',
    marginBottom: Theme.spacing.lg,
  },
  kpiCard: {
    backgroundColor: Theme.colors.surface,
    padding: Theme.spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  kpiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: 'transparent',
    gap: 8,
  },
  kpiIconBox: {
    padding: 6,
    borderRadius: 6,
  },
  kpiTitle: {
    fontSize: 12,
    color: Theme.colors.textMuted,
    letterSpacing: 0.5,
    fontFamily: 'Bangers',
  },
  kpiValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  kpiSubtitle: {
    fontSize: 10,
    color: Theme.colors.textMuted,
    marginTop: 4,
  },
  section: {
    backgroundColor: Theme.colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    marginBottom: Theme.spacing.lg,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
    gap: 8,
    backgroundColor: Theme.colors.surface,
  },
  sectionTitle: {
    fontSize: 16,
    letterSpacing: 1,
    color: Theme.colors.text,
    fontFamily: 'Bangers',
  },
  sectionContent: {
    padding: Theme.spacing.md,
    backgroundColor: 'transparent',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border + '33',
    backgroundColor: 'transparent',
  },
  infoLabel: {
    fontSize: 11,
    color: Theme.colors.textMuted,
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 11,
    fontWeight: '700',
  },
  chartContainer: {
    padding: Theme.spacing.md,
    backgroundColor: 'transparent',
  },
  chartRow: {
    marginBottom: 12,
    backgroundColor: 'transparent',
  },
  chartLabelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
    backgroundColor: 'transparent',
  },
  chartLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: Theme.colors.textMuted,
  },
  chartValue: {
    fontSize: 10,
    fontWeight: '800',
    color: Theme.colors.text,
  },
  barBg: {
    height: 6,
    backgroundColor: Theme.colors.border + '33',
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  }
});

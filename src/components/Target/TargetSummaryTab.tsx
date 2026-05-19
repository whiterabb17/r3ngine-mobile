import React, { useState } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { 
  ShieldAlert, 
  Globe, 
  Activity, 
  ChevronRight, 
  ChevronDown, 
  ChevronUp, 
  Target as TargetIcon,
  Layers,
  Cpu,
  Server,
  Clock,
  Link as LinkIcon,
  Database,
  Info,
  Calendar,
  AlertTriangle
} from 'lucide-react-native';
import { Text, View } from '@/components/Themed';
import { Theme } from '../../constants/Theme';
import GeoMap from '../Dashboard/GeoMap';

interface TargetSummaryTabProps {
  data: any;
}

interface CollapsibleCardProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultExpanded?: boolean;
}

const CollapsibleCard = ({ title, icon, children, defaultExpanded = false }: CollapsibleCardProps) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  return (
    <View style={styles.cardContainer}>
      <TouchableOpacity 
        style={styles.cardHeader} 
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeaderTitle}>
          {icon}
          <Text style={styles.cardTitle}>{title}</Text>
        </View>
        {expanded ? (
          <ChevronUp size={16} color={Theme.colors.textMuted} />
        ) : (
          <ChevronDown size={16} color={Theme.colors.textMuted} />
        )}
      </TouchableOpacity>
      {expanded && (
        <View style={styles.cardContent}>
          {children}
        </View>
      )}
    </View>
  );
};

const getSeverityStyle = (severity: number) => {
  switch (severity) {
    case 4: return { label: 'CRITICAL', color: '#ff003c' };
    case 3: return { label: 'HIGH', color: '#ff6b00' };
    case 2: return { label: 'MEDIUM', color: '#ffbc00' };
    case 1: return { label: 'LOW', color: '#00ff62' };
    default: return { label: 'INFO', color: '#00f3ff' };
  }
};

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
      {/* 4 KPIs grid at the top */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Activity size={18} color="#00f3ff" />
          <Text style={styles.statValue}>{data.scan_count || 0}</Text>
          <Text style={styles.statLabel}>Total Scans</Text>
        </View>
        <View style={styles.statCard}>
          <Globe size={18} color="#7000ff" />
          <Text style={styles.statValue}>{data.subdomain_count || 0}</Text>
          <Text style={styles.statLabel}>Subdomains</Text>
        </View>
        <View style={styles.statCard}>
          <Layers size={18} color="#ff00f7" />
          <Text style={styles.statValue}>{data.endpoint_count || 0}</Text>
          <Text style={styles.statLabel}>Endpoints</Text>
        </View>
        <View style={styles.statCard}>
          <ShieldAlert size={18} color="#ff003c" />
          <Text style={styles.statValue}>{data.vulnerability_count || 0}</Text>
          <Text style={styles.statLabel}>Vulnerabilities</Text>
        </View>
      </View>

      {/* Vulnerability Distribution */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <ShieldAlert size={16} color={Theme.colors.text} />
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

      {/* Accordion 1: Target Information */}
      <CollapsibleCard 
        title="Target Information" 
        icon={<Info size={16} color={Theme.colors.primary} />}
        defaultExpanded={true}
      >
        <View style={styles.infoGrid}>
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>DOMAIN</Text>
            <Text style={[styles.infoValue, { color: Theme.colors.error }]}>{data.target_info?.name || 'N/A'}</Text>
          </View>
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>DNSSEC</Text>
            <Text style={styles.infoValue}>{data.domain_info?.dnssec || 'N/A'}</Text>
          </View>
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>GEOLOCATION</Text>
            <Text style={styles.infoValue}>{data.domain_info?.geolocation_iso || 'N/A'}</Text>
          </View>
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>CREATED</Text>
            <Text style={styles.infoValue}>{data.domain_info?.created?.split('T')[0] || 'N/A'}</Text>
          </View>
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>UPDATED</Text>
            <Text style={styles.infoValue}>{data.domain_info?.updated?.split('T')[0] || 'N/A'}</Text>
          </View>
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>EXPIRES</Text>
            <Text style={styles.infoValue}>{data.domain_info?.expires?.split('T')[0] || 'N/A'}</Text>
          </View>
          <View style={[styles.infoCol, { width: '100%' }]}>
            <Text style={styles.infoLabel}>REGISTRAR</Text>
            <Text style={[styles.infoValue, { color: Theme.colors.primary }]}>{data.domain_info?.registrar?.name || 'N/A'}</Text>
          </View>
        </View>

        {/* DNS Records */}
        {data.domain_info?.dns_records && data.domain_info.dns_records.length > 0 && (
          <View style={styles.dnsSection}>
            <Text style={styles.subTitle}>DNS RECORDS</Text>
            {data.domain_info.dns_records.map((r: any, idx: number) => (
              <View key={idx} style={styles.dnsRow}>
                <View style={styles.dnsBadge}>
                  <Text style={styles.dnsBadgeText}>{r.type.toUpperCase()}</Text>
                </View>
                <Text style={styles.dnsValue}>{r.value || r.name}</Text>
              </View>
            ))}
          </View>
        )}
      </CollapsibleCard>

      {/* Accordion 2: Vulnerability Highlights */}
      {data.vulnerability_highlights && data.vulnerability_highlights.length > 0 && (
        <CollapsibleCard 
          title="Vulnerability Highlights" 
          icon={<ShieldAlert size={16} color={Theme.colors.error} />}
        >
          {data.vulnerability_highlights.map((v: any, idx: number) => {
            const style = getSeverityStyle(v.severity);
            return (
              <View key={idx} style={styles.vulnRow}>
                <View style={styles.vulnHeader}>
                  <Text style={styles.vulnName} numberOfLines={1}>{v.name}</Text>
                  <View style={[styles.sevBadge, { backgroundColor: style.color + '15', borderColor: style.color + '33' }]}>
                    <Text style={[styles.sevBadgeText, { color: style.color }]}>{style.label}</Text>
                  </View>
                </View>
                <View style={styles.vulnMeta}>
                  <Clock size={12} color={Theme.colors.textMuted} />
                  <Text style={styles.vulnDate}>{v.discovered_date}</Text>
                </View>
              </View>
            );
          })}
        </CollapsibleCard>
      )}

      {/* Accordion 3: Scan Timeline & Sub Scans */}
      <CollapsibleCard 
        title="Scan Timeline & Sub Scans" 
        icon={<Activity size={16} color={Theme.colors.info} />}
      >
        {/* Recent Scans */}
        {data.recent_scans && data.recent_scans.length > 0 && (
          <View style={{ marginBottom: 15 }}>
            <Text style={styles.subTitle}>RECENT SCANS</Text>
            {data.recent_scans.map((scan: any) => (
              <View key={scan.id} style={styles.timelineRow}>
                <View style={styles.timelineIndicator} />
                <View style={styles.timelineContent}>
                  <View style={styles.timelineHeader}>
                    <Text style={styles.timelineEngine}>{scan.engine_name}</Text>
                    <View style={[styles.statusBadge, { 
                      backgroundColor: scan.scan_status === 2 ? Theme.colors.success + '22' : Theme.colors.primary + '22'
                    }]}>
                      <Text style={[styles.statusText, { 
                        color: scan.scan_status === 2 ? Theme.colors.success : Theme.colors.primary
                      }]}>
                        {scan.scan_status === 2 ? 'Completed' : 'Scanning'}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.timelineTime}>{scan.completed_ago}</Text>
                  <Text style={styles.timelineStats}>{scan.subdomain_count} Subdomains Discovered</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Sub Scans */}
        {data.subscans && data.subscans.length > 0 && (
          <View>
            <Text style={styles.subTitle}>SUB SCANS ({data.subscans.length})</Text>
            {data.subscans.slice(0, 5).map((scan: any) => (
              <View key={scan.id} style={styles.subscanRow}>
                <View style={styles.subscanHeader}>
                  <Text style={styles.subscanEngine}>{(scan.engine || scan.type || 'SCAN').replace(/_/g, ' ')}</Text>
                  <View style={[styles.statusBadge, { 
                    backgroundColor: Theme.colors.success + '22',
                    borderColor: Theme.colors.success + '44'
                  }]}>
                    <Text style={[styles.statusText, { color: Theme.colors.success }]}>Success</Text>
                  </View>
                </View>
                <Text style={styles.subscanTarget} numberOfLines={1}>
                  {(scan.subdomain_name || data.target_info?.name || '').toUpperCase()}
                </Text>
                <View style={styles.subscanMeta}>
                  <Clock size={12} color={Theme.colors.textMuted} />
                  <Text style={styles.subscanTime}>Completed {scan.completed_ago}</Text>
                  <Text style={styles.subscanDuration}>• Took {scan.time_taken || '0m'}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </CollapsibleCard>

      {/* Accordion 4: Ports & Active Technologies */}
      <CollapsibleCard 
        title="Ports & Active Technologies" 
        icon={<Cpu size={16} color="#fffc00" />}
      >
        {/* Ports */}
        <Text style={styles.subTitle}>DISCOVERED PORTS</Text>
        <View style={styles.chipContainer}>
          {data.discovered_ports && data.discovered_ports.length > 0 ? (
            data.discovered_ports.map((p: any, idx: number) => (
              <View key={idx} style={[styles.chip, { backgroundColor: '#7000ff15', borderColor: '#7000ff33' }]}>
                <Server size={12} color="#7000ff" />
                <Text style={[styles.chipText, { color: '#b580ff' }]}>{p.number}/{p.service_name}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No open ports identified</Text>
          )}
        </View>

        {/* Technologies */}
        <Text style={[styles.subTitle, { marginTop: 15 }]}>TECHNOLOGIES</Text>
        <View style={styles.chipContainer}>
          {data.discovered_technologies && data.discovered_technologies.length > 0 ? (
            data.discovered_technologies.map((t: any, idx: number) => (
              <View key={idx} style={[styles.chip, { backgroundColor: '#fffc0015', borderColor: '#fffc0033' }]}>
                <Cpu size={12} color="#fffc00" />
                <Text style={[styles.chipText, { color: '#fffc00' }]}>{t.name}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No active technologies identified</Text>
          )}
        </View>
      </CollapsibleCard>

      {/* Accordion 5: Related Domains & Scope */}
      <CollapsibleCard 
        title="Related Domains & Scope" 
        icon={<Globe size={16} color={Theme.colors.primary} />}
      >
        {/* Scope IPs */}
        {data.target_info?.in_scope_ips && data.target_info.in_scope_ips.length > 0 && (
          <View style={{ marginBottom: 15 }}>
            <Text style={styles.subTitle}>IN-SCOPE IP RANGES</Text>
            <View style={styles.chipContainer}>
              {data.target_info.in_scope_ips.map((ip: string, idx: number) => (
                <View key={idx} style={[styles.chip, { backgroundColor: Theme.colors.primary + '15', borderColor: Theme.colors.primary + '33' }]}>
                  <Database size={12} color={Theme.colors.primary} />
                  <Text style={[styles.chipText, { color: Theme.colors.primary }]}>{ip}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Historical IPs */}
        {data.domain_info?.historical_ips && data.domain_info.historical_ips.length > 0 && (
          <View style={{ marginBottom: 15 }}>
            <Text style={styles.subTitle}>HISTORICAL RESOLVED IPS</Text>
            <View style={styles.chipContainer}>
              {data.domain_info.historical_ips.map((ip: any, idx: number) => (
                <View key={idx} style={styles.chip}>
                  <Database size={12} color={Theme.colors.textMuted} />
                  <Text style={styles.chipText}>{ip.ip}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Related Domains */}
        <Text style={styles.subTitle}>RELATED DOMAINS</Text>
        <View style={styles.chipContainer}>
          {data.related_domains && data.related_domains.length > 0 ? (
            data.related_domains.map((d: string, idx: number) => (
              <View key={idx} style={[styles.chip, { backgroundColor: 'transparent', borderColor: Theme.colors.border }]}>
                <LinkIcon size={12} color={Theme.colors.textMuted} />
                <Text style={styles.chipText}>{d}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No related domains identified</Text>
          )}
        </View>
      </CollapsibleCard>

      {/* GeoMap */}
      {data.asset_countries && data.asset_countries.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Globe size={16} color={Theme.colors.text} />
            <Text style={styles.sectionTitle}>Asset Distribution</Text>
          </View>
          <GeoMap data={data.asset_countries} />
        </View>
      )}

      {/* Important Subdomains */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Globe size={16} color={Theme.colors.text} />
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
    fontSize: 14,
    color: Theme.colors.textMuted,
    textTransform: 'uppercase',
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
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: Theme.spacing.lg,
    backgroundColor: 'transparent',
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
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
    fontSize: 11,
    color: Theme.colors.textMuted,
    marginTop: 2,
    fontFamily: 'Bangers',
    letterSpacing: 0.5,
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
    fontSize: 12,
  },
  cardContainer: {
    backgroundColor: Theme.colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    marginBottom: Theme.spacing.md,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Theme.spacing.md,
    backgroundColor: Theme.colors.surface,
  },
  cardHeaderTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'transparent',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Theme.colors.text,
    fontFamily: 'Bangers',
    letterSpacing: 0.5,
  },
  cardContent: {
    padding: Theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
    backgroundColor: 'transparent',
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    backgroundColor: 'transparent',
  },
  infoCol: {
    width: '47%',
    backgroundColor: 'transparent',
  },
  infoLabel: {
    fontSize: 10,
    color: Theme.colors.textMuted,
    fontWeight: 'bold',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 13,
    color: Theme.colors.text,
    fontWeight: '600',
  },
  dnsSection: {
    marginTop: 15,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
    paddingTop: 15,
    backgroundColor: 'transparent',
  },
  subTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: Theme.colors.textMuted,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  dnsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
    backgroundColor: 'transparent',
  },
  dnsBadge: {
    backgroundColor: Theme.colors.primary + '15',
    borderColor: Theme.colors.primary + '33',
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  dnsBadgeText: {
    color: Theme.colors.primary,
    fontSize: 10,
    fontWeight: 'bold',
  },
  dnsValue: {
    fontSize: 12,
    color: Theme.colors.text,
    flex: 1,
  },
  vulnRow: {
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
    paddingVertical: 10,
    backgroundColor: 'transparent',
  },
  vulnHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'transparent',
    gap: 10,
  },
  vulnName: {
    fontSize: 13,
    fontWeight: '600',
    color: Theme.colors.text,
    flex: 1,
  },
  sevBadge: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  sevBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  vulnMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
    backgroundColor: 'transparent',
  },
  vulnDate: {
    fontSize: 11,
    color: Theme.colors.textMuted,
  },
  timelineRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
    backgroundColor: 'transparent',
  },
  timelineIndicator: {
    width: 2,
    backgroundColor: Theme.colors.border,
    borderRadius: 1,
    marginVertical: 4,
  },
  timelineContent: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  timelineEngine: {
    fontSize: 13,
    fontWeight: 'bold',
    color: Theme.colors.text,
  },
  timelineTime: {
    fontSize: 11,
    color: Theme.colors.textMuted,
    marginTop: 2,
  },
  timelineStats: {
    fontSize: 12,
    color: Theme.colors.primary,
    fontWeight: '600',
    marginTop: 4,
  },
  subscanRow: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  subscanHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  subscanEngine: {
    fontSize: 12,
    fontWeight: 'bold',
    color: Theme.colors.text,
  },
  subscanTarget: {
    fontSize: 11,
    color: Theme.colors.info,
    fontWeight: '500',
    marginTop: 2,
  },
  subscanMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
    backgroundColor: 'transparent',
  },
  subscanTime: {
    fontSize: 11,
    color: Theme.colors.textMuted,
  },
  subscanDuration: {
    fontSize: 11,
    color: Theme.colors.textMuted,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    backgroundColor: 'transparent',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  chipText: {
    fontSize: 11,
    color: Theme.colors.text,
    fontWeight: '500',
  }
});

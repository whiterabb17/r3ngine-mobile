import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, ScrollView, RefreshControl, TouchableOpacity, useWindowDimensions, Modal } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import {
  Target,
  ShieldAlert,
  Globe,
  Zap,
  ChevronDown,
  Activity,
  AlertTriangle,
  LayoutGrid,
  Biohazard,
  ChevronRight,
  Key,
  Code,
  StickyNote,
  Camera,
  Bell,
} from 'lucide-react-native';

import { Text, View } from '@/components/Themed';
import { Theme } from '../../src/constants/Theme';
import apiClient from '../../src/api/client';
import { useProjectStore } from '../../src/store/useProjectStore';
import GeoMap from '../../src/components/Dashboard/GeoMap';
import { getUnreadCount } from '../../src/api/notifications';

interface Kpis {
  domain_count: number;
  subdomain_count: number;
  endpoint_count: number;
  vulnerability_count: number;
  critical_count: number;
  high_count: number;
  medium_count: number;
  low_count: number;
  info_count: number;
  secret_leak_count?: number;
}

interface Vulnerability {
  id: number;
  name: string;
  severity: number;
  discovered_date: string;
}

interface Project {
  name: string;
  slug: string;
}

interface Technology {
  name: string;
  count: number;
}

interface VulnerableTarget {
  name: string;
  vuln_count: number;
  critical_count: number;
  high_count: number;
  medium_count: number;
  low_count: number;
}

interface Trends {
  vulns_in_last_week: number[];
  last_7_dates: string[];
}

export default function DashboardScreen() {
  const [projects, setProjects] = useState<Project[]>([]);
  const router = useRouter();
  const { currentProject, setCurrentProject } = useProjectStore();
  const [kpis, setKpis] = useState<Kpis | null>(null);
  const [vulnerabilities, setVulnerabilities] = useState<Vulnerability[]>([]);
  const [technologies, setTechnologies] = useState<Technology[]>([]);
  const [topVulnerableTargets, setTopVulnerableTargets] = useState<VulnerableTarget[]>([]);
  const [trends, setTrends] = useState<Trends | null>(null);
  const [assetCountries, setAssetCountries] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { width } = useWindowDimensions();

  const fetchDashboard = useCallback(async (slug: string) => {
    try {
      setError(null);
      const response = await apiClient.get(`dashboard/${slug}/`);
      setKpis(response.data.kpis);
      setVulnerabilities(response.data.vulnerability_feed || []);
      setTechnologies(response.data.most_used_tech || []);
      setTopVulnerableTargets(response.data.most_vulnerable_targets || []);
      setTrends(response.data.trends || null);
      setAssetCountries(response.data.asset_countries || []);
    } catch (err: any) {
      console.error('Error fetching dashboard:', err);
      setError(`Dashboard Error: ${err.message}`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const fetchProjects = useCallback(async () => {
    try {
      setError(null);
      const response = await apiClient.get('projects/');
      const projectList = (response.data && Array.isArray(response.data))
        ? response.data
        : (response.data?.results || []);

      setProjects(projectList);
      if (projectList.length > 0 && !currentProject) {
        setCurrentProject(projectList[0].slug);
        fetchDashboard(projectList[0].slug);
      } else if (currentProject) {
        fetchDashboard(currentProject);
      } else {
        setLoading(false);
      }
    } catch (err: any) {
      console.error('Error fetching projects:', err);
      setError(`Projects Error: ${err.message}`);
      setLoading(false);
    }
  }, [currentProject, fetchDashboard]);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const count = await getUnreadCount(currentProject || undefined);
      setUnreadCount(count);
    } catch (err) {
      console.error('Error fetching unread count:', err);
    }
  }, [currentProject]);

  useEffect(() => {
    fetchProjects();
    fetchUnreadCount();
    
    // Poll for notifications every 60 seconds
    const interval = setInterval(fetchUnreadCount, 60000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProjects();
    fetchUnreadCount();
  };

  const handleProjectSelect = (slug: string) => {
    setCurrentProject(slug);
    setShowProjectModal(false);
    setLoading(true);
    fetchDashboard(slug);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? 'N/A' : date.toLocaleDateString();
  };

  const getSeverityColor = (severity: number) => {
    switch (severity) {
      case 4: return '#ff003c'; // Critical
      case 3: return '#ff6b00'; // High
      case 2: return '#ffcc00'; // Medium
      case 1: return '#00d1ff'; // Low
      default: return '#888';
    }
  };

  const formatRelativeTime = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'N/A';

    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'just now';
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;

    return date.toLocaleDateString();
  };

  const KpiCard = ({ icon: Icon, title, value, color }: any) => (
    <View style={[styles.kpiCard, { width: (width - Theme.spacing.md * 3) / 2 }]}>
      <View style={styles.kpiHeader}>
        <Icon size={20} color={color} />
        <Text style={styles.kpiTitle}>{title}</Text>
      </View>
      <Text style={styles.kpiValue}>{value}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen options={{
        headerTitle: () => (
          <Text style={styles.headerTitleText}>R3NGINE</Text>
        ),
        headerRight: () => (
          <View style={styles.headerRightContainer}>
            <TouchableOpacity
              style={styles.notificationIcon}
              onPress={() => router.push('/notifications' as any)}
            >
              <Bell size={22} color="#fff" />
              {unreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.projectPicker}
              activeOpacity={0.7}
              onPress={() => setShowProjectModal(true)}
            >
              <Text style={styles.projectPickerText} numberOfLines={1}>
                {projects.find(p => p.slug === currentProject)?.name || 'Select Project'}
              </Text>
              <ChevronDown size={14} color={Theme.colors.textMuted} />
            </TouchableOpacity>
          </View>
        )
      }} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Theme.colors.primary} />}
      >
        {error && (
          <View style={styles.errorAlert}>
            <AlertTriangle size={18} color={Theme.colors.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
        {/* KPI Grid */}
        <View style={styles.grid}>
          <KpiCard icon={Target} title="Targets" value={kpis?.domain_count || 0} color={Theme.colors.primary} />
          <KpiCard icon={Globe} title="Subdomains" value={kpis?.subdomain_count || 0} color={Theme.colors.secondary} />
          <KpiCard icon={Zap} title="Endpoints" value={kpis?.endpoint_count || 0} color={Theme.colors.info} />
          <KpiCard icon={ShieldAlert} title="Vulnerabilities" value={kpis?.vulnerability_count || 0} color={Theme.colors.error} />
        </View>
        {/* Severity Distribution */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ShieldAlert size={18} color={Theme.colors.text} />
            <Text style={styles.sectionTitle}>Severity Distribution</Text>
          </View>
          <View style={styles.severityGrid}>
            {[4, 3, 2, 1].map((sev) => {
              const count = kpis ? (
                sev === 4 ? kpis.critical_count :
                  sev === 3 ? kpis.high_count :
                    sev === 2 ? kpis.medium_count :
                      kpis.low_count
              ) : 0;
              const color = getSeverityColor(sev);
              const label = sev === 4 ? 'Crit' : sev === 3 ? 'High' : sev === 2 ? 'Med' : 'Low';

              return (
                <View key={sev} style={[styles.severityMiniCard, { borderColor: color + '44' }]}>
                  <View style={[styles.severityCardIndicator, { backgroundColor: color }]} />
                  <Text style={styles.severityMiniLabel}>{label}</Text>
                  <Text style={[styles.severityMiniCount, { color: color }]}>{count}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* 7-Day Activity Horizon */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Activity size={18} color={Theme.colors.text} />
            <Text style={styles.sectionTitle}>7-Day Activity Horizon</Text>
          </View>
          <View style={styles.card}>
            {trends ? (
              <View style={[styles.trendChartContainer, { marginTop: 10, marginBottom: 10 }]}>
                <View style={styles.trendBarsRow}>
                  {trends.vulns_in_last_week.map((val, i) => {
                    const maxVal = Math.max(...trends.vulns_in_last_week, 1);
                    const barHeight = (val / maxVal) * 100;
                    return (
                      <View key={i} style={styles.trendBarWrapper}>
                        <View style={[styles.trendBar, { height: `${Math.max(barHeight, 5)}%` }]} />
                        <Text style={styles.trendBarLabel}>{new Date(trends.last_7_dates[i]).getDate()}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            ) : (
              <Text style={styles.emptyText}>No activity data available</Text>
            )}
          </View>
        </View>

        {/* GeoMap Section */}
        {assetCountries && assetCountries.length > 0 && (
          <GeoMap data={assetCountries} />
        )}

        {/* Tactical Intelligence Shortcuts */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Tactical Intelligence</Text>
        </View>
        <View style={styles.intelligenceGrid}>
          <TouchableOpacity 
            style={styles.intelCard}
            onPress={() => router.push('/feeds/assets' as any)}
          >
            <View style={[styles.intelIconBox, { backgroundColor: Theme.colors.primary + '22' }]}>
              <Globe size={20} color={Theme.colors.primary} />
            </View>
            <Text style={styles.intelLabel}>Global Assets</Text>
            <Text style={styles.intelCount}>{kpis?.subdomain_count || 0}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.intelCard}
            onPress={() => router.push('/feeds/vulnerabilities' as any)}
          >
            <View style={[styles.intelIconBox, { backgroundColor: Theme.colors.error + '22' }]}>
              <ShieldAlert size={20} color={Theme.colors.error} />
            </View>
            <Text style={styles.intelLabel}>Threat Feed</Text>
            <Text style={[styles.intelCount, { color: Theme.colors.error }]}>
              {(kpis?.critical_count || 0) + (kpis?.high_count || 0)}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.intelCard}
            onPress={() => router.push('/feeds/endpoints' as any)}
          >
            <View style={[styles.intelIconBox, { backgroundColor: Theme.colors.info + '22' }]}>
              <LayoutGrid size={20} color={Theme.colors.info} />
            </View>
            <Text style={styles.intelLabel}>Endpoints</Text>
            <Text style={[styles.intelCount, { color: Theme.colors.info }]}>{kpis?.endpoint_count || 0}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.intelligenceGrid}>
          <TouchableOpacity 
            style={styles.intelCard}
            onPress={() => router.push('/intelligence/secrets' as any)}
          >
            <View style={[styles.intelIconBox, { backgroundColor: Theme.colors.warning + '22' }]}>
              <Key size={20} color={Theme.colors.warning} />
            </View>
            <Text style={styles.intelLabel}>Secret Leaks</Text>
            <Text style={[styles.intelCount, { color: Theme.colors.warning }]}>{kpis?.secret_leak_count || 0}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.intelCard}
            onPress={() => router.push('/intelligence/notes' as any)}
          >
             <View style={[styles.intelIconBox, { backgroundColor: Theme.colors.success + '22' }]}>
                <StickyNote size={20} color={Theme.colors.success} />
             </View>
             <Text style={styles.intelLabel}>Notes</Text>
             <Text style={[styles.intelCount, { color: Theme.colors.success }]}>RECON</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.intelCard}
            onPress={() => router.push('/intelligence/attack-paths' as any)}
          >
             <View style={styles.intelIconBox}>
                <Code size={20} color={Theme.colors.primary} />
             </View>
             <Text style={styles.intelLabel}>Analysis</Text>
             <Text style={styles.intelCount}>APME</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.intelligenceGrid}>
          <TouchableOpacity 
            style={styles.intelCard}
            onPress={() => router.push('/feeds/visual' as any)}
          >
            <View style={[styles.intelIconBox, { backgroundColor: Theme.colors.info + '22' }]}>
              <Camera size={20} color={Theme.colors.info} />
            </View>
            <Text style={styles.intelLabel}>Visual Recon</Text>
            <Text style={[styles.intelCount, { color: Theme.colors.info }]}>FEED</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.intelCard}
            onPress={() => router.push('/intelligence/staging' as any)}
          >
            <View style={[styles.intelIconBox, { backgroundColor: Theme.colors.primary + '22' }]}>
              <Inbox size={20} color={Theme.colors.primary} />
            </View>
            <Text style={styles.intelLabel}>OSINT Staging</Text>
            <Text style={[styles.intelCount, { color: Theme.colors.primary }]}>REVIEW</Text>
          </TouchableOpacity>

          <View style={{ flex: 1, backgroundColor: 'transparent' }} />
        </View>

        {/* Most Vulnerable Targets */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Target size={18} color={Theme.colors.text} />
            <Text style={styles.sectionTitle}>Most Vulnerable Targets</Text>
          </View>
          <View style={styles.card}>
            {topVulnerableTargets.length > 0 ? topVulnerableTargets.map((target, index) => (
              <View key={index} style={styles.targetRow}>
                <View style={styles.targetMainInfo}>
                  <Text style={styles.targetName} numberOfLines={1}>{target.name}</Text>
                  <View style={styles.targetSeverityCounts}>
                    {target.critical_count > 0 && <View style={[styles.miniBadge, { backgroundColor: '#ff003c' }]}><Text style={styles.miniBadgeText}>{target.critical_count}</Text></View>}
                    {target.high_count > 0 && <View style={[styles.miniBadge, { backgroundColor: '#ff6b00' }]}><Text style={styles.miniBadgeText}>{target.high_count}</Text></View>}
                    <Text style={styles.totalVulnLabel}>{target.vuln_count} Total</Text>
                  </View>
                </View>
              </View>
            )) : (
              <Text style={styles.emptyText}>No vulnerable targets found</Text>
            )}
          </View>
        </View>

        {/* Most Used Technologies */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <LayoutGrid size={18} color={Theme.colors.text} />
            <Text style={styles.sectionTitle}>Top Technologies</Text>
          </View>
          <View style={[styles.card]}>
            {technologies.length > 0 ? technologies.map((tech, index) => (
              <View key={index} style={styles.techRow}>
                <Text style={styles.techName}>{tech.name}</Text>
                <View style={styles.techBarContainer}>
                  <View style={[styles.techBarFill, { marginLeft: -20, width: `${Math.min((tech.count / (technologies[0]?.count || 1)) * 100, 100)}%` }]} />
                  <Text style={styles.techCount}>{tech.count}</Text>
                </View>
              </View>
            )) : (
              <Text style={styles.emptyText}>No technologies detected</Text>
            )}
          </View>
        </View>

        {/* Recent Vulnerabilities */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Biohazard size={18} color={Theme.colors.text} />
            <Text style={styles.sectionTitle}>Recent Vulnerabilities</Text>
          </View>
          <View style={styles.card}>
            {vulnerabilities.length > 0 ? vulnerabilities.map((vuln) => (
              <TouchableOpacity key={vuln.id} style={styles.vulnRow} activeOpacity={0.7}>
                <View style={[styles.vulnIconContainer, { backgroundColor: getSeverityColor(vuln.severity) + '15' }]}>
                  <Biohazard size={18} color={getSeverityColor(vuln.severity)} />
                </View>
                <View style={styles.vulnInfo}>
                  <Text style={styles.vulnName} numberOfLines={1}>{vuln.name}</Text>
                  <Text style={styles.vulnDate}>{formatRelativeTime(vuln.discovered_date)}</Text>
                </View>
                <ChevronRight size={16} color={Theme.colors.textMuted} />
              </TouchableOpacity>
            )) : (
              <Text style={styles.emptyText}>No recent vulnerabilities found</Text>
            )}
          </View>
        </View>

        {__DEV__ && (
          <View style={[styles.card, { marginTop: 20, borderColor: Theme.colors.warning }]}>
            <Text style={{ color: Theme.colors.warning, fontWeight: 'bold', marginBottom: 5 }}>DEBUG INFO</Text>
            <Text style={{ color: '#fff', fontSize: 10 }}>Project Count: {projects.length}</Text>
            <Text style={{ color: '#fff', fontSize: 10 }}>Current Project: {currentProject || 'None'}</Text>
            <Text style={{ color: '#fff', fontSize: 10 }}>Loading: {loading ? 'YES' : 'NO'}</Text>
          </View>
        )}
      </ScrollView>

      {/* Project Selection Modal */}
      <Modal
        visible={showProjectModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowProjectModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowProjectModal(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Switch Project</Text>
            {projects.map((project) => (
              <TouchableOpacity
                key={project.slug}
                style={[
                  styles.projectItem,
                  currentProject === project.slug && styles.projectItemActive
                ]}
                onPress={() => handleProjectSelect(project.slug)}
              >
                <Text style={[
                  styles.projectItemText,
                  currentProject === project.slug && styles.projectItemTextActive
                ]}>
                  {project.name}
                </Text>
                {currentProject === project.slug && (
                  <View style={styles.activeDot} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Quick Scan FAB */}
      <TouchableOpacity style={styles.fab} activeOpacity={0.8}>
        <Zap size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  scrollContent: {
    padding: Theme.spacing.md,
  },
  headerTitleText: {
    fontWeight: '400',
    fontFamily: "Bangers",
    letterSpacing: 2,
    color: "rgba(215, 98, 30, 1)",
    fontSize: 24,
    textTransform: 'uppercase'
  },
  headerRightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: Theme.spacing.md,
  },
  notificationIcon: {
    marginRight: 16,
    position: 'relative',
    padding: 4,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: Theme.colors.error,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#0f172a',
  },
  badgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: 'bold',
  },
  projectPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    marginRight: 10,
    maxWidth: 150,
  },
  projectPickerText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: Theme.colors.text,
    marginRight: 6,
  },
  errorAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.error + '22',
    padding: Theme.spacing.md,
    borderRadius: Theme.borderRadius.md,
    marginBottom: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Theme.colors.error + '44',
  },
  errorText: {
    color: Theme.colors.error,
    fontSize: 12,
    marginLeft: Theme.spacing.sm,
    flex: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: Theme.spacing.lg,
    backgroundColor: 'transparent',
  },
  kpiCard: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.md,
    marginBottom: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  kpiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Theme.spacing.xs,
    backgroundColor: 'transparent',
  },
  kpiTitle: {
    fontSize: 14,
    color: Theme.colors.textMuted,
    marginLeft: 6,
    fontFamily: 'Bangers',
    letterSpacing: 0.5,
  },
  kpiValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Theme.colors.text,
  },
  section: {
    marginBottom: Theme.spacing.xl,
    backgroundColor: 'transparent',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Theme.spacing.md,
    backgroundColor: 'transparent',
  },
  sectionTitle: {
    fontSize: 20,
    color: Theme.colors.text,
    marginLeft: 8,
    fontFamily: 'Bangers',
    letterSpacing: 1,
  },
  severityGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
  },
  severityMiniCard: {
    flex: 1,
    backgroundColor: Theme.colors.surface,
    borderRadius: 12,
    padding: 10,
    marginHorizontal: 4,
    borderWidth: 1,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  severityCardIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  severityMiniLabel: {
    fontSize: 9,
    fontWeight: '900',
    color: Theme.colors.textMuted,
    textTransform: 'uppercase',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  severityMiniCount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    padding: Theme.spacing.xs,
  },
  vulnIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  vulnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border + '33',
    backgroundColor: 'transparent',
  },
  severityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  vulnInfo: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  vulnName: {
    fontSize: 14,
    color: Theme.colors.text,
    marginBottom: 2,
  },
  vulnDate: {
    fontSize: 11,
    color: Theme.colors.textMuted,
  },
  emptyText: {
    textAlign: 'center',
    color: Theme.colors.textMuted,
    padding: Theme.spacing.lg,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  trendChartContainer: {
    height: 120,
    paddingTop: Theme.spacing.md,
    backgroundColor: 'transparent',
  },
  trendBarsRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: Theme.spacing.xs,
    backgroundColor: 'transparent',
  },
  trendBarWrapper: {
    alignItems: 'center',
    width: '12%',
    backgroundColor: 'transparent',
  },
  trendBar: {
    width: 12,
    backgroundColor: Theme.colors.primary,
    borderRadius: 6,
  },
  trendBarLabel: {
    fontSize: 9,
    color: Theme.colors.textMuted,
    marginTop: 8,
    fontWeight: 'bold',
  },
  targetRow: {
    flexDirection: 'row',
    padding: Theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border + '33',
    backgroundColor: 'transparent',
  },
  targetMainInfo: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  targetName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Theme.colors.text,
    marginBottom: 4,
  },
  targetSeverityCounts: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  miniBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 6,
  },
  miniBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
  totalVulnLabel: {
    fontSize: 11,
    color: Theme.colors.textMuted,
  },
  techRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border + '33',
    backgroundColor: 'transparent',
  },
  techName: {
    width: '35%',
    fontSize: 13,
    color: Theme.colors.text,
    fontWeight: '600',
  },
  techBarContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 20,
    backgroundColor: 'transparent',
  },
  techBarFill: {
    height: 8,
    backgroundColor: Theme.colors.secondary + '66',
    borderRadius: 4,
  },
  techCount: {
    marginLeft: 8,
    fontSize: 11,
    fontWeight: 'bold',
    color: Theme.colors.textMuted,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Theme.spacing.xl,
  },
  modalContent: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadius.lg,
    width: '100%',
    padding: Theme.spacing.lg,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  modalTitle: {
    fontSize: 24,
    color: Theme.colors.text,
    marginBottom: 20,
    fontFamily: 'Bangers',
    textAlign: 'center',
    letterSpacing: 1,
  },
  kpiTitleTactical: {
    fontFamily: 'Bangers',
  },
  sectionTitleTactical: {
    fontFamily: 'Bangers',
  },
  headerTitleTextTactical: {
    fontFamily: 'Bangers',
  },
  intelligenceGrid: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: Theme.spacing.md,
    marginBottom: Theme.spacing.lg,
    backgroundColor: 'transparent',
  },
  intelCard: {
    flex: 1,
    backgroundColor: Theme.colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    alignItems: 'center',
  },
  intelIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  intelLabel: {
    fontSize: 12,
    color: Theme.colors.textMuted,
    fontWeight: '700',
    marginBottom: 4,
  },
  intelCount: {
    fontSize: 18,
    fontWeight: '900',
    color: Theme.colors.primary,
    fontFamily: 'Bangers',
  },
  projectItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Theme.spacing.md,
    paddingHorizontal: Theme.spacing.md,
    borderRadius: Theme.borderRadius.md,
    marginBottom: Theme.spacing.xs,
  },
  projectItemActive: {
    backgroundColor: Theme.colors.primary + '22',
  },
  projectItemText: {
    fontSize: 16,
    color: Theme.colors.textMuted,
  },
  projectItemTextActive: {
    color: Theme.colors.primary,
    fontWeight: 'bold',
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Theme.colors.primary,
  },
});

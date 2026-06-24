import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity,
  Alert, Switch, ActivityIndicator,
} from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import {
  Play, Square, Clock, ChevronRight, AlertCircle, AlertTriangle,
  X, CheckCircle, Calendar, Trash2, Layers,
} from 'lucide-react-native';
import { Theme } from '../../src/constants/Theme';
import apiClient from '../../src/api/client';
import {
  listScheduledScans, toggleScheduledScan, deleteScheduledScan,
  listSubScans, ScheduledScan, SubScan,
} from '../../src/api/scans';
import { useProjectStore } from '../../src/store/useProjectStore';

type Segment = 'HISTORY' | 'SCHEDULED' | 'SUBSCANS';

interface Scan {
  id: number;
  domain: { name: string };
  scan_status: number;
  start_scan_date: string;
  vulnerability_count: number;
  engine_name: string;
  successful_task_count?: number;
  total_task_count?: number;
}

// ─── Scheduled Scans Panel ──────────────────────────────────────────────────

function ScheduledScansPanel() {
  const { currentProject } = useProjectStore();
  const [scans, setScans] = useState<ScheduledScan[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const fetchScans = useCallback(async () => {
    if (!currentProject) { setLoading(false); setRefreshing(false); return; }
    try {
      setError(null);
      const data = await listScheduledScans(currentProject);
      setScans(data);
    } catch {
      setError('Failed to load scheduled scans');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentProject]);

  useEffect(() => { fetchScans(); }, [fetchScans]);

  const handleToggle = async (scan: ScheduledScan) => {
    setTogglingId(scan.id);
    try {
      const result = await toggleScheduledScan(scan.id);
      setScans(prev => prev.map(s => s.id === scan.id ? { ...s, enabled: result.enabled } : s));
    } catch {
      Alert.alert('Error', 'Failed to toggle scheduled scan');
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = (scan: ScheduledScan) => {
    Alert.alert(
      'Delete Schedule',
      `Delete scheduled scan "${scan.description || scan.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: async () => {
            try {
              await deleteScheduledScan(scan.id);
              setScans(prev => prev.filter(s => s.id !== scan.id));
            } catch {
              Alert.alert('Error', 'Failed to delete scheduled scan');
            }
          },
        },
      ]
    );
  };

  const formatDate = (dt: string | null) => {
    if (!dt) return 'Never';
    const d = new Date(dt);
    return isNaN(d.getTime()) ? 'Unknown' : d.toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
  };

  if (loading) {
    return <View style={panelStyles.center}><ActivityIndicator color={Theme.colors.primary} /></View>;
  }

  return (
    <View style={panelStyles.container}>
      {error && (
        <View style={panelStyles.errorBanner}>
          <AlertTriangle size={16} color={Theme.colors.error} />
          <Text style={panelStyles.errorText}>{error}</Text>
        </View>
      )}
      <FlatList
        data={scans}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={panelStyles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchScans(); }}
            tintColor={Theme.colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={panelStyles.center}>
            <Calendar size={40} color={Theme.colors.textMuted} />
            <Text style={panelStyles.emptyText}>No scheduled scans</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={panelStyles.card}>
            <View style={panelStyles.cardHeader}>
              <View style={panelStyles.cardLeft}>
                <Calendar size={16} color={item.enabled ? Theme.colors.primary : Theme.colors.textMuted} />
                <View style={panelStyles.cardInfo}>
                  <Text style={panelStyles.cardName} numberOfLines={1}>{item.description || item.name}</Text>
                  <Text style={panelStyles.cardFreq}>{item.frequency}</Text>
                </View>
              </View>
              <Switch
                value={item.enabled}
                onValueChange={() => handleToggle(item)}
                disabled={togglingId === item.id}
                trackColor={{ false: Theme.colors.border, true: Theme.colors.primary + '66' }}
                thumbColor={item.enabled ? Theme.colors.primary : Theme.colors.textMuted}
              />
            </View>
            <View style={panelStyles.cardFooter}>
              <View style={panelStyles.metaRow}>
                <Clock size={12} color={Theme.colors.textMuted} />
                <Text style={panelStyles.metaText}>Last run: {formatDate(item.last_run_at)}</Text>
              </View>
              <Text style={panelStyles.metaText}>Runs: {item.total_run_count}</Text>
              <TouchableOpacity onPress={() => handleDelete(item)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Trash2 size={16} color={Theme.colors.error} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
}

// ─── Sub Scans Panel ─────────────────────────────────────────────────────────

const SUB_STATUS_MAP: Record<number, { label: string; color: string }> = {
  0: { label: 'Failed',   color: Theme.colors.error },
  1: { label: 'Running',  color: Theme.colors.info },
  2: { label: 'Complete', color: Theme.colors.success },
  3: { label: 'Aborted',  color: Theme.colors.error },
  4: { label: 'Partial',  color: Theme.colors.warning },
};

function SubScansPanel() {
  const { currentProject } = useProjectStore();
  const [scans, setScans] = useState<SubScan[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchScans = useCallback(async () => {
    if (!currentProject) { setLoading(false); setRefreshing(false); return; }
    try {
      setError(null);
      const data = await listSubScans(currentProject);
      setScans(data);
    } catch {
      setError('Failed to load sub scans');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentProject]);

  useEffect(() => { fetchScans(); }, [fetchScans]);

  const formatDate = (dt: string | null) => {
    if (!dt) return '—';
    const d = new Date(dt);
    return isNaN(d.getTime()) ? '—' : d.toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
  };

  if (loading) {
    return <View style={panelStyles.center}><ActivityIndicator color={Theme.colors.primary} /></View>;
  }

  return (
    <View style={panelStyles.container}>
      {error && (
        <View style={panelStyles.errorBanner}>
          <AlertTriangle size={16} color={Theme.colors.error} />
          <Text style={panelStyles.errorText}>{error}</Text>
        </View>
      )}
      <FlatList
        data={scans}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={panelStyles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchScans(); }}
            tintColor={Theme.colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={panelStyles.center}>
            <Layers size={40} color={Theme.colors.textMuted} />
            <Text style={panelStyles.emptyText}>No sub scans found</Text>
          </View>
        }
        renderItem={({ item }) => {
          const statusInfo = SUB_STATUS_MAP[item.status] ?? { label: 'Unknown', color: Theme.colors.textMuted };
          return (
            <View style={panelStyles.card}>
              <View style={panelStyles.cardHeader}>
                <Text style={panelStyles.cardName} numberOfLines={1}>{item.subdomain_name}</Text>
                <View style={[panelStyles.statusBadge, { backgroundColor: statusInfo.color + '20' }]}>
                  <Text style={[panelStyles.statusText, { color: statusInfo.color }]}>{statusInfo.label}</Text>
                </View>
              </View>
              <Text style={panelStyles.taskType}>{item.type?.replace(/_/g, ' ')}</Text>
              <View style={panelStyles.cardFooter}>
                <View style={panelStyles.metaRow}>
                  <Clock size={12} color={Theme.colors.textMuted} />
                  <Text style={panelStyles.metaText}>{formatDate(item.start_scan_date)}</Text>
                </View>
                {item.time_taken && <Text style={panelStyles.metaText}>Duration: {item.time_taken}</Text>}
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}

// ─── Main Scans Screen ────────────────────────────────────────────────────────

export default function ScansScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const targetId = params.targetId as string;
  const targetName = params.targetName as string;

  const { currentProject } = useProjectStore();
  const [activeSegment, setActiveSegment] = useState<Segment>('HISTORY');
  const [scans, setScans] = useState<Scan[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchScans = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      let url = `/mapi/listScans/?project=${currentProject}`;
      if (targetId) url += `&target_id=${targetId}`;
      const response = await apiClient.get(url);
      const data = Array.isArray(response.data) ? response.data : (response.data.results || []);
      setScans(data);
    } catch (err: any) {
      setError(`Scans Error: ${err.message}`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [targetId, currentProject]);

  useEffect(() => { fetchScans(); }, [fetchScans]);

  const onRefresh = () => { setRefreshing(true); fetchScans(); };

  const handleStopScan = (scanId: number, domainName: string) => {
    Alert.alert(
      'Stop Scan',
      `Are you sure you want to stop the scan for ${domainName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Stop Scan', style: 'destructive',
          onPress: async () => {
            try {
              const response = await apiClient.post('/mapi/action/stop/scan/', { scan_ids: [scanId] });
              if (response.data?.status) {
                Alert.alert('Success', 'Scan stop request sent.');
                fetchScans();
              } else {
                Alert.alert('Error', response.data.message || 'Failed to stop scan.');
              }
            } catch {
              Alert.alert('Error', 'An error occurred while stopping the scan.');
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? 'N/A' : date.toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
  };

  const getStatusColor = (status: number) => {
    switch (status) {
      case 2: return Theme.colors.success;
      case 1: return Theme.colors.primary;
      case 3: return Theme.colors.error;
      case 0: return Theme.colors.error;
      case 4: return Theme.colors.warning;
      default: return Theme.colors.textMuted;
    }
  };

  const getStatusLabel = (status: number, ok?: number, total?: number): string => {
    const suffix = (total ?? 0) > 0 ? ` ${ok ?? 0}/${total}` : '';
    switch (status) {
      case 2: return `Complete${suffix}`;
      case 1: return 'Scanning';
      case 3: return 'Aborted';
      case 0: return `Failed${suffix}`;
      case 4: return 'Partial';
      default: return 'Unknown';
    }
  };

  const renderScanItem = ({ item }: { item: Scan }) => (
    <TouchableOpacity
      style={styles.scanCard}
      activeOpacity={0.7}
      onPress={() => {
        if (currentProject) {
          router.push({ pathname: '/scan/[id]', params: { id: item.id, slug: currentProject } });
        }
      }}
    >
      <View style={styles.scanHeader}>
        <Text style={styles.domainName}>{item.domain?.name || 'N/A'}</Text>
        <View style={styles.badgeRow}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.scan_status) + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(item.scan_status) }]}>
              {getStatusLabel(item.scan_status, item.successful_task_count, item.total_task_count)}
            </Text>
          </View>
          {item.scan_status === 1 && (
            <TouchableOpacity
              style={styles.stopBtn}
              onPress={() => handleStopScan(item.id, item.domain?.name)}
            >
              <Square size={14} color={Theme.colors.error} fill={Theme.colors.error} />
            </TouchableOpacity>
          )}
        </View>
      </View>
      <View style={styles.detailsRow}>
        <Text style={styles.engineLabel}>{item.engine_name}</Text>
      </View>
      <View style={styles.scanFooter}>
        <View style={styles.metaRow}>
          <Clock size={14} color={Theme.colors.textMuted} />
          <Text style={styles.metaText}>{formatDate(item.start_scan_date)}</Text>
        </View>
        <View style={styles.metaRow}>
          <AlertCircle size={14} color={item.vulnerability_count > 0 ? Theme.colors.error : Theme.colors.success} />
          <Text style={styles.metaText}>{item.vulnerability_count} Vulns</Text>
        </View>
        <ChevronRight size={18} color={Theme.colors.textMuted} />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen options={{
        title: targetName ? `Scans: ${targetName}` : 'Scan History',
        headerStyle: { backgroundColor: Theme.colors.surface },
        headerTintColor: Theme.colors.primary,
        headerTitleStyle: { fontFamily: 'Bangers', fontSize: 24 },
      }} />

      {/* Segment bar — all three tabs switch inline */}
      <View style={styles.segmentBar}>
        {(['HISTORY', 'SCHEDULED', 'SUBSCANS'] as Segment[]).map(seg => (
          <TouchableOpacity
            key={seg}
            style={[styles.segmentTab, activeSegment === seg && styles.segmentTabActive]}
            onPress={() => setActiveSegment(seg)}
          >
            <Text style={[styles.segmentLabel, activeSegment === seg && styles.segmentLabelActive]}>
              {seg === 'SUBSCANS' ? 'Sub Scans' : seg === 'SCHEDULED' ? 'Scheduled' : 'History'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* History tab content */}
      {activeSegment === 'HISTORY' && (
        <>
          {targetId && (
            <View style={styles.filterHeader}>
              <Text style={styles.filterText}>Filtering by Target: {targetName || targetId}</Text>
              <TouchableOpacity onPress={() => router.setParams({ targetId: undefined, targetName: undefined })}>
                <X size={16} color={Theme.colors.primary} />
              </TouchableOpacity>
            </View>
          )}
          {error && (
            <View style={styles.errorAlert}>
              <AlertTriangle size={18} color={Theme.colors.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
          <FlatList
            data={scans}
            renderItem={renderScanItem}
            keyExtractor={item => item.id.toString()}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Theme.colors.primary} />
            }
            ListEmptyComponent={
              !loading ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No scans found</Text>
                </View>
              ) : null
            }
          />
        </>
      )}

      {activeSegment === 'SCHEDULED' && <ScheduledScansPanel />}
      {activeSegment === 'SUBSCANS' && <SubScansPanel />}
    </View>
  );
}

// ─── Shared panel styles ──────────────────────────────────────────────────────

const panelStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  list: { padding: Theme.spacing.md },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Theme.spacing.xl },
  emptyText: { color: Theme.colors.textMuted, marginTop: Theme.spacing.md, fontSize: 15 },
  errorBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Theme.colors.error + '22', padding: Theme.spacing.md,
    margin: Theme.spacing.md, borderRadius: Theme.borderRadius.md,
    borderWidth: 1, borderColor: Theme.colors.error + '44',
  },
  errorText: { color: Theme.colors.error, flex: 1, fontSize: 13 },
  card: {
    backgroundColor: Theme.colors.surface, borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.md, marginBottom: Theme.spacing.md,
    borderWidth: 1, borderColor: Theme.colors.border,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Theme.spacing.sm },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: Theme.spacing.sm, flex: 1 },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 14, fontWeight: '700', color: Theme.colors.text, flex: 1 },
  cardFreq: { fontSize: 12, color: Theme.colors.primary, marginTop: 2 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 11, color: Theme.colors.textMuted },
  taskType: { fontSize: 12, color: Theme.colors.textMuted, marginBottom: Theme.spacing.sm, textTransform: 'capitalize' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  statusText: { fontSize: 11, fontWeight: '700' },
});

// ─── Main screen styles ───────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  segmentBar: {
    flexDirection: 'row',
    backgroundColor: Theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  segmentTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  segmentTabActive: { borderBottomColor: Theme.colors.primary },
  segmentLabel: {
    fontSize: 12, fontWeight: '700',
    color: Theme.colors.textMuted,
    letterSpacing: 0.3, textTransform: 'uppercase',
  },
  segmentLabelActive: { color: Theme.colors.primary },
  listContent: { padding: Theme.spacing.md },
  filterHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: Theme.colors.surface, padding: 12,
    marginHorizontal: Theme.spacing.md, marginTop: Theme.spacing.md,
    borderRadius: 8, borderWidth: 1, borderColor: Theme.colors.primary + '44',
  },
  filterText: { color: Theme.colors.primary, fontSize: 13, fontWeight: '600' },
  errorAlert: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Theme.colors.error + '22', padding: Theme.spacing.md,
    margin: Theme.spacing.md, borderRadius: Theme.borderRadius.md,
    borderWidth: 1, borderColor: Theme.colors.error + '44',
  },
  errorText: { color: Theme.colors.error, fontSize: 12, marginLeft: Theme.spacing.sm, flex: 1 },
  scanCard: {
    backgroundColor: Theme.colors.surface, borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.md, marginBottom: Theme.spacing.md,
    borderWidth: 1, borderColor: Theme.colors.border,
  },
  scanHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: Theme.spacing.sm,
  },
  domainName: { fontSize: 16, fontWeight: 'bold', color: Theme.colors.text, flex: 1 },
  detailsRow: { marginBottom: Theme.spacing.sm },
  engineLabel: { fontSize: 13, color: Theme.colors.textMuted, fontStyle: 'italic' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  statusText: { fontSize: 12, fontWeight: 'bold' },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stopBtn: {
    padding: 6, backgroundColor: Theme.colors.error + '15',
    borderRadius: 6, borderWidth: 1, borderColor: Theme.colors.error + '33',
  },
  scanFooter: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginTop: Theme.spacing.sm,
  },
  metaRow: { flexDirection: 'row', alignItems: 'center' },
  metaText: { fontSize: 12, color: Theme.colors.textMuted, marginLeft: 4 },
  emptyContainer: { padding: 40, alignItems: 'center' },
  emptyText: { color: Theme.colors.textMuted },
});

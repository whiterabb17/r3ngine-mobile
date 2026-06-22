import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Layers, ChevronLeft, AlertTriangle, Clock } from 'lucide-react-native';
import { Theme } from '../../src/constants/Theme';
import { listSubScans, SubScan } from '../../src/api/scans';
import { useProjectStore } from '../../src/store/useProjectStore';

const STATUS_MAP: Record<number, { label: string; color: string }> = {
  0: { label: 'Failed', color: Theme.colors.error },
  1: { label: 'Running', color: Theme.colors.info },
  2: { label: 'Complete', color: Theme.colors.success },
  3: { label: 'Aborted', color: Theme.colors.error },
  4: { label: 'Partial', color: Theme.colors.warning },
};

export default function SubScansScreen() {
  const router = useRouter();
  const { currentProject } = useProjectStore();
  const params = useLocalSearchParams<{ scanHistoryId?: string; domainName?: string }>();
  const scanHistoryId = params.scanHistoryId ? Number(params.scanHistoryId) : undefined;

  const [scans, setScans] = useState<SubScan[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchScans = useCallback(async () => {
    if (!currentProject) {
      setLoading(false);
      return;
    }
    try {
      setError(null);
      const data = await listSubScans(currentProject, scanHistoryId);
      setScans(data);
    } catch {
      setError('Failed to load sub scans');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentProject, scanHistoryId]);

  useEffect(() => { fetchScans(); }, [fetchScans]);

  const formatDate = (dt: string | null) => {
    if (!dt) return '—';
    const d = new Date(dt);
    return isNaN(d.getTime()) ? '—' : d.toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
  };

  const renderItem = ({ item }: { item: SubScan }) => {
    const statusInfo = STATUS_MAP[item.status] ?? { label: 'Unknown', color: Theme.colors.textMuted };
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.subdomainName} numberOfLines={1}>{item.subdomain_name}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusInfo.color + '20' }]}>
            <Text style={[styles.statusText, { color: statusInfo.color }]}>{statusInfo.label}</Text>
          </View>
        </View>
        <Text style={styles.taskType}>{item.type?.replace(/_/g, ' ')}</Text>
        <View style={styles.cardFooter}>
          <View style={styles.metaRow}>
            <Clock size={12} color={Theme.colors.textMuted} />
            <Text style={styles.metaText}>{formatDate(item.start_scan_date)}</Text>
          </View>
          {item.time_taken && (
            <Text style={styles.metaText}>Duration: {item.time_taken}</Text>
          )}
        </View>
      </View>
    );
  };

  const title = params.domainName ? `Sub Scans: ${params.domainName}` : 'Sub Scans';

  return (
    <View style={styles.container}>
      <Stack.Screen options={{
        title,
        headerStyle: { backgroundColor: Theme.colors.surface },
        headerTintColor: Theme.colors.primary,
        headerTitleStyle: { fontFamily: 'Bangers', fontSize: 22 },
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ChevronLeft size={26} color={Theme.colors.text} />
          </TouchableOpacity>
        ),
      }} />

      {error && (
        <View style={styles.errorBanner}>
          <AlertTriangle size={16} color={Theme.colors.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={scans}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchScans(); }} tintColor={Theme.colors.primary} />}
          ListEmptyComponent={
            <View style={styles.center}>
              <Layers size={40} color={Theme.colors.textMuted} />
              <Text style={styles.emptyText}>No sub scans found</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
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
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  subdomainName: { fontSize: 14, fontWeight: '700', color: Theme.colors.text, flex: 1 },
  taskType: { fontSize: 12, color: Theme.colors.textMuted, marginBottom: Theme.spacing.sm, textTransform: 'capitalize' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  statusText: { fontSize: 11, fontWeight: '700' },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 11, color: Theme.colors.textMuted },
  backBtn: { marginLeft: 4, padding: 4 },
});

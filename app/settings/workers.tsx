import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  Switch, RefreshControl, ActivityIndicator,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { ChevronLeft, Cpu, AlertTriangle } from 'lucide-react-native';
import { Theme } from '../../src/constants/Theme';
import { getWorkers, patchWorker, ScanWorker } from '../../src/api/settings';

function heartbeatColor(lastHeartbeat: string | null): string {
  if (!lastHeartbeat) return Theme.colors.error;
  const ageMins = (Date.now() - new Date(lastHeartbeat).getTime()) / 60000;
  if (ageMins < 5) return Theme.colors.success;
  if (ageMins < 30) return Theme.colors.warning;
  return Theme.colors.error;
}

function heartbeatLabel(lastHeartbeat: string | null): string {
  if (!lastHeartbeat) return 'Never';
  const ageMins = Math.floor((Date.now() - new Date(lastHeartbeat).getTime()) / 60000);
  if (ageMins < 1) return 'Just now';
  if (ageMins < 60) return `${ageMins}m ago`;
  const ageHrs = Math.floor(ageMins / 60);
  return `${ageHrs}h ago`;
}

export default function WorkersScreen() {
  const router = useRouter();
  const [workers, setWorkers] = useState<ScanWorker[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const fetchWorkers = useCallback(async () => {
    try {
      setError(null);
      const data = await getWorkers();
      setWorkers(data);
    } catch {
      setError('Failed to load workers');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchWorkers(); }, [fetchWorkers]);

  const handleToggle = async (worker: ScanWorker) => {
    setTogglingId(worker.id);
    try {
      const updated = await patchWorker(worker.id, { is_active: !worker.is_active });
      setWorkers((prev) => prev.map((w) => w.id === worker.id ? { ...w, is_active: updated.is_active } : w));
    } catch {
      setError('Failed to update worker');
    } finally {
      setTogglingId(null);
    }
  };

  const renderItem = ({ item }: { item: ScanWorker }) => {
    const hbColor = heartbeatColor(item.last_heartbeat);
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.nameRow}>
            <View style={[styles.hbDot, { backgroundColor: hbColor }]} />
            <Text style={styles.workerName}>{item.name}</Text>
          </View>
          <Switch
            value={item.is_active}
            onValueChange={() => handleToggle(item)}
            disabled={togglingId === item.id}
            trackColor={{ false: Theme.colors.border, true: Theme.colors.primary + '66' }}
            thumbColor={item.is_active ? Theme.colors.primary : Theme.colors.textMuted}
          />
        </View>
        <View style={styles.metaGrid}>
          <Text style={styles.metaLabel}>Queue</Text>
          <Text style={styles.metaValue}>{item.task_queue}</Text>
          <Text style={styles.metaLabel}>IP</Text>
          <Text style={styles.metaValue}>{item.ip_address ?? '—'}</Text>
          <Text style={styles.metaLabel}>Heartbeat</Text>
          <Text style={[styles.metaValue, { color: hbColor }]}>
            {heartbeatLabel(item.last_heartbeat)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{
        title: 'Remote Workers',
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
          data={workers}
          renderItem={renderItem}
          keyExtractor={(w) => w.id.toString()}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchWorkers(); }}
              tintColor={Theme.colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Cpu size={40} color={Theme.colors.textMuted} />
              <Text style={styles.emptyText}>No workers registered</Text>
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
  emptyText: { color: Theme.colors.textMuted, marginTop: Theme.spacing.md },
  backBtn: { marginLeft: 4, padding: 4 },
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
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  hbDot: { width: 8, height: 8, borderRadius: 4 },
  workerName: { fontSize: 15, fontWeight: '700', color: Theme.colors.text },
  metaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  metaLabel: { fontSize: 11, color: Theme.colors.textMuted, width: 72 },
  metaValue: { fontSize: 11, color: Theme.colors.text, flex: 1, marginBottom: 4 },
});

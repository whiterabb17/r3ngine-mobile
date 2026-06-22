import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  Switch, Alert, RefreshControl, ActivityIndicator,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Calendar, Trash2, ChevronLeft, AlertTriangle, Clock } from 'lucide-react-native';
import { Theme } from '../../src/constants/Theme';
import { listScheduledScans, toggleScheduledScan, deleteScheduledScan, ScheduledScan } from '../../src/api/scans';
import { useProjectStore } from '../../src/store/useProjectStore';

export default function ScheduledScansScreen() {
  const router = useRouter();
  const { currentProject } = useProjectStore();
  const [scans, setScans] = useState<ScheduledScan[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const fetchScans = useCallback(async () => {
    if (!currentProject) return;
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
      setScans((prev) =>
        prev.map((s) => s.id === scan.id ? { ...s, enabled: result.enabled } : s)
      );
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
              setScans((prev) => prev.filter((s) => s.id !== scan.id));
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

  const renderItem = ({ item }: { item: ScheduledScan }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardLeft}>
          <Calendar size={16} color={item.enabled ? Theme.colors.primary : Theme.colors.textMuted} />
          <View style={styles.cardInfo}>
            <Text style={styles.cardName} numberOfLines={1}>{item.description || item.name}</Text>
            <Text style={styles.cardFreq}>{item.frequency}</Text>
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
      <View style={styles.cardFooter}>
        <View style={styles.metaRow}>
          <Clock size={12} color={Theme.colors.textMuted} />
          <Text style={styles.metaText}>Last run: {formatDate(item.last_run_at)}</Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.runCount}>Runs: {item.total_run_count}</Text>
        </View>
        <TouchableOpacity onPress={() => handleDelete(item)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Trash2 size={16} color={Theme.colors.error} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen options={{
        title: 'Scheduled Scans',
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
              <Calendar size={40} color={Theme.colors.textMuted} />
              <Text style={styles.emptyText}>No scheduled scans</Text>
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
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Theme.spacing.sm },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: Theme.spacing.sm, flex: 1 },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 14, fontWeight: '700', color: Theme.colors.text },
  cardFreq: { fontSize: 12, color: Theme.colors.primary, marginTop: 2 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 11, color: Theme.colors.textMuted },
  runCount: { fontSize: 11, color: Theme.colors.textMuted },
  backBtn: { marginLeft: 4, padding: 4 },
});

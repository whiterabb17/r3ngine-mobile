import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Activity, Zap, ChevronRight, History, ShieldAlert, Cpu } from 'lucide-react-native';
import { Theme } from '../../src/constants/Theme';
import apiClient from '../../src/api/client';
import { TacticalHaptics } from '../../src/utils/haptics';

interface StressScan {
  id: number;
  domain_name: string;
  start_scan_date: string;
  scan_type_name: string;
}

export default function StressHistoryScreen() {
  const router = useRouter();
  const [scans, setScans] = useState<StressScan[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStressHistory = async () => {
    try {
      setError(null);
      const response = await apiClient.get('/api/stress-testing/history/');
      // Map response to our internal interface
      const mappedScans = (response.data.scans || []).map((s: any) => ({
        id: s.id,
        domain_name: s.domain?.name || 'Unknown Target',
        start_scan_date: s.start_scan_date,
        scan_type_name: s.scan_type?.engine_name || 'Standard Scan'
      }));
      setScans(mappedScans);
    } catch (err) {
      console.error('Failed to fetch stress history:', err);
      setError('Tactical telemetry link unstable.');
      TacticalHaptics.error();
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStressHistory();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    TacticalHaptics.soft();
    fetchStressHistory();
  };

  const renderScanItem = ({ item }: { item: StressScan }) => (
    <TouchableOpacity 
      style={styles.card} 
      onPress={() => router.push(`/system/stress/${item.id}` as any)}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={styles.iconContainer}>
          <Activity size={24} color={Theme.colors.warning} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.targetName} numberOfLines={1}>{item.domain_name}</Text>
          <Text style={styles.scanDate}>{new Date(item.start_scan_date).toLocaleString()}</Text>
        </View>
        <ChevronRight size={20} color={Theme.colors.textMuted} />
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.engineTag}>
          <Cpu size={12} color={Theme.colors.primary} />
          <Text style={styles.engineText}>{item.scan_type_name.toUpperCase()}</Text>
        </View>
        <View style={styles.statusBadge}>
          <View style={styles.pulseDot} />
          <Text style={styles.statusText}>TELEMETRY AVAILABLE</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Theme.colors.warning} />
        <Text style={styles.loadingText}>FETCHING PERFORMANCE LOGS...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'STRESS TELEMETRY',
          headerStyle: { backgroundColor: Theme.colors.background },
          headerTintColor: '#fff',
          headerTitleStyle: { fontFamily: 'Bangers' }
        }} 
      />

      <FlatList
        data={scans}
        renderItem={renderScanItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Theme.colors.warning} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <History size={48} color={Theme.colors.border} />
            <Text style={styles.emptyText}>No historical stress testing telemetry detected in the operational archive.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Theme.colors.background,
  },
  loadingText: {
    marginTop: 12,
    color: Theme.colors.warning,
    fontFamily: 'Bangers',
    letterSpacing: 1,
  },
  listContent: {
    padding: Theme.spacing.md,
    paddingBottom: Theme.spacing.xl,
  },
  card: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.md,
    marginBottom: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Theme.spacing.md,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Theme.colors.warning + '11',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Theme.colors.warning + '22',
  },
  headerText: {
    flex: 1,
    marginLeft: Theme.spacing.md,
  },
  targetName: {
    color: Theme.colors.text,
    fontSize: 18,
    fontFamily: 'Bangers',
    letterSpacing: 0.5,
  },
  scanDate: {
    color: Theme.colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border + '33',
    paddingTop: Theme.spacing.md,
  },
  engineTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.primary + '11',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    gap: 6,
  },
  engineText: {
    color: Theme.colors.primary,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Theme.colors.success,
  },
  statusText: {
    color: Theme.colors.success,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
  },
  emptyText: {
    color: Theme.colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 16,
    maxWidth: '80%',
    lineHeight: 20,
  },
});

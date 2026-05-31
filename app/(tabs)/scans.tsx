import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Play, Square, Clock, ChevronRight, AlertCircle, AlertTriangle, X, CheckCircle } from 'lucide-react-native';
import { Theme } from '../../src/constants/Theme';
import apiClient from '../../src/api/client';
import { useProjectStore } from '../../src/store/useProjectStore';

interface Scan {
  id: number;
  domain: {
    name: string;
  };
  scan_status: number;
  start_scan_date: string;
  vulnerability_count: number;
  engine_name: string;
}

export default function ScansScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const targetId = params.targetId as string;
  const targetName = params.targetName as string;

  const { currentProject } = useProjectStore();
  const [scans, setScans] = useState<Scan[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchScans = async () => {
    try {
      setLoading(true);
      setError(null);
      let url = `/mapi/listScans/?project=${currentProject}`;
      if (targetId) {
        url += `&target_id=${targetId}`;
      }
      const response = await apiClient.get(url);
      const data = Array.isArray(response.data) ? response.data : (response.data.results || []);
      setScans(data);
    } catch (err: any) {
      console.error('Error fetching scans:', err);
      setError(`Scans Error: ${err.message}`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchScans();
  }, [targetId, currentProject]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchScans();
  };

  const handleStopScan = (scanId: number, domainName: string) => {
    Alert.alert(
      "Stop Scan",
      `Are you sure you want to stop the scan for ${domainName}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Stop Scan",
          style: "destructive",
          onPress: async () => {
            try {
              const response = await apiClient.post('/mapi/action/stop/scan/', { scan_ids: [scanId] });
              if (response.data && response.data.status) {
                Alert.alert("Success", "Scan stop request sent.");
                fetchScans();
              } else {
                Alert.alert("Error", response.data.message || "Failed to stop scan.");
              }
            } catch (err: any) {
              Alert.alert("Error", "An error occurred while stopping the scan.");
            }
          }
        }
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
      case 2: return Theme.colors.success; // SUCCESS_TASK
      case 1: return Theme.colors.primary; // RUNNING_TASK
      case 3: return Theme.colors.error;   // ABORTED_TASK
      case 0: return Theme.colors.error;   // FAILED_TASK
      case 4: return Theme.colors.warning; // PARTIALLY_COMPLETE_TASK
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

  const renderItem = ({ item }: { item: Scan }) => (
    <TouchableOpacity
      style={styles.scanCard}
      activeOpacity={0.7}
      onPress={() => {
        if (currentProject) {
          router.push({
            pathname: '/scan/[id]',
            params: { id: item.id, slug: currentProject }
          });
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
        headerTitleStyle: {
          fontFamily: 'Bangers',
          fontSize: 24,
        }
      }} />

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
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Theme.colors.primary} />}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No scans found</Text>
            </View>
          ) : null
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
  listContent: {
    padding: Theme.spacing.md,
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Theme.colors.surface,
    padding: 12,
    marginHorizontal: Theme.spacing.md,
    marginTop: Theme.spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Theme.colors.primary + '44',
  },
  filterText: {
    color: Theme.colors.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  errorAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.error + '22',
    padding: Theme.spacing.md,
    margin: Theme.spacing.md,
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1,
    borderColor: Theme.colors.error + '44',
  },
  errorText: {
    color: Theme.colors.error,
    fontSize: 12,
    marginLeft: Theme.spacing.sm,
    flex: 1,
  },
  scanCard: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.md,
    marginBottom: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  scanHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.sm,
  },
  domainName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Theme.colors.text,
    flex: 1,
  },
  detailsRow: {
    marginBottom: Theme.spacing.sm,
  },
  engineLabel: {
    fontSize: 13,
    color: Theme.colors.textMuted,
    fontStyle: 'italic',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stopBtn: {
    padding: 6,
    backgroundColor: Theme.colors.error + '15',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Theme.colors.error + '33',
  },
  scanFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Theme.spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 12,
    color: Theme.colors.textMuted,
    marginLeft: 4,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: Theme.colors.textMuted,
  },
});

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl, TouchableOpacity, Modal, Switch, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Search, Filter, Clock, Globe, Shield, Zap, AlertTriangle, Settings, X } from 'lucide-react-native';
import apiClient from '../../src/api/client';
import { Theme } from '../../src/constants/Theme';
import { formatDistanceToNow } from 'date-fns';

export default function MonitoringFeedScreen() {
  const [discoveries, setDiscoveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [targets, setTargets] = useState<any[]>([]);
  const [targetsLoading, setTargetsLoading] = useState(false);
  const [togglingTargetId, setTogglingTargetId] = useState<number | null>(null);

  const fetchTargets = async () => {
    setTargetsLoading(true);
    try {
      const response = await apiClient.get('/mapi/listTargets/');
      const data = response.data.results || response.data;
      setTargets(data || []);
    } catch (err) {
      console.error('Failed to fetch targets:', err);
    } finally {
      setTargetsLoading(false);
    }
  };

  useEffect(() => {
    if (settingsModalVisible) {
      fetchTargets();
    }
  }, [settingsModalVisible]);

  const handleToggleMonitoring = async (targetId: number, currentStatus: boolean) => {
    setTogglingTargetId(targetId);
    try {
      // optimistic update
      setTargets(prev => prev.map(t => t.id === targetId ? { ...t, is_monitored: !currentStatus } : t));

      const response = await apiClient.post('/mapi/toggle/monitoring/', { domain_id: targetId });
      if (!response.data.status) {
        throw new Error(response.data.message || 'Failed to toggle monitoring');
      }
    } catch (err: any) {
      console.error('Failed to toggle target monitoring:', err);
      // rollback
      setTargets(prev => prev.map(t => t.id === targetId ? { ...t, is_monitored: currentStatus } : t));
      Alert.alert('Configuration Error', err.response?.data?.message || err.message || 'Failed to toggle monitoring status.');
    } finally {
      setTogglingTargetId(null);
    }
  };

  const handleCloseSettings = () => {
    setSettingsModalVisible(false);
    fetchDiscoveries();
  };

  const fetchDiscoveries = async () => {
    try {
      const response = await apiClient.get('/mapi/monitoring/');
      // Handling potential pagination or direct list
      const data = response.data.results || response.data;
      setDiscoveries(data);
    } catch (err) {
      console.error('Failed to fetch monitoring discoveries:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDiscoveries();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDiscoveries();
  };

  const getDiscoveryIcon = (type: string) => {
    switch (type) {
      case 'subdomain': return <Globe size={16} color={Theme.colors.primary} />;
      case 'vulnerability': return <AlertTriangle size={16} color={Theme.colors.error} />;
      case 'port': return <Zap size={16} color={Theme.colors.secondary} />;
      default: return <Clock size={16} color={Theme.colors.info} />;
    }
  };

  const DiscoveryCard = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.typeBadge}>
          {getDiscoveryIcon(item.discovery_type)}
          <Text style={styles.typeText}>{item.discovery_type?.toUpperCase()}</Text>
        </View>
        <Text style={styles.timeText}>
          {item.discovered_at ? formatDistanceToNow(new Date(item.discovered_at), { addSuffix: true }) : 'Just now'}
        </Text>
      </View>
      
      <Text style={styles.domainText}>{item.domain_name}</Text>
      <Text style={styles.contentText}>{item.content?.value || JSON.stringify(item.content)}</Text>
      
      <View style={styles.cardFooter}>
        <Shield size={12} color={Theme.colors.textMuted} />
        <Text style={styles.footerText}>Verified via ReconX Monitoring</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'RECONX DISCOVERY',
          headerTitleAlign: 'center',
          headerTitleStyle: { fontFamily: 'Bangers' },
          headerRight: () => (
            <TouchableOpacity onPress={() => setSettingsModalVisible(true)} style={{ marginRight: 10, padding: 5 }}>
              <Settings size={20} color="#fff" />
            </TouchableOpacity>
          )
        }} 
      />

      <Modal
        visible={settingsModalVisible}
        animationType="slide"
        onRequestClose={handleCloseSettings}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>MONITORING SETTINGS</Text>
            <TouchableOpacity onPress={handleCloseSettings} style={styles.closeButton}>
              <X size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          {targetsLoading ? (
            <View style={styles.modalCenterContainer}>
              <ActivityIndicator size="large" color={Theme.colors.primary} />
              <Text style={styles.modalLoadingText}>RETRIEVING TARGET REGISTRY...</Text>
            </View>
          ) : (
            <FlatList
              data={targets}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={styles.modalListContent}
              renderItem={({ item }) => (
                <View style={styles.targetRow}>
                  <View style={styles.targetInfo}>
                    <Text style={styles.targetName}>{item.name}</Text>
                    <Text style={styles.targetSub}>{item.is_monitored ? 'MONITORING ACTIVE' : 'MONITORING PAUSED'}</Text>
                  </View>
                  <Switch
                    value={item.is_monitored}
                    onValueChange={() => handleToggleMonitoring(item.id, item.is_monitored)}
                    disabled={togglingTargetId === item.id}
                    trackColor={{ false: '#333', true: Theme.colors.success + '44' }}
                    thumbColor={item.is_monitored ? Theme.colors.success : '#777'}
                  />
                </View>
              )}
              ListEmptyComponent={
                <View style={styles.modalEmptyContainer}>
                  <Text style={styles.modalEmptyText}>No targets registered in database.</Text>
                </View>
              }
            />
          )}
        </View>
      </Modal>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Theme.colors.primary} />
          <Text style={styles.loadingText}>Synchronizing with ReconX Grid...</Text>
        </View>
      ) : (
        <FlatList
          data={discoveries}
          renderItem={({ item }) => <DiscoveryCard item={item} />}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Theme.colors.primary} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Search size={48} color={Theme.colors.border} />
              <Text style={styles.emptyText}>No new discoveries detected in monitoring cycle.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: Theme.spacing.md,
  },
  card: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.md,
    marginBottom: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderLeftWidth: 4,
    borderLeftColor: Theme.colors.primary,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.sm,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  typeText: {
    color: Theme.colors.text,
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 6,
    letterSpacing: 0.5,
  },
  timeText: {
    color: Theme.colors.textMuted,
    fontSize: 11,
  },
  domainText: {
    color: Theme.colors.text,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  contentText: {
    color: Theme.colors.secondary,
    fontSize: 13,
    fontFamily: 'monospace',
    marginBottom: Theme.spacing.md,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border + '33',
    paddingTop: Theme.spacing.sm,
  },
  footerText: {
    color: Theme.colors.textMuted,
    fontSize: 10,
    marginLeft: 6,
    textTransform: 'uppercase',
  },
  loadingText: {
    color: Theme.colors.textMuted,
    marginTop: Theme.spacing.md,
    fontFamily: 'Bangers',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    color: Theme.colors.textMuted,
    marginTop: Theme.spacing.md,
    textAlign: 'center',
    maxWidth: 250,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
    backgroundColor: Theme.colors.surface,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 20,
    fontFamily: 'Bangers',
    letterSpacing: 1,
  },
  closeButton: {
    padding: 4,
  },
  modalCenterContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Theme.spacing.xl,
  },
  modalLoadingText: {
    color: Theme.colors.textMuted,
    marginTop: Theme.spacing.md,
    fontFamily: 'Bangers',
    letterSpacing: 0.5,
  },
  modalListContent: {
    padding: Theme.spacing.md,
  },
  targetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Theme.colors.surface,
    padding: Theme.spacing.md,
    borderRadius: Theme.borderRadius.md,
    marginBottom: Theme.spacing.sm,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  targetInfo: {
    flex: 1,
    marginRight: Theme.spacing.md,
  },
  targetName: {
    color: Theme.colors.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  targetSub: {
    color: Theme.colors.textMuted,
    fontSize: 11,
    marginTop: 2,
    fontWeight: '500',
  },
  modalEmptyContainer: {
    alignItems: 'center',
    marginTop: 100,
  },
  modalEmptyText: {
    color: Theme.colors.textMuted,
    textAlign: 'center',
  },
});

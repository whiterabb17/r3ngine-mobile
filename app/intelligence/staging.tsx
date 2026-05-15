import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { ChevronLeft, Search, Filter, ShieldCheck, Inbox, AlertTriangle } from 'lucide-react-native';

import { Text, View } from '@/components/Themed';
import { Theme } from '../../src/constants/Theme';
import apiClient from '../../src/api/client';
import { TacticalHaptics } from '../../src/utils/haptics';
import OsintStagingCard, { StagingItem } from '../../src/components/Intelligence/OsintStagingCard';
import StagingActions from '../../src/components/Intelligence/StagingActions';

export default function OsintStagingScreen() {
  const router = useRouter();
  const [items, setItems] = useState<StagingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchStagingItems = useCallback(async () => {
    try {
      setError(null);
      const response = await apiClient.get('/mapi/osintStaging/');
      setItems(response.data);
    } catch (err: any) {
      console.error('Error fetching OSINT staging:', err);
      setError('Failed to sync staging feed.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStagingItems();
  }, [fetchStagingItems]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchStagingItems();
  };

  const toggleSelection = (id: number) => {
    TacticalHaptics.soft();
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handlePromote = async (id: number) => {
    try {
      TacticalHaptics.impact();
      await apiClient.post(`/mapi/osintStaging/${id}/promote/`);
      setItems(prev => prev.filter(item => item.id !== id));
      TacticalHaptics.success();
    } catch (err) {
      Alert.alert('Promotion Failed', 'Critical failure during item promotion.');
    }
  };

  const handleDiscard = async (id: number) => {
    try {
      TacticalHaptics.impact();
      await apiClient.post(`/mapi/osintStaging/${id}/discard/`);
      setItems(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      Alert.alert('Discard Failed', 'Failed to remove staging item.');
    }
  };

  const handleBulkPromote = async () => {
    Alert.alert(
      "Promote Items",
      `Are you sure you want to promote ${selectedIds.length} items to primary intelligence?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "VALIDATE", 
          onPress: async () => {
            try {
              setLoading(true);
              await apiClient.post('/mapi/osintStaging/bulk_promote/', { ids: selectedIds });
              setItems(prev => prev.filter(item => !selectedIds.includes(item.id)));
              setSelectedIds([]);
              TacticalHaptics.success();
            } catch (err) {
              Alert.alert('Bulk Action Failed', 'Batch promotion failed.');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleBulkDiscard = async () => {
    Alert.alert(
      "Discard Items",
      `Delete ${selectedIds.length} items from staging?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "DISCARD", 
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              await apiClient.post('/mapi/osintStaging/bulk_discard/', { ids: selectedIds });
              setItems(prev => prev.filter(item => !selectedIds.includes(item.id)));
              setSelectedIds([]);
              TacticalHaptics.impact();
            } catch (err) {
              Alert.alert('Bulk Action Failed', 'Batch discard failed.');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{
        title: 'OSINT STAGING',
        headerStyle: { backgroundColor: Theme.colors.surface },
        headerTintColor: Theme.colors.text,
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: -10, padding: 10 }}>
            <ChevronLeft size={24} color={Theme.colors.text} />
          </TouchableOpacity>
        ),
        headerRight: () => (
          <View style={{ flexDirection: 'row', gap: 15, backgroundColor: 'transparent', marginRight: 10 }}>
            <TouchableOpacity><Search size={20} color={Theme.colors.text} /></TouchableOpacity>
            <TouchableOpacity><Filter size={20} color={Theme.colors.text} /></TouchableOpacity>
          </View>
        )
      }} />

      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Theme.colors.primary} />
          <Text style={styles.loadingText}>SYNCING STAGING BUFFERS...</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <OsintStagingCard 
              item={item}
              selected={selectedIds.includes(item.id)}
              onSelect={toggleSelection}
              onPromote={handlePromote}
              onDiscard={handleDiscard}
            />
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Theme.colors.primary} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <ShieldCheck size={48} color={Theme.colors.success + '44'} />
              <Text style={styles.emptyTitle}>ALL CLEAR</Text>
              <Text style={styles.emptySubtitle}>No pending OSINT items requiring review.</Text>
            </View>
          }
        />
      )}

      {error && (
        <View style={styles.errorBanner}>
          <AlertTriangle size={14} color="#fff" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <StagingActions 
        selectedCount={selectedIds.length}
        onBulkPromote={handleBulkPromote}
        onBulkDiscard={handleBulkDiscard}
        onClearSelection={() => setSelectedIds([])}
      />
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
  loadingText: {
    marginTop: 12,
    color: Theme.colors.primary,
    fontFamily: 'Bangers',
    letterSpacing: 1,
  },
  listContent: {
    padding: 12,
    paddingBottom: 100,
  },
  emptyContainer: {
    marginTop: 100,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.8,
  },
  emptyTitle: {
    fontSize: 24,
    fontFamily: 'Bangers',
    color: Theme.colors.success,
    marginTop: 16,
    letterSpacing: 2,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Theme.colors.textMuted,
    marginTop: 8,
    textAlign: 'center',
  },
  errorBanner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: Theme.colors.error,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    gap: 8,
  },
  errorText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  }
});

import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, ActivityIndicator, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { ShieldAlert, Info, Filter, Zap } from 'lucide-react-native';
import { Text, View } from '@/components/Themed';
import { Theme } from '../../src/constants/Theme';
import apiClient from '../../src/api/client';
import { useProjectStore } from '../../src/store/useProjectStore';
import AttackPathCard from '../../src/components/Intelligence/AttackPathCard';

export default function AttackPathExplorer() {
  const router = useRouter();
  const { currentProject } = useProjectStore();
  const [paths, setPaths] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPaths = useCallback(async () => {
    if (!currentProject) return;
    try {
      // Use the updated endpoint that supports project filtering
      const response = await apiClient.get(`apme/paths/?project=${currentProject}`);
      setPaths(response.data.paths || []);
    } catch (error) {
      console.error('Failed to fetch attack paths', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentProject]);

  useEffect(() => {
    fetchPaths();
  }, [fetchPaths]);

  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <Zap size={48} color={Theme.colors.surface} />
      <Text style={styles.emptyText}>No Attack Paths Modeled</Text>
      <Text style={styles.emptySubtext}>
        Run an AI Attack Path Modeling task from a scan detail page to generate tactical exploit chains.
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ 
        title: 'Attack Path Explorer',
        headerRight: () => (
          <TouchableOpacity style={styles.headerBtn}>
            <Filter size={20} color={Theme.colors.primary} />
          </TouchableOpacity>
        )
      }} />

      {loading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator color={Theme.colors.primary} />
          <Text style={styles.loadingText}>Simulating Exploit Chains...</Text>
        </View>
      ) : (
        <FlatList
          data={paths}
          renderItem={({ item }) => (
            <AttackPathCard 
              path={item} 
              onPress={() => router.push({
                pathname: `/intelligence/${item.path_id}` as any,
                params: { 
                  pathData: JSON.stringify(item)
                }
              })} 
            />
          )}
          keyExtractor={(item, index) => item.path_id + index}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmpty}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={() => { setRefreshing(true); fetchPaths(); }} 
              tintColor={Theme.colors.primary}
            />
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
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
  },
  loadingText: {
    marginTop: 12,
    color: Theme.colors.textMuted,
    fontSize: 12,
    fontFamily: 'Orbitron',
  },
  headerBtn: {
    marginRight: 8,
    padding: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 100,
    paddingHorizontal: 40,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: 'bold',
    color: Theme.colors.text,
    fontFamily: 'Orbitron',
    textAlign: 'center',
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 12,
    color: Theme.colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  }
});

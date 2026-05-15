import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { Stack } from 'expo-router';
import { ShieldAlert } from 'lucide-react-native';
import { View, Text } from 'react-native';
import { Theme } from '../../src/constants/Theme';
import apiClient from '../../src/api/client';
import { useProjectStore } from '../../src/store/useProjectStore';
import SecretLeakViewer from '../../src/components/Intelligence/SecretLeakViewer';

export default function SecretLeakExplorer() {
  const { currentProject } = useProjectStore();
  const [leaks, setLeaks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchLeaks = useCallback(async () => {
    if (!currentProject) return;
    try {
      const response = await apiClient.get(`/mapi/secretLeaks/?project=${currentProject}`);
      const data = response.data.results || response.data;
      setLeaks(data);
    } catch (error) {
      console.error('Failed to fetch secret leaks', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentProject]);

  useEffect(() => {
    fetchLeaks();
  }, [fetchLeaks]);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ 
        title: 'Secret Leak Explorer',
        headerTitleAlign: 'center'
      }} />
      
      {loading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator color={Theme.colors.primary} />
          <Text style={styles.loadingText}>Decrypting Tactical Intel...</Text>
        </View>
      ) : (
        <SecretLeakViewer 
          leaks={leaks} 
          onRefresh={() => { setRefreshing(true); fetchLeaks(); }} 
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
  loadingText: {
    marginTop: 12,
    color: Theme.colors.textMuted,
    fontSize: 12,
    fontFamily: 'Bangers',
  },
});

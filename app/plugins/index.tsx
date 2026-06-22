import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, RefreshControl, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { Stack } from 'expo-router';
import { Theme } from '../../src/constants/Theme';
import {
  listPlugins, setPluginEnabled, getInstallStatus,
  Plugin, InstallStatus,
} from '../../src/api/plugins';
import PluginCard from '../../src/components/Plugins/PluginCard';
import InstallProgressModal from '../../src/components/Plugins/InstallProgressModal';

export default function PluginManagementPage() {
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [installStatus, setInstallStatus] = useState<InstallStatus | null>(null);
  const [installVisible, setInstallVisible] = useState(false);

  const fetchPlugins = useCallback(async () => {
    setError(null);
    try {
      const data = await listPlugins();
      setPlugins(data);
    } catch {
      setError('Failed to load plugins');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchPlugins(); }, [fetchPlugins]);

  const handleToggle = async (slug: string, current: boolean) => {
    try {
      const updated = await setPluginEnabled(slug, !current);
      setPlugins((prev) => prev.map((p) => (p.slug === slug ? updated : p)));
    } catch {
      Alert.alert('Error', 'Failed to update plugin');
    }
  };

  const pollInstall = async (installId: string) => {
    setInstallVisible(true);
    const interval = setInterval(async () => {
      try {
        const status = await getInstallStatus(installId);
        setInstallStatus(status);
        if (status.status !== 'running') {
          clearInterval(interval);
          if (status.status === 'completed') {
            fetchPlugins();
            setTimeout(() => setInstallVisible(false), 2000);
          }
        }
      } catch {
        clearInterval(interval);
      }
    }, 1000);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Plugin Management',
          headerStyle: { backgroundColor: Theme.colors.background },
          headerTintColor: '#fff',
        }}
      />

      {loading && <ActivityIndicator color={Theme.colors.primary} style={styles.spinner} />}
      {!!error && <Text style={styles.error}>{error}</Text>}

      {!loading && plugins.length === 0 && !error && (
        <Text style={styles.empty}>No plugins installed.</Text>
      )}

      <FlatList
        data={plugins}
        keyExtractor={(p) => p.slug}
        renderItem={({ item }) => (
          <PluginCard plugin={item} onToggleEnabled={handleToggle} />
        )}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchPlugins(); }} tintColor={Theme.colors.primary} />
        }
      />

      <InstallProgressModal visible={installVisible} status={installStatus} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  list: { padding: Theme.spacing.md },
  spinner: { marginTop: Theme.spacing.xl },
  error: { color: Theme.colors.error, textAlign: 'center', margin: Theme.spacing.md },
  empty: { color: Theme.colors.textMuted, textAlign: 'center', marginTop: Theme.spacing.xl },
});

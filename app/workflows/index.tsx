import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { Stack } from 'expo-router';
import { Theme } from '../../src/constants/Theme';
import { listWorkflows, WorkflowDef } from '../../src/api/workflows';
import WorkflowCard from '../../src/components/Workflows/WorkflowCard';
import WorkflowLaunchModal from '../../src/components/Workflows/WorkflowLaunchModal';

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<WorkflowDef[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<WorkflowDef | null>(null);

  const fetchWorkflows = useCallback(async () => {
    setError(null);
    try {
      const data = await listWorkflows();
      setWorkflows(data);
    } catch {
      setError('Failed to load workflows');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchWorkflows(); }, [fetchWorkflows]);

  const handleLaunched = (wfId: string) => {
    Alert.alert('Workflow Started', `Workflow ID: ${wfId}\n\nMonitor progress in the Temporal UI.`);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Workflows', headerStyle: { backgroundColor: Theme.colors.background }, headerTintColor: Theme.colors.text }} />

      {loading && <ActivityIndicator color={Theme.colors.primary} style={styles.spinner} />}
      {!!error && <Text style={styles.error}>{error}</Text>}

      <FlatList
        data={workflows}
        keyExtractor={(w) => w.slug}
        renderItem={({ item }) => (
          <WorkflowCard workflow={item} onLaunch={() => setSelected(item)} />
        )}
        contentContainerStyle={styles.list}
      />

      <WorkflowLaunchModal
        workflow={selected}
        onClose={() => setSelected(null)}
        onLaunched={handleLaunched}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  list: { padding: Theme.spacing.md },
  spinner: { marginTop: Theme.spacing.xl },
  error: { color: Theme.colors.error, textAlign: 'center', margin: Theme.spacing.md },
});

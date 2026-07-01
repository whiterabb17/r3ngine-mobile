import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  RefreshControl, ActivityIndicator, Alert,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { ChevronLeft, Wrench, RefreshCw, Trash2, AlertTriangle } from 'lucide-react-native';
import { Theme } from '../../src/constants/Theme';
import { listTools, updateTool, uninstallTool, InstalledTool } from '../../src/api/settings';

export default function ToolsScreen() {
  const router = useRouter();
  const [tools, setTools] = useState<InstalledTool[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actioningName, setActioningName] = useState<string | null>(null);

  const fetchTools = useCallback(async () => {
    try {
      setError(null);
      const data = await listTools();
      setTools(data);
    } catch {
      setError('Failed to load tools');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchTools(); }, [fetchTools]);

  const handleUpdate = (tool: InstalledTool) => {
    Alert.alert(
      'Update Tool',
      `Update ${tool.name}? This may take several minutes.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Update',
          onPress: async () => {
            setActioningName(tool.name);
            try {
              const result = await updateTool(tool.name);
              Alert.alert('Update Started', result.message ?? 'Tool update initiated.');
            } catch {
              Alert.alert('Error', 'Failed to start tool update.');
            } finally {
              setActioningName(null);
            }
          },
        },
      ]
    );
  };

  const handleUninstall = (tool: InstalledTool) => {
    Alert.alert(
      'Uninstall Tool',
      `Uninstall ${tool.name}? Scans using this tool will fail.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Uninstall',
          style: 'destructive',
          onPress: async () => {
            setActioningName(tool.name);
            try {
              await uninstallTool(tool.name);
              setTools((prev) => prev.filter((t) => t.name !== tool.name));
            } catch {
              Alert.alert('Error', 'Failed to uninstall tool.');
            } finally {
              setActioningName(null);
            }
          },
        },
      ]
    );
  };

  const renderItem = useCallback(({ item }: { item: InstalledTool }) => {
    const isActioning = actioningName === item.name;
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.toolName}>{item.name}</Text>
          {isActioning && <ActivityIndicator size="small" color={Theme.colors.primary} />}
        </View>
        {item.description ? (
          <Text style={styles.toolDesc} numberOfLines={2}>{item.description}</Text>
        ) : null}
        <View style={styles.actions}>
          {item.update_command && (
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => handleUpdate(item)}
              disabled={isActioning}
            >
              <RefreshCw size={14} color={Theme.colors.info} />
              <Text style={[styles.actionText, { color: Theme.colors.info }]}>Update</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnDestructive]}
            onPress={() => handleUninstall(item)}
            disabled={isActioning}
          >
            <Trash2 size={14} color={Theme.colors.error} />
            <Text style={[styles.actionText, { color: Theme.colors.error }]}>Uninstall</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }, [actioningName]);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{
        title: 'Tool Arsenal',
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
          data={tools}
          renderItem={renderItem}
          keyExtractor={(t) => t.id?.toString() ?? t.name}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchTools(); }}
              tintColor={Theme.colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Wrench size={40} color={Theme.colors.textMuted} />
              <Text style={styles.emptyText}>No tools installed</Text>
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
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  toolName: { fontSize: 15, fontWeight: '700', color: Theme.colors.text },
  toolDesc: { fontSize: 12, color: Theme.colors.textMuted, marginBottom: Theme.spacing.sm, lineHeight: 18 },
  actions: { flexDirection: 'row', gap: Theme.spacing.sm, marginTop: Theme.spacing.sm },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: Theme.borderRadius.sm, borderWidth: 1,
    borderColor: Theme.colors.info + '55', backgroundColor: Theme.colors.info + '11',
  },
  actionBtnDestructive: {
    borderColor: Theme.colors.error + '55', backgroundColor: Theme.colors.error + '11',
  },
  actionText: { fontSize: 12, fontWeight: '600' },
});

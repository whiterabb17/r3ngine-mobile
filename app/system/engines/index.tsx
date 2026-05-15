import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { ChevronRight, Cpu, Settings, Shield, Zap, ChevronLeft } from 'lucide-react-native';
import { Theme } from '../../../src/constants/Theme';
import apiClient from '../../../src/api/client';
import { TacticalHaptics } from '../../../src/utils/haptics';

interface Engine {
  id: number;
  engine_name: string;
  default_engine: boolean;
  tasks: string[];
}

export default function EngineListScreen() {
  const router = useRouter();
  const [engines, setEngines] = useState<Engine[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchEngines = async () => {
    try {
      const response = await apiClient.get('/mapi/listEngines/');
      setEngines(response.data.engines || []);
    } catch (err) {
      console.error('Failed to fetch engines:', err);
      TacticalHaptics.error();
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchEngines();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    TacticalHaptics.soft();
    fetchEngines();
  };

  const renderEngineItem = ({ item }: { item: Engine }) => (
    <TouchableOpacity 
      style={styles.card} 
      onPress={() => router.push(`/system/engines/${item.id}` as any)}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={[styles.iconContainer, item.default_engine && styles.defaultIcon]}>
          <Cpu size={24} color={item.default_engine ? Theme.colors.success : Theme.colors.primary} />
        </View>
        <View style={styles.headerText}>
          <View style={styles.titleRow}>
            <Text style={styles.engineName}>{item.engine_name}</Text>
            {item.default_engine && (
              <View style={styles.defaultBadge}>
                <Text style={styles.defaultBadgeText}>DEFAULT</Text>
              </View>
            )}
          </View>
          <Text style={styles.taskCount}>{item.tasks?.length || 0} TACTICAL MODULES</Text>
        </View>
        <ChevronRight size={20} color={Theme.colors.textMuted} />
      </View>

      <View style={styles.taskPreview}>
        {item.tasks?.slice(0, 3).map((task, i) => (
          <View key={i} style={styles.taskTag}>
            <Text style={styles.taskText}>{task.toUpperCase()}</Text>
          </View>
        ))}
        {(item.tasks?.length || 0) > 3 && (
          <Text style={styles.moreText}>+{(item.tasks?.length || 0) - 3} more</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Theme.colors.primary} />
        <Text style={styles.loadingText}>LOADING ENGINE ARSENAL...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'SCAN ENGINES',
          headerStyle: { backgroundColor: Theme.colors.background },
          headerTintColor: '#fff',
          headerTitleStyle: { fontFamily: 'Bangers' },
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: -10, padding: 10 }}>
              <ChevronLeft size={24} color="#fff" />
            </TouchableOpacity>
          )
        }} 
      />

      <FlatList
        data={engines}
        renderItem={renderEngineItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Theme.colors.primary} />
        }
        ListHeaderComponent={
          <View style={styles.infoBox}>
            <Shield size={20} color={Theme.colors.primary} />
            <Text style={styles.infoText}>
              Select an engine to modify its tactical YAML configuration. Changes affect all future scans using this engine.
            </Text>
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
    color: Theme.colors.primary,
    fontFamily: 'Bangers',
    letterSpacing: 1,
  },
  listContent: {
    padding: Theme.spacing.md,
    paddingBottom: Theme.spacing.xl,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: Theme.colors.primary + '11',
    padding: Theme.spacing.md,
    borderRadius: Theme.borderRadius.md,
    marginBottom: Theme.spacing.lg,
    borderWidth: 1,
    borderColor: Theme.colors.primary + '33',
    alignItems: 'center',
    gap: 12,
  },
  infoText: {
    flex: 1,
    color: Theme.colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
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
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Theme.colors.primary + '11',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Theme.colors.primary + '22',
  },
  defaultIcon: {
    backgroundColor: Theme.colors.success + '11',
    borderColor: Theme.colors.success + '22',
  },
  headerText: {
    flex: 1,
    marginLeft: Theme.spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  engineName: {
    color: Theme.colors.text,
    fontSize: 18,
    fontFamily: 'Bangers',
    letterSpacing: 0.5,
  },
  defaultBadge: {
    backgroundColor: Theme.colors.success + '22',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: Theme.colors.success + '44',
  },
  defaultBadgeText: {
    color: Theme.colors.success,
    fontSize: 8,
    fontWeight: 'bold',
  },
  taskCount: {
    color: Theme.colors.textMuted,
    fontSize: 10,
    fontWeight: 'bold',
    marginTop: 2,
    letterSpacing: 0.5,
  },
  taskPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Theme.spacing.md,
    paddingTop: Theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border + '33',
    gap: 8,
  },
  taskTag: {
    backgroundColor: Theme.colors.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  taskText: {
    color: Theme.colors.textMuted,
    fontSize: 9,
    fontWeight: '900',
  },
  moreText: {
    color: Theme.colors.primary,
    fontSize: 10,
    fontWeight: 'bold',
  },
});

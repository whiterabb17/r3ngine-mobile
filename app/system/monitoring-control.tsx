import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Switch, TouchableOpacity, Alert } from 'react-native';
import { Stack } from 'expo-router';
import { Shield, Target, Activity, Zap } from 'lucide-react-native';
import apiClient from '../../src/api/client';
import { Theme } from '../../src/constants/Theme';
import { TacticalHaptics } from '../../src/utils/haptics';

export default function MonitoringControlScreen() {
  const [targets, setTargets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTargets = async () => {
    try {
      const response = await apiClient.get('/mapi/projects/');
      // Projects usually contain targets, or we can fetch targets directly if endpoint exists
      // Let's assume listTargets exists based on grep
      const targetsResponse = await apiClient.get('/mapi/listTargets/');
      setTargets(targetsResponse.data.results || targetsResponse.data);
    } catch (err) {
      console.error('Failed to fetch targets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTargets();
  }, []);

  const toggleMonitoring = async (targetId: number, currentStatus: boolean) => {
    try {
      TacticalHaptics.soft();
      const response = await apiClient.post('/mapi/toggle/monitoring/', { domain_id: targetId });
      
      if (response.data.status) {
        setTargets(prev => prev.map(t => 
          t.id === targetId ? { ...t, is_monitored: !currentStatus } : t
        ));
        TacticalHaptics.success();
      }
    } catch (err) {
      console.error('Toggle monitoring failed:', err);
      TacticalHaptics.error();
      Alert.alert('Error', 'Failed to update monitoring status.');
    }
  };

  const TargetRow = ({ item }: { item: any }) => (
    <View style={styles.row}>
      <View style={styles.targetInfo}>
        <Target size={20} color={Theme.colors.primary} />
        <View style={styles.textContainer}>
          <Text style={styles.targetName}>{item.name}</Text>
          <Text style={styles.targetDetails}>Freq: {item.monitor_frequency || 'Daily'} • Engine: {item.monitor_engine_name || 'Standard'}</Text>
        </View>
      </View>
      
      <View style={styles.actionContainer}>
        <Text style={[styles.statusText, { color: item.is_monitored ? Theme.colors.secondary : Theme.colors.textMuted }]}>
          {item.is_monitored ? 'ACTIVE' : 'OFF'}
        </Text>
        <Switch
          value={item.is_monitored}
          onValueChange={() => toggleMonitoring(item.id, item.is_monitored)}
          trackColor={{ false: '#333', true: Theme.colors.secondary + '88' }}
          thumbColor={item.is_monitored ? Theme.colors.secondary : '#888'}
        />
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'MONITORING CONTROL',
          headerStyle: { backgroundColor: Theme.colors.surface },
          headerTintColor: Theme.colors.primary,
          headerTitleStyle: { fontFamily: 'Bangers' }
        }} 
      />

      <View style={styles.header}>
        <Activity size={24} color={Theme.colors.secondary} />
        <Text style={styles.headerText}>Continuous Discovery Targets</Text>
        <Text style={styles.headerSubtext}>Manage automated 24/7 scanning for infrastructure discovery. Deletion restricted to Web Console.</Text>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 50 }} color={Theme.colors.primary} />
      ) : (
        <FlatList
          data={targets}
          renderItem={({ item }) => <TargetRow item={item} />}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
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
  header: {
    padding: Theme.spacing.lg,
    backgroundColor: Theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
    alignItems: 'center',
  },
  headerText: {
    color: Theme.colors.text,
    fontFamily: 'Bangers',
    fontSize: 18,
    marginTop: 8,
    letterSpacing: 1,
  },
  headerSubtext: {
    color: Theme.colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 20,
  },
  listContent: {
    padding: Theme.spacing.md,
  },
  row: {
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
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  textContainer: {
    marginLeft: Theme.spacing.md,
  },
  targetName: {
    color: Theme.colors.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  targetDetails: {
    color: Theme.colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  actionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    marginRight: 8,
    width: 45,
    textAlign: 'right',
  },
});

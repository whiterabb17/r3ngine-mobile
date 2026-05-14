import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Switch, TouchableOpacity, Alert } from 'react-native';
import { Stack } from 'expo-router';
import { Calendar, Clock, Play, Pause, Trash2, AlertCircle } from 'lucide-react-native';
import apiClient from '../../src/api/client';
import { Theme } from '../../src/constants/Theme';
import { TacticalHaptics } from '../../src/utils/haptics';

export default function ScheduledScansScreen() {
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSchedules = async () => {
    try {
      const response = await apiClient.get('scheduledScans/');
      setSchedules(response.data.results || response.data);
    } catch (err) {
      console.error('Failed to fetch schedules:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  const toggleSchedule = async (id: number, currentStatus: boolean) => {
    try {
      TacticalHaptics.soft();
      const response = await apiClient.post(`scheduledScans/${id}/toggle/`);
      if (response.data.status) {
        setSchedules(prev => prev.map(s => 
          s.id === id ? { ...s, enabled: !currentStatus } : s
        ));
        TacticalHaptics.success();
      }
    } catch (err) {
      console.error('Toggle schedule failed:', err);
      TacticalHaptics.error();
    }
  };

  const ScheduleRow = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardMain}>
        <View style={styles.iconContainer}>
          <Calendar size={24} color={item.enabled ? Theme.colors.primary : Theme.colors.textMuted} />
        </View>
        <View style={styles.infoContainer}>
          <Text style={styles.nameText}>{item.description}</Text>
          <View style={styles.metaRow}>
            <Clock size={12} color={Theme.colors.textMuted} />
            <Text style={styles.metaText}>{item.frequency}</Text>
          </View>
          <Text style={styles.lastRun}>Last Run: {item.last_run_at ? new Date(item.last_run_at).toLocaleString() : 'Never'}</Text>
        </View>
        <View style={styles.toggleContainer}>
          <Switch
            value={item.enabled}
            onValueChange={() => toggleSchedule(item.id, item.enabled)}
            trackColor={{ false: '#333', true: Theme.colors.primary + '88' }}
            thumbColor={item.enabled ? Theme.colors.primary : '#888'}
          />
          <Text style={[styles.statusLabel, { color: item.enabled ? Theme.colors.primary : Theme.colors.textMuted }]}>
            {item.enabled ? 'ACTIVE' : 'PAUSED'}
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'SCAN SCHEDULES',
          headerTitleStyle: { fontFamily: 'Bangers' }
        }} 
      />

      <View style={styles.banner}>
        <AlertCircle size={16} color={Theme.colors.info} />
        <Text style={styles.bannerText}>Managing automation pipeline. Toggling schedules affects background task execution.</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Theme.colors.primary} />
          <Text style={styles.loadingText}>Loading Automation Pipeline...</Text>
        </View>
      ) : (
        <FlatList
          data={schedules}
          renderItem={({ item }) => <ScheduleRow item={item} />}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Clock size={48} color={Theme.colors.border} />
              <Text style={styles.emptyText}>No scheduled scans found in the database.</Text>
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
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  banner: {
    flexDirection: 'row',
    backgroundColor: Theme.colors.info + '11',
    padding: Theme.spacing.md,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.info + '33',
  },
  bannerText: {
    color: Theme.colors.info,
    fontSize: 11,
    marginLeft: 8,
    flex: 1,
  },
  listContent: {
    padding: Theme.spacing.md,
  },
  card: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadius.lg,
    marginBottom: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    overflow: 'hidden',
  },
  cardMain: {
    flexDirection: 'row',
    padding: Theme.spacing.md,
    alignItems: 'center',
  },
  iconContainer: {
    width: 45,
    height: 45,
    borderRadius: 22,
    backgroundColor: Theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  infoContainer: {
    flex: 1,
    marginLeft: Theme.spacing.md,
  },
  nameText: {
    color: Theme.colors.text,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  metaText: {
    color: Theme.colors.secondary,
    fontSize: 12,
    marginLeft: 6,
    fontWeight: '500',
  },
  lastRun: {
    color: Theme.colors.textMuted,
    fontSize: 10,
  },
  toggleContainer: {
    alignItems: 'center',
    width: 60,
  },
  statusLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    marginTop: 4,
  },
  loadingText: {
    color: Theme.colors.textMuted,
    fontFamily: 'Bangers',
    marginTop: Theme.spacing.md,
  },
  empty: {
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    color: Theme.colors.textMuted,
    marginTop: Theme.spacing.md,
  },
});

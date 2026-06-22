import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { ChevronLeft, HardDrive, AlertTriangle } from 'lucide-react-native';
import { Theme } from '../../src/constants/Theme';
import { getReNgineSettings, patchReNgineSettings, ReNgineSettings } from '../../src/api/settings';

function diskColor(percent: number): string {
  if (percent >= 90) return Theme.colors.error;
  if (percent >= 80) return Theme.colors.warning;
  return Theme.colors.success;
}

export default function ReNgineSettingsScreen() {
  const router = useRouter();
  const [settings, setSettings] = useState<ReNgineSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    try {
      setError(null);
      const data = await getReNgineSettings();
      setSettings(data);
    } catch {
      setError('Failed to load settings');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const handleQueueingToggle = async () => {
    if (!settings) return;
    setToggling(true);
    const newValue = !settings.enable_scan_queueing;
    try {
      await patchReNgineSettings({ enable_scan_queueing: newValue });
      setSettings((s) => s ? { ...s, enable_scan_queueing: newValue } : s);
    } catch {
      Alert.alert('Error', 'Failed to update scan queueing setting.');
    } finally {
      setToggling(false);
    }
  };

  const fillColor = settings ? diskColor(settings.consumed_percent) : Theme.colors.textMuted;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{
        title: 'ReNgine Settings',
        headerStyle: { backgroundColor: Theme.colors.surface },
        headerTintColor: Theme.colors.primary,
        headerTitleStyle: { fontFamily: 'Bangers', fontSize: 22 },
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ChevronLeft size={26} color={Theme.colors.text} />
          </TouchableOpacity>
        ),
      }} />

      {loading ? (
        <View style={styles.center}><ActivityIndicator color={Theme.colors.primary} /></View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchSettings(); }} tintColor={Theme.colors.primary} />
          }
        >
          {error && (
            <View style={styles.errorBanner}>
              <AlertTriangle size={16} color={Theme.colors.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {settings && (
            <>
              <Text style={styles.sectionTitle}>Disk Usage</Text>
              <View style={styles.card}>
                <View style={styles.diskRow}>
                  <HardDrive size={18} color={fillColor} />
                  <Text style={styles.diskLabel}>Storage</Text>
                  <Text style={[styles.diskPercent, { color: fillColor }]}>
                    {settings.consumed_percent}%
                  </Text>
                </View>
                <View style={styles.progressBg}>
                  <View style={[styles.progressFill, { width: `${settings.consumed_percent}%` as any, backgroundColor: fillColor }]} />
                </View>
                <View style={styles.diskStats}>
                  <Text style={styles.diskStat}>Used: {settings.used} GB</Text>
                  <Text style={styles.diskStat}>Free: {settings.free} GB</Text>
                  <Text style={styles.diskStat}>Total: {settings.total} GB</Text>
                </View>
              </View>

              <Text style={styles.sectionTitle}>Scan Behaviour</Text>
              <View style={styles.card}>
                <View style={styles.switchRow}>
                  <View style={styles.switchInfo}>
                    <Text style={styles.switchLabel}>Scan Queueing</Text>
                    <Text style={styles.switchDesc}>Queue scans instead of running concurrently</Text>
                  </View>
                  <Switch
                    value={settings.enable_scan_queueing}
                    onValueChange={handleQueueingToggle}
                    disabled={toggling}
                    trackColor={{ false: Theme.colors.border, true: Theme.colors.primary + '66' }}
                    thumbColor={settings.enable_scan_queueing ? Theme.colors.primary : Theme.colors.textMuted}
                  />
                </View>
              </View>
            </>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: Theme.spacing.md },
  backBtn: { marginLeft: 4, padding: 4 },
  errorBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Theme.colors.error + '22', padding: Theme.spacing.md,
    marginBottom: Theme.spacing.md, borderRadius: Theme.borderRadius.md,
    borderWidth: 1, borderColor: Theme.colors.error + '44',
  },
  errorText: { color: Theme.colors.error, flex: 1, fontSize: 13 },
  sectionTitle: {
    fontSize: 12, color: Theme.colors.textMuted, textTransform: 'uppercase',
    letterSpacing: 0.5, marginBottom: Theme.spacing.sm, marginLeft: Theme.spacing.xs,
    fontFamily: 'Bangers',
  },
  card: {
    backgroundColor: Theme.colors.surface, borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.md, marginBottom: Theme.spacing.lg,
    borderWidth: 1, borderColor: Theme.colors.border,
  },
  diskRow: { flexDirection: 'row', alignItems: 'center', gap: Theme.spacing.sm, marginBottom: Theme.spacing.sm },
  diskLabel: { flex: 1, fontSize: 14, color: Theme.colors.text, fontWeight: '600' },
  diskPercent: { fontSize: 14, fontWeight: '900' },
  progressBg: { height: 8, backgroundColor: Theme.colors.border + '44', borderRadius: 4, overflow: 'hidden', marginBottom: Theme.spacing.sm },
  progressFill: { height: '100%', borderRadius: 4 },
  diskStats: { flexDirection: 'row', justifyContent: 'space-between' },
  diskStat: { fontSize: 12, color: Theme.colors.textMuted },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  switchInfo: { flex: 1, marginRight: Theme.spacing.md },
  switchLabel: { fontSize: 15, color: Theme.colors.text, fontWeight: '600' },
  switchDesc: { fontSize: 12, color: Theme.colors.textMuted, marginTop: 2 },
});

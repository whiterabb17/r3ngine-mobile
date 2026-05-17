import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Switch } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { LogOut, Server, Shield, Bell, Info, Activity, Database, Globe, Clock, Terminal, Cpu } from 'lucide-react-native';
import { Theme } from '../../src/constants/Theme';
import { useAuthStore } from '../../src/store/useAuthStore';
import { useSettingsStore } from '../../src/store/useSettingsStore';
import apiClient from '../../src/api/client';

export default function SettingsScreen() {
  const router = useRouter();
  const { logout } = useAuthStore();
  const { serverIp } = useSettingsStore();
  const [socEnabled, setSocEnabled] = React.useState(false);
  const [loadingSoc, setLoadingSoc] = React.useState(true);

  React.useEffect(() => {
    fetchSocSettings();
  }, []);

  const fetchSocSettings = async () => {
    try {
      const response = await apiClient.get('/mapi/soc-settings/');
      setSocEnabled(response.data.enable_live_log_streaming);
    } catch (err) {
      console.error('Failed to fetch SOC settings:', err);
    } finally {
      setLoadingSoc(false);
    }
  };

  const toggleSocStreaming = async () => {
    const newValue = !socEnabled;
    setSocEnabled(newValue); // Optimistic update
    try {
      await apiClient.post('/mapi/soc-settings/toggle_streaming/');
    } catch (err) {
      console.error('Failed to toggle SOC streaming:', err);
      setSocEnabled(!newValue); // Revert
      Alert.alert('Error', 'Failed to update tactical log configuration.');
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout? Your server settings will be preserved but you will need to log in again.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: () => logout() }
      ]
    );
  };

  const SettingRow = ({ icon: Icon, label, value, onPress, color }: any) => (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.rowLabel}>
        <Icon size={20} color={color || Theme.colors.textMuted} />
        <Text style={styles.labelText}>{label}</Text>
      </View>
      <View style={styles.rowValue}>
        <Text style={styles.valueText}>{value}</Text>
        <Info size={16} color={Theme.colors.textMuted} />
      </View>
    </TouchableOpacity>
  );

  const SwitchRow = ({ icon: Icon, label, value, onValueChange, color, disabled }: any) => (
    <View style={styles.row}>
      <View style={styles.rowLabel}>
        <Icon size={20} color={color || Theme.colors.textMuted} />
        <Text style={styles.labelText}>{label}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ false: '#333', true: Theme.colors.primary + '66' }}
        thumbColor={value ? Theme.colors.primary : '#888'}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen options={{
        title: 'Settings',
        headerStyle: { backgroundColor: Theme.colors.surface },
        headerTintColor: Theme.colors.primary,
        headerTitleStyle: {
          fontFamily: 'Bangers',
          fontSize: 24,
        }
      }} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Connection</Text>
          <View style={styles.card}>
            <SettingRow icon={Server} label="Server URL" value={serverIp} />
            <SettingRow icon={Shield} label="Security" value="JWT Enabled" />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tactical Feeds</Text>
          <View style={styles.card}>
            <SettingRow
              icon={Activity}
              label="ReconX Feed"
              value="Live Discovery"
              onPress={() => router.push('/feeds/monitoring' as any)}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Infrastructure</Text>
          <View style={styles.card}>
            <SettingRow
              icon={Cpu}
              label="Scan Engines"
              value="Tactical YAML"
              onPress={() => router.push('/system/engines' as any)}
            />
            <SettingRow
              icon={Database}
              label="System Assets"
              value="Engines & Tools"
              onPress={() => router.push('/control' as any)}
            />
            <SettingRow
              icon={Globe}
              label="Proxy Control"
              value="Traffic Routing"
              onPress={() => router.push('/system/proxies' as any)}
            />
            <SettingRow
              icon={Shield}
              label="Monitoring Hub"
              value="Continuous Discovery"
              onPress={() => router.push('/system/monitoring-control' as any)}
            />
            <SettingRow
              icon={Clock}
              label="Scan Schedules"
              value="Automation Pipeline"
              onPress={() => router.push('/system/schedules' as any)}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <View style={styles.card}>
            <SettingRow icon={Bell} label="Notifications" value="Push Disabled" />
            <SwitchRow
              icon={Terminal}
              label="Live Log Streaming"
              value={socEnabled}
              onValueChange={toggleSocStreaming}
              color={socEnabled ? Theme.colors.primary : Theme.colors.textMuted}
              disabled={loadingSoc}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Diagnostics</Text>
          <View style={styles.card}>
            <SettingRow
              icon={Activity}
              label="System Health"
              value="Tactical Status"
              onPress={() => router.push('/system/health' as any)}
            />
            <SettingRow
              icon={Info}
              label="App Diagnostics"
              value="Technical Info"
              onPress={() => router.push('/diagnostics' as any)}
            />
          </View>
        </View>

        <View style={styles.section}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <LogOut size={20} color={Theme.colors.error} />
            <Text style={styles.logoutText}>Logout from reNgine</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>reNgine Mobile v1.0.0-alpha</Text>
          <Text style={styles.footerText}>Crafted for Security Researchers</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  scrollContent: {
    padding: Theme.spacing.md,
  },
  section: {
    marginBottom: Theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: 16,
    color: Theme.colors.textMuted,
    textTransform: 'uppercase',
    marginBottom: Theme.spacing.sm,
    marginLeft: Theme.spacing.xs,
    fontFamily: 'Bangers',
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border + '33',
  },
  rowLabel: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  labelText: {
    fontSize: 15,
    color: Theme.colors.text,
    marginLeft: Theme.spacing.md,
  },
  rowValue: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  valueText: {
    fontSize: 14,
    color: Theme.colors.textMuted,
    marginRight: Theme.spacing.sm,
  },
  logoutButton: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.md,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Theme.colors.error + '44',
  },
  logoutText: {
    color: Theme.colors.error,
    fontWeight: 'bold',
    marginLeft: Theme.spacing.sm,
  },
  footer: {
    alignItems: 'center',
    marginTop: Theme.spacing.xl,
    paddingBottom: Theme.spacing.xl,
  },
  footerText: {
    color: Theme.colors.textMuted,
    fontSize: 12,
    marginBottom: 4,
  },
});

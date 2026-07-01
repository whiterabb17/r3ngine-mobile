import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Switch, Linking, Modal } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { LogOut, Server, Shield, Bell, Info, Activity, Database, Globe, Clock, Terminal, Cpu, DollarSign, Search, Package, CheckSquare, Zap, Sliders, Wifi, FileText, Key, Brain, UserCog, Wrench } from 'lucide-react-native';
import * as Notifications from 'expo-notifications';
import { Theme } from '../../src/constants/Theme';
import { useAuthStore } from '../../src/store/useAuthStore';
import { useSettingsStore } from '../../src/store/useSettingsStore';
import { useInstanceStore } from '../../src/store/useInstanceStore';
import InstanceSwitcherModal from '../../src/components/Instances/InstanceSwitcherModal';
import apiClient from '../../src/api/client';
import { requestLocalNotificationPermissionsAsync, registerPushNotificationToken } from '../../src/utils/notifications';
import { registerNotificationTask, unregisterNotificationTask } from '../../src/utils/backgroundTasks';
import { version as appVersion } from '../../package.json';

export default function SettingsScreen() {
  const router = useRouter();
  const { logout } = useAuthStore();
  const { serverIp, pushEnabled, setPushEnabled, pollingInterval, setPollingInterval } = useSettingsStore();
  const [socEnabled, setSocEnabled] = React.useState(false);
  const [loadingSoc, setLoadingSoc] = React.useState(true);
  const [togglingPush, setTogglingPush] = React.useState(false);
  const [showIntervalModal, setShowIntervalModal] = React.useState(false);
  const [instanceSwitcherVisible, setInstanceSwitcherVisible] = React.useState(false);
  const currentInstance = useInstanceStore((s) =>
    s.instances.find((i) => i.id === s.currentInstanceId) ?? null
  );

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

  const promptOpenSettings = () => {
    Alert.alert(
      'Notifications Disabled',
      'Push notifications are disabled for this app. Open Settings to enable them?',
      [
        { text: 'Not Now', style: 'cancel' },
        { text: 'Open Settings', onPress: () => Linking.openSettings() },
      ],
    );
  };

  const handleIntervalSelect = async (interval: number) => {
    setShowIntervalModal(false);
    setTogglingPush(true);
    try {
      const isGranted = await requestLocalNotificationPermissionsAsync();
      if (!isGranted) {
        promptOpenSettings();
        setTogglingPush(false);
        return;
      }
      
      await setPollingInterval(interval);
      await registerNotificationTask(interval);
      await setPushEnabled(true);
      // Register push token with backend
      await registerPushNotificationToken();
    } catch (err) {
      console.error('[Settings] Failed to enable background polling:', err);
      Alert.alert('Error', 'Failed to enable background notifications.');
    } finally {
      setTogglingPush(false);
    }
  };

  const togglePushNotifications = async () => {
    if (togglingPush) return;
    
    if (pushEnabled) {
      setTogglingPush(true);
      try {
        await unregisterNotificationTask();
        await setPushEnabled(false);
        // Deactivate push token on backend
        await apiClient.delete('/mapi/push-token/register/');
      } catch (err) {
        console.error('[Settings] Failed to disable background polling:', err);
      } finally {
        setTogglingPush(false);
      }
    } else {
      // Open modal to select interval instead of turning on immediately
      setShowIntervalModal(true);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout? Your server settings will be preserved but you will need to log in again.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              // Deactivate push token on logout
              await apiClient.delete('/mapi/push-token/register/');
            } catch (err) {
              console.error('[Settings] Failed to unregister push token during logout:', err);
            }
            logout();
          },
        },
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
          <Text style={styles.sectionTitle}>Instances</Text>
          <View style={styles.card}>
            <SettingRow
              icon={Server}
              label="Active Server"
              value={currentInstance?.label ?? 'Not configured'}
              onPress={() => setInstanceSwitcherVisible(true)}
              color={currentInstance ? Theme.colors.primary : Theme.colors.textMuted}
            />
          </View>
        </View>

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
          <Text style={styles.sectionTitle}>Platform Config</Text>
          <View style={styles.card}>
            <SettingRow
              icon={Wifi}
              label="Remote Workers"
              value="Worker Infrastructure"
              onPress={() => router.push('/settings/workers' as any)}
            />
            <SettingRow
              icon={Wrench}
              label="Tool Arsenal"
              value="Installed Tools"
              onPress={() => router.push('/settings/tools' as any)}
            />
            <SettingRow
              icon={Database}
              label="ReNgine Settings"
              value="System & Disk"
              onPress={() => router.push('/settings/rengine-settings' as any)}
            />
            <SettingRow
              icon={FileText}
              label="Report Settings"
              value="Branding & Output"
              onPress={() => router.push('/settings/report-settings' as any)}
            />
            <SettingRow
              icon={Bell}
              label="Notification Settings"
              value="Webhooks & Events"
              onPress={() => router.push('/settings/notification-settings' as any)}
            />
            <SettingRow
              icon={Shield}
              label="OpSec"
              value="Configure on web"
              onPress={() => router.push('/settings/opsec' as any)}
              color={Theme.colors.textMuted}
            />
            <SettingRow
              icon={Key}
              label="API Vault"
              value="Configure on web"
              onPress={() => router.push('/settings/api-vault' as any)}
              color={Theme.colors.textMuted}
            />
            <SettingRow
              icon={Brain}
              label="LLM Toolkit"
              value="Configure on web"
              onPress={() => router.push('/settings/llm-toolkit' as any)}
              color={Theme.colors.textMuted}
            />
            <SettingRow
              icon={Sliders}
              label="Tool Settings"
              value="Configure on web"
              onPress={() => router.push('/settings/tool-settings' as any)}
              color={Theme.colors.textMuted}
            />
            <SettingRow
              icon={UserCog}
              label="Admin"
              value="Configure on web"
              onPress={() => router.push('/settings/admin' as any)}
              color={Theme.colors.textMuted}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <View style={styles.card}>
            <SwitchRow
              icon={Bell}
              label="Push Notifications"
              value={pushEnabled ?? false}
              onValueChange={togglePushNotifications}
              color={(pushEnabled ?? false) ? Theme.colors.primary : Theme.colors.textMuted}
              disabled={togglingPush}
            />
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
          <Text style={styles.sectionTitle}>Org & Workflows</Text>
          <View style={styles.card}>
            <SettingRow
              icon={DollarSign}
              label="Bounty Hub"
              value="Program Browser"
              onPress={() => router.push('/bounty' as any)}
            />
            <SettingRow
              icon={Search}
              label="Global Search"
              value="Cross-Entity Search"
              onPress={() => router.push('/search' as any)}
            />
            <SettingRow
              icon={Package}
              label="Plugin Management"
              value="Installed Plugins"
              onPress={() => router.push('/plugins' as any)}
            />
            <SettingRow
              icon={CheckSquare}
              label="Todos"
              value="Task Management"
              onPress={() => router.push('/todos' as any)}
            />
            <SettingRow
              icon={Zap}
              label="Workflows"
              value="Temporal Workflows"
              onPress={() => router.push('/workflows' as any)}
            />
            <SettingRow
              icon={Sliders}
              label="Profiles"
              value="Scan Profiles"
              onPress={() => router.push('/profiles' as any)}
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
          <Text style={styles.footerText}>reNgine Mobile v{appVersion}</Text>
          <Text style={styles.footerText}>Crafted for Security Researchers</Text>
        </View>
      </ScrollView>

      <InstanceSwitcherModal
        visible={instanceSwitcherVisible}
        onClose={() => setInstanceSwitcherVisible(false)}
      />

      {/* Interval Selection Modal */}
      <Modal visible={showIntervalModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Check for Notifications</Text>
            <Text style={styles.modalSubtitle}>
              To save battery, notifications are pulled in the background. Select how often to check:
            </Text>
            
            <TouchableOpacity style={styles.intervalOption} onPress={() => handleIntervalSelect(15)}>
              <Text style={styles.intervalText}>Every 15 Minutes</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.intervalOption} onPress={() => handleIntervalSelect(30)}>
              <Text style={styles.intervalText}>Every 30 Minutes</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.intervalOption} onPress={() => handleIntervalSelect(60)}>
              <Text style={styles.intervalText}>Every 1 Hour</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.intervalOption, styles.cancelOption]} onPress={() => setShowIntervalModal(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Theme.spacing.lg,
  },
  modalContent: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.lg,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  modalTitle: {
    fontSize: 20,
    color: Theme.colors.text,
    fontFamily: 'Bangers',
    marginBottom: Theme.spacing.sm,
    textAlign: 'center',
    letterSpacing: 1,
  },
  modalSubtitle: {
    fontSize: 14,
    color: Theme.colors.textMuted,
    marginBottom: Theme.spacing.xl,
    textAlign: 'center',
    lineHeight: 20,
  },
  intervalOption: {
    backgroundColor: Theme.colors.background,
    padding: Theme.spacing.md,
    borderRadius: Theme.borderRadius.md,
    marginBottom: Theme.spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Theme.colors.border + '55',
  },
  intervalText: {
    color: Theme.colors.text,
    fontSize: 16,
    fontWeight: '500',
  },
  cancelOption: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    marginTop: Theme.spacing.sm,
  },
  cancelText: {
    color: Theme.colors.error,
    fontSize: 16,
    fontWeight: '500',
  },
});

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Stack } from 'expo-router';
import { LogOut, Server, Shield, Bell, Info } from 'lucide-react-native';
import { Theme } from '../../src/constants/Theme';
import { useAuthStore } from '../../src/store/useAuthStore';
import { useSettingsStore } from '../../src/store/useSettingsStore';

export default function SettingsScreen() {
  const { logout } = useAuthStore();
  const { serverIp } = useSettingsStore();

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

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Settings' }} />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Connection</Text>
          <View style={styles.card}>
            <SettingRow icon={Server} label="Server URL" value={serverIp} />
            <SettingRow icon={Shield} label="Security" value="JWT Enabled" />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <View style={styles.card}>
            <SettingRow icon={Bell} label="Notifications" value="Push Disabled" />
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
    fontSize: 14,
    fontWeight: 'bold',
    color: Theme.colors.textMuted,
    textTransform: 'uppercase',
    marginBottom: Theme.spacing.sm,
    marginLeft: Theme.spacing.xs,
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

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Platform } from 'react-native';
import { Stack } from 'expo-router';
import { Activity, Server, Shield, Smartphone, Terminal, RefreshCcw } from 'lucide-react-native';
import { useAuthStore } from '../src/store/useAuthStore';
import { useSettingsStore } from '../src/store/useSettingsStore';
import apiClient from '../src/api/client';
import axios from 'axios';
import { Theme } from '../src/constants/Theme';
import * as Device from 'expo-device';

export default function Diagnostics() {
  const { isAuthenticated, token } = useAuthStore();
  const { serverIp } = useSettingsStore();
  const [pingStatus, setPingStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [lastCheck, setLastCheck] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const checkConnectivity = async () => {
    setPingStatus('checking');
    try {
      const baseUrl = serverIp ? (serverIp.includes('://') ? serverIp : `http://${serverIp}`) : '';
      if (!baseUrl) throw new Error('No IP');
      await axios.get(`${baseUrl}/api/auth/token/refresh/`, { timeout: 5000 });
      setPingStatus('online');
    } catch (e) {
      setPingStatus('offline');
    }
    setLastCheck(new Date());
    setRefreshing(false);
  };

  useEffect(() => {
    checkConnectivity();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    checkConnectivity();
  };

  const InfoRow = ({ icon: Icon, label, value, color }: any) => (
    <View style={styles.row}>
      <View style={styles.labelContainer}>
        <Icon size={18} color={color || Theme.colors.textMuted} />
        <Text style={styles.label}>{label}</Text>
      </View>
      <Text style={[styles.value, color ? { color } : {}]}>{value}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'System Diagnostics', headerStyle: { backgroundColor: Theme.colors.background }, headerTintColor: '#fff' }} />
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Theme.colors.primary} />}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Network & Server</Text>
          <View style={styles.card}>
            <InfoRow icon={Server} label="Server IP" value={serverIp || 'Not Configured'} />
            <InfoRow 
              icon={Activity} 
              label="Status" 
              value={pingStatus.toUpperCase()} 
              color={pingStatus === 'online' ? Theme.colors.success : pingStatus === 'offline' ? Theme.colors.error : Theme.colors.textMuted} 
            />
            <InfoRow icon={RefreshCcw} label="Last Checked" value={lastCheck ? lastCheck.toLocaleTimeString() : 'Never'} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Authentication</Text>
          <View style={styles.card}>
            <InfoRow 
              icon={Shield} 
              label="Auth State" 
              value={isAuthenticated ? 'Authenticated' : 'Not Authenticated'} 
              color={isAuthenticated ? Theme.colors.success : Theme.colors.error}
            />
            <InfoRow 
              icon={Terminal} 
              label="Access Token" 
              value={token ? `${token.substring(0, 10)}...${token.substring(token.length - 10)}` : 'None'} 
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Device Info</Text>
          <View style={styles.card}>
            <InfoRow icon={Smartphone} label="Model" value={Device.modelName || 'Unknown'} />
            <InfoRow icon={Smartphone} label="OS Version" value={`${Device.osName} ${Device.osVersion}`} />
            <InfoRow icon={Smartphone} label="App Version" value="1.0.0 (Alpha)" />
          </View>
        </View>

        {__DEV__ && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Raw Debug Data</Text>
            <View style={styles.debugCard}>
              <Text style={styles.debugText}>
                {JSON.stringify({
                  auth: useAuthStore.getState(),
                  settings: useSettingsStore.getState(),
                }, null, 2)}
              </Text>
            </View>
          </View>
        )}
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
    marginBottom: Theme.spacing.lg,
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
    padding: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border + '33',
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    fontSize: 15,
    color: Theme.colors.text,
    marginLeft: Theme.spacing.sm,
  },
  value: {
    fontSize: 15,
    color: Theme.colors.textMuted,
    fontWeight: '500',
  },
  debugCard: {
    backgroundColor: '#000',
    borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Theme.colors.primary + '66',
  },
  debugText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: '#00FF00',
    fontSize: 12,
  },
});

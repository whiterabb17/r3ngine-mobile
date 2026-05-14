import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Switch, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert 
} from 'react-native';
import { Stack } from 'expo-router';
import { Globe, RefreshCw, Save, Shield, List } from 'lucide-react-native';
import apiClient from '../../src/api/client';
import { Theme } from '../../src/constants/Theme';
import { TacticalHaptics } from '../../src/utils/haptics';

export default function ProxySettingsScreen() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [settings, setSettings] = useState({
    use_proxy: false,
    proxies: '',
    use_proxychains: false
  });

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('rengine/proxy-settings/');
      setSettings(response.data);
    } catch (err) {
      console.error('Failed to fetch proxy settings:', err);
      Alert.alert('Error', 'Failed to load proxy settings from server.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSave = async () => {
    try {
      setSaving(true);
      TacticalHaptics.soft();
      await apiClient.post('rengine/proxy-settings/', settings);
      TacticalHaptics.success();
      Alert.alert('Success', 'Proxy settings updated successfully.');
    } catch (err) {
      console.error('Failed to save proxy settings:', err);
      TacticalHaptics.error();
      Alert.alert('Error', 'Failed to save proxy settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleFetchProxies = async () => {
    try {
      setFetching(true);
      TacticalHaptics.trigger();
      const response = await apiClient.post('rengine/fetch-proxies/');
      if (response.data.status) {
        Alert.alert(
          'Task Started', 
          'Proxy fetch task has been initiated in the background. Your proxy list will be updated automatically.'
        );
        // Refresh after a delay to see if proxies updated
        setTimeout(fetchSettings, 5000);
      }
    } catch (err) {
      console.error('Failed to fetch proxies:', err);
      TacticalHaptics.error();
      Alert.alert('Error', 'Failed to initiate proxy fetch task.');
    } finally {
      setFetching(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Theme.colors.primary} />
        <Text style={styles.loadingText}>Accessing Encryption Layer...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'PROXY CONTROL',
          headerTitleStyle: { fontFamily: 'Bangers' }
        }} 
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Shield size={18} color={Theme.colors.primary} />
            <Text style={styles.sectionTitle}>Global Proxy Policy</Text>
          </View>
          
          <View style={styles.card}>
            <View style={styles.settingRow}>
              <View>
                <Text style={styles.settingLabel}>Enable Proxy Routing</Text>
                <Text style={styles.settingDesc}>Route all tactical traffic through nodes</Text>
              </View>
              <Switch 
                value={settings.use_proxy} 
                onValueChange={(val) => setSettings({...settings, use_proxy: val})}
                trackColor={{ false: '#333', true: Theme.colors.primary + '88' }}
                thumbColor={settings.use_proxy ? Theme.colors.primary : '#888'}
              />
            </View>

            <View style={[styles.settingRow, { borderBottomWidth: 0 }]}>
              <View>
                <Text style={styles.settingLabel}>Use Proxychains</Text>
                <Text style={styles.settingDesc}>Advanced chaining for multi-hop anonymity</Text>
              </View>
              <Switch 
                value={settings.use_proxychains} 
                onValueChange={(val) => setSettings({...settings, use_proxychains: val})}
                trackColor={{ false: '#333', true: Theme.colors.secondary + '88' }}
                thumbColor={settings.use_proxychains ? Theme.colors.secondary : '#888'}
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <List size={18} color={Theme.colors.info} />
            <Text style={styles.sectionTitle}>Tactical Proxy List</Text>
          </View>

          <View style={styles.card}>
            <TextInput
              style={styles.proxyInput}
              multiline
              placeholder="Enter proxies (one per line)...&#10;e.g. http://1.2.3.4:8080"
              placeholderTextColor="#555"
              value={settings.proxies}
              onChangeText={(val) => setSettings({...settings, proxies: val})}
            />
          </View>
          <Text style={styles.helperText}>Formats: http://host:port, socks5://user:pass@host:port</Text>
        </View>

        <View style={styles.actionContainer}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.saveButton]} 
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Save size={20} color="#fff" />
                <Text style={styles.buttonText}>APPLY SETTINGS</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, styles.fetchButton]} 
            onPress={handleFetchProxies}
            disabled={fetching}
          >
            {fetching ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <RefreshCw size={20} color="#fff" />
                <Text style={styles.buttonText}>FETCH & UPDATE</Text>
              </>
            )}
          </TouchableOpacity>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Theme.colors.background,
  },
  loadingText: {
    color: Theme.colors.textMuted,
    fontFamily: 'Bangers',
    marginTop: Theme.spacing.md,
    fontSize: 18,
  },
  scrollContent: {
    padding: Theme.spacing.md,
  },
  section: {
    marginBottom: Theme.spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Theme.spacing.sm,
    marginLeft: Theme.spacing.xs,
  },
  sectionTitle: {
    color: Theme.colors.text,
    fontSize: 14,
    fontFamily: 'Bangers',
    marginLeft: Theme.spacing.sm,
    letterSpacing: 1,
  },
  card: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border + '33',
  },
  settingLabel: {
    color: Theme.colors.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  settingDesc: {
    color: Theme.colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  proxyInput: {
    color: Theme.colors.text,
    padding: Theme.spacing.md,
    height: 200,
    textAlignVertical: 'top',
    fontSize: 14,
    fontFamily: 'monospace',
  },
  helperText: {
    color: Theme.colors.textMuted,
    fontSize: 11,
    marginTop: Theme.spacing.xs,
    marginLeft: Theme.spacing.xs,
    fontStyle: 'italic',
  },
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Theme.spacing.md,
    marginBottom: Theme.spacing.xl,
  },
  actionButton: {
    flex: 0.48,
    flexDirection: 'row',
    height: 50,
    borderRadius: Theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: Theme.colors.primary,
  },
  fetchButton: {
    backgroundColor: Theme.colors.info,
  },
  buttonText: {
    color: '#fff',
    fontFamily: 'Bangers',
    fontSize: 14,
    marginLeft: Theme.spacing.sm,
    letterSpacing: 0.5,
  },
});

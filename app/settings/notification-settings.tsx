import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Switch, ScrollView, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { ChevronLeft, Save, Send, AlertTriangle } from 'lucide-react-native';
import { Theme } from '../../src/constants/Theme';
import { getNotificationSettings, patchNotificationSettings, NotificationSettings } from '../../src/api/settings';

type Channel = { toggleKey: keyof NotificationSettings; urlKey: keyof NotificationSettings; label: string };

const CHANNELS: Channel[] = [
  { toggleKey: 'send_to_slack',    urlKey: 'slack_hook_url',     label: 'Slack' },
  { toggleKey: 'send_to_discord',  urlKey: 'discord_hook_url',   label: 'Discord' },
  { toggleKey: 'send_to_telegram', urlKey: 'telegram_bot_token', label: 'Telegram' },
  { toggleKey: 'send_to_lark',     urlKey: 'lark_hook_url',      label: 'Lark' },
];

const EVENT_TOGGLES: { key: keyof NotificationSettings; label: string }[] = [
  { key: 'send_scan_status_notif',       label: 'Scan Status' },
  { key: 'send_vuln_notif',              label: 'Vulnerabilities' },
  { key: 'send_interesting_notif',       label: 'Interesting Findings' },
  { key: 'send_subdomain_changes_notif', label: 'Subdomain Changes' },
];

export default function NotificationSettingsScreen() {
  const router = useRouter();
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [urlValues, setUrlValues] = useState<Record<string, string>>({});

  const fetchSettings = useCallback(async () => {
    try {
      setError(null);
      const data = await getNotificationSettings();
      setSettings(data);
      setUrlValues({
        slack_hook_url: data.slack_hook_url ?? '',
        discord_hook_url: data.discord_hook_url ?? '',
        telegram_bot_token: data.telegram_bot_token ?? '',
        lark_hook_url: data.lark_hook_url ?? '',
        telegram_bot_chat_id: data.telegram_bot_chat_id ?? '',
      });
    } catch {
      setError('Failed to load notification settings');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const handleToggle = (key: keyof NotificationSettings, value: boolean) => {
    setSettings((s) => s ? { ...s, [key]: value } : s);
  };

  const handleSave = async (sendTest = false) => {
    if (!settings) return;
    sendTest ? setTesting(true) : setSaving(true);
    try {
      const payload = {
        ...settings,
        slack_hook_url: urlValues.slack_hook_url || null,
        discord_hook_url: urlValues.discord_hook_url || null,
        telegram_bot_token: urlValues.telegram_bot_token || null,
        lark_hook_url: urlValues.lark_hook_url || null,
        telegram_bot_chat_id: urlValues.telegram_bot_chat_id || null,
        send_test: sendTest,
      } as Partial<NotificationSettings>;
      const result = await patchNotificationSettings(payload);
      Alert.alert('Success', result.message ?? 'Notification settings saved.');
    } catch {
      Alert.alert('Error', 'Failed to save notification settings.');
    } finally {
      setSaving(false);
      setTesting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{
        title: 'Notifications',
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
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchSettings(); }} tintColor={Theme.colors.primary} />}
        >
          {error && (
            <View style={styles.errorBanner}>
              <AlertTriangle size={16} color={Theme.colors.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {settings && (
            <>
              <Text style={styles.sectionTitle}>Channels</Text>
              {CHANNELS.map((ch) => (
                <View key={ch.toggleKey as string} style={styles.card}>
                  <View style={styles.channelHeader}>
                    <Text style={styles.channelLabel}>{ch.label}</Text>
                    <Switch
                      value={Boolean(settings[ch.toggleKey])}
                      onValueChange={(v) => handleToggle(ch.toggleKey, v)}
                      trackColor={{ false: Theme.colors.border, true: Theme.colors.primary + '66' }}
                      thumbColor={Boolean(settings[ch.toggleKey]) ? Theme.colors.primary : Theme.colors.textMuted}
                    />
                  </View>
                  {Boolean(settings[ch.toggleKey]) && (
                    <TextInput
                      style={styles.input}
                      value={urlValues[ch.urlKey as string] ?? ''}
                      onChangeText={(v) => setUrlValues((prev) => ({ ...prev, [ch.urlKey as string]: v }))}
                      placeholder={ch.label === 'Telegram' ? 'Bot token' : 'Webhook URL'}
                      placeholderTextColor={Theme.colors.textMuted}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  )}
                </View>
              ))}

              <Text style={styles.sectionTitle}>Events</Text>
              <View style={styles.card}>
                {EVENT_TOGGLES.map(({ key, label }) => (
                  <View key={key} style={styles.switchRow}>
                    <Text style={styles.switchLabel}>{label}</Text>
                    <Switch
                      value={Boolean(settings[key])}
                      onValueChange={(v) => handleToggle(key, v)}
                      trackColor={{ false: Theme.colors.border, true: Theme.colors.primary + '66' }}
                      thumbColor={Boolean(settings[key]) ? Theme.colors.primary : Theme.colors.textMuted}
                    />
                  </View>
                ))}
              </View>

              <View style={styles.btnRow}>
                <TouchableOpacity
                  style={[styles.btn, styles.btnSecondary, testing && styles.btnDisabled]}
                  onPress={() => handleSave(true)}
                  disabled={testing || saving}
                >
                  {testing
                    ? <ActivityIndicator color={Theme.colors.primary} size="small" />
                    : <>
                        <Send size={14} color={Theme.colors.primary} />
                        <Text style={[styles.btnText, { color: Theme.colors.primary }]}>Send Test</Text>
                      </>
                  }
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.btn, styles.btnPrimary, saving && styles.btnDisabled]}
                  onPress={() => handleSave(false)}
                  disabled={saving || testing}
                >
                  {saving
                    ? <ActivityIndicator color={Theme.colors.background} size="small" />
                    : <>
                        <Save size={14} color={Theme.colors.background} />
                        <Text style={[styles.btnText, { color: Theme.colors.background }]}>Save</Text>
                      </>
                  }
                </TouchableOpacity>
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
  content: { padding: Theme.spacing.md, paddingBottom: Theme.spacing.xl },
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
    padding: Theme.spacing.md, marginBottom: Theme.spacing.md,
    borderWidth: 1, borderColor: Theme.colors.border,
  },
  channelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  channelLabel: { fontSize: 15, fontWeight: '700', color: Theme.colors.text },
  input: {
    marginTop: Theme.spacing.sm, backgroundColor: Theme.colors.background,
    borderWidth: 1, borderColor: Theme.colors.border, borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.sm, color: Theme.colors.text, fontSize: 13,
  },
  switchRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: Theme.spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Theme.colors.border,
  },
  switchLabel: { fontSize: 14, color: Theme.colors.text },
  btnRow: { flexDirection: 'row', gap: Theme.spacing.md, marginTop: Theme.spacing.sm },
  btn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, padding: Theme.spacing.md, borderRadius: Theme.borderRadius.md,
  },
  btnPrimary: { backgroundColor: Theme.colors.primary },
  btnSecondary: { backgroundColor: Theme.colors.primary + '15', borderWidth: 1, borderColor: Theme.colors.primary + '55' },
  btnDisabled: { opacity: 0.6 },
  btnText: { fontWeight: '700', fontSize: 14 },
});

import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Switch, ScrollView, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { ChevronLeft, Save, AlertTriangle } from 'lucide-react-native';
import { Theme } from '../../src/constants/Theme';
import { getReportSettings, patchReportSettings, ReportSettings } from '../../src/api/settings';

export default function ReportSettingsScreen() {
  const router = useRouter();
  const [settings, setSettings] = useState<ReportSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState('');

  const fetchSettings = useCallback(async () => {
    try {
      setError(null);
      const data = await getReportSettings();
      setSettings(data);
      setCompanyName(data.company_name ?? '');
    } catch {
      setError('Failed to load report settings');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      const updated = await patchReportSettings({ company_name: companyName });
      setSettings(updated);
      Alert.alert('Saved', 'Report settings updated.');
    } catch {
      Alert.alert('Error', 'Failed to save report settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (field: keyof ReportSettings, value: boolean) => {
    if (!settings) return;
    setSettings((s) => s ? { ...s, [field]: value } : s);
    try {
      await patchReportSettings({ [field]: value });
    } catch {
      setSettings((s) => s ? { ...s, [field]: !value } : s);
      Alert.alert('Error', 'Failed to update setting.');
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{
        title: 'Report Settings',
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
              <Text style={styles.sectionTitle}>Branding</Text>
              <View style={styles.card}>
                <Text style={styles.fieldLabel}>Company Name</Text>
                <TextInput
                  style={styles.input}
                  value={companyName}
                  onChangeText={setCompanyName}
                  placeholder="Your company name"
                  placeholderTextColor={Theme.colors.textMuted}
                />
                <View style={styles.colorRow}>
                  <Text style={styles.fieldLabel}>Primary Color</Text>
                  <View style={[styles.colorChip, { backgroundColor: settings.primary_color ?? Theme.colors.primary }]}>
                    <Text style={styles.colorChipText}>{settings.primary_color ?? '—'}</Text>
                  </View>
                </View>
                <View style={styles.colorRow}>
                  <Text style={styles.fieldLabel}>Secondary Color</Text>
                  <View style={[styles.colorChip, { backgroundColor: settings.secondary_color ?? Theme.colors.surface }]}>
                    <Text style={styles.colorChipText}>{settings.secondary_color ?? '—'}</Text>
                  </View>
                </View>
              </View>

              <Text style={styles.sectionTitle}>Features</Text>
              <View style={styles.card}>
                {(
                  [
                    ['enable_llm_report_generation', 'AI Report Generation'],
                    ['show_executive_summary', 'Executive Summary'],
                    ['show_rengine_banner', 'Show reNgine Banner'],
                    ['show_footer', 'Show Footer'],
                    ['include_attack_surface_map', 'Attack Surface Map'],
                  ] as [keyof ReportSettings, string][]
                ).map(([field, label]) => (
                  <View key={field} style={styles.switchRow}>
                    <Text style={styles.switchLabel}>{label}</Text>
                    <Switch
                      value={Boolean(settings[field])}
                      onValueChange={(v) => handleToggle(field, v)}
                      trackColor={{ false: Theme.colors.border, true: Theme.colors.primary + '66' }}
                      thumbColor={Boolean(settings[field]) ? Theme.colors.primary : Theme.colors.textMuted}
                    />
                  </View>
                ))}
              </View>

              <TouchableOpacity
                style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving
                  ? <ActivityIndicator color={Theme.colors.background} size="small" />
                  : <>
                      <Save size={16} color={Theme.colors.background} />
                      <Text style={styles.saveBtnText}>Save Changes</Text>
                    </>
                }
              </TouchableOpacity>
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
    padding: Theme.spacing.md, marginBottom: Theme.spacing.lg,
    borderWidth: 1, borderColor: Theme.colors.border,
  },
  fieldLabel: { fontSize: 12, color: Theme.colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 4, marginTop: Theme.spacing.sm },
  input: {
    backgroundColor: Theme.colors.background, borderWidth: 1,
    borderColor: Theme.colors.border, borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.sm, color: Theme.colors.text, fontSize: 15,
  },
  colorRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  colorChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: Theme.borderRadius.sm, marginTop: 4 },
  colorChipText: { fontSize: 11, color: '#fff', fontWeight: '700' },
  switchRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: Theme.spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Theme.colors.border,
  },
  switchLabel: { fontSize: 14, color: Theme.colors.text },
  saveBtn: {
    backgroundColor: Theme.colors.primary, borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.md, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: Theme.colors.background, fontWeight: '700', fontSize: 15, fontFamily: 'Bangers', letterSpacing: 1 },
});

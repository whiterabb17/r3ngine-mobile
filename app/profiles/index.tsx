import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, SectionList, ActivityIndicator, StyleSheet, RefreshControl } from 'react-native';
import { Stack } from 'expo-router';
import { Theme } from '../../src/constants/Theme';
import { listProfiles, ScanProfile } from '../../src/api/profiles';
import ProfileCard from '../../src/components/Profiles/ProfileCard';

export default function ProfilesPage() {
  const [profiles, setProfiles] = useState<ScanProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfiles = useCallback(async () => {
    setError(null);
    try {
      const data = await listProfiles();
      setProfiles(data);
    } catch {
      setError('Failed to load profiles');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchProfiles(); }, [fetchProfiles]);

  const builtin = profiles.filter((p) => p.is_builtin);
  const custom = profiles.filter((p) => !p.is_builtin);

  const sections = [
    ...(builtin.length > 0 ? [{ title: 'Built-in Profiles', data: builtin }] : []),
    ...(custom.length > 0  ? [{ title: 'Custom Profiles', data: custom }] : []),
  ];

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Scan Profiles', headerStyle: { backgroundColor: Theme.colors.background }, headerTintColor: Theme.colors.text }} />

      {loading && <ActivityIndicator color={Theme.colors.primary} style={styles.spinner} />}
      {!!error && <Text style={styles.error}>{error}</Text>}
      {!loading && profiles.length === 0 && !error && (
        <Text style={styles.empty}>No scan profiles found.</Text>
      )}

      <SectionList
        sections={sections}
        keyExtractor={(p) => String(p.id)}
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
          </View>
        )}
        renderItem={({ item }) => <ProfileCard profile={item} />}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchProfiles(); }} tintColor={Theme.colors.primary} />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  list: { padding: Theme.spacing.md },
  spinner: { marginTop: Theme.spacing.xl },
  error: { color: Theme.colors.error, textAlign: 'center', margin: Theme.spacing.md },
  empty: { color: Theme.colors.textMuted, textAlign: 'center', marginTop: Theme.spacing.xl },
  sectionHeader: { backgroundColor: Theme.colors.background, paddingVertical: Theme.spacing.xs, marginBottom: Theme.spacing.xs },
  sectionTitle: { color: Theme.colors.textMuted, fontSize: 12, fontWeight: '600', textTransform: 'uppercase' },
});

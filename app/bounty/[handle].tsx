import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { Theme } from '../../src/constants/Theme';
import { getProgram, BountyProgram } from '../../src/api/bounty';

export default function BountyProgramDetail() {
  const { handle } = useLocalSearchParams<{ handle: string }>();
  const [program, setProgram] = useState<BountyProgram | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!handle) return;
    getProgram(handle)
      .then(setProgram)
      .catch(() => setError('Failed to load program details'))
      .finally(() => setLoading(false));
  }, [handle]);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: program?.name ?? handle, headerStyle: { backgroundColor: Theme.colors.background }, headerTintColor: '#fff' }} />

      {loading && <ActivityIndicator color={Theme.colors.primary} style={styles.spinner} />}
      {!!error && <Text style={styles.error}>{error}</Text>}

      {program && (
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.name}>{program.name}</Text>
          <Text style={styles.handle}>@{program.handle}</Text>

          <Text style={styles.sectionTitle}>In-Scope Assets</Text>
          {program.in_scope.map((s, i) => (
            <View key={i} style={styles.scopeRow}>
              <View style={styles.assetTypeBadge}>
                <Text style={styles.assetTypeText}>{s.asset_type}</Text>
              </View>
              <Text style={styles.assetId} numberOfLines={1}>{s.asset_identifier}</Text>
              <Text style={[styles.severity, { color: severityColor(s.max_severity) }]}>
                {s.max_severity}
              </Text>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

function severityColor(sev: string): string {
  switch (sev?.toLowerCase()) {
    case 'critical': return Theme.colors.vulnerabilities.critical;
    case 'high':     return Theme.colors.vulnerabilities.high;
    case 'medium':   return Theme.colors.vulnerabilities.medium;
    case 'low':      return Theme.colors.vulnerabilities.low;
    default:         return Theme.colors.textMuted;
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  scroll: { padding: Theme.spacing.md },
  spinner: { marginTop: Theme.spacing.xl },
  error: { color: Theme.colors.error, textAlign: 'center', marginTop: Theme.spacing.md },
  name: { color: Theme.colors.text, fontSize: 20, fontWeight: '700', marginBottom: 4 },
  handle: { color: Theme.colors.textMuted, fontSize: 13, marginBottom: Theme.spacing.lg },
  sectionTitle: { color: Theme.colors.textMuted, fontSize: 12, fontWeight: '600', textTransform: 'uppercase', marginBottom: Theme.spacing.sm },
  scopeRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Theme.colors.surface, borderRadius: Theme.borderRadius.md, padding: Theme.spacing.sm, marginBottom: Theme.spacing.xs, gap: Theme.spacing.sm },
  assetTypeBadge: { backgroundColor: Theme.colors.primary + '22', borderRadius: Theme.borderRadius.sm, paddingHorizontal: 6, paddingVertical: 2 },
  assetTypeText: { color: Theme.colors.primary, fontSize: 11, fontWeight: '600' },
  assetId: { flex: 1, color: Theme.colors.text, fontSize: 13 },
  severity: { fontSize: 11, fontWeight: '600' },
});

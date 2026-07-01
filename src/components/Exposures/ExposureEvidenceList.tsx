import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Theme } from '../../constants/Theme';

interface Props {
  data: Record<string, unknown>;
  timestamps?: { first_seen: string; last_seen: string };
}

function stringify(v: unknown): string {
  if (v === null || v === undefined) return '—';
  if (typeof v === 'string') return v;
  try { return JSON.stringify(v); } catch { return String(v); }
}

export default function ExposureEvidenceList({ data, timestamps }: Props) {
  const entries = Object.entries(data);
  return (
    <View style={styles.container}>
      {entries.length === 0 ? (
        <Text style={styles.empty}>No evidence captured.</Text>
      ) : entries.map(([k, v]) => (
        <View key={k} style={styles.row}>
          <Text style={styles.key}>{k}</Text>
          <Text style={styles.value} selectable>{stringify(v)}</Text>
        </View>
      ))}
      {timestamps && (
        <Text style={styles.ts}>first seen {timestamps.first_seen} · last seen {timestamps.last_seen}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: Theme.colors.surface, borderRadius: Theme.borderRadius.md, padding: Theme.spacing.md, borderWidth: 1, borderColor: Theme.colors.border, marginVertical: Theme.spacing.md },
  empty: { color: Theme.colors.textMuted, fontStyle: 'italic' },
  row: { paddingVertical: Theme.spacing.xs, borderBottomWidth: 1, borderBottomColor: Theme.colors.border },
  key: { color: Theme.colors.textMuted, fontSize: 11, letterSpacing: 1, fontWeight: '700' },
  value: { color: Theme.colors.text, fontFamily: 'SpaceMono', marginTop: 2 },
  ts: { color: Theme.colors.textMuted, fontSize: 10, marginTop: Theme.spacing.sm },
});

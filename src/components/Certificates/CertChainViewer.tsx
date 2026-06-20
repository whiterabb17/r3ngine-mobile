import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Theme } from '../../constants/Theme';

interface ChainEntry { subject: string; issuer: string; depth: number }

export default function CertChainViewer({ chain }: { chain: ChainEntry[] }) {
  const sorted = [...chain].sort((a, b) => a.depth - b.depth);
  return (
    <View style={styles.container}>
      <Text style={styles.label}>CHAIN</Text>
      {sorted.map((e) => (
        <View key={`${e.subject}-${e.depth}`} style={[styles.entry, { marginLeft: e.depth * Theme.spacing.md }]}>
          <Text style={styles.subject}>{e.subject}</Text>
          <Text style={styles.issuer}>← {e.issuer}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: Theme.colors.surface, borderRadius: Theme.borderRadius.md, padding: Theme.spacing.md, borderWidth: 1, borderColor: Theme.colors.border, marginVertical: Theme.spacing.sm },
  label: { color: Theme.colors.textMuted, fontSize: 10, letterSpacing: 1, fontWeight: '700', marginBottom: Theme.spacing.sm },
  entry: { paddingVertical: Theme.spacing.xs },
  subject: { color: Theme.colors.text, fontWeight: '700' },
  issuer: { color: Theme.colors.textMuted, fontSize: 11 },
});

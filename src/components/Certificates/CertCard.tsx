import React from 'react';
import { StyleSheet, TouchableOpacity, Text } from 'react-native';
import { Theme } from '../../constants/Theme';
import type { Certificate } from '../../api/certificates';

function expiryColor(cert: Certificate): string {
  if (cert.is_expired) return Theme.colors.danger;
  const ms = new Date(cert.not_after).getTime() - Date.now();
  return ms < 30 * 86400_000 ? Theme.colors.warning : Theme.colors.textMuted;
}

export default function CertCard({ cert, onPress }: { cert: Certificate; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.card}>
      <Text style={styles.subject}>{cert.subject_cn}</Text>
      <Text style={styles.issuer}>issued by {cert.issuer_cn}</Text>
      <Text style={[styles.expiry, { color: expiryColor(cert) }]}>expires {cert.not_after}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: Theme.colors.surface, borderColor: Theme.colors.border, borderWidth: 1, borderRadius: Theme.borderRadius.md, padding: Theme.spacing.md, marginBottom: Theme.spacing.sm },
  subject: { color: Theme.colors.text, fontWeight: '700', fontSize: 14 },
  issuer: { color: Theme.colors.textMuted, fontSize: 12, marginTop: 2 },
  expiry: { fontSize: 11, marginTop: Theme.spacing.xs, fontFamily: 'SpaceMono' },
});

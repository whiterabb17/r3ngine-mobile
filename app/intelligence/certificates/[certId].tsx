import React, { useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Modal, TextInput, Alert } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RefreshCw, Flag } from 'lucide-react-native';
import { Theme } from '../../../src/constants/Theme';
import {
  getCertificateDetail,
  resyncCertificate,
  flagCertificateAnomaly,
  CERTS_KEYS,
  type CertFlag,
} from '../../../src/api/certificates';
import CertChainViewer from '../../../src/components/Certificates/CertChainViewer';
import SanList from '../../../src/components/Certificates/SanList';
import FingerprintRow from '../../../src/components/Certificates/FingerprintRow';

const FLAGS: { key: CertFlag; label: string }[] = [
  { key: 'expired-not-revoked', label: 'EXPIRED NOT REVOKED' },
  { key: 'weak-key', label: 'WEAK KEY' },
  { key: 'suspicious-san', label: 'SUSPICIOUS SAN' },
  { key: 'other', label: 'OTHER' },
];

export default function CertDetail() {
  const { certId } = useLocalSearchParams<{ certId: string }>();
  const id = Number(certId);
  const qc = useQueryClient();
  const [flagOpen, setFlagOpen] = useState(false);
  const [selectedFlag, setSelectedFlag] = useState<CertFlag>('other');
  const [note, setNote] = useState('');

  const q = useQuery({
    queryKey: CERTS_KEYS.detail(id),
    queryFn: () => getCertificateDetail(id),
    staleTime: 30_000,
  });

  const resyncM = useMutation({
    mutationFn: () => resyncCertificate(id),
    onSuccess: () => Alert.alert('Queued', 'Resync started'),
    onSettled: () => void qc.invalidateQueries({ queryKey: CERTS_KEYS.detail(id) }),
  });

  const flagM = useMutation({
    mutationFn: ({ flag, note: n }: { flag: CertFlag; note?: string }) => flagCertificateAnomaly(id, flag, n),
    onSettled: () => void qc.invalidateQueries({ queryKey: CERTS_KEYS.detail(id) }),
  });

  if (q.isLoading || !q.data) {
    return <View style={styles.center}><ActivityIndicator color={Theme.colors.primary} /></View>;
  }

  const c = q.data;

  return (
    <ScrollView style={styles.root} contentContainerStyle={{ padding: Theme.spacing.md }}>
      <Text style={styles.title}>{c.subject_cn}</Text>
      <View style={styles.actions}>
        <TouchableOpacity
          disabled={resyncM.isPending}
          accessibilityLabel="resync"
          onPress={() => resyncM.mutate()}
          style={styles.action}
        >
          {resyncM.isPending
            ? <ActivityIndicator color={Theme.colors.primary} size="small" />
            : <RefreshCw size={16} color={Theme.colors.primary} />}
          <Text style={styles.actionText}>Resync</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setFlagOpen(true)} style={styles.action}>
          <Flag size={16} color={Theme.colors.warning} />
          <Text style={[styles.actionText, { color: Theme.colors.warning }]}>Flag Anomaly</Text>
        </TouchableOpacity>
      </View>
      <CertChainViewer chain={c.chain} />
      <SanList sans={c.san} />
      <FingerprintRow label="SHA-256" value={c.sha256_fingerprint} />
      <FingerprintRow label="SHA-1" value={c.sha1_fingerprint} />

      <Modal visible={flagOpen} transparent animationType="fade" onRequestClose={() => setFlagOpen(false)}>
        <View style={styles.modalBack}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Flag Anomaly</Text>
            <View style={styles.flagChips}>
              {FLAGS.map(f => (
                <TouchableOpacity
                  key={f.key}
                  onPress={() => setSelectedFlag(f.key)}
                  style={[styles.flagChip, selectedFlag === f.key && styles.flagChipActive]}
                >
                  <Text style={[styles.flagChipText, selectedFlag === f.key && styles.flagChipTextActive]}>{f.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={styles.input}
              placeholder="Optional note"
              placeholderTextColor={Theme.colors.textMuted}
              value={note}
              onChangeText={setNote}
              maxLength={1000}
              multiline
            />
            <View style={styles.modalRow}>
              <TouchableOpacity onPress={() => setFlagOpen(false)}>
                <Text style={[styles.modalAction, { color: Theme.colors.textMuted }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => {
                flagM.mutate({ flag: selectedFlag, note: note.slice(0, 1000) || undefined });
                setFlagOpen(false);
                setNote('');
              }}>
                <Text style={styles.modalAction}>Submit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Theme.colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { color: Theme.colors.text, fontSize: 20, fontWeight: '800', marginBottom: Theme.spacing.md },
  actions: { flexDirection: 'row', gap: Theme.spacing.md, marginBottom: Theme.spacing.md },
  action: { flexDirection: 'row', alignItems: 'center', gap: Theme.spacing.xs, padding: Theme.spacing.sm, borderRadius: Theme.borderRadius.md, borderWidth: 1, borderColor: Theme.colors.border },
  actionText: { color: Theme.colors.primary, fontWeight: '700' },
  modalBack: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.7)' },
  modal: { backgroundColor: Theme.colors.surface, borderRadius: Theme.borderRadius.md, padding: Theme.spacing.lg, minWidth: 300, borderColor: Theme.colors.border, borderWidth: 1 },
  modalTitle: { color: Theme.colors.text, fontWeight: '700', marginBottom: Theme.spacing.md },
  flagChips: { flexDirection: 'row', flexWrap: 'wrap', gap: Theme.spacing.xs, marginBottom: Theme.spacing.md },
  flagChip: { paddingHorizontal: Theme.spacing.sm, paddingVertical: 4, borderRadius: Theme.borderRadius.full, borderWidth: 1, borderColor: Theme.colors.border },
  flagChipActive: { backgroundColor: Theme.colors.primary, borderColor: Theme.colors.primary },
  flagChipText: { color: Theme.colors.textMuted, fontSize: 10, fontWeight: '700' },
  flagChipTextActive: { color: Theme.colors.background },
  input: { color: Theme.colors.text, borderColor: Theme.colors.border, borderWidth: 1, borderRadius: Theme.borderRadius.sm, padding: Theme.spacing.sm, minHeight: 60 },
  modalRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: Theme.spacing.md, marginTop: Theme.spacing.md },
  modalAction: { color: Theme.colors.primary, fontWeight: '700' },
});

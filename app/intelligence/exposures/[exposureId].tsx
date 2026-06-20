import React, { useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet, Modal, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Theme } from '../../../src/constants/Theme';
import {
  getExposureDetail,
  updateExposureStatus,
  EXPOSURES_KEYS,
  type Exposure,
  type ExposureStatus,
} from '../../../src/api/exposures';
import ExposureStatusChip from '../../../src/components/Exposures/ExposureStatusChip';
import ExposureEvidenceList from '../../../src/components/Exposures/ExposureEvidenceList';
import ExposureLinkedVulns from '../../../src/components/Exposures/ExposureLinkedVulns';

const DESTRUCTIVE: ExposureStatus[] = ['resolved', 'false_positive'];

export default function ExposureDetail() {
  const { exposureId } = useLocalSearchParams<{ exposureId: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const id = Number(exposureId);
  const [pendingAction, setPendingAction] = useState<ExposureStatus | null>(null);
  const [note, setNote] = useState('');

  const q = useQuery({
    queryKey: EXPOSURES_KEYS.detail(id),
    queryFn: () => getExposureDetail(id),
    staleTime: 30_000,
  });

  const m = useMutation({
    mutationFn: ({ status, note: n }: { status: ExposureStatus; note?: string }) =>
      updateExposureStatus(id, status, n),
    onMutate: async ({ status }) => {
      await qc.cancelQueries({ queryKey: EXPOSURES_KEYS.detail(id) });
      const prev = qc.getQueryData<Exposure>(EXPOSURES_KEYS.detail(id));
      qc.setQueryData<Exposure>(EXPOSURES_KEYS.detail(id), (old) => old ? { ...old, status } : old);
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(EXPOSURES_KEYS.detail(id), ctx.prev);
      Alert.alert('Failed', 'Status update was rejected by the server');
    },
    onSettled: () => void qc.invalidateQueries({ queryKey: EXPOSURES_KEYS.list() }),
  });

  if (q.isLoading || !q.data) {
    return <View style={styles.center}><ActivityIndicator color={Theme.colors.primary} /></View>;
  }

  const e = q.data;

  const dispatchAction = (status: ExposureStatus) => {
    if (DESTRUCTIVE.includes(status)) { setPendingAction(status); return; }
    m.mutate({ status });
  };

  const confirmDestructive = () => {
    if (!pendingAction) return;
    m.mutate({ status: pendingAction, note: note.slice(0, 1000) || undefined });
    setPendingAction(null);
    setNote('');
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={{ padding: Theme.spacing.md }}>
      <Text style={styles.title}>{e.title}</Text>
      <View style={styles.row}>
        <ExposureStatusChip status={e.status} />
      </View>
      <ExposureEvidenceList data={e.evidence_data} timestamps={e.evidence_timestamps} />
      <ExposureLinkedVulns
        ids={e.linked_vulnerability_ids}
        onPressVuln={(vid) => router.push(`/scan/${e.scan_id ?? 0}?vuln=${vid}` as never)}
      />
      <View style={styles.actions}>
        {(['accepted', 'false_positive', 'resolved', 'open'] as ExposureStatus[]).map(status => (
          <TouchableOpacity key={status} style={styles.btn} onPress={() => dispatchAction(status)}>
            <Text style={styles.btnText}>
              {status === 'open' ? 'Reopen' : status === 'false_positive' ? 'Mark FP' : `Mark ${status.charAt(0).toUpperCase()}${status.slice(1)}`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Modal visible={!!pendingAction} transparent animationType="fade" onRequestClose={() => setPendingAction(null)}>
        <View style={styles.modalBack}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Confirm {pendingAction}</Text>
            <TextInput
              style={styles.input}
              placeholder="Optional note"
              placeholderTextColor={Theme.colors.textMuted}
              value={note}
              onChangeText={setNote}
              multiline
              maxLength={1000}
            />
            <View style={styles.modalRow}>
              <TouchableOpacity onPress={() => setPendingAction(null)}>
                <Text style={[styles.modalAction, { color: Theme.colors.textMuted }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={confirmDestructive}>
                <Text style={styles.modalAction}>Confirm</Text>
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
  title: { color: Theme.colors.text, fontSize: 20, fontWeight: '800', marginBottom: Theme.spacing.sm },
  row: { flexDirection: 'row', gap: Theme.spacing.sm, marginBottom: Theme.spacing.md },
  actions: { gap: Theme.spacing.sm, marginTop: Theme.spacing.lg },
  btn: { padding: Theme.spacing.md, borderRadius: Theme.borderRadius.md, borderWidth: 1, borderColor: Theme.colors.primary, alignItems: 'center' },
  btnText: { color: Theme.colors.primary, fontWeight: '700', letterSpacing: 1 },
  modalBack: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.7)' },
  modal: { backgroundColor: Theme.colors.surface, borderRadius: Theme.borderRadius.md, padding: Theme.spacing.lg, minWidth: 280, borderColor: Theme.colors.border, borderWidth: 1 },
  modalTitle: { color: Theme.colors.text, fontWeight: '700', marginBottom: Theme.spacing.md },
  input: { color: Theme.colors.text, borderColor: Theme.colors.border, borderWidth: 1, borderRadius: Theme.borderRadius.sm, padding: Theme.spacing.sm, minHeight: 60 },
  modalRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: Theme.spacing.md, marginTop: Theme.spacing.md },
  modalAction: { color: Theme.colors.primary, fontWeight: '700' },
});

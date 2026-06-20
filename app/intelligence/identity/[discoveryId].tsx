import React, { useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Modal, TextInput } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, X } from 'lucide-react-native';
import { Theme } from '../../../src/constants/Theme';
import {
  getIdentityInfraDetail,
  confirmIdentityProvider,
  dismissIdentityDiscovery,
  IDENTITY_KEYS,
  type IdentityInfraDiscovery,
} from '../../../src/api/identity';
import IdentityProviderBadge from '../../../src/components/Identity/IdentityProviderBadge';
import IdentityEvidence from '../../../src/components/Identity/IdentityEvidence';

export default function IdentityDetail() {
  const { discoveryId } = useLocalSearchParams<{ discoveryId: string }>();
  const id = Number(discoveryId);
  const qc = useQueryClient();
  const [dismissOpen, setDismissOpen] = useState(false);
  const [reason, setReason] = useState('');

  const q = useQuery({
    queryKey: IDENTITY_KEYS.detail(id),
    queryFn: () => getIdentityInfraDetail(id),
    staleTime: 30_000,
  });

  const confirmM = useMutation({
    mutationFn: () => confirmIdentityProvider(id, true),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: IDENTITY_KEYS.detail(id) });
      const prev = qc.getQueryData<IdentityInfraDiscovery>(IDENTITY_KEYS.detail(id));
      qc.setQueryData<IdentityInfraDiscovery>(IDENTITY_KEYS.detail(id), (old) => old ? { ...old, confirmed: true } : old);
      return { prev };
    },
    onError: (_e, _v, ctx) => { if (ctx?.prev) qc.setQueryData(IDENTITY_KEYS.detail(id), ctx.prev); },
    onSettled: () => void qc.invalidateQueries({ queryKey: IDENTITY_KEYS.list() }),
  });

  const dismissM = useMutation({
    mutationFn: (r?: string) => dismissIdentityDiscovery(id, r),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: IDENTITY_KEYS.detail(id) });
      const prev = qc.getQueryData<IdentityInfraDiscovery>(IDENTITY_KEYS.detail(id));
      qc.setQueryData<IdentityInfraDiscovery>(IDENTITY_KEYS.detail(id), (old) => old ? { ...old, dismissed: true } : old);
      return { prev };
    },
    onError: (_e, _v, ctx) => { if (ctx?.prev) qc.setQueryData(IDENTITY_KEYS.detail(id), ctx.prev); },
    onSettled: () => void qc.invalidateQueries({ queryKey: IDENTITY_KEYS.list() }),
  });

  if (q.isLoading || !q.data) {
    return <View style={styles.center}><ActivityIndicator color={Theme.colors.primary} /></View>;
  }

  const d = q.data;

  return (
    <ScrollView style={styles.root} contentContainerStyle={{ padding: Theme.spacing.md }}>
      <View style={styles.head}>
        <IdentityProviderBadge provider={d.provider} />
        {d.confirmed && <Text style={styles.tag}>CONFIRMED</Text>}
        {d.dismissed && <Text style={[styles.tag, { color: Theme.colors.textMuted }]}>DISMISSED</Text>}
      </View>
      <View style={styles.actions}>
        <TouchableOpacity onPress={() => confirmM.mutate()} style={[styles.action, { borderColor: Theme.colors.success }]}>
          <Check size={16} color={Theme.colors.success} />
          <Text style={[styles.actionText, { color: Theme.colors.success }]}>Confirm Provider</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setDismissOpen(true)} style={[styles.action, { borderColor: Theme.colors.danger }]}>
          <X size={16} color={Theme.colors.danger} />
          <Text style={[styles.actionText, { color: Theme.colors.danger }]}>Dismiss as False Match</Text>
        </TouchableOpacity>
      </View>
      <IdentityEvidence signals={d.detection_signals} />

      <Modal visible={dismissOpen} transparent animationType="fade" onRequestClose={() => setDismissOpen(false)}>
        <View style={styles.modalBack}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Dismiss as False Match</Text>
            <TextInput
              style={styles.input}
              placeholder="Optional reason"
              placeholderTextColor={Theme.colors.textMuted}
              value={reason}
              onChangeText={setReason}
              maxLength={1000}
              multiline
            />
            <View style={styles.modalRow}>
              <TouchableOpacity onPress={() => setDismissOpen(false)}>
                <Text style={[styles.modalAction, { color: Theme.colors.textMuted }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => {
                dismissM.mutate(reason.slice(0, 1000) || undefined);
                setDismissOpen(false);
                setReason('');
              }}>
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
  head: { flexDirection: 'row', alignItems: 'center', gap: Theme.spacing.sm, marginBottom: Theme.spacing.md },
  tag: { color: Theme.colors.success, fontSize: 10, letterSpacing: 1, fontWeight: '700' },
  actions: { gap: Theme.spacing.sm, marginBottom: Theme.spacing.lg },
  action: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Theme.spacing.xs, padding: Theme.spacing.md, borderRadius: Theme.borderRadius.md, borderWidth: 1 },
  actionText: { fontWeight: '700', letterSpacing: 1 },
  modalBack: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.7)' },
  modal: { backgroundColor: Theme.colors.surface, borderRadius: Theme.borderRadius.md, padding: Theme.spacing.lg, minWidth: 280, borderColor: Theme.colors.border, borderWidth: 1 },
  modalTitle: { color: Theme.colors.text, fontWeight: '700', marginBottom: Theme.spacing.md },
  input: { color: Theme.colors.text, borderColor: Theme.colors.border, borderWidth: 1, borderRadius: Theme.borderRadius.sm, padding: Theme.spacing.sm, minHeight: 60 },
  modalRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: Theme.spacing.md, marginTop: Theme.spacing.md },
  modalAction: { color: Theme.colors.primary, fontWeight: '700' },
});

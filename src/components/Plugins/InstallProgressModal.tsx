import React from 'react';
import { Modal, View, Text, StyleSheet, SafeAreaView, ActivityIndicator } from 'react-native';
import { CheckCircle, XCircle, Circle } from 'lucide-react-native';
import { Theme } from '../../constants/Theme';
import { InstallStatus, InstallStep } from '../../api/plugins';

interface Props {
  visible: boolean;
  status: InstallStatus | null;
}

function StepRow({ step }: { step: InstallStep }) {
  const icon =
    step.status === 'completed' ? <CheckCircle size={16} color={Theme.colors.success} /> :
    step.status === 'failed'    ? <XCircle size={16} color={Theme.colors.error} /> :
    step.status === 'running'   ? <ActivityIndicator size="small" color={Theme.colors.primary} /> :
    <Circle size={16} color={Theme.colors.textMuted} />;

  return (
    <View style={stepStyles.row}>
      {icon}
      <Text style={stepStyles.label}>{step.label}</Text>
      {!!step.message && <Text style={stepStyles.msg} numberOfLines={1}>{step.message}</Text>}
    </View>
  );
}

const stepStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Theme.spacing.sm, paddingVertical: 6 },
  label: { color: Theme.colors.text, fontSize: 13, flex: 1 },
  msg: { color: Theme.colors.textMuted, fontSize: 11 },
});

export default function InstallProgressModal({ visible, status }: Props) {
  return (
    <Modal visible={visible} animationType="fade" transparent>
      <SafeAreaView style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>
            {status?.status === 'completed' ? '✓ Install Complete' :
             status?.status === 'failed'    ? '✗ Install Failed' : 'Installing Plugin…'}
          </Text>
          {status?.steps.map((s) => <StepRow key={s.key} step={s} />)}
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: Theme.spacing.md },
  card: { backgroundColor: Theme.colors.surface, borderRadius: Theme.borderRadius.lg, padding: Theme.spacing.lg, width: '100%' },
  title: { color: Theme.colors.text, fontSize: 16, fontWeight: '700', marginBottom: Theme.spacing.md },
});

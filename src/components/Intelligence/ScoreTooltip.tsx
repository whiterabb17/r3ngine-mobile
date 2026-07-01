import React from 'react';
import { Modal, Pressable, StyleSheet, View, Text } from 'react-native';
import { Theme } from '../../constants/Theme';
import type { ScoreBreakdown } from '../../api/apme';

interface Props {
  visible: boolean;
  breakdown?: ScoreBreakdown;
  onDismiss: () => void;
}

export default function ScoreTooltip({ visible, breakdown, onDismiss }: Props) {
  if (!breakdown) return null;
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <Pressable style={styles.backdrop} onPress={onDismiss}>
        <View style={styles.card}>
          <Text style={styles.title}>SCORE BREAKDOWN</Text>
          <Row label="Exploitability" value={breakdown.exploitability} />
          <Row label="Impact" value={breakdown.impact} />
          <Row label="Confidence" value={breakdown.confidence} />
        </View>
      </Pressable>
    </Modal>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value.toFixed(1)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.6)' },
  card: { backgroundColor: Theme.colors.surface, borderColor: Theme.colors.border, borderWidth: 1, borderRadius: Theme.borderRadius.md, padding: Theme.spacing.lg, minWidth: 240 },
  title: { color: Theme.colors.primary, fontWeight: '700', letterSpacing: 1, marginBottom: Theme.spacing.md },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: Theme.spacing.xs },
  label: { color: Theme.colors.textMuted },
  value: { color: Theme.colors.text, fontWeight: '700' },
});

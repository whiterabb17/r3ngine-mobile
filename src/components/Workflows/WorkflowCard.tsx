import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Play } from 'lucide-react-native';
import { Theme } from '../../constants/Theme';
import { WorkflowDef } from '../../api/workflows';

interface Props {
  workflow: WorkflowDef;
  onLaunch: () => void;
}

export default function WorkflowCard({ workflow, onLaunch }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.body}>
        <Text style={styles.name}>{workflow.name}</Text>
        <Text style={styles.desc} numberOfLines={2}>{workflow.description}</Text>
        <View style={styles.fields}>
          {workflow.required_fields.map((f) => (
            <View key={f} style={styles.fieldChip}>
              <Text style={styles.fieldText}>{f}</Text>
            </View>
          ))}
        </View>
      </View>
      <TouchableOpacity style={styles.launchBtn} onPress={onLaunch}>
        <Play size={16} color="#fff" fill="#fff" />
        <Text style={styles.launchText}>Launch</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: Theme.colors.surface, borderRadius: Theme.borderRadius.md, padding: Theme.spacing.md, marginBottom: Theme.spacing.sm, borderWidth: StyleSheet.hairlineWidth, borderColor: Theme.colors.border },
  body: { flex: 1 },
  name: { color: Theme.colors.text, fontSize: 15, fontWeight: '600' },
  desc: { color: Theme.colors.textMuted, fontSize: 12, marginTop: 2, marginBottom: Theme.spacing.sm },
  fields: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  fieldChip: { backgroundColor: Theme.colors.primary + '22', borderRadius: Theme.borderRadius.sm, paddingHorizontal: 6, paddingVertical: 2 },
  fieldText: { color: Theme.colors.primary, fontSize: 11 },
  launchBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Theme.colors.primary, borderRadius: Theme.borderRadius.md, paddingHorizontal: Theme.spacing.sm, paddingVertical: Theme.spacing.xs },
  launchText: { color: '#fff', fontWeight: '600', fontSize: 13 },
});

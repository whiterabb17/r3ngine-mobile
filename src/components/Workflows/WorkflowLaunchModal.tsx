import React, { useState } from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, ScrollView,
} from 'react-native';
import { X } from 'lucide-react-native';
import { Theme } from '../../constants/Theme';
import { WorkflowDef, startWorkflow } from '../../api/workflows';

interface Props {
  workflow: WorkflowDef | null;
  onClose: () => void;
  onLaunched: (workflowId: string) => void;
}

export default function WorkflowLaunchModal({ workflow, onClose, onLaunched }: Props) {
  const [fields, setFields] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLaunch = async () => {
    if (!workflow) return;
    const missing = workflow.required_fields.filter((f) => !fields[f]?.trim());
    if (missing.length > 0) {
      setError(`Required: ${missing.join(', ')}`);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const body: Record<string, unknown> = {};
      for (const f of workflow.required_fields) {
        // 'urls' field expects an array
        body[f] = f === 'urls'
          ? fields[f].split('\n').map((u) => u.trim()).filter(Boolean)
          : fields[f].trim();
      }
      const result = await startWorkflow(workflow.slug, body);
      onLaunched(result.workflow_id);
      setFields({});
      onClose();
    } catch {
      setError('Failed to launch workflow');
    } finally {
      setLoading(false);
    }
  };

  if (!workflow) return null;

  return (
    <Modal visible={!!workflow} animationType="slide" transparent onRequestClose={onClose}>
      <SafeAreaView style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Launch: {workflow.name}</Text>
            <TouchableOpacity onPress={onClose}><X size={20} color={Theme.colors.textMuted} /></TouchableOpacity>
          </View>

          <ScrollView>
            {workflow.required_fields.map((field) => (
              <View key={field} style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>{field}</Text>
                <TextInput
                  style={[styles.input, field === 'urls' && styles.multiline]}
                  value={fields[field] ?? ''}
                  onChangeText={(v) => setFields((prev) => ({ ...prev, [field]: v }))}
                  placeholder={field === 'urls' ? 'One URL per line' : `Enter ${field}`}
                  placeholderTextColor={Theme.colors.textMuted}
                  multiline={field === 'urls'}
                  numberOfLines={field === 'urls' ? 4 : 1}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            ))}
          </ScrollView>

          {!!error && <Text style={styles.error}>{error}</Text>}

          <TouchableOpacity
            style={[styles.launchBtn, loading && styles.btnDisabled]}
            onPress={handleLaunch}
            disabled={loading}
          >
            <Text style={styles.launchText}>{loading ? 'Launching…' : 'Launch Workflow'}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: Theme.colors.surface, borderTopLeftRadius: Theme.borderRadius.xl, borderTopRightRadius: Theme.borderRadius.xl, padding: Theme.spacing.md, maxHeight: '80%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Theme.spacing.md },
  title: { color: Theme.colors.text, fontSize: 16, fontWeight: '600', flex: 1 },
  fieldGroup: { marginBottom: Theme.spacing.sm },
  fieldLabel: { color: Theme.colors.textMuted, fontSize: 12, marginBottom: 4, textTransform: 'capitalize' },
  input: { backgroundColor: Theme.colors.background, color: Theme.colors.text, borderRadius: Theme.borderRadius.md, padding: Theme.spacing.sm, borderWidth: 1, borderColor: Theme.colors.border },
  multiline: { height: 100, textAlignVertical: 'top' },
  error: { color: Theme.colors.error, marginBottom: Theme.spacing.sm },
  launchBtn: { backgroundColor: Theme.colors.primary, borderRadius: Theme.borderRadius.md, padding: Theme.spacing.sm, alignItems: 'center', marginTop: Theme.spacing.sm },
  btnDisabled: { opacity: 0.6 },
  launchText: { color: '#fff', fontWeight: '600' },
});

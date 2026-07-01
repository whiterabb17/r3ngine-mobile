import React, { useState } from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { X } from 'lucide-react-native';
import { Theme } from '../../constants/Theme';

interface Props {
  visible: boolean;
  onClose: () => void;
  onAdd: (title: string, description: string) => Promise<void>;
}

export default function AddTodoModal({ visible, onClose, onAdd }: Props) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!title.trim()) { setError('Title is required'); return; }
    setLoading(true);
    setError('');
    try {
      await onAdd(title.trim(), description.trim());
      setTitle('');
      setDescription('');
      onClose();
    } catch {
      setError('Failed to add todo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <SafeAreaView style={styles.overlay}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Add Todo</Text>
            <TouchableOpacity onPress={onClose}><X size={20} color={Theme.colors.textMuted} /></TouchableOpacity>
          </View>

          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Title"
            placeholderTextColor={Theme.colors.textMuted}
          />
          <TextInput
            style={[styles.input, styles.multiline]}
            value={description}
            onChangeText={setDescription}
            placeholder="Description (optional)"
            placeholderTextColor={Theme.colors.textMuted}
            multiline
            numberOfLines={3}
          />

          {!!error && <Text style={styles.error}>{error}</Text>}

          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.btnText}>{loading ? 'Adding…' : 'Add Todo'}</Text>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: Theme.colors.surface, borderTopLeftRadius: Theme.borderRadius.xl, borderTopRightRadius: Theme.borderRadius.xl, padding: Theme.spacing.md, paddingBottom: Theme.spacing.xl },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Theme.spacing.md },
  title: { color: Theme.colors.text, fontSize: 16, fontWeight: '600' },
  input: { backgroundColor: Theme.colors.background, color: Theme.colors.text, borderRadius: Theme.borderRadius.md, padding: Theme.spacing.sm, marginBottom: Theme.spacing.sm, borderWidth: 1, borderColor: Theme.colors.border },
  multiline: { height: 80, textAlignVertical: 'top' },
  error: { color: Theme.colors.error, marginBottom: Theme.spacing.sm },
  btn: { backgroundColor: Theme.colors.primary, borderRadius: Theme.borderRadius.md, padding: Theme.spacing.sm, alignItems: 'center' },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontWeight: '600' },
});

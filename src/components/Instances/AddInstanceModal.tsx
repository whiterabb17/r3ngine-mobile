import React, { useState } from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import axios from 'axios';
import { X } from 'lucide-react-native';
import { Theme } from '../../constants/Theme';
import { useInstanceStore } from '../../store/useInstanceStore';

interface Props {
  visible: boolean;
  onClose: () => void;
  onAdded: (id: string) => void;
}

export default function AddInstanceModal({ visible, onClose, onAdded }: Props) {
  const { addInstance } = useInstanceStore();
  const [label, setLabel] = useState('');
  const [serverUrl, setServerUrl] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setLabel('');
    setServerUrl('');
    setUsername('');
    setPassword('');
    setError(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleConnect = async () => {
    setError(null);

    const trimmedUrl = serverUrl.trim().replace(/\/$/, '');
    if (!trimmedUrl) {
      setError('Server URL is required.');
      return;
    }
    // Security rule 3.2 — only http/https
    if (!/^https?:\/\//i.test(trimmedUrl)) {
      setError('Server URL must start with http:// or https://');
      return;
    }
    if (!label.trim()) {
      setError('Label is required.');
      return;
    }
    if (!username.trim() || !password) {
      setError('Username and password are required.');
      return;
    }

    setLoading(true);
    try {
      const resp = await axios.post(
        `${trimmedUrl}/auth/login/`,
        { username: username.trim(), password },
        { timeout: 10000 }
      );
      const { access, refresh } = resp.data;
      if (!access || !refresh) {
        setError('Unexpected response from server. Please check the URL.');
        return;
      }
      const id = addInstance({
        label: label.trim(),
        serverIp: trimmedUrl,
        token: access,
        refreshToken: refresh,
      });
      reset();
      onAdded(id);
    } catch (err: any) {
      console.error('[AddInstanceModal] connect failed:', err);
      if (err.response?.status === 401) {
        setError('Invalid username or password.');
      } else if (err.code === 'ECONNREFUSED' || err.code === 'ERR_NETWORK') {
        setError('Could not reach server. Check the URL and try again.');
      } else {
        setError('Connection failed. Verify the server URL and credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Add Server</Text>
            <TouchableOpacity onPress={handleClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <X size={20} color={Theme.colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
            <Text style={styles.fieldLabel}>Label</Text>
            <TextInput
              style={styles.input}
              value={label}
              onChangeText={setLabel}
              placeholder="e.g. Production"
              placeholderTextColor={Theme.colors.textMuted}
              autoCapitalize="words"
            />

            <Text style={styles.fieldLabel}>Server URL</Text>
            <TextInput
              style={styles.input}
              value={serverUrl}
              onChangeText={setServerUrl}
              placeholder="http://192.168.1.100:8000"
              placeholderTextColor={Theme.colors.textMuted}
              keyboardType="url"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Text style={styles.fieldLabel}>Username</Text>
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              placeholder="admin"
              placeholderTextColor={Theme.colors.textMuted}
              autoCapitalize="none"
            />

            <Text style={styles.fieldLabel}>Password</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor={Theme.colors.textMuted}
              secureTextEntry
            />

            {error && <Text style={styles.errorText}>{error}</Text>}

            <TouchableOpacity
              style={[styles.connectBtn, loading && styles.connectBtnDisabled]}
              onPress={handleConnect}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color={Theme.colors.background} size="small" />
                : <Text style={styles.connectBtnText}>Connect</Text>
              }
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Theme.colors.surface,
    borderTopLeftRadius: Theme.borderRadius.xl,
    borderTopRightRadius: Theme.borderRadius.xl,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  title: { color: Theme.colors.text, fontSize: 16, fontWeight: '600' },
  form: { padding: Theme.spacing.md, paddingBottom: Theme.spacing.xl },
  fieldLabel: {
    fontSize: 12,
    color: Theme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
    marginTop: Theme.spacing.md,
  },
  input: {
    backgroundColor: Theme.colors.background,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.md,
    color: Theme.colors.text,
    fontSize: 15,
  },
  errorText: {
    color: Theme.colors.error,
    fontSize: 13,
    marginTop: Theme.spacing.md,
    textAlign: 'center',
  },
  connectBtn: {
    backgroundColor: Theme.colors.primary,
    borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.md,
    alignItems: 'center',
    marginTop: Theme.spacing.xl,
  },
  connectBtnDisabled: { opacity: 0.6 },
  connectBtnText: {
    color: Theme.colors.background,
    fontWeight: '700',
    fontSize: 15,
    fontFamily: 'Bangers',
    letterSpacing: 1,
  },
});

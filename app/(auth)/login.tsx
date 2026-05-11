import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Server, User, Lock, ChevronRight, Shield, Activity } from 'lucide-react-native';
import { useAuthStore } from '../../src/store/useAuthStore';
import { useSettingsStore } from '../../src/store/useSettingsStore';
import axios from 'axios';
import { Theme } from '../../src/constants/Theme';

export default function LoginScreen() {
  const router = useRouter();
  const { setServerIp, serverIp } = useSettingsStore();
  const { setTokens } = useAuthStore();

  const [ip, setIp] = useState(serverIp || '');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!ip || !username || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    console.log('Attempting login to:', ip);
    try {
      const baseUrl = ip.includes('://') ? ip : `http://${ip}`;
      const response = await axios.post(`${baseUrl}${baseUrl.endsWith('/') ? '' : '/'}mapi/auth/token/`, {
        username,
        password,
      }, { timeout: 10000 });

      console.log('Login successful, response data:', response.data);

      if (!response.data.access || !response.data.refresh) {
        throw new Error('Server did not return tokens. Please check backend JWT configuration.');
      }

      await setServerIp(String(ip));
      await setTokens(String(response.data.access), String(response.data.refresh));
      
      router.replace('/(tabs)');
    } catch (error: any) {
      console.error('Login error:', error);
      const msg = error.response?.data?.detail || error.message || 'Could not connect to server. Please check IP and credentials.';
      Alert.alert('Login Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Image 
              source={require('../../assets/images/logo.png')} 
              style={styles.logo} 
              resizeMode="contain" 
            />
          </View>
          <Text style={styles.title}>reNgine Mobile</Text>
          <Text style={styles.subtitle}>Enterprise Security Orchestration</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Server Address</Text>
            <View style={styles.inputWrapper}>
              <Server size={20} color={Theme.colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="e.g. 192.168.1.10 or rengine.io"
                placeholderTextColor={Theme.colors.textMuted}
                value={ip}
                onChangeText={setIp}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Username</Text>
            <View style={styles.inputWrapper}>
              <User size={20} color={Theme.colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Admin username"
                placeholderTextColor={Theme.colors.textMuted}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputWrapper}>
              <Lock size={20} color={Theme.colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor={Theme.colors.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.buttonText}>Connect & Login</Text>
                <ChevronRight size={20} color="#fff" />
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.diagButton}
            onPress={() => router.push('/diagnostics')}
          >
            <Activity size={16} color={Theme.colors.textMuted} />
            <Text style={styles.diagButtonText}>System Diagnostics</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: Theme.spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: Theme.spacing.xl * 2,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: Theme.borderRadius.xl,
    backgroundColor: Theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Theme.spacing.md,
    borderWidth: 1,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    overflow: 'hidden',
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Theme.colors.text,
    marginBottom: Theme.spacing.xs,
  },
  subtitle: {
    fontSize: 16,
    color: Theme.colors.textMuted,
  },
  form: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: Theme.spacing.lg,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Theme.colors.textMuted,
    marginBottom: Theme.spacing.sm,
    marginLeft: Theme.spacing.xs,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    paddingHorizontal: Theme.spacing.md,
  },
  inputIcon: {
    marginRight: Theme.spacing.sm,
  },
  input: {
    flex: 1,
    height: 50,
    color: Theme.colors.text,
    fontSize: 16,
  },
  button: {
    flexDirection: 'row',
    backgroundColor: Theme.colors.primary,
    borderRadius: Theme.borderRadius.lg,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Theme.spacing.xl,
    shadowColor: Theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: Theme.spacing.sm,
  },
  diagButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Theme.spacing.lg,
    padding: Theme.spacing.sm,
  },
  diagButtonText: {
    color: Theme.colors.textMuted,
    fontSize: 14,
    marginLeft: Theme.spacing.xs,
    textDecorationLine: 'underline',
  },
});

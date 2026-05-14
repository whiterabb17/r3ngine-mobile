import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Save, X, ChevronLeft, Terminal, AlertTriangle, FileCode } from 'lucide-react-native';
import { Theme } from '../../../src/constants/Theme';
import apiClient from '../../../src/api/client';
import { TacticalHaptics } from '../../../src/utils/haptics';

export default function EngineEditorScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  
  const [engineName, setEngineName] = useState('');
  const [yamlConfig, setYamlConfig] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const fetchEngineDetails = async () => {
    try {
      const response = await apiClient.get(`action/engine/get/?engine_id=${id}`);
      if (response.data.status) {
        setEngineName(response.data.engine_name);
        setYamlConfig(response.data.yaml_configuration);
      }
    } catch (err) {
      console.error('Failed to fetch engine details:', err);
      Alert.alert('Error', 'Failed to retrieve tactical configuration.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEngineDetails();
  }, [id]);

  const handleSave = async () => {
    if (!yamlConfig.trim()) {
      Alert.alert('Validation Error', 'Tactical YAML configuration cannot be empty.');
      return;
    }

    setSaving(true);
    TacticalHaptics.success();
    
    try {
      const response = await apiClient.post('action/engine/update/', {
        engine_id: id,
        engine_name: engineName,
        yaml_configuration: yamlConfig
      });

      if (response.data.status) {
        setHasChanges(false);
        TacticalHaptics.impact();
        Alert.alert('Success', 'Engine configuration updated successfully.', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      } else {
        throw new Error(response.data.message || 'Update failed');
      }
    } catch (err: any) {
      console.error('Failed to update engine:', err);
      Alert.alert('Deployment Failed', err.response?.data?.message || 'Failed to update engine configuration.');
      TacticalHaptics.error();
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Theme.colors.primary} />
        <Text style={styles.loadingText}>DECRYPTING YAML BLOB...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
    >
      <Stack.Screen 
        options={{ 
          title: engineName.toUpperCase(),
          headerStyle: { backgroundColor: Theme.colors.surface },
          headerTintColor: '#fff',
          headerTitleStyle: { fontFamily: 'Bangers' },
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: -10, padding: 10 }}>
              <X size={24} color="#fff" />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity 
              onPress={handleSave} 
              disabled={saving || !hasChanges}
              style={[styles.saveBtn, (!hasChanges || saving) && styles.disabledBtn]}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Save size={20} color="#fff" />
              )}
            </TouchableOpacity>
          )
        }} 
      />

      <View style={styles.editorContainer}>
        <View style={styles.editorHeader}>
          <View style={styles.headerLabel}>
            <FileCode size={14} color={Theme.colors.primary} />
            <Text style={styles.headerText}>CONFIG.YAML</Text>
          </View>
          {hasChanges && (
            <View style={styles.unsavedBadge}>
              <Text style={styles.unsavedText}>UNSAVED CHANGES</Text>
            </View>
          )}
        </View>

        <ScrollView style={styles.scrollView} keyboardShouldPersistTaps="handled">
          <TextInput
            style={styles.yamlEditor}
            value={yamlConfig}
            onChangeText={(text) => {
              setYamlConfig(text);
              setHasChanges(true);
            }}
            multiline
            autoCapitalize="none"
            autoCorrect={false}
            spellCheck={false}
            placeholder="Enter YAML configuration..."
            placeholderTextColor={Theme.colors.textMuted}
          />
        </ScrollView>
      </View>

      <View style={styles.warningBox}>
        <AlertTriangle size={16} color={Theme.colors.warning} />
        <Text style={styles.warningText}>
          CAUTION: Direct YAML modification can destabilize scan operations. Ensure syntax integrity before deployment.
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  loadingText: {
    marginTop: 12,
    color: Theme.colors.primary,
    fontFamily: 'Bangers',
    letterSpacing: 1,
  },
  saveBtn: {
    backgroundColor: Theme.colors.primary,
    padding: 8,
    borderRadius: 8,
    marginRight: 5,
  },
  disabledBtn: {
    opacity: 0.5,
    backgroundColor: '#333',
  },
  editorContainer: {
    flex: 1,
    backgroundColor: '#050505',
    margin: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1A1A1A',
    overflow: 'hidden',
  },
  editorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#111',
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
  },
  headerLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerText: {
    fontSize: 10,
    color: '#666',
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  unsavedBadge: {
    backgroundColor: Theme.colors.warning + '22',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: Theme.colors.warning + '44',
  },
  unsavedText: {
    color: Theme.colors.warning,
    fontSize: 8,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  yamlEditor: {
    color: '#E0E0E0',
    fontSize: 13,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    padding: 16,
    minHeight: 500,
    textAlignVertical: 'top',
  },
  warningBox: {
    flexDirection: 'row',
    backgroundColor: Theme.colors.warning + '11',
    padding: 12,
    margin: 12,
    marginTop: 0,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Theme.colors.warning + '33',
    alignItems: 'center',
    gap: 12,
  },
  warningText: {
    flex: 1,
    color: Theme.colors.warning,
    fontSize: 10,
    fontWeight: 'bold',
    lineHeight: 14,
  },
});

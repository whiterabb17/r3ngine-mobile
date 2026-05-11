import React, { useState, useEffect } from 'react';
import { StyleSheet, Modal, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { X, Play, Shield, Zap } from 'lucide-react-native';
import { Text, View } from '@/components/Themed';
import { Theme } from '../../constants/Theme';
import apiClient from '../../api/client';

interface Engine {
  id: number;
  engine_name: string;
}

interface MainScanModalProps {
  visible: boolean;
  onClose: () => void;
  targetId: number;
  targetName: string;
}

export default function MainScanModal({ visible, onClose, targetId, targetName }: MainScanModalProps) {
  const [engines, setEngines] = useState<Engine[]>([]);
  const [selectedEngine, setSelectedEngine] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (visible) {
      fetchEngines();
    }
  }, [visible]);

  const fetchEngines = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('listEngines/');
      if (response.data && response.data.engines) {
        setEngines(response.data.engines);
        if (response.data.engines.length > 0) {
          setSelectedEngine(response.data.engines[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to fetch engines', error);
      Alert.alert('Error', 'Failed to load scan engines');
    } finally {
      setLoading(false);
    }
  };

  const handleInitiate = async () => {
    if (!selectedEngine) {
      Alert.alert('Error', 'Please select a scan engine');
      return;
    }

    setSubmitting(true);
    try {
      const response = await apiClient.post('action/initiate/scan/', {
        engine_id: selectedEngine,
        domain_id: targetId,
      });

      if (response.data && response.data.status) {
        Alert.alert('Success', `Scan initiated for ${targetName}`);
        onClose();
      } else {
        Alert.alert('Error', response.data.message || 'Failed to initiate scan');
      }
    } catch (error: any) {
      console.error('Failed to initiate scan', error);
      Alert.alert('Error', error.response?.data?.message || 'An error occurred while initiating the scan');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.content}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Start New Scan</Text>
              <Text style={styles.subtitle}>Target: {targetName}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={24} color={Theme.colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body}>
            <Text style={styles.sectionTitle}>Select Scan Engine</Text>
            {loading ? (
              <ActivityIndicator color={Theme.colors.primary} style={styles.loader} />
            ) : (
              <View style={styles.engineGrid}>
                {engines.map(engine => (
                  <TouchableOpacity
                    key={engine.id}
                    style={[
                      styles.engineCard,
                      selectedEngine === engine.id && styles.selectedEngineCard
                    ]}
                    onPress={() => setSelectedEngine(engine.id)}
                  >
                    <Shield 
                      size={20} 
                      color={selectedEngine === engine.id ? Theme.colors.primary : Theme.colors.textMuted} 
                    />
                    <Text style={[
                      styles.engineName,
                      selectedEngine === engine.id && styles.selectedEngineText
                    ]}>
                      {engine.engine_name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            
            <View style={styles.infoBox}>
              <Zap size={16} color={Theme.colors.warning} />
              <Text style={styles.infoText}>
                This will initiate a full recon and vulnerability scan based on the selected engine configuration.
              </Text>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity 
              style={styles.cancelBtn} 
              onPress={onClose}
              disabled={submitting}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.initiateBtn, submitting && styles.disabledBtn]} 
              onPress={handleInitiate}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Play size={16} color="#fff" />
                  <Text style={styles.initiateBtnText}>Initiate Scan</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: Theme.colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '60%',
    padding: Theme.spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Theme.spacing.lg,
    backgroundColor: 'transparent',
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: Theme.colors.text,
    fontFamily: 'Orbitron',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 12,
    color: Theme.colors.textMuted,
    marginTop: 4,
  },
  closeBtn: {
    padding: 4,
  },
  body: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Theme.colors.primary,
    marginBottom: 12,
    marginTop: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  loader: {
    marginVertical: 20,
  },
  engineGrid: {
    backgroundColor: 'transparent',
    gap: 10,
    marginBottom: 24,
  },
  engineCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.surface,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    gap: 12,
  },
  selectedEngineCard: {
    borderColor: Theme.colors.primary,
    backgroundColor: Theme.colors.primary + '11',
  },
  engineName: {
    fontSize: 14,
    color: Theme.colors.text,
    fontWeight: '600',
  },
  selectedEngineText: {
    color: Theme.colors.primary,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    padding: 12,
    borderRadius: 8,
    gap: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 11,
    color: Theme.colors.warning,
    lineHeight: 16,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: Theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
    backgroundColor: 'transparent',
  },
  cancelBtn: {
    flex: 1,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: Theme.colors.surface,
  },
  cancelBtnText: {
    color: Theme.colors.textMuted,
    fontWeight: '700',
  },
  initiateBtn: {
    flex: 2,
    height: 50,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: Theme.colors.primary,
    gap: 8,
  },
  disabledBtn: {
    opacity: 0.6,
  },
  initiateBtnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
  },
});

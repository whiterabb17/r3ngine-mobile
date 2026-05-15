import React, { useState, useEffect } from 'react';
import { StyleSheet, Modal, TouchableOpacity, ActivityIndicator, Alert, Animated } from 'react-native';
import { X, ChevronRight, ChevronLeft, Play } from 'lucide-react-native';
import { TacticalHaptics } from '../../utils/haptics';
import { Text, View } from '@/components/Themed';
import { Theme } from '../../constants/Theme';
import apiClient from '../../api/client';
import EngineSelector from './EngineSelector';
import AdvancedOptions from './AdvancedOptions';
import ScanReview from './ScanReview';
import { paths, components } from '../../types/api';

type Engine = {
  id: number;
  engine_name: string;
};

interface MainScanModalProps {
  visible: boolean;
  onClose: () => void;
  targetId: number;
  targetName: string;
}

type Step = 'engine' | 'advanced' | 'review';

export default function MainScanModal({ visible, onClose, targetId, targetName }: MainScanModalProps) {
  const [step, setStep] = useState<Step>('engine');
  const [engines, setEngines] = useState<Engine[]>([]);
  const [selectedEngineId, setSelectedEngineId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [advancedConfig, setAdvancedConfig] = useState({
    importSubdomainTextArea: '',
    outOfScopeSubdomainTextarea: '',
    startingPointPath: '',
    excludedPaths: '',
    customDorkTextarea: '',
    customDorkSwitch: false,
    spiderfoot_scan: false,
  });

  useEffect(() => {
    if (visible) {
      fetchConfiguration();
      setStep('engine');
    }
  }, [visible]);

  const fetchConfiguration = async () => {
    setLoading(true);
    try {
      // Falling back to any because schema content is missing for scans/configuration
      const response = await apiClient.get<any>('/mapi/scans/configuration/');
      if (response.data && response.data.engines) {
        setEngines(response.data.engines);
        if (response.data.engines.length > 0 && !selectedEngineId) {
          setSelectedEngineId(response.data.engines[0].id || null);
        }
      }
    } catch (error) {
      console.error('Failed to fetch configurations', error);
      // Fallback to simpler listEngines if configuration fails
      try {
        const fallback = await apiClient.get<any>('/mapi/listEngines/');
        if (fallback.data && fallback.data.engines) {
          setEngines(fallback.data.engines);
        }
      } catch (err) {
        Alert.alert('Error', 'Failed to load scan configurations');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAdvancedChange = (key: string, value: any) => {
    setAdvancedConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleNext = () => {
    TacticalHaptics.soft();
    if (step === 'engine') {
      if (!selectedEngineId) {
        Alert.alert('Error', 'Please select a scan engine');
        return;
      }
      setStep('advanced');
    } else if (step === 'advanced') {
      setStep('review');
    }
  };

  const handleBack = () => {
    TacticalHaptics.soft();
    if (step === 'advanced') setStep('engine');
    else if (step === 'review') setStep('advanced');
  };

  const handleInitiate = async () => {
    setSubmitting(true);
    try {
      // Sanitize multi-line inputs into arrays for backend parity
      const sanitizedConfig = {
        ...advancedConfig,
        importSubdomainTextArea: advancedConfig.importSubdomainTextArea
          ? advancedConfig.importSubdomainTextArea.split('\n').map(s => s.trim()).filter(s => s !== '')
          : [],
        outOfScopeSubdomainTextarea: advancedConfig.outOfScopeSubdomainTextarea
          ? advancedConfig.outOfScopeSubdomainTextarea.split('\n').map(s => s.trim()).filter(s => s !== '')
          : [],
        excludedPaths: advancedConfig.excludedPaths
          ? advancedConfig.excludedPaths.split('\n').map(s => s.trim()).filter(s => s !== '')
          : [],
      };

      const payload = {
        engine_id: selectedEngineId,
        domain_id: targetId,
        ...sanitizedConfig,
      };

      // Falling back to any because schema content is missing for initiate/scan
      const response = await apiClient.post<any>('/mapi/action/initiate/scan/', payload);

      if (response.data && response.data.status) {
        TacticalHaptics.success();
        Alert.alert('Scan Initiated', `Targeting sequence started for ${targetName}`, [
          { text: 'ACKNOWLEDGE', onPress: onClose }
        ]);
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

  const selectedEngine = engines.find(e => e.id === selectedEngineId);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.content}>
          {/* Progress Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Scan Orchestration</Text>
              <View style={styles.stepIndicator}>
                <View style={[styles.stepDot, step === 'engine' && styles.activeDot]} />
                <View style={[styles.stepDot, step === 'advanced' && styles.activeDot]} />
                <View style={[styles.stepDot, step === 'review' && styles.activeDot]} />
                <Text style={styles.stepText}>
                  {step === 'engine' ? 'Step 1: Engine' : 
                   step === 'advanced' ? 'Step 2: Config' : 'Step 3: Review'}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={24} color={Theme.colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.body}>
            {step === 'engine' && (
              <EngineSelector 
                engines={engines}
                selectedEngineId={selectedEngineId}
                onSelectEngine={setSelectedEngineId}
                loading={loading}
              />
            )}
            {step === 'advanced' && (
              <AdvancedOptions 
                data={advancedConfig}
                onChange={handleAdvancedChange}
              />
            )}
            {step === 'review' && (
              <ScanReview 
                targetName={targetName}
                engineName={selectedEngine?.engine_name || ''}
                config={advancedConfig}
              />
            )}
          </View>

          <View style={styles.footer}>
            {step !== 'engine' ? (
              <TouchableOpacity 
                style={styles.backBtn} 
                onPress={handleBack}
                disabled={submitting}
              >
                <ChevronLeft size={20} color={Theme.colors.text} />
                <Text style={styles.backBtnText}>Back</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                style={styles.backBtn} 
                onPress={onClose}
                disabled={submitting}
              >
                <Text style={styles.backBtnText}>Cancel</Text>
              </TouchableOpacity>
            )}

            {step === 'review' ? (
              <TouchableOpacity 
                style={[styles.initiateBtn, submitting && styles.disabledBtn]} 
                onPress={handleInitiate}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Play size={18} color="#fff" />
                    <Text style={styles.initiateBtnText}>Launch Scan</Text>
                  </>
                )}
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                style={styles.nextBtn} 
                onPress={handleNext}
              >
                <Text style={styles.nextBtnText}>Next</Text>
                <ChevronRight size={20} color="#fff" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: Theme.colors.background,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    height: '85%',
    padding: Theme.spacing.lg,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderBottomWidth: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Theme.spacing.lg,
    backgroundColor: 'transparent',
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: Theme.colors.text,
    fontFamily: 'Bangers',
    letterSpacing: 1.5,
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
    backgroundColor: 'transparent',
  },
  stepDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Theme.colors.border,
  },
  activeDot: {
    backgroundColor: Theme.colors.primary,
    width: 20,
  },
  stepText: {
    fontSize: 11,
    color: Theme.colors.textMuted,
    fontWeight: '700',
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  closeBtn: {
    padding: 4,
  },
  body: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  footer: {
    flexDirection: 'row',
    gap: 16,
    paddingTop: Theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
    backgroundColor: 'transparent',
    marginBottom: 10,
  },
  backBtn: {
    flex: 1,
    height: 56,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    backgroundColor: Theme.colors.surface,
    gap: 8,
  },
  backBtnText: {
    color: Theme.colors.text,
    fontWeight: '700',
    fontSize: 16,
  },
  nextBtn: {
    flex: 2,
    height: 56,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    backgroundColor: Theme.colors.primary,
    gap: 8,
    shadowColor: Theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  nextBtnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 18,
  },
  initiateBtn: {
    flex: 2,
    height: 56,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    backgroundColor: Theme.colors.success,
    gap: 8,
    shadowColor: Theme.colors.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  disabledBtn: {
    opacity: 0.6,
  },
  initiateBtnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 18,
  },
});

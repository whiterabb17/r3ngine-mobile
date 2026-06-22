import React, { useState, useEffect } from 'react';
import { StyleSheet, Modal, TouchableOpacity, ActivityIndicator, Alert, Animated, View, Text } from 'react-native';
import { X, ChevronRight, ChevronLeft, Play } from 'lucide-react-native';
import { TacticalHaptics } from '../../utils/haptics';
import { Theme } from '../../constants/Theme';
import apiClient from '../../api/client';
import { listPlugins, type Plugin } from '../../api/control';
import EngineSelector from './EngineSelector';
import AdvancedOptions from './AdvancedOptions';
import PluginSelector from './PluginSelector';
import ScanReview from './ScanReview';
import { paths, components } from '../../types/api';

type Engine = {
  id: number;
  engine_name: string;
  tasks?: string[];
};

type HardwareProfile = {
  id: number;
  name: string;
  description?: string;
  threads: number;
  rate_limit: number;
  is_default: boolean;
  is_active: boolean;
};

interface MainScanModalProps {
  visible: boolean;
  onClose: () => void;
  targetId: number;
  targetName: string;
}

type Step = 'engine' | 'advanced' | 'plugins' | 'review';

export default function MainScanModal({ visible, onClose, targetId, targetName }: MainScanModalProps) {
  const [step, setStep] = useState<Step>('engine');
  const [engines, setEngines] = useState<Engine[]>([]);
  const [selectedEngineId, setSelectedEngineId] = useState<number | null>(null);
  const [profiles, setProfiles] = useState<HardwareProfile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<number | null>(null);
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [selectedPlugins, setSelectedPlugins] = useState<string[]>([]);
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
      setSelectedPlugins([]);
    }
  }, [visible]);

  const fetchConfiguration = async () => {
    setLoading(true);
    try {
      // Falling back to any because schema content is missing for scans/configuration
      const response = await apiClient.get<any>('/mapi/scans/configuration/');
      if (response.data && response.data.engines) {
        const engineData: Engine[] = response.data.engines.map((e: any) => ({
          id: e.id,
          engine_name: e.engine_name,
          tasks: (e.yaml_configuration ?? '').match(/^([a-z_]+):/gm)?.map((m: string) => m.replace(':', '').trim()) ?? [],
        }));
        setEngines(engineData);
        if (engineData.length > 0 && !selectedEngineId) {
          setSelectedEngineId(engineData[0].id || null);
        }
      }
    } catch (error) {
      console.error('Failed to fetch configurations', error);
      // Fallback to simpler listEngines if configuration fails
      try {
        const fallback = await apiClient.get<any>('/mapi/listEngines/');
        if (fallback.data && fallback.data.engines) {
          const engineData: Engine[] = fallback.data.engines.map((e: any) => ({
            id: e.id,
            engine_name: e.engine_name,
            tasks: (e.yaml_configuration ?? '').match(/^([a-z_]+):/gm)?.map((m: string) => m.replace(':', '').trim()) ?? [],
          }));
          setEngines(engineData);
        }
      } catch (err) {
        Alert.alert('Error', 'Failed to load scan configurations');
      }
    }

    // Fetch hardware profiles independently
    try {
      const profileResponse = await apiClient.get<any>('/mapi/hardwareProfiles/');
      let fetchedProfiles: HardwareProfile[] = [];
      if (profileResponse.data && Array.isArray(profileResponse.data)) {
        fetchedProfiles = profileResponse.data;
      } else if (profileResponse.data && Array.isArray(profileResponse.data.results)) {
        fetchedProfiles = profileResponse.data.results;
      }
      
      setProfiles(fetchedProfiles);
      if (fetchedProfiles.length > 0) {
        const defaultProfile = fetchedProfiles.find(p => p.is_default && p.is_active);
        if (defaultProfile) {
          setSelectedProfileId(defaultProfile.id);
        } else {
          const firstActive = fetchedProfiles.find(p => p.is_active);
          if (firstActive) {
            setSelectedProfileId(firstActive.id);
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch hardware profiles', err);
    } finally {
      setLoading(false);
    }

    // Fetch enabled plugins independently — non-blocking
    try {
      const allPlugins = await listPlugins();
      setPlugins(allPlugins.filter(p => p.is_enabled));
    } catch {
      // Plugin fetch failure is non-fatal; proceed without plugin selection
      setPlugins([]);
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
      if (!selectedProfileId) {
        Alert.alert('Error', 'Please select a hardware profile');
        return;
      }
      setStep('advanced');
    } else if (step === 'advanced') {
      setStep('plugins');
    } else if (step === 'plugins') {
      setStep('review');
    }
  };

  const handleBack = () => {
    TacticalHaptics.soft();
    if (step === 'advanced') setStep('engine');
    else if (step === 'plugins') setStep('advanced');
    else if (step === 'review') setStep('plugins');
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
        hardware_profile_id: selectedProfileId,
        domain_id: targetId,
        ...sanitizedConfig,
        selected_plugins: selectedPlugins,
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
  const selectedProfile = profiles.find(p => p.id === selectedProfileId);

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
                <View style={[styles.stepDot, step === 'plugins' && styles.activeDot]} />
                <View style={[styles.stepDot, step === 'review' && styles.activeDot]} />
                <Text style={styles.stepText}>
                  {step === 'engine' ? 'Step 1: Engine' :
                   step === 'advanced' ? 'Step 2: Config' :
                   step === 'plugins' ? 'Step 3: Plugins' : 'Step 4: Review'}
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
                profiles={profiles}
                selectedProfileId={selectedProfileId}
                onSelectProfile={setSelectedProfileId}
                loading={loading}
              />
            )}
            {step === 'advanced' && (
              <AdvancedOptions
                data={advancedConfig}
                onChange={handleAdvancedChange}
              />
            )}
            {step === 'plugins' && (
              <PluginSelector
                plugins={plugins}
                selectedPlugins={selectedPlugins}
                onToggle={(slug) =>
                  setSelectedPlugins(prev =>
                    prev.includes(slug) ? prev.filter(s => s !== slug) : [...prev, slug]
                  )
                }
              />
            )}
            {step === 'review' && (
              <ScanReview
                targetName={targetName}
                engineName={selectedEngine?.engine_name || ''}
                profileName={selectedProfile?.name || 'Default'}
                config={advancedConfig}
                selectedPlugins={selectedPlugins}
                pluginNames={plugins
                  .filter(p => selectedPlugins.includes(p.slug))
                  .map(p => p.name)}
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
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Theme.colors.border,
  },
  activeDot: {
    backgroundColor: Theme.colors.primary,
    width: 24,
  },
  stepText: {
    fontSize: 12,
    color: Theme.colors.textMuted,
    fontWeight: '800',
    marginLeft: 8,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
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

import React, { useState, useEffect, useMemo } from 'react';
import { StyleSheet, Modal, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Dimensions } from 'react-native';
import { 
  X, 
  Play, 
  Shield, 
  Globe, 
  Search, 
  Code, 
  Eye, 
  Lock, 
  Terminal, 
  Server, 
  Camera,
  Flame,
  ShieldCheck,
  Wifi,
  Database,
  CloudLightning,
  Rocket,
  Layout,
  Star,
  SearchCode,
  Network,
  Bug,
  Zap,
  Layers,
  Unlink,
  Cpu,
  Webhook,
  Biohazard,
  Radar,
  CheckCircle2,
  Settings,
  AlertCircle,
  Fingerprint,
  Download,
  Link,
  GitBranch,
  Activity,
  AlertTriangle,
  ChevronRight
} from 'lucide-react-native';
import { Text, View } from '@/components/Themed';
import { Theme } from '../../constants/Theme';
import apiClient from '../../api/client';
import { paths, components } from '../../types/api';

const { width } = Dimensions.get('window');

type Engine = {
  id: number;
  engine_name: string;
  tasks: string[];
};

interface SubtaskModalProps {
  visible: boolean;
  onClose: () => void;
  subdomainId: number;
  subdomainName: string;
}

// Map backend task keys to UI labels and icons
const TASK_META: Record<string, { label: string; icon: any; color: string }> = {
  subdomain_discovery: { label: 'Recon', icon: Globe, color: '#3b82f6' }, // Blue
  http_crawl: { label: 'HTTP Crawl', icon: Search, color: '#10b981' }, // Emerald
  osint: { label: 'OSINT', icon: Eye, color: '#f59e0b' }, // Amber
  visual_recon: { label: 'Visual Recon', icon: Camera, color: '#8b5cf6' }, // Violet
  secret_leak_detection: { label: 'Secrets', icon: Lock, color: '#ec4899' }, // Pink
  dir_discovery: { label: 'Directory', icon: Terminal, color: '#6366f1' }, // Indigo
  port_scan: { label: 'Port Scan', icon: Server, color: '#14b8a6' }, // Teal
  screenshot_capture: { label: 'Screenshots', icon: Camera, color: '#06b6d4' }, // Cyan
  attack_path_modeling: { label: 'Attack Paths', icon: GitBranch, color: '#f97316' }, // Orange
  firewall_vpn_scan: { label: 'FW/VPN', icon: Network, color: '#0ea5e9' }, // Sky
  brute_force_scan: { label: 'Brute Force', icon: Flame, color: '#dc2626' }, // Strong Red
  spiderfoot_scan: { label: 'SpiderFoot', icon: Bug, color: '#84cc16' }, // Spider-like (Green)
  vulnerability_scan: { label: 'Vuln Scan', icon: Biohazard, color: '#ef4444' }, // Biohazard (Red)
  subfinder: { label: 'Subfinder', icon: Globe, color: '#2563eb' },
  nuclei: { label: 'Nuclei', icon: Zap, color: '#7c3aed' },
  waf_detection: { label: 'WAF Detect', icon: Layers, color: '#d946ef' },
  stress_test: { label: 'Stress Test', icon: CloudLightning, color: '#dc2626' }, // Red (Matches Engine)
  web_api_discovery: { label: 'Web Discovery', icon: Layout, color: '#06b6d4' }, // Cyan (Matches Engine)
  waf_bypass: { label: 'WAF Bypass', icon: Unlink, color: '#ec4899' }, // Pink
  dir_file_fuzz: { label: 'File Fuzz', icon: SearchCode, color: '#6366f1' }, // Indigo
  fetch_url: { label: 'Fetch URL', icon: Link, color: '#10b981' }, // Emerald
  screenshot: { label: 'Screenshot', icon: Camera, color: '#0ea5e9' }, // Sky
};

const ENGINE_META: Record<string, { icon: any; color: string }> = {
  // Primary Mappings
  'Subdomain Scan': { icon: Globe, color: '#3b82f6' },
  'Vulnerability Scan': { icon: Biohazard, color: '#ef4444' },
  'SpiderFoot Scan': { icon: Bug, color: '#f59e0b' },
  'OSINT Scan': { icon: Eye, color: '#10b981' },
  'Full Scan': { icon: Rocket, color: '#8b5cf6' },
  'Nuclei Scan': { icon: ShieldCheck, color: '#ec4899' },
  'Directory Scan': { icon: Terminal, color: '#6366f1' },
  'Port Scan': { icon: Server, color: '#14b8a6' },
  'Attack Path Modeling': { icon: GitBranch, color: '#f97316' },
  'Passive Recon': { icon: Radar, color: '#10b981' },
  'Active Stress & Resilience Engine': { icon: CloudLightning, color: '#dc2626' },
  'WebApp Scan': { icon: Layout, color: '#06b6d4' },
  'Recommended Scan': { icon: Star, color: '#eab308' },
  'Brute Force Scan': { icon: Flame, color: '#f43f5e' },
  'Firewall & VPN Scan': { icon: Network, color: '#0ea5e9' },
  
  // Variations for robustness
  'subdomain': { icon: Globe, color: '#3b82f6' },
  'vulnerability': { icon: Biohazard, color: '#ef4444' },
  'spiderfoot': { icon: Bug, color: '#f59e0b' },
  'osint': { icon: Eye, color: '#10b981' },
  'full': { icon: Rocket, color: '#8b5cf6' },
  'nuclei': { icon: ShieldCheck, color: '#ec4899' },
  'directory': { icon: Terminal, color: '#6366f1' },
  'port': { icon: Server, color: '#14b8a6' },
  'attack_path': { icon: GitBranch, color: '#f97316' },
  'passive': { icon: Radar, color: '#10b981' },
  'stress': { icon: CloudLightning, color: '#dc2626' },
  'webapp': { icon: Layout, color: '#06b6d4' },
  'recommended': { icon: Star, color: '#eab308' },
  'brute_force': { icon: Flame, color: '#f43f5e' },
  'firewall': { icon: Network, color: '#0ea5e9' },
  'vpn': { icon: Network, color: '#0ea5e9' },
  'Subdomain discovery': { icon: Globe, color: '#3b82f6' },
  'HTTP Crawl': { icon: Search, color: '#10b981' },
};

const FALLBACK_ICONS = [Shield, Lock, Wifi, Database, Settings, AlertCircle, Fingerprint, Unlink, Layers, Cpu];
const FALLBACK_COLORS = ['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6', '#06b6d4', '#f97316'];

const getEngineMeta = (name: string) => {
  // Try exact match
  if (ENGINE_META[name]) return ENGINE_META[name];
  
  // Try case-insensitive substring match
  const lowerName = name.toLowerCase();
  for (const key of Object.keys(ENGINE_META)) {
    if (lowerName.includes(key.toLowerCase())) return ENGINE_META[key];
  }
  
  // Dynamic fallback to avoid repetition
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return {
    icon: FALLBACK_ICONS[Math.abs(hash) % FALLBACK_ICONS.length],
    color: FALLBACK_COLORS[Math.abs(hash) % FALLBACK_COLORS.length]
  };
};

export default function SubtaskModal({ visible, onClose, subdomainId, subdomainName }: SubtaskModalProps) {
  const [engines, setEngines] = useState<Engine[]>([]);
  const [selectedEngineId, setSelectedEngineId] = useState<number | null>(null);
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
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
      // Falling back to any because schema content is missing for listEngines
      const response = await apiClient.get<any>('/mapi/listEngines/');
      if (response.data && response.data.engines) {
        setEngines(response.data.engines);
        if (response.data.engines.length > 0) {
          const firstEngine = response.data.engines[0];
          setSelectedEngineId(firstEngine.id || null);
          setSelectedTasks(firstEngine.tasks || []);
        }
      }
    } catch (error) {
      console.error('Failed to fetch engines', error);
      Alert.alert('Error', 'Failed to load scan engines');
    } finally {
      setLoading(false);
    }
  };

  const selectedEngine = useMemo(() => 
    engines.find(e => e.id === selectedEngineId), 
    [engines, selectedEngineId]
  );

  const toggleTask = (task: string) => {
    if (selectedTasks.includes(task)) {
      setSelectedTasks(prev => prev.filter(t => t !== task));
    } else {
      setSelectedTasks(prev => [...prev, task]);
    }
  };

  const handleInitiate = async () => {
    if (!selectedEngineId) {
      Alert.alert('Error', 'Please select an engine');
      return;
    }
    if (selectedTasks.length === 0) {
      Alert.alert('Error', 'Please select at least one task');
      return;
    }

    setSubmitting(true);
    try {
      // Falling back to any because schema content is missing for initiate/subtask
      const response = await apiClient.post<any>('/mapi/action/initiate/subtask/', {
        subdomain_id: subdomainId,
        engine_id: selectedEngineId,
        tasks: selectedTasks
      });

      if (response.data && response.data.status) {
        Alert.alert('Success', 'Subscan initiated successfully');
        onClose();
      } else {
        Alert.alert('Error', response.data.message || 'Failed to initiate subscan');
      }
    } catch (error: any) {
      console.error('Failed to initiate subscan', error);
      Alert.alert('Error', error.response?.data?.message || 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.headerTextContainer}>
              <Text style={styles.title}>Subscan Drawer</Text>
              <Text style={styles.targetName}>{subdomainName}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={24} color={Theme.colors.text} />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.centerLoader}>
              <ActivityIndicator color={Theme.colors.primary} size="large" />
              <Text style={styles.loaderText}>Loading Engines...</Text>
            </View>
          ) : (
            <>
              <View style={styles.engineSection}>
                <Text style={styles.sectionLabel}>Select Engine</Text>
                <View style={styles.engineGrid}>
                  {engines.map(engine => {
                    const meta = getEngineMeta(engine.engine_name);
                    const Icon = meta.icon;
                    const isSelected = selectedEngineId === engine.id;

                    return (
                      <TouchableOpacity
                        key={engine.id}
                        style={[
                          styles.engineIconBtn,
                          { 
                            backgroundColor: isSelected ? meta.color + '25' : meta.color + '10',
                            borderColor: isSelected ? meta.color : meta.color + '33'
                          }
                        ]}
                        onPress={() => {
                          setSelectedEngineId(engine.id);
                          setSelectedTasks(engine.tasks || []);
                        }}
                      >
                        <Icon 
                          size={24} 
                          color={isSelected ? meta.color : meta.color + 'bb'} 
                        />
                        {isSelected && (
                          <View style={[styles.activeIndicator, { backgroundColor: meta.color }]} />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <Text style={[styles.sectionLabel, { marginBottom: 16 }]}>
                {selectedEngine?.engine_name || 'Available'} Tasks
              </Text>
              <ScrollView style={styles.taskSection} showsVerticalScrollIndicator={false}>
                {selectedEngine?.tasks && selectedEngine.tasks.length > 0 ? (
                  <View style={styles.taskGrid}>
                    {selectedEngine.tasks.map((taskKey: string) => {
                      const meta = TASK_META[taskKey] || { label: taskKey, icon: Code, color: Theme.colors.primary };
                      const isSelected = selectedTasks.includes(taskKey);
                      const Icon = meta.icon;

                      return (
                        <TouchableOpacity
                          key={taskKey}
                          style={[
                            styles.taskCard,
                            isSelected && { borderColor: meta.color, backgroundColor: meta.color + '11' }
                          ]}
                          onPress={() => toggleTask(taskKey)}
                        >
                          <View style={[styles.taskIconContainer, { backgroundColor: meta.color + '22' }]}>
                            <Icon size={20} color={meta.color} />
                          </View>
                          <View style={styles.taskInfo}>
                            <Text style={[styles.taskLabel, isSelected && { color: meta.color }]}>
                              {meta.label}
                            </Text>
                            <Text style={styles.taskKey}>{taskKey}</Text>
                          </View>
                          <View style={styles.taskCheckbox}>
                            {isSelected ? (
                              <CheckCircle2 size={18} color={meta.color} />
                            ) : (
                              <View style={styles.checkboxUnchecked} />
                            )}
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ) : (
                  <View style={styles.emptyTasks}>
                    <AlertTriangle size={24} color={Theme.colors.warning} />
                    <Text style={styles.emptyTasksText}>No tasks defined for this engine</Text>
                  </View>
                )}
              </ScrollView>

              <View style={styles.footer}>
                <TouchableOpacity 
                  style={[styles.initiateBtn, submitting && styles.disabledBtn]} 
                  onPress={handleInitiate}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Text style={styles.initiateBtnText}>Start {selectedTasks.length} Task(s)</Text>
                      <ChevronRight size={20} color="#fff" />
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </>
          )}
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
    backgroundColor: 'transparent',
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: Theme.colors.text,
    fontFamily: 'Orbitron',
    letterSpacing: 1,
    backgroundColor: 'transparent',
  },
  targetName: {
    fontSize: 14,
    color: Theme.colors.primary,
    fontWeight: '600',
    marginTop: 4,
    backgroundColor: 'transparent',
  },
  headerTextContainer: {
    backgroundColor: 'transparent',
    flex: 1,
  },
  closeBtn: {
    padding: 8,
    backgroundColor: Theme.colors.surface,
    borderRadius: 12,
  },
  centerLoader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  loaderText: {
    marginTop: 12,
    color: Theme.colors.textMuted,
    fontSize: 14,
  },
  engineSection: {
    backgroundColor: 'transparent',
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '900',
    color: Theme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  engineGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    backgroundColor: 'transparent',
  },
  engineIconBtn: {
    width: 50,
    height: 50,
    borderRadius: 15,
    backgroundColor: Theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Theme.colors.border,
    position: 'relative',
  },
  activeIndicator: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: Theme.colors.background,
  },
  taskSection: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  taskGrid: {
    backgroundColor: 'transparent',
    gap: 12,
    paddingBottom: 20,
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.surface,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Theme.colors.border,
    gap: 12,
  },
  taskIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  taskInfo: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  taskLabel: {
    fontSize: 15,
    fontWeight: 'bold',
    color: Theme.colors.text,
  },
  taskKey: {
    fontSize: 11,
    color: Theme.colors.textMuted,
    marginTop: 2,
  },
  taskCheckbox: {
    backgroundColor: 'transparent',
  },
  checkboxUnchecked: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: Theme.colors.border,
  },
  emptyTasks: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: 'transparent',
  },
  emptyTasksText: {
    marginTop: 12,
    color: Theme.colors.textMuted,
    textAlign: 'center',
  },
  footer: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
    backgroundColor: 'transparent',
  },
  initiateBtn: {
    height: 56,
    backgroundColor: Theme.colors.primary,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    shadowColor: Theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  disabledBtn: {
    opacity: 0.6,
  },
  initiateBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});

import React, { useEffect, useState, useRef, useMemo } from 'react';
import { 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  ActivityIndicator, 
  Alert, 
  FlatList,
  Dimensions,
  Switch,
  Modal
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { 
  ChevronLeft, 
  Play, 
  Square, 
  Settings, 
  Activity, 
  Zap, 
  AlertTriangle, 
  Terminal, 
  Sliders, 
  Globe, 
  ShieldAlert, 
  Clock,
  Plus
} from 'lucide-react-native';
import Svg, { Path, Rect } from 'react-native-svg';

import { Text, View } from '@/components/Themed';
import { Theme } from '../../../src/constants/Theme';
import { stressApi, StressConfig } from '../../../src/api/stress';
import { useSettingsStore } from '../../../src/store/useSettingsStore';

const { width } = Dimensions.get('window');

interface TelemetryPoint {
  type: string;
  tool?: string;
  line?: string;
  avg_latency?: number;
  latency?: number;
  throughput_rps?: number;
  rps?: number;
  error_rate?: number;
  total_requests?: number;
  timestamp: number;
}

export default function MobileStressCockpit() {
  const { id } = useLocalSearchParams();
  const scanId = parseInt(Array.isArray(id) ? id[0] : id);
  const router = useRouter();
  const { serverIp } = useSettingsStore();

  const [isScanning, setIsScanning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [wsStatus, setWsStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');

  // Configuration States
  const [concurrency, setConcurrency] = useState(50);
  const [duration, setDuration] = useState('30s');
  const [selectedTools, setSelectedTools] = useState<string[]>(['k6', 'wrk']);
  
  // Endpoint Selection Drawer/Modal
  const [endpoints, setEndpoints] = useState<any[]>([]);
  const [selectedEndpoints, setSelectedEndpoints] = useState<string[]>([]);
  const [openSettingsModal, setOpenSettingsModal] = useState(false);
  const [openEndpointsModal, setOpenEndpointsModal] = useState(false);

  // Telemetry Metrics
  const [logs, setLogs] = useState<string[]>([]);
  const [latencyPoints, setLatencyPoints] = useState<{ x: number; y: number }[]>([]);
  const [rpsValue, setRpsValue] = useState(0);
  const [totalReqs, setTotalReqs] = useState(0);
  const [errorRate, setErrorRate] = useState(0);

  const socketRef = useRef<WebSocket | null>(null);
  const logsListRef = useRef<FlatList | null>(null);

  // Fetch initial scan settings & status
  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        // Load discovered endpoints
        const fetchedEndpoints = await stressApi.getEndpoints('default', scanId);
        setEndpoints(fetchedEndpoints);

        // Fetch status
        const status = await stressApi.getStressStatus(scanId);
        if (status.kill_switch_active === false) {
          // If active in DB or stream is running, we can check if it's currently scanning
          // Let's connect socket to find out
        }
      } catch (err) {
        console.error('Failed to initialize stress telemetry cockpit:', err);
      } finally {
        setLoading(false);
      }
    };
    init();

    return () => {
      disconnectWebSocket();
    };
  }, [scanId]);

  // Connect WebSocket when scanning starts
  useEffect(() => {
    if (isScanning) {
      connectWebSocket();
    } else {
      disconnectWebSocket();
    }
  }, [isScanning]);

  const connectWebSocket = () => {
    disconnectWebSocket();

    let wsProto = 'ws://';
    let wsHost = serverIp || '10.0.2.2:8000';

    if (wsHost.includes('://')) {
      const parts = wsHost.split('://');
      wsProto = parts[0] === 'https' ? 'wss://' : 'ws://';
      wsHost = parts[1];
    }

    if (wsHost.endsWith('/')) {
      wsHost = wsHost.substring(0, wsHost.length - 1);
    }

    const wsUrl = `${wsProto}${wsHost}/ws/stress/${scanId}/`;
    console.log(`[WebSocket] Connecting to stress stream: ${wsUrl}`);
    setWsStatus('connecting');

    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    socket.onopen = () => {
      console.log('[WebSocket] Connected successfully');
      setWsStatus('connected');
    };

    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'telemetry_update') {
          handleTelemetryData(message.data);
        } else if (message.type === 'scan_status') {
          setIsScanning(message.status === 'running');
        }
      } catch (err) {
        console.error('[WebSocket] Parse error:', err);
      }
    };

    socket.onclose = (event) => {
      console.log('[WebSocket] Connection closed:', event.code);
      setWsStatus('disconnected');
      if (isScanning) {
        // Retry
        setTimeout(connectWebSocket, 3000);
      }
    };

    socket.onerror = (error) => {
      console.error('[WebSocket] Error encountered:', error);
      setWsStatus('error');
    };
  };

  const disconnectWebSocket = () => {
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
    setWsStatus('disconnected');
  };

  const handleTelemetryData = (point: TelemetryPoint) => {
    if (point.type === 'log' && point.line) {
      setLogs(prev => {
        const newLogs = [...prev, point.line!];
        if (newLogs.length > 500) newLogs.shift();
        return newLogs;
      });
      // Scroll terminal logs to bottom
      setTimeout(() => {
        logsListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } else if (point.type === 'metric') {
      const lat = point.avg_latency || point.latency || 0;
      const rps = point.throughput_rps || point.rps || 0;
      const reqs = point.total_requests || 0;
      const errs = point.error_rate || 0;

      if (lat > 0) {
        setLatencyPoints(prev => {
          const nextPoints = [...prev, { x: point.timestamp, y: lat }];
          if (nextPoints.length > 30) nextPoints.shift();
          return nextPoints;
        });
      }

      setRpsValue(rps);
      if (reqs > 0) setTotalReqs(reqs);
      setErrorRate(errs);
    }
  };

  const handleStart = async () => {
    setLogs([]);
    setLatencyPoints([]);
    setRpsValue(0);
    setErrorRate(0);
    setIsScanning(true);

    const k6_conf = {
      vus: concurrency,
      duration: duration,
      attack_type: 'http_get',
      rps: '',
      insecure_skip_tls: true,
      no_connection_reuse: false,
      http_debug: ''
    };

    const wrk_conf = {
      threads: '2',
      connections: concurrency,
      duration: duration,
      latency: true,
      timeout: '',
      headers: []
    };

    const locust_conf = {
      users: concurrency,
      spawn_rate: 10,
      run_time: duration,
      loglevel: 'ERROR'
    };

    const payload: StressConfig = {
      concurrency,
      duration,
      uses_tools: selectedTools,
      selected_endpoints: selectedEndpoints.length > 0 ? selectedEndpoints : undefined,
      k6_config: k6_conf,
      wrk_config: wrk_conf,
      locust_config: locust_conf
    };

    try {
      await stressApi.controlStressTest(scanId, 'start', payload);
      Alert.alert('Telemetry Cockpit Active', 'Stress testing run successfully initiated.');
    } catch (error: any) {
      console.error('Failed to start stress run:', error);
      setIsScanning(false);
      Alert.alert('Execution Blocked', 'Could not start stress testing task. Please check server logs.');
    }
  };

  const handleStop = async () => {
    try {
      await stressApi.controlStressTest(scanId, 'stop');
      setIsScanning(false);
      Alert.alert('Halt Sent', 'Emergency abort command triggered.');
    } catch (error: any) {
      console.error('Failed to trigger abort switch:', error);
      Alert.alert('Error', 'Failed to halt the stress test.');
    }
  };

  const toggleTool = (tool: string) => {
    setSelectedTools(prev => 
      prev.includes(tool) ? prev.filter(t => t !== tool) : [...prev, tool]
    );
  };

  const toggleEndpoint = (url: string) => {
    setSelectedEndpoints(prev => 
      prev.includes(url) ? prev.filter(u => u !== url) : [...prev, url]
    );
  };

  // SVG Chart Layout Helpers
  const svgPath = useMemo(() => {
    if (latencyPoints.length < 2) return '';
    const chartWidth = width - Theme.spacing.md * 4;
    const chartHeight = 120;
    const ys = latencyPoints.map(p => p.y);
    const maxY = Math.max(...ys, 100);
    const minY = Math.min(...ys, 0);
    const yRange = maxY - minY;

    return latencyPoints.map((p, index) => {
      const x = (index / (latencyPoints.length - 1)) * chartWidth;
      const y = chartHeight - ((p.y - minY) / yRange) * (chartHeight - 20) - 10;
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
  }, [latencyPoints]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Theme.colors.primary} />
        <Text style={styles.loadingText}>Connecting Telemetry Grid...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={28} color={Theme.colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>STRESS COCKPIT</Text>
          <Text style={styles.headerSubtitle}>Target Scan ID: {scanId}</Text>
        </View>
        <TouchableOpacity 
          onPress={() => setOpenSettingsModal(true)} 
          style={styles.settingsBtn}
          disabled={isScanning}
        >
          <Settings size={22} color={isScanning ? Theme.colors.textMuted : Theme.colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Connection Status & Control Console */}
        <View style={styles.panel}>
          <View style={styles.panelHeader}>
            <Activity size={16} color={Theme.colors.primary} />
            <Text style={styles.panelTitle}>TELEMETRY NETWORK STATUS</Text>
          </View>
          <View style={styles.statusBox}>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>GRID STATUS:</Text>
              <View style={[styles.badge, { 
                borderColor: isScanning ? Theme.colors.success : Theme.colors.warning 
              }]}>
                <Text style={[styles.badgeText, { 
                  color: isScanning ? Theme.colors.success : Theme.colors.warning 
                }]}>
                  {isScanning ? 'RUNNING' : 'STANDBY'}
                </Text>
              </View>
            </View>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>WEBSOCKET FEED:</Text>
              <Text style={[styles.feedStatus, { 
                color: wsStatus === 'connected' ? Theme.colors.success : Theme.colors.error 
              }]}>
                {wsStatus.toUpperCase()}
              </Text>
            </View>
          </View>

          {/* Start/Stop Primary Buttons */}
          <View style={styles.controlsRow}>
            {!isScanning ? (
              <TouchableOpacity onPress={handleStart} style={styles.startBtn}>
                <Play size={18} color="#000" fill="#000" />
                <Text style={styles.startBtnText}>ENGAGE STRESS TEST</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={handleStop} style={styles.stopBtn}>
                <Square size={18} color="#fff" fill="#fff" />
                <Text style={styles.stopBtnText}>ABORT TASK IMMEDIATELY</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Real-time KPI Card Dashboard */}
        <View style={styles.kpiRow}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>AVERAGE RPS</Text>
            <Text style={[styles.kpiValue, { color: Theme.colors.primary }]}>
              {rpsValue.toFixed(1)}
            </Text>
            <Text style={styles.kpiSub}>Requests / Sec</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>ERROR RATE</Text>
            <Text style={[styles.kpiValue, { color: errorRate > 0 ? Theme.colors.error : Theme.colors.success }]}>
              {errorRate.toFixed(1)}%
            </Text>
            <Text style={styles.kpiSub}>Failed Requests</Text>
          </View>
        </View>

        {/* SVG Performance Line Graph */}
        <View style={styles.panel}>
          <View style={styles.panelHeader}>
            <Zap size={16} color={Theme.colors.warning} />
            <Text style={styles.panelTitle}>LATENCY OVERVIEW (ms)</Text>
          </View>
          <View style={styles.chartContainer}>
            {latencyPoints.length < 2 ? (
              <View style={styles.emptyChart}>
                <Text style={styles.emptyChartText}>Waiting for latency data stream...</Text>
              </View>
            ) : (
              <Svg width={width - Theme.spacing.md * 4} height={120}>
                <Path
                  d={svgPath}
                  fill="none"
                  stroke={Theme.colors.primary}
                  strokeWidth={2.5}
                />
              </Svg>
            )}
          </View>
        </View>

        {/* Real-time RPS Load Indicator */}
        <View style={styles.panel}>
          <View style={styles.panelHeader}>
            <Sliders size={16} color={Theme.colors.secondary} />
            <Text style={styles.panelTitle}>THROUGHPUT SATURATION</Text>
          </View>
          <View style={styles.saturationContainer}>
            <Text style={styles.saturationLabel}>CURRENT LOAD PRESSURE</Text>
            <View style={styles.barBg}>
              <View style={[
                styles.barFill, 
                { width: `${Math.min((rpsValue / 500) * 100, 100)}%` }
              ]} />
            </View>
            <Text style={styles.saturationSub}>
              {rpsValue.toFixed(0)} / 500 RPS Max Indicator Capacity
            </Text>
          </View>
        </View>

        {/* Console Log Terminal */}
        <View style={styles.terminalPanel}>
          <View style={styles.terminalHeader}>
            <Terminal size={14} color="#00f3ff" />
            <Text style={styles.terminalTitle}>TACTICAL TELEMETRY STREAM</Text>
          </View>
          <FlatList
            ref={logsListRef}
            data={logs}
            keyExtractor={(item, index) => index.toString()}
            style={styles.terminalList}
            contentContainerStyle={styles.terminalContent}
            renderItem={({ item }) => (
              <Text style={styles.terminalText}>{item}</Text>
            )}
            ListEmptyComponent={
              <Text style={styles.terminalEmpty}>CONSOLE STANDBY - ENGAGE COCKPIT TO UNLEASH TELEMETRY...</Text>
            }
          />
        </View>
      </ScrollView>

      {/* Settings Configuration Modal */}
      <Modal visible={openSettingsModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>STRESS RUN CONFIGURATION</Text>

            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>Concurrency Limit (VUs)</Text>
              <TextInput
                keyboardType="numeric"
                value={concurrency.toString()}
                onChangeText={(text) => setConcurrency(parseInt(text) || 10)}
                style={styles.textInput}
              />
            </View>

            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>Duration Limit (e.g. 30s, 1m)</Text>
              <TextInput
                value={duration}
                onChangeText={setDuration}
                style={styles.textInput}
              />
            </View>

            {/* Tool Selection Checkboxes */}
            <Text style={styles.sectionHeading}>ENGAGED TOOLS</Text>
            {['k6', 'wrk', 'locust'].map((tool) => (
              <View key={tool} style={styles.checkboxRow}>
                <Text style={styles.toolName}>{tool.toUpperCase()}</Text>
                <Switch
                  value={selectedTools.includes(tool)}
                  onValueChange={() => toggleTool(tool)}
                  thumbColor={selectedTools.includes(tool) ? Theme.colors.primary : '#444'}
                  trackColor={{ true: Theme.colors.primary + '66', false: '#222' }}
                />
              </View>
            ))}

            {/* Target URL Selector Button */}
            <TouchableOpacity 
              onPress={() => {
                setOpenSettingsModal(false);
                setTimeout(() => setOpenEndpointsModal(true), 300);
              }}
              style={styles.endpointSelectBtn}
            >
              <Globe size={18} color="#000" />
              <Text style={styles.endpointSelectBtnText}>
                TARGET SELECTOR ({selectedEndpoints.length} ACTIVE)
              </Text>
            </TouchableOpacity>

            <View style={styles.modalActions}>
              <TouchableOpacity 
                onPress={() => setOpenSettingsModal(false)} 
                style={styles.applyBtn}
              >
                <Text style={styles.applyBtnText}>APPLY CONFIGS</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Endpoint Selector Drawer / Modal */}
      <Modal visible={openEndpointsModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>TARGET ENDPOINT SELECTOR</Text>
            <Text style={styles.modalSub}>Select specific discovered URLs to stress test</Text>

            <ScrollView style={styles.endpointsScroll}>
              {endpoints.map((ep) => {
                const isActive = selectedEndpoints.includes(ep.http_url);
                return (
                  <TouchableOpacity 
                    key={ep.id || ep.http_url}
                    onPress={() => toggleEndpoint(ep.http_url)}
                    style={[styles.endpointItem, isActive && styles.endpointItemActive]}
                  >
                    <View style={styles.endpointMeta}>
                      <Text style={styles.endpointUrl} numberOfLines={2}>{ep.http_url}</Text>
                      {ep.http_status && (
                        <Text style={styles.endpointStatus}>Status: {ep.http_status}</Text>
                      )}
                    </View>
                    <View style={[styles.customCheckbox, isActive && styles.customCheckboxChecked]}>
                      {isActive && <Text style={styles.checkText}>✓</Text>}
                    </View>
                  </TouchableOpacity>
                );
              })}
              {endpoints.length === 0 && (
                <Text style={styles.emptyEndpoints}>No crawled target endpoints found for this scan.</Text>
              )}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity 
                onPress={() => {
                  setOpenEndpointsModal(false);
                  setTimeout(() => setOpenSettingsModal(true), 300);
                }} 
                style={styles.applyBtn}
              >
                <Text style={styles.applyBtnText}>SAVE SELECTIONS</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0d',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0a0a0d',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#00f3ff',
    fontFamily: 'SpaceMono',
    fontSize: 14,
    marginTop: 15,
    letterSpacing: 1.5,
  },
  header: {
    height: 70,
    backgroundColor: '#101014',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    marginLeft: 10,
  },
  headerTitle: {
    fontFamily: 'SpaceMono',
    fontSize: 16,
    fontWeight: 'bold',
    color: '#00f3ff',
    letterSpacing: 2,
  },
  headerSubtitle: {
    fontFamily: 'SpaceMono',
    fontSize: 11,
    color: Theme.colors.textMuted,
  },
  settingsBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: Theme.spacing.md,
    paddingBottom: 40,
  },
  panel: {
    backgroundColor: '#121216',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.03)',
    padding: Theme.spacing.md,
    marginBottom: Theme.spacing.md,
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Theme.spacing.md,
    backgroundColor: 'transparent',
  },
  panelTitle: {
    fontFamily: 'SpaceMono',
    fontSize: 12,
    fontWeight: 'bold',
    color: Theme.colors.text,
    marginLeft: 8,
    letterSpacing: 1.5,
  },
  statusBox: {
    backgroundColor: '#0a0a0c',
    borderRadius: 6,
    padding: Theme.spacing.sm,
    marginBottom: Theme.spacing.md,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4,
    backgroundColor: 'transparent',
  },
  statusLabel: {
    fontFamily: 'SpaceMono',
    fontSize: 11,
    color: Theme.colors.textMuted,
  },
  badge: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: {
    fontFamily: 'SpaceMono',
    fontSize: 10,
    fontWeight: 'bold',
  },
  feedStatus: {
    fontFamily: 'SpaceMono',
    fontSize: 11,
    fontWeight: 'bold',
  },
  controlsRow: {
    flexDirection: 'row',
    backgroundColor: 'transparent',
  },
  startBtn: {
    flex: 1,
    height: 46,
    backgroundColor: '#00f3ff',
    borderRadius: 6,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  startBtnText: {
    color: '#000',
    fontFamily: 'SpaceMono',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1.5,
  },
  stopBtn: {
    flex: 1,
    height: 46,
    backgroundColor: Theme.colors.error,
    borderRadius: 6,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  stopBtnText: {
    color: '#fff',
    fontFamily: 'SpaceMono',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  kpiRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Theme.spacing.md,
    backgroundColor: 'transparent',
  },
  kpiCard: {
    width: (width - Theme.spacing.md * 3) / 2,
    backgroundColor: '#121216',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.03)',
    padding: Theme.spacing.md,
    alignItems: 'center',
  },
  kpiLabel: {
    fontFamily: 'SpaceMono',
    fontSize: 10,
    color: Theme.colors.textMuted,
    letterSpacing: 1,
    marginBottom: 4,
  },
  kpiValue: {
    fontFamily: 'SpaceMono',
    fontSize: 22,
    fontWeight: 'bold',
    marginVertical: 4,
  },
  kpiSub: {
    fontFamily: 'SpaceMono',
    fontSize: 9,
    color: Theme.colors.textMuted,
  },
  chartContainer: {
    height: 125,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a0a0c',
    borderRadius: 6,
  },
  emptyChart: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  emptyChartText: {
    fontFamily: 'SpaceMono',
    fontSize: 11,
    color: Theme.colors.textMuted,
  },
  saturationContainer: {
    backgroundColor: '#0a0a0c',
    borderRadius: 6,
    padding: Theme.spacing.md,
  },
  saturationLabel: {
    fontFamily: 'SpaceMono',
    fontSize: 10,
    color: Theme.colors.textMuted,
    marginBottom: 8,
  },
  barBg: {
    height: 12,
    backgroundColor: '#222',
    borderRadius: 6,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: Theme.colors.secondary,
    borderRadius: 6,
  },
  saturationSub: {
    fontFamily: 'SpaceMono',
    fontSize: 9,
    color: Theme.colors.textMuted,
    marginTop: Theme.spacing.xs,
  },
  terminalPanel: {
    backgroundColor: '#000',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 243, 255, 0.15)',
    height: 200,
    marginBottom: Theme.spacing.md,
    overflow: 'hidden',
  },
  terminalHeader: {
    height: 34,
    backgroundColor: '#111',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 243, 255, 0.1)',
  },
  terminalTitle: {
    fontFamily: 'SpaceMono',
    fontSize: 10,
    color: '#00f3ff',
    marginLeft: 6,
    letterSpacing: 1.5,
  },
  terminalList: {
    flex: 1,
  },
  terminalContent: {
    padding: Theme.spacing.sm,
  },
  terminalText: {
    fontFamily: 'SpaceMono',
    fontSize: 10,
    color: '#39ff14', // Matrix Green stdout
    lineHeight: 14,
  },
  terminalEmpty: {
    fontFamily: 'SpaceMono',
    fontSize: 10,
    color: 'rgba(255,255,255,0.3)',
    textAlign: 'center',
    paddingVertical: 40,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#121216',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: Theme.spacing.md,
    borderTopWidth: 2,
    borderTopColor: '#00f3ff',
    maxHeight: '80%',
  },
  modalTitle: {
    fontFamily: 'SpaceMono',
    fontSize: 15,
    fontWeight: 'bold',
    color: '#00f3ff',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  modalSub: {
    fontFamily: 'SpaceMono',
    fontSize: 11,
    color: Theme.colors.textMuted,
    marginBottom: Theme.spacing.md,
  },
  settingItem: {
    marginBottom: Theme.spacing.md,
    backgroundColor: 'transparent',
  },
  settingLabel: {
    fontFamily: 'SpaceMono',
    fontSize: 11,
    color: Theme.colors.text,
    marginBottom: 6,
  },
  textInput: {
    height: 40,
    backgroundColor: '#0a0a0c',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    color: '#fff',
    paddingHorizontal: 12,
    fontFamily: 'SpaceMono',
    fontSize: 12,
  },
  sectionHeading: {
    fontFamily: 'SpaceMono',
    fontSize: 11,
    fontWeight: 'bold',
    color: '#00f3ff',
    marginTop: Theme.spacing.sm,
    marginBottom: Theme.spacing.xs,
    letterSpacing: 1.5,
  },
  checkboxRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.03)',
    backgroundColor: 'transparent',
  },
  toolName: {
    fontFamily: 'SpaceMono',
    fontSize: 12,
    color: '#fff',
  },
  endpointSelectBtn: {
    height: 40,
    backgroundColor: '#ff5f1f', // Tactical Orange
    borderRadius: 6,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginVertical: Theme.spacing.md,
  },
  endpointSelectBtnText: {
    color: '#000',
    fontFamily: 'SpaceMono',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1.5,
  },
  modalActions: {
    marginTop: Theme.spacing.md,
    backgroundColor: 'transparent',
  },
  applyBtn: {
    height: 44,
    backgroundColor: '#00f3ff',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  applyBtnText: {
    color: '#000',
    fontFamily: 'SpaceMono',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  endpointsScroll: {
    maxHeight: 300,
    marginVertical: Theme.spacing.md,
  },
  endpointItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Theme.spacing.sm,
    borderRadius: 6,
    backgroundColor: '#0a0a0c',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  endpointItemActive: {
    borderColor: 'rgba(255, 95, 31, 0.4)',
    backgroundColor: 'rgba(255, 95, 31, 0.05)',
  },
  endpointMeta: {
    flex: 1,
    marginRight: Theme.spacing.md,
    backgroundColor: 'transparent',
  },
  endpointUrl: {
    fontFamily: 'SpaceMono',
    fontSize: 11,
    color: '#fff',
  },
  endpointStatus: {
    fontFamily: 'SpaceMono',
    fontSize: 9,
    color: Theme.colors.textMuted,
    marginTop: 2,
  },
  customCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#444',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  customCheckboxChecked: {
    borderColor: '#ff5f1f',
    backgroundColor: '#ff5f1f',
  },
  checkText: {
    color: '#000',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyEndpoints: {
    fontFamily: 'SpaceMono',
    fontSize: 11,
    color: 'rgba(255,255,255,0.3)',
    textAlign: 'center',
    paddingVertical: 30,
  },
});

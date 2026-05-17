import React, { useEffect, useState, useRef, useMemo } from 'react';
import { 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert, 
  TextInput,
  Clipboard,
  Dimensions,
  SafeAreaView
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { 
  Zap, 
  Square, 
  Activity, 
  AlertTriangle, 
  ChevronLeft, 
  Terminal as TerminalIcon, 
  Clock, 
  FileText, 
  Cpu,
  Layers,
  Sparkles,
  ArrowDownCircle,
  Copy,
  Trash2
} from 'lucide-react-native';
import Svg, { Path, Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import * as Haptics from 'expo-haptics';

import { Text, View } from '@/components/Themed';
import { Theme } from '../../../src/constants/Theme';
import apiClient from '../../../src/api/client';
import { useSettingsStore } from '../../../src/store/useSettingsStore';

// Telemetry Interface aligning with the web dashboard
interface TelemetryPoint {
  timestamp: number;
  tool: string;
  endpoint: string;
  concurrency?: number;
  latency?: number;
  avg_latency?: number;
  p95_latency?: number;
  throughput_rps?: number;
  error_rate?: number;
  type?: 'command' | 'log' | 'metric';
  command?: string;
  line?: string;
}

export default function MobileStressTelemetryScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { serverIp } = useSettingsStore();

  const [wsStatus, setWsStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const [isScanning, setIsScanning] = useState(false);
  const [telemetry, setTelemetry] = useState<TelemetryPoint[]>([]);
  const [consoleLogs, setConsoleLogs] = useState<string[]>([]);
  const [filterText, setFilterText] = useState('');
  const [isStopping, setIsStopping] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  const socketRef = useRef<WebSocket | null>(null);
  const consoleScrollViewRef = useRef<ScrollView | null>(null);

  // 1. Resolve & Establish WebSocket Connection
  useEffect(() => {
    if (!id || !serverIp) return;

    let reconnectTimeout: ReturnType<typeof setTimeout>;
    let isMounted = true;
    let reconnectAttempts = 0;

    const connect = () => {
      if (!isMounted) return;

      let cleanIp = serverIp.trim();
      if (cleanIp.endsWith('/')) {
        cleanIp = cleanIp.slice(0, -1);
      }

      let wsBase = '';
      if (cleanIp.startsWith('https://')) {
        wsBase = cleanIp.replace('https://', 'wss://');
      } else if (cleanIp.startsWith('http://')) {
        wsBase = cleanIp.replace('http://', 'ws://');
      } else {
        wsBase = `ws://${cleanIp}`;
      }

      const socketUrl = `${wsBase}/ws/stress/${id}/`;
      console.log(`[Mobile WS] Connecting (Attempt ${reconnectAttempts + 1}): ${socketUrl}`);
      setWsStatus('connecting');

      const socket = new WebSocket(socketUrl);
      socketRef.current = socket;

      socket.onopen = () => {
        if (!isMounted) return;
        console.log('[Mobile WS] Telemetry Connected');
        setWsStatus('connected');
        reconnectAttempts = 0;
      };

      socket.onmessage = (event) => {
        if (!isMounted) return;
        try {
          const packet = JSON.parse(event.data);
          if (packet.type === 'telemetry_update' && packet.data) {
            const dataPoint = packet.data as TelemetryPoint;
            
            // Add to metric telemetry
            if (!dataPoint.type || dataPoint.type === 'metric') {
              setTelemetry((prev) => {
                const updated = [...prev, dataPoint];
                return updated.length > 500 ? updated.slice(1) : updated;
              });
            }

            // Stream to console logs if it is stdout/stderr log
            if (dataPoint.type === 'log' || dataPoint.type === 'command') {
              const logMsg = dataPoint.line || dataPoint.command || '';
              if (logMsg.trim()) {
                setConsoleLogs((prev) => {
                  const updated = [...prev, logMsg];
                  return updated.length > 1000 ? updated.slice(1) : updated;
                });
              }
            }
          } else if (packet.type === 'scan_status') {
            setIsScanning(packet.status === 'running');
          }
        } catch (err) {
          console.error('[Mobile WS] Message parse failed', err);
        }
      };

      socket.onclose = (event) => {
        if (!isMounted) return;
        console.log(`[Mobile WS] Disconnected: ${event.code}`);
        setWsStatus('disconnected');

        if (event.code !== 1000 && event.code !== 1001) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 20000);
          reconnectAttempts++;
          reconnectTimeout = setTimeout(connect, delay);
        }
      };

      socket.onerror = (error) => {
        if (!isMounted) return;
        console.error('[Mobile WS] Error:', error);
        setWsStatus('error');
      };
    };

    connect();

    return () => {
      isMounted = false;
      if (socketRef.current) {
        socketRef.current.close(1000);
      }
      clearTimeout(reconnectTimeout);
    };
  }, [id, serverIp]);

  // 2. Stop Scan Trigger with Native Haptics Feedback
  const handleStopScan = async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
      "ABORT SCAN ENGINE",
      "Are you sure you want to stop this stress test immediately? This will terminate all active load tools.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "ABORT ENGINE", 
          style: "destructive",
          onPress: async () => {
            setIsStopping(true);
            try {
              const response = await apiClient.post('/mapi/action/stop/scan/', { scan_ids: [Number(id)] });
              if (response.data && response.data.status) {
                await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                Alert.alert("Success", "Stress scan abort command issued successfully.");
                setIsScanning(false);
              } else {
                Alert.alert("Error", response.data.message || "Failed to abort stress test.");
              }
            } catch (err) {
              Alert.alert("Error", "Network error occurred when stopping the stress engine.");
            } finally {
              setIsStopping(false);
            }
          }
        }
      ]
    );
  };

  // 3. Generate Report Trigger
  const handleGenerateReport = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsGeneratingReport(true);
    try {
      // Simulate/trigger report generation using same backend endpoint
      const response = await apiClient.post(`/mapi/action/generate-stress-report/`, { scan_id: Number(id) });
      if (response.data && response.data.status) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert("Report Initialized", "Stress Test SOC report compilation triggered successfully.");
      } else {
        Alert.alert("Error", response.data.message || "Failed to compile stress test report.");
      }
    } catch (err) {
      Alert.alert("Error", "Network connection issues prevented report compilation.");
    } finally {
      setIsGeneratingReport(false);
    }
  };

  // 4. Compute Real-Time KPIs dynamically from Telemetry Streams
  const kpiData = useMemo(() => {
    const points = telemetry.filter(p => !p.type || p.type === 'metric');
    if (points.length === 0) {
      return { concurrency: 0, avgLatency: 0, successRate: 100, rps: 0 };
    }

    const latest = points[points.length - 1];
    const concurrency = latest.concurrency || 0;
    
    // Average Latency
    const sumLatency = points.reduce((acc, curr) => acc + (curr.avg_latency || curr.latency || 0), 0);
    const avgLatency = Math.round(sumLatency / points.length);

    // Throughput RPS
    const rps = latest.throughput_rps || 0;

    // Success Rate (from error rate)
    const avgErrorRate = points.reduce((acc, curr) => acc + (curr.error_rate || 0), 0) / points.length;
    const successRate = Math.max(0, Math.min(100, Math.round(100 - avgErrorRate)));

    return { concurrency, avgLatency, successRate, rps };
  }, [telemetry]);

  // 5. Build Lightweight SVG Custom Charts for 60fps Mobile Performance
  const screenWidth = Dimensions.get('window').width;
  const chartWidth = screenWidth - 32 - 16; // Account for margins and padding
  const chartHeight = 120;

  const latencyChartPath = useMemo(() => {
    const points = telemetry.filter(p => !p.type || p.type === 'metric');
    if (points.length < 2) return '';

    const latencies = points.map(p => p.avg_latency || p.latency || 0);
    const maxVal = Math.max(...latencies, 200); // Floor at 200ms
    const minVal = 0;

    const xStride = chartWidth / (points.length - 1);
    const yScale = chartHeight / (maxVal - minVal);

    let d = `M 0 ${chartHeight - (latencies[0] - minVal) * yScale}`;
    for (let i = 1; i < latencies.length; i++) {
      const x = i * xStride;
      const y = chartHeight - (latencies[i] - minVal) * yScale;
      d += ` L ${x} ${y}`;
    }
    return d;
  }, [telemetry, chartWidth]);

  const latencyFillPath = useMemo(() => {
    if (!latencyChartPath) return '';
    return `${latencyChartPath} L ${chartWidth} ${chartHeight} L 0 ${chartHeight} Z`;
  }, [latencyChartPath, chartWidth]);

  const throughputChartPath = useMemo(() => {
    const points = telemetry.filter(p => !p.type || p.type === 'metric');
    if (points.length < 2) return '';

    const throughputs = points.map(p => p.throughput_rps || 0);
    const maxVal = Math.max(...throughputs, 50); // Floor at 50 RPS
    const minVal = 0;

    const xStride = chartWidth / (points.length - 1);
    const yScale = chartHeight / (maxVal - minVal);

    let d = `M 0 ${chartHeight - (throughputs[0] - minVal) * yScale}`;
    for (let i = 1; i < throughputs.length; i++) {
      const x = i * xStride;
      const y = chartHeight - (throughputs[i] - minVal) * yScale;
      d += ` L ${x} ${y}`;
    }
    return d;
  }, [telemetry, chartWidth]);

  // 6. Mobile Optimized Saturation List
  const endpointSaturationList = useMemo(() => {
    const endpoints: Record<string, { latency: number; count: number }> = {};
    telemetry.forEach((p) => {
      if (p.endpoint && (p.latency || p.avg_latency)) {
        const val = p.avg_latency || p.latency || 0;
        if (!endpoints[p.endpoint]) {
          endpoints[p.endpoint] = { latency: 0, count: 0 };
        }
        endpoints[p.endpoint].latency += val;
        endpoints[p.endpoint].count += 1;
      }
    });

    return Object.keys(endpoints).map((key) => {
      const avg = Math.round(endpoints[key].latency / endpoints[key].count);
      let status: 'good' | 'warn' | 'critical' = 'good';
      let color = Theme.colors.success;
      if (avg > 500) {
        status = 'critical';
        color = Theme.colors.error;
      } else if (avg > 200) {
        status = 'warn';
        color = Theme.colors.warning;
      }

      return {
        endpoint: key,
        avgLatency: avg,
        status,
        color
      };
    });
  }, [telemetry]);

  // 7. Stream Console & Filtering Log Methods
  const filteredConsoleLogs = useMemo(() => {
    if (!filterText.trim()) return consoleLogs;
    return consoleLogs.filter(log => log.toLowerCase().includes(filterText.toLowerCase()));
  }, [consoleLogs, filterText]);

  const copyToClipboard = () => {
    Clipboard.setString(consoleLogs.join('\n'));
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert("Copied", "Raw telemetry logs successfully copied to your clipboard.");
  };

  const clearLogs = () => {
    setConsoleLogs([]);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <Stack.Screen 
        options={{
          headerShown: true,
          title: 'STRESS COCKPIT',
          headerStyle: { backgroundColor: Theme.colors.surface },
          headerTintColor: Theme.colors.primary,
          headerTitleStyle: {
            fontFamily: 'Bangers',
            fontSize: 22
          },
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ padding: 8, marginLeft: -8 }}>
              <ChevronLeft size={24} color={Theme.colors.text} />
            </TouchableOpacity>
          )
        }}
      />

      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* WS Status Badge & Engine Info */}
        <View style={styles.topInfoRow}>
          <View style={styles.badgeContainer}>
            <View style={[styles.statusDot, { 
              backgroundColor: wsStatus === 'connected' ? Theme.colors.success : 
                               wsStatus === 'connecting' ? Theme.colors.warning : Theme.colors.error 
            }]} />
            <Text style={styles.statusLabel}>
              WS TELEMETRY: {wsStatus.toUpperCase()}
            </Text>
          </View>
          <View style={[styles.statusBadge, { 
            borderColor: isScanning ? Theme.colors.primary : Theme.colors.textMuted,
            backgroundColor: isScanning ? Theme.colors.primary + '15' : 'transparent'
          }]}>
            <Text style={[styles.badgeText, { color: isScanning ? Theme.colors.primary : Theme.colors.textMuted }]}>
              {isScanning ? 'ACTIVE RUN' : 'STANDBY'}
            </Text>
          </View>
        </View>

        {/* Real-Time KPIs Grid */}
        <View style={styles.kpiGrid}>
          <View style={styles.kpiCard}>
            <View style={styles.kpiHeader}>
              <Cpu size={14} color={Theme.colors.primary} />
              <Text style={styles.kpiTitle}>CONCURRENCY</Text>
            </View>
            <Text style={[styles.kpiValue, { color: Theme.colors.primary }]}>{kpiData.concurrency}</Text>
            <Text style={styles.kpiMeta}>Active VUs</Text>
          </View>

          <View style={styles.kpiCard}>
            <View style={styles.kpiHeader}>
              <Clock size={14} color={Theme.colors.warning} />
              <Text style={styles.kpiTitle}>AVG LATENCY</Text>
            </View>
            <Text style={[styles.kpiValue, { color: Theme.colors.warning }]}>{kpiData.avgLatency}ms</Text>
            <Text style={styles.kpiMeta}>Response</Text>
          </View>

          <View style={styles.kpiCard}>
            <View style={styles.kpiHeader}>
              <Zap size={14} color={Theme.colors.success} />
              <Text style={styles.kpiTitle}>SUCCESS RATE</Text>
            </View>
            <Text style={[styles.kpiValue, { color: Theme.colors.success }]}>{kpiData.successRate}%</Text>
            <Text style={styles.kpiMeta}>Error bound</Text>
          </View>

          <View style={styles.kpiCard}>
            <View style={styles.kpiHeader}>
              <Activity size={14} color={Theme.colors.accent} />
              <Text style={styles.kpiTitle}>THROUGHPUT</Text>
            </View>
            <Text style={[styles.kpiValue, { color: Theme.colors.accent }]}>{Math.round(kpiData.rps)}</Text>
            <Text style={styles.kpiMeta}>Requests/sec</Text>
          </View>
        </View>

        {/* Action Controls */}
        <View style={styles.actionContainer}>
          <TouchableOpacity 
            style={[styles.glassBtn, styles.reportBtn]} 
            onPress={handleGenerateReport}
            disabled={isGeneratingReport}
          >
            {isGeneratingReport ? (
              <ActivityIndicator size="small" color="#8ba4c0" />
            ) : (
              <>
                <FileText size={18} color="#8ba4c0" />
                <Text style={styles.reportBtnText}>COMPILE SOC REPORT</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionBtn, styles.stopBtn]} 
            onPress={handleStopScan}
            disabled={isStopping}
          >
            {isStopping ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Square size={16} color="#fff" fill="#fff" />
                <Text style={styles.stopBtnText}>KILL SWITCH</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Real-time charts */}
        <View style={styles.chartPanel}>
          <View style={styles.panelHeader}>
            <Activity size={16} color={Theme.colors.warning} />
            <Text style={styles.panelTitle}>AVG RESPONSE TIME (ms)</Text>
          </View>
          <View style={styles.chartContainer}>
            {telemetry.length < 2 ? (
              <View style={styles.emptyChart}>
                <ActivityIndicator size="small" color={Theme.colors.warning} />
                <Text style={styles.emptyChartText}>Waiting for latency telemetry...</Text>
              </View>
            ) : (
              <Svg width={chartWidth} height={chartHeight}>
                <Defs>
                  <LinearGradient id="latencyGlow" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0%" stopColor={Theme.colors.warning} stopOpacity="0.3" />
                    <Stop offset="100%" stopColor={Theme.colors.warning} stopOpacity="0" />
                  </LinearGradient>
                </Defs>
                <Path d={latencyFillPath} fill="url(#latencyGlow)" />
                <Path d={latencyChartPath} fill="none" stroke={Theme.colors.warning} strokeWidth="2.5" />
              </Svg>
            )}
          </View>
        </View>

        <View style={styles.chartPanel}>
          <View style={styles.panelHeader}>
            <Zap size={16} color={Theme.colors.accent} />
            <Text style={styles.panelTitle}>THROUGHPUT RATE (RPS)</Text>
          </View>
          <View style={styles.chartContainer}>
            {telemetry.length < 2 ? (
              <View style={styles.emptyChart}>
                <ActivityIndicator size="small" color={Theme.colors.accent} />
                <Text style={styles.emptyChartText}>Waiting for throughput telemetry...</Text>
              </View>
            ) : (
              <Svg width={chartWidth} height={chartHeight}>
                <Defs>
                  <LinearGradient id="throughputGlow" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0%" stopColor={Theme.colors.accent} stopOpacity="0.25" />
                    <Stop offset="100%" stopColor={Theme.colors.accent} stopOpacity="0" />
                  </LinearGradient>
                </Defs>
                <Path d={throughputChartPath} fill="none" stroke={Theme.colors.accent} strokeWidth="2" />
              </Svg>
            )}
          </View>
        </View>

        {/* Heatmap/Saturation list */}
        <View style={styles.chartPanel}>
          <View style={styles.panelHeader}>
            <Layers size={16} color={Theme.colors.primary} />
            <Text style={styles.panelTitle}>ENDPOINT SATURATION ANALYSIS</Text>
          </View>
          <View style={styles.saturationContainer}>
            {endpointSaturationList.length === 0 ? (
              <View style={styles.emptyChart}>
                <Text style={styles.emptyChartText}>No active endpoint telemetry logged.</Text>
              </View>
            ) : (
              endpointSaturationList.map((item) => (
                <View key={item.endpoint} style={styles.saturationRow}>
                  <View style={[styles.saturationDotBox, { backgroundColor: item.color + '20' }]}>
                    <View style={[styles.saturationIndicator, { backgroundColor: item.color }]} />
                  </View>
                  <Text style={styles.saturationEndpoint} numberOfLines={1}>
                    {item.endpoint}
                  </Text>
                  <Text style={[styles.saturationLatency, { color: item.color }]}>
                    {item.avgLatency}ms
                  </Text>
                </View>
              ))
            )}
          </View>
        </View>

        {/* Live Terminal Logs */}
        <View style={styles.terminalPanel}>
          <View style={styles.terminalHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'transparent', gap: 8 }}>
              <TerminalIcon size={16} color={Theme.colors.primary} />
              <Text style={styles.terminalTitle}>RAW TELEMETRY STREAM</Text>
            </View>
            <View style={styles.terminalControls}>
              <TouchableOpacity onPress={copyToClipboard} style={styles.terminalControlBtn}>
                <Copy size={14} color={Theme.colors.textMuted} />
              </TouchableOpacity>
              <TouchableOpacity onPress={clearLogs} style={styles.terminalControlBtn}>
                <Trash2 size={14} color={Theme.colors.textMuted} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Filtering logs bar */}
          <View style={styles.searchBarContainer}>
            <TextInput 
              style={styles.searchInput}
              placeholder="Filter terminal console..."
              placeholderTextColor={Theme.colors.textMuted + '80'}
              value={filterText}
              onChangeText={setFilterText}
            />
          </View>

          <ScrollView 
            ref={consoleScrollViewRef}
            style={styles.terminalConsole}
            contentContainerStyle={styles.terminalScrollContent}
            nestedScrollEnabled={true}
            onContentSizeChange={() => {
              if (consoleScrollViewRef.current) {
                consoleScrollViewRef.current.scrollToEnd({ animated: true });
              }
            }}
          >
            {filteredConsoleLogs.length === 0 ? (
              <Text style={styles.emptyTerminalText}>[STANDBY] Telemetry log buffer empty...</Text>
            ) : (
              filteredConsoleLogs.map((log, index) => {
                let color = '#d4d4d8'; // neutral text
                if (log.includes('ERROR') || log.includes('Failed') || log.includes('ERR')) {
                  color = Theme.colors.error;
                } else if (log.includes('SUCCESS') || log.includes('passed') || log.includes('done')) {
                  color = Theme.colors.success;
                } else if (log.startsWith('>') || log.startsWith('[k6') || log.startsWith('[wrk')) {
                  color = Theme.colors.primary;
                }

                return (
                  <Text key={index} style={[styles.terminalLine, { color }]}>
                    {log}
                  </Text>
                );
              })
            )}
          </ScrollView>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  topInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'transparent',
    marginBottom: 16,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: Theme.colors.textMuted,
    letterSpacing: 0.5,
  },
  statusBadge: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    backgroundColor: 'transparent',
    marginBottom: 20,
  },
  kpiCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Theme.colors.surface,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  kpiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    backgroundColor: 'transparent',
    gap: 6,
  },
  kpiTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: Theme.colors.textMuted,
    letterSpacing: 0.5,
  },
  kpiValue: {
    fontSize: 22,
    fontWeight: 'bold',
    marginVertical: 4,
  },
  kpiMeta: {
    fontSize: 9,
    color: Theme.colors.textMuted,
  },
  actionContainer: {
    flexDirection: 'row',
    backgroundColor: 'transparent',
    gap: 12,
    marginBottom: 20,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 10,
    gap: 8,
  },
  glassBtn: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 10,
    gap: 8,
    borderWidth: 1,
  },
  reportBtn: {
    backgroundColor: 'rgba(20, 15, 30, 0.75)',
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  reportBtnText: {
    color: '#8ba4c0',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  stopBtn: {
    backgroundColor: Theme.colors.error,
  },
  stopBtnText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  chartPanel: {
    backgroundColor: Theme.colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    padding: 16,
    marginBottom: 16,
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    backgroundColor: 'transparent',
    gap: 8,
  },
  panelTitle: {
    fontSize: 11,
    color: Theme.colors.text,
    fontFamily: 'Bangers',
    letterSpacing: 0.5,
  },
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  emptyChart: {
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    gap: 8,
  },
  emptyChartText: {
    fontSize: 11,
    color: Theme.colors.textMuted,
  },
  saturationContainer: {
    backgroundColor: 'transparent',
    gap: 10,
  },
  saturationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border + '20',
  },
  saturationDotBox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  saturationIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  saturationEndpoint: {
    flex: 1,
    fontSize: 12,
    color: Theme.colors.text,
    fontWeight: '500',
  },
  saturationLatency: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  terminalPanel: {
    backgroundColor: '#090d16',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    padding: 16,
    marginBottom: 16,
  },
  terminalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'transparent',
    marginBottom: 12,
  },
  terminalTitle: {
    fontSize: 11,
    color: Theme.colors.text,
    fontFamily: 'Bangers',
    letterSpacing: 0.5,
  },
  terminalControls: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: 'transparent',
  },
  terminalControlBtn: {
    padding: 6,
    backgroundColor: Theme.colors.surface,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  searchBarContainer: {
    backgroundColor: Theme.colors.surface,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Theme.colors.border + '50',
  },
  searchInput: {
    color: Theme.colors.text,
    fontSize: 12,
    padding: 0,
  },
  terminalConsole: {
    height: 180,
    backgroundColor: '#05070c',
    borderRadius: 8,
    padding: 10,
  },
  terminalScrollContent: {
    paddingBottom: 10,
  },
  emptyTerminalText: {
    color: Theme.colors.textMuted + '80',
    fontSize: 10,
    fontFamily: 'monospace',
  },
  terminalLine: {
    fontSize: 10,
    fontFamily: 'monospace',
    lineHeight: 14,
    marginBottom: 4,
  }
});

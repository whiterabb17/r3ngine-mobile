import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Zap, Activity, ShieldAlert, Cpu, ChevronLeft, AlertTriangle, Play, Square, Loader2 } from 'lucide-react-native';
import { Theme } from '../../../src/constants/Theme';
import apiClient from '../../../src/api/client';
import { TacticalHaptics } from '../../../src/utils/haptics';
import TelemetryChart from '../../../src/components/System/TelemetryChart';

interface TelemetryPoint {
  endpoint_url: string;
  tool: string;
  concurrent_users: number;
  avg_latency: number;
  p95_latency: number;
  error_rate: number;
  total_requests: number;
  throughput_rps: number;
}

export default function StressDashboardScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [telemetry, setTelemetry] = useState<TelemetryPoint[]>([]);
  const [history, setHistory] = useState<{
    latency: number[];
    throughput: number[];
    errors: number[];
  }>({
    latency: [],
    throughput: [],
    errors: []
  });
  
  const pollInterval = useRef<NodeJS.Timeout | null>(null);

  const fetchTelemetry = async (isFirstLoad = false) => {
    try {
      const response = await apiClient.get(`/api/stress-testing/${id}/`);
      if (response.data.status) {
        const results = response.data.results || [];
        setTelemetry(results);
        
        // Aggregate data for charts (averages across all endpoints tested in this scan)
        if (results.length > 0) {
          const avgLat = results.reduce((acc: number, curr: any) => acc + (curr.avg_latency || 0), 0) / results.length;
          const avgThr = results.reduce((acc: number, curr: any) => acc + (curr.throughput_rps || 0), 0) / results.length;
          const avgErr = results.reduce((acc: number, curr: any) => acc + (curr.error_rate || 0), 0) / results.length;
          
          setHistory(prev => ({
            latency: [...prev.latency, avgLat].slice(-20),
            throughput: [...prev.throughput, avgThr].slice(-20),
            errors: [...prev.errors, avgErr * 100].slice(-20) // Convert to percentage
          }));
        }
      }
    } catch (err) {
      console.error('Failed to poll stress telemetry:', err);
    } finally {
      if (isFirstLoad) setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTelemetry(true);
    
    // Setup polling every 5 seconds
    pollInterval.current = setInterval(() => fetchTelemetry(), 5000);
    
    return () => {
      if (pollInterval.current) clearInterval(pollInterval.current);
    };
  }, [id]);

  const onRefresh = () => {
    setRefreshing(true);
    TacticalHaptics.soft();
    fetchTelemetry();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Theme.colors.warning} />
        <Text style={styles.loadingText}>ESTABLISHING TELEMETRY LINK...</Text>
      </View>
    );
  }

  const currentStatus = telemetry[0] || {};

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'PERFORMANCE DASHBOARD',
          headerStyle: { backgroundColor: Theme.colors.background },
          headerTintColor: '#fff',
          headerTitleStyle: { fontFamily: 'Bangers', letterSpacing: 1 },
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: -10, padding: 10 }}>
              <ChevronLeft size={24} color="#fff" />
            </TouchableOpacity>
          )
        }} 
      />

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Theme.colors.warning} />
        }
      >
        {/* KPI Section */}
        <View style={styles.kpiGrid}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>CONCURRENT</Text>
            <Text style={styles.kpiValue}>{currentStatus.concurrent_users || 0}</Text>
            <Text style={styles.kpiUnit}>USERS</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>REQ TOTAL</Text>
            <Text style={styles.kpiValue}>{currentStatus.total_requests || 0}</Text>
            <Text style={styles.kpiUnit}>PROCESSED</Text>
          </View>
        </View>

        {/* Real-time Charts */}
        <Text style={styles.sectionTitle}>REAL-TIME METRICS</Text>
        
        <TelemetryChart 
          data={history.latency} 
          label="Response Latency" 
          color={Theme.colors.primary} 
          unit="ms" 
        />
        
        <TelemetryChart 
          data={history.throughput} 
          label="Throughput" 
          color={Theme.colors.success} 
          unit=" rps" 
        />
        
        <TelemetryChart 
          data={history.errors} 
          label="Error Rate" 
          color={Theme.colors.error} 
          unit="%" 
          maxValue={100}
        />

        {/* Detailed Logs */}
        <Text style={styles.sectionTitle}>ENDPOINT SATURATION</Text>
        {telemetry.map((t, index) => (
          <View key={index} style={styles.endpointCard}>
            <View style={styles.endpointHeader}>
              <Activity size={16} color={Theme.colors.warning} />
              <Text style={styles.url} numberOfLines={1}>{t.endpoint_url}</Text>
            </View>
            <View style={styles.detailsRow}>
              <View style={styles.detail}>
                <Text style={styles.detailLabel}>P95 LATENCY</Text>
                <Text style={styles.detailValue}>{t.p95_latency.toFixed(1)}ms</Text>
              </View>
              <View style={styles.detail}>
                <Text style={styles.detailLabel}>TOOL</Text>
                <Text style={styles.detailValue}>{t.tool.toUpperCase()}</Text>
              </View>
              <View style={styles.detail}>
                <Text style={styles.detailLabel}>STABILITY</Text>
                <Text style={[styles.detailValue, { color: t.error_rate > 0.1 ? Theme.colors.error : Theme.colors.success }]}>
                  {((1 - t.error_rate) * 100).toFixed(1)}%
                </Text>
              </View>
            </View>
          </View>
        ))}

        {telemetry.length === 0 && (
          <View style={styles.emptyContainer}>
            <AlertTriangle size={48} color={Theme.colors.border} />
            <Text style={styles.emptyText}>No telemetry data detected for this operational cycle.</Text>
          </View>
        )}
      </ScrollView>

      {/* Control Bar */}
      <View style={styles.controlBar}>
        <View style={styles.statusIndicator}>
          <View style={[styles.pulseDot, { backgroundColor: Theme.colors.success }]} />
          <Text style={styles.statusText}>LIVE TELEMETRY ACTIVE</Text>
        </View>
        <TouchableOpacity 
          style={styles.stopButton}
          onPress={() => TacticalHaptics.notification('warning')}
        >
          <Square size={16} color="#fff" fill="#fff" />
          <Text style={styles.stopButtonText}>ABORT TEST</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Theme.colors.background,
  },
  loadingText: {
    marginTop: 12,
    color: Theme.colors.warning,
    fontFamily: 'Bangers',
    letterSpacing: 1,
  },
  scrollContent: {
    padding: Theme.spacing.md,
    paddingBottom: 120,
  },
  kpiGrid: {
    flexDirection: 'row',
    gap: Theme.spacing.md,
    marginBottom: Theme.spacing.xl,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: Theme.colors.surface,
    padding: Theme.spacing.md,
    borderRadius: Theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    alignItems: 'center',
  },
  kpiLabel: {
    color: Theme.colors.textMuted,
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 4,
  },
  kpiValue: {
    color: Theme.colors.text,
    fontSize: 32,
    fontFamily: 'Bangers',
  },
  kpiUnit: {
    color: Theme.colors.primary,
    fontSize: 10,
    fontWeight: 'bold',
    marginTop: -4,
  },
  sectionTitle: {
    color: Theme.colors.textMuted,
    fontSize: 12,
    fontFamily: 'Bangers',
    letterSpacing: 1,
    marginBottom: Theme.spacing.md,
    marginTop: Theme.spacing.md,
  },
  endpointCard: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.md,
    marginBottom: Theme.spacing.sm,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  endpointHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  url: {
    color: Theme.colors.text,
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border + '33',
    paddingTop: 12,
  },
  detail: {
    alignItems: 'center',
  },
  detailLabel: {
    color: Theme.colors.textMuted,
    fontSize: 9,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  detailValue: {
    color: Theme.colors.text,
    fontSize: 12,
    fontWeight: 'bold',
  },
  controlBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Theme.colors.surface,
    padding: Theme.spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    color: Theme.colors.text,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  stopButton: {
    backgroundColor: Theme.colors.error,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: Theme.borderRadius.md,
    gap: 8,
  },
  stopButtonText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
    marginTop: 20,
  },
  emptyText: {
    color: Theme.colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 20,
  },
});

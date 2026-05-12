import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Dimensions, Animated } from 'react-native';
import { Stack } from 'expo-router';
import { Activity, Database, Cpu, HardDrive, ShieldCheck, AlertTriangle, Zap } from 'lucide-react-native';
import apiClient from '../../src/api/client';
import { Theme } from '../../src/constants/Theme';
import { TacticalHaptics } from '../../src/utils/haptics';

const { width } = Dimensions.get('window');

interface HealthData {
  status: 'online' | 'degraded' | 'offline';
  database: {
    status: 'up' | 'down';
    latency_ms: number;
  };
  workers: {
    status: 'online' | 'offline';
    count: number;
  };
  disk: {
    used_percent: number;
    free_gb: number;
  };
  load: number;
  timestamp: number;
}

export default function SystemHealthDashboard() {
  const [data, setData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const fadeAnim = useState(new Animated.Value(0))[0];

  const fetchHealth = async () => {
    try {
      const response = await apiClient.get('/api/system/health/');
      setData(response.data);
      setError(null);
      
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    } catch (err) {
      console.error('Failed to fetch health:', err);
      setError('Tactical link to backend severed.');
      TacticalHaptics.trigger('error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 30000); // Update every 30s
    return () => clearInterval(interval);
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    TacticalHaptics.trigger('soft');
    fetchHealth();
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'online':
      case 'up':
        return Theme.colors.success;
      case 'degraded':
        return Theme.colors.warning;
      case 'offline':
      case 'down':
        return Theme.colors.error;
      default:
        return Theme.colors.textMuted;
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <Activity color={Theme.colors.primary} size="large" />
        <Text style={styles.loadingText}>SYNCHRONIZING TACTICAL DATA...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'SYSTEM HEALTH', 
          headerStyle: { backgroundColor: Theme.colors.background }, 
          headerTintColor: '#fff',
          headerTitleStyle: { fontFamily: 'Bangers', letterSpacing: 1 }
        }} 
      />

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Theme.colors.primary} />}
      >
        {/* Global Status Banner */}
        <Animated.View style={[styles.statusBanner, { backgroundColor: getStatusColor(data?.status), opacity: fadeAnim }]}>
          <ShieldCheck color="#fff" size={24} />
          <View style={styles.statusBannerTextContainer}>
            <Text style={styles.statusBannerTitle}>
              SYSTEM STATUS: {data?.status.toUpperCase() || 'UNKNOWN'}
            </Text>
            <Text style={styles.statusBannerSubtitle}>
              {data?.status === 'online' ? 'All systems nominal.' : 'Performance degradation detected.'}
            </Text>
          </View>
        </Animated.View>

        {error && (
          <View style={styles.errorCard}>
            <AlertTriangle color={Theme.colors.error} size={20} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.grid}>
          {/* Database Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Database color={Theme.colors.primary} size={20} />
              <Text style={styles.cardTitle}>DATABASE</Text>
            </View>
            <View style={styles.cardContent}>
              <Text style={[styles.mainValue, { color: getStatusColor(data?.database.status) }]}>
                {data?.database.status === 'up' ? 'ONLINE' : 'OFFLINE'}
              </Text>
              <Text style={styles.subValue}>LATENCY: {data?.database.latency_ms}ms</Text>
            </View>
          </View>

          {/* Workers Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Zap color={Theme.colors.warning} size={20} />
              <Text style={styles.cardTitle}>WORKERS</Text>
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.mainValue}>{data?.workers.count || 0}</Text>
              <Text style={styles.subValue}>ACTIVE INSTANCES</Text>
            </View>
          </View>

          {/* CPU / Load Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Cpu color={Theme.colors.info} size={20} />
              <Text style={styles.cardTitle}>SYSTEM LOAD</Text>
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.mainValue}>{data?.load.toFixed(2) || '0.00'}</Text>
              <Text style={styles.subValue}>AVG (1 MIN)</Text>
            </View>
          </View>

          {/* Storage Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <HardDrive color={Theme.colors.textMuted} size={20} />
              <Text style={styles.cardTitle}>STORAGE</Text>
            </View>
            <View style={styles.cardContent}>
              <View style={styles.progressContainer}>
                <View style={[styles.progressBar, { width: `${data?.disk.used_percent || 0}%`, backgroundColor: (data?.disk.used_percent || 0) > 80 ? Theme.colors.error : Theme.colors.success }]} />
              </View>
              <Text style={styles.subValue}>{data?.disk.free_gb}GB FREE</Text>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            LAST UPDATED: {data ? new Date(data.timestamp * 1000).toLocaleTimeString() : 'N/A'}
          </Text>
        </View>
      </ScrollView>
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
    backgroundColor: Theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: Theme.colors.primary,
    fontFamily: 'Bangers',
    marginTop: Theme.spacing.md,
    letterSpacing: 1,
  },
  scrollContent: {
    padding: Theme.spacing.md,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Theme.spacing.md,
    borderRadius: Theme.borderRadius.lg,
    marginBottom: Theme.spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  statusBannerTextContainer: {
    marginLeft: Theme.spacing.md,
  },
  statusBannerTitle: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'Bangers',
    letterSpacing: 0.5,
  },
  statusBannerSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    fontWeight: '500',
  },
  errorCard: {
    backgroundColor: Theme.colors.error + '22',
    flexDirection: 'row',
    alignItems: 'center',
    padding: Theme.spacing.md,
    borderRadius: Theme.borderRadius.md,
    marginBottom: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Theme.colors.error + '44',
  },
  errorText: {
    color: Theme.colors.error,
    marginLeft: Theme.spacing.sm,
    fontWeight: '600',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: (width - Theme.spacing.md * 3) / 2,
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.md,
    marginBottom: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Theme.spacing.sm,
  },
  cardTitle: {
    color: Theme.colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    marginLeft: Theme.spacing.xs,
    letterSpacing: 0.5,
  },
  cardContent: {
    alignItems: 'flex-start',
  },
  mainValue: {
    color: Theme.colors.text,
    fontSize: 24,
    fontFamily: 'Bangers',
    marginVertical: Theme.spacing.xs,
  },
  subValue: {
    color: Theme.colors.textMuted,
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  progressContainer: {
    width: '100%',
    height: 6,
    backgroundColor: Theme.colors.border,
    borderRadius: 3,
    marginVertical: Theme.spacing.sm,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  footer: {
    marginTop: Theme.spacing.xl,
    alignItems: 'center',
    paddingBottom: Theme.spacing.xl,
  },
  footerText: {
    color: Theme.colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
});

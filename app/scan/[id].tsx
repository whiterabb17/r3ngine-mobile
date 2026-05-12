import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, ScrollView, RefreshControl, TouchableOpacity, useWindowDimensions, ActivityIndicator, Alert } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { 
  Activity, 
  Globe, 
  ShieldAlert, 
  History, 
  ChevronLeft, 
  MoreVertical,
  Clock,
  Zap,
  Target,
  AlertTriangle,
  Square
} from 'lucide-react-native';

import { Text, View } from '@/components/Themed';
import { Theme } from '../../src/constants/Theme';
import apiClient from '../../src/api/client';

import SummaryTab from '../../src/components/Scan/SummaryTab';
import SubdomainsTab from '../../src/components/Scan/SubdomainsTab';
import VulnerabilitiesTab from '../../src/components/Scan/VulnerabilitiesTab';
import TimelineTab from '../../src/components/Scan/TimelineTab';

type TabType = 'SUMMARY' | 'SUBDOMAINS' | 'VULNERABILITIES' | 'TIMELINE';

export default function ScanDetailScreen() {
  const { id, slug } = useLocalSearchParams();
  const router = useRouter();
  const { width } = useWindowDimensions();
  
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('SUMMARY');
  const [error, setError] = useState<string | null>(null);

  const fetchScanDetail = useCallback(async () => {
    if (!id || !slug) return;
    try {
      setError(null);
      const response = await apiClient.get(`scan-summary/${slug}/${id}/`);
      setData(response.data);
    } catch (err: any) {
      console.error('Error fetching scan detail:', err);
      setError(err.message || 'Failed to fetch scan details');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id, slug]);

  useEffect(() => {
    fetchScanDetail();
  }, [fetchScanDetail]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchScanDetail();
  };

  const handleStopScan = () => {
    Alert.alert(
      "Stop Scan",
      "Are you sure you want to stop this scan? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Stop Scan", 
          style: "destructive",
          onPress: async () => {
            try {
              const response = await apiClient.post('action/stop/scan/', { scan_ids: [id] });
              if (response.data && response.data.status) {
                Alert.alert("Success", "Scan stop request sent.");
                fetchScanDetail();
              } else {
                Alert.alert("Error", response.data.message || "Failed to stop scan.");
              }
            } catch (err: any) {
              Alert.alert("Error", "An error occurred while stopping the scan.");
            }
          }
        }
      ]
    );
  };

  const getStatusColor = (status: number) => {
    switch (status) {
      case 2: return Theme.colors.success; // Success
      case 1: return Theme.colors.info;    // Scanning
      case 3: return Theme.colors.error;   // Aborted
      case 0: return Theme.colors.error;   // Failed
      case 4: return Theme.colors.warning; // Partially Complete
      default: return Theme.colors.warning; // Pending/Unknown
    }
  };

  const getStatusLabel = (status: number) => {
    switch (status) {
      case 2: return 'SUCCESS';
      case 1: return 'SCANNING';
      case 3: return 'ABORTED';
      case 0: return 'FAILED';
      case 4: return 'PARTIALLY COMPLETE';
      default: return 'PENDING';
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Theme.colors.primary} />
        <Text style={styles.loadingText}>Loading Scan Artifacts...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ 
        title: 'Scan Detail',
        headerStyle: { backgroundColor: Theme.colors.surface },
        headerTintColor: Theme.colors.text,
        headerLeft: () => (
          <TouchableOpacity 
            onPress={() => router.back()} 
            style={{ marginLeft: -10, paddingLeft: 10, paddingRight: 15 }}
          >
            <ChevronLeft size={24} color={Theme.colors.text} />
          </TouchableOpacity>
        ),
        headerRight: () => (
          <TouchableOpacity style={{ marginRight: 10 }}>
            <MoreVertical size={20} color={Theme.colors.text} />
          </TouchableOpacity>
        )
      }} />

      {/* Sticky Progress Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={{ backgroundColor: 'transparent' }}>
            <Text style={styles.targetName} numberOfLines={1}>{data?.target_info?.name || 'Target'}</Text>
            <Text style={styles.scanMeta}>ID: {id} • {data?.scan_info?.engine_name || 'Scan Engine'}</Text>
          </View>
          <View style={styles.badgeContainer}>
            <View style={[styles.statusBadge, { borderColor: getStatusColor(data?.scan_info?.scan_status) }]}>
              <Text style={[styles.statusLabel, { color: getStatusColor(data?.scan_info?.scan_status) }]}>
                {getStatusLabel(data?.scan_info?.scan_status)}
              </Text>
            </View>
            {data?.scan_info?.scan_status === 1 && (
              <TouchableOpacity onPress={handleStopScan} style={styles.stopBtn}>
                <Square size={16} color={Theme.colors.error} fill={Theme.colors.error} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {data?.scan_info?.scan_status === 1 && (
          <View style={styles.progressSection}>
            <View style={styles.progressInfo}>
              <Text style={styles.progressLabel}>SCAN PROGRESS</Text>
              <Text style={styles.progressPercentage}>{data?.scan_info?.progress || 0}%</Text>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${data?.scan_info?.progress || 0}%` }]} />
            </View>
          </View>
        )}
      </View>

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        {(['SUMMARY', 'SUBDOMAINS', 'VULNERABILITIES', 'TIMELINE'] as TabType[]).map((tab) => (
          <TouchableOpacity 
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[styles.tabItem, activeTab === tab && styles.tabItemActive]}
          >
            {tab === 'SUMMARY' && <Activity size={18} color={activeTab === tab ? Theme.colors.primary : Theme.colors.textMuted} />}
            {tab === 'SUBDOMAINS' && <Globe size={18} color={activeTab === tab ? Theme.colors.primary : Theme.colors.textMuted} />}
            {tab === 'VULNERABILITIES' && <ShieldAlert size={18} color={activeTab === tab ? Theme.colors.primary : Theme.colors.textMuted} />}
            {tab === 'TIMELINE' && <History size={18} color={activeTab === tab ? Theme.colors.primary : Theme.colors.textMuted} />}
            <Text style={[styles.tabLabel, activeTab === tab && styles.tabLabelActive]}>
              {tab.charAt(0) + tab.slice(1).toLowerCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View 
        style={[styles.content, { backgroundColor: 'transparent' }]}
      >
        {refreshing && (
          <View style={styles.refreshIndicator}>
            <ActivityIndicator size="small" color={Theme.colors.primary} />
          </View>
        )}
        {error && (
          <View style={styles.errorContainer}>
            <AlertTriangle size={24} color={Theme.colors.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {activeTab === 'SUMMARY' && data && (
           <SummaryTab data={data} />
        )}
        
        {activeTab === 'SUBDOMAINS' && data && (
           <SubdomainsTab subdomains={data.subdomains} />
        )}

        {activeTab === 'VULNERABILITIES' && data && (
           <VulnerabilitiesTab 
             vulnerabilities={data.vulnerabilities} 
             onRefresh={fetchScanDetail}
           />
        )}

        {activeTab === 'TIMELINE' && data && (
           <TimelineTab timeline={data.timeline} />
        )}
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
    color: Theme.colors.textMuted,
    fontSize: 16,
    fontFamily: 'Bangers',
    letterSpacing: 1,
  },
  header: {
    padding: Theme.spacing.md,
    backgroundColor: Theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  targetName: {
    fontSize: 22,
    color: Theme.colors.text,
    marginBottom: 2,
    fontFamily: 'Bangers',
    letterSpacing: 1,
  },
  scanMeta: {
    fontSize: 12,
    color: Theme.colors.textMuted,
  },
  statusBadge: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: 'transparent',
  },
  statusLabel: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'transparent',
  },
  stopBtn: {
    padding: 6,
    backgroundColor: Theme.colors.error + '22',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Theme.colors.error + '44',
  },
  progressSection: {
    marginTop: Theme.spacing.md,
    backgroundColor: 'transparent',
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
    backgroundColor: 'transparent',
  },
  progressLabel: {
    fontSize: 9,
    fontWeight: '900',
    color: Theme.colors.textMuted,
    letterSpacing: 0.5,
  },
  progressPercentage: {
    fontSize: 10,
    fontWeight: 'bold',
    color: Theme.colors.primary,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: Theme.colors.border + '33',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Theme.colors.primary,
    borderRadius: 3,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    backgroundColor: 'transparent',
  },
  tabItemActive: {
    borderBottomColor: Theme.colors.primary,
  },
  tabLabel: {
    fontSize: 10,
    marginTop: 6,
    color: Theme.colors.textMuted,
    letterSpacing: 0.5,
    fontFamily: 'Bangers',
  },
  tabLabelActive: {
    color: Theme.colors.primary,
  },
  content: {
    flex: 1,
  },
  refreshIndicator: {
    padding: 10,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  errorContainer: {
    padding: Theme.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    color: Theme.colors.error,
    textAlign: 'center',
    marginTop: 12,
  }
});

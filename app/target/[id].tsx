import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, ScrollView, RefreshControl, TouchableOpacity, useWindowDimensions, ActivityIndicator, Alert } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { 
  Globe, 
  ShieldAlert, 
  LayoutGrid, 
  ChevronLeft, 
  MoreVertical,
  Zap,
  Target as TargetIcon,
  AlertTriangle,
  StickyNote,
  Plus,
  Network
} from 'lucide-react-native';

import { Text, View } from '@/components/Themed';
import { Theme } from '../../src/constants/Theme';
import apiClient from '../../src/api/client';
import { useProjectStore } from '../../src/store/useProjectStore';

import TargetSummaryTab from '../../src/components/Target/TargetSummaryTab';
import SubdomainsTab from '../../src/components/Scan/SubdomainsTab';
import VulnerabilitiesTab from '../../src/components/Scan/VulnerabilitiesTab';
import TechStackTab from '../../src/components/Target/TechStackTab';
import { ReconNoteCard } from '../../src/components/Intelligence/ReconNoteCard';

import AssetGraph from '../../src/components/Observability/AssetGraph';

type TabType = 'SUMMARY' | 'SUBDOMAINS' | 'VULNERABILITIES' | 'TECH' | 'NOTES' | 'GRAPH';

export default function TargetDetailScreen() {
  const { id } = useLocalSearchParams();
  const { currentProject } = useProjectStore();
  const router = useRouter();
  const { width } = useWindowDimensions();
  
  const [summaryData, setSummaryData] = useState<any>(null);
  const [subdomains, setSubdomains] = useState<any[]>([]);
  const [vulnerabilities, setVulnerabilities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('SUMMARY');
  const [notes, setNotes] = useState<any[]>([]);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!id || !currentProject) return;
    try {
      setError(null);
      
      // Fetch summary
      const summaryRes = await apiClient.get(`target-summary/${currentProject}/${id}/`);
      setSummaryData(summaryRes.data);

      // We'll fetch full lists only when tabs are switched to save resources
      // but for now let's pre-fetch if needed or handle in useEffect
    } catch (err: any) {
      console.error('Error fetching target detail:', err);
      setError(err.message || 'Failed to fetch target details');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id, currentProject]);

  const fetchTabContent = useCallback(async (tab: TabType) => {
    if (!id) return;
    try {
      if (tab === 'SUBDOMAINS' && subdomains.length === 0) {
        const res = await apiClient.get(`querySubdomains/?target_id=${id}`);
        setSubdomains(res.data.subdomains || []);
      } else if (tab === 'VULNERABILITIES' && vulnerabilities.length === 0) {
        const res = await apiClient.get(`listVulnerability/?target_id=${id}`);
        const data = Array.isArray(res.data) ? res.data : (res.data.results || []);
        setVulnerabilities(data);
      } else if (tab === 'NOTES' && notes.length === 0) {
        setLoadingNotes(true);
        const res = await apiClient.get(`listTodoNotes/?target_id=${id}`);
        setNotes(res.data.notes || []);
        setLoadingNotes(false);
      }
    } catch (err) {
      console.error(`Error fetching ${tab} data:`, err);
    }
  }, [id, subdomains.length, vulnerabilities.length]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchTabContent(activeTab);
  }, [activeTab, fetchTabContent]);

  const onRefresh = () => {
    setRefreshing(true);
    // Reset lists to force re-fetch
    setSubdomains([]);
    setVulnerabilities([]);
    fetchData();
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Theme.colors.primary} />
        <Text style={styles.loadingText}>Initializing Target Intelligence...</Text>
      </View>
    );
  }

  const tabs: { type: TabType; icon: any; label: string }[] = [
    { type: 'SUMMARY', icon: TargetIcon, label: 'Summary' },
    { type: 'SUBDOMAINS', icon: Globe, label: 'Assets' },
    { type: 'VULNERABILITIES', icon: ShieldAlert, label: 'Vulns' },
    { type: 'TECH', icon: LayoutGrid, label: 'Stack' },
    { type: 'GRAPH', icon: Network, label: 'Graph' },
    { type: 'NOTES', icon: StickyNote, label: 'Notes' },
  ];

  return (
    <View style={styles.container}>
      <Stack.Screen options={{
        headerTitle: summaryData?.domain_info?.name || 'Target Detail',
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 0, marginRight: 15 }}>
            <ChevronLeft size={24} color={Theme.colors.text} />
          </TouchableOpacity>
        ),
        headerRight: () => (
          <TouchableOpacity onPress={() => {}}>
            <MoreVertical size={20} color={Theme.colors.text} />
          </TouchableOpacity>
        ),
        headerStyle: {
          backgroundColor: Theme.colors.surface,
        },
        headerTitleStyle: {
          fontFamily: 'Bangers',
          fontSize: 16,
          color: Theme.colors.primary,
        }
      }} />

      {/* Target Header Stats */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={{ backgroundColor: 'transparent' }}>
            <Text style={styles.targetName}>{summaryData?.target?.name || 'Loading...'}</Text>
            <Text style={styles.projectSlug}>Project: {currentProject}</Text>
          </View>
          <TouchableOpacity style={styles.scanBtn} onPress={() => {}}>
            <Zap size={16} color={Theme.colors.background} fill={Theme.colors.background} />
            <Text style={styles.scanBtnText}>SCAN</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Custom Tab Bar */}
      <View style={styles.tabBar}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.type;
          return (
            <TouchableOpacity 
              key={tab.type} 
              style={[styles.tabItem, isActive && styles.tabItemActive]}
              onPress={() => setActiveTab(tab.type)}
            >
              <tab.icon size={18} color={isActive ? Theme.colors.primary : Theme.colors.textMuted} />
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Tab Content */}
      <View style={styles.content}>
        {error && (
          <View style={styles.errorContainer}>
            <AlertTriangle size={24} color={Theme.colors.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {activeTab === 'SUMMARY' && (
          <TargetSummaryTab data={summaryData} />
        )}
        
        {activeTab === 'SUBDOMAINS' && (
          <SubdomainsTab subdomains={subdomains} />
        )}

        {activeTab === 'VULNERABILITIES' && (
          <VulnerabilitiesTab vulnerabilities={vulnerabilities} onRefresh={onRefresh} />
        )}

        {activeTab === 'TECH' && (
          <TechStackTab 
            technologies={summaryData?.discovered_technologies || []} 
            ports={summaryData?.discovered_ports || []} 
          />
        )}
        {activeTab === 'NOTES' && (
          <ScrollView 
            style={{ flex: 1 }} 
            contentContainerStyle={{ paddingVertical: 16 }}
            refreshControl={<RefreshControl refreshing={loadingNotes} onRefresh={() => fetchTabContent('NOTES')} />}
          >
            {notes.length === 0 && !loadingNotes ? (
              <View style={{ alignItems: 'center', padding: 40 }}>
                <StickyNote size={48} color={Theme.colors.surface} />
                <Text style={{ marginTop: 16, color: Theme.colors.textMuted }}>No Notes for this target</Text>
              </View>
            ) : (
              notes.map(note => (
                <ReconNoteCard 
                  key={note.id} 
                  note={note} 
                  onToggleStatus={async (nid) => {
                    await apiClient.post('toggle/note/status/', { id: nid });
                    setNotes(prev => prev.map(n => n.id === nid ? { ...n, is_done: !n.is_done } : n));
                  }}
                  onToggleImportance={async (nid) => {
                    await apiClient.post('toggle/note/importance/', { id: nid });
                    setNotes(prev => prev.map(n => n.id === nid ? { ...n, is_important: !n.is_important } : n));
                  }}
                  onDelete={async (nid) => {
                    await apiClient.post('action/note/delete/', { id: nid });
                    setNotes(prev => prev.filter(n => n.id !== nid));
                  }}
                />
              ))
            )}
            <TouchableOpacity 
              style={{ 
                marginHorizontal: 16, 
                marginTop: 16, 
                height: 48, 
                borderRadius: 12, 
                backgroundColor: Theme.colors.surface,
                borderWidth: 1,
                borderColor: Theme.colors.primary + '44',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8
              }}
              onPress={() => router.push('/intelligence/notes' as any)}
            >
              <Plus size={18} color={Theme.colors.primary} />
              <Text style={{ color: Theme.colors.primary, fontWeight: 'bold' }}>MANAGE ALL NOTES</Text>
            </TouchableOpacity>
          </ScrollView>
        )}

        {activeTab === 'GRAPH' && (
           <AssetGraph targetId={Number(id)} />
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
    fontSize: 14,
    fontFamily: 'Bangers',
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
    fontSize: 18,
    fontWeight: 'bold',
    color: Theme.colors.text,
    fontFamily: 'Bangers',
  },
  projectSlug: {
    fontSize: 12,
    color: Theme.colors.textMuted,
    marginTop: 2,
  },
  scanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  scanBtnText: {
    color: Theme.colors.background,
    fontWeight: 'bold',
    fontSize: 12,
    letterSpacing: 1,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    backgroundColor: 'transparent',
  },
  tabItemActive: {
    borderBottomColor: Theme.colors.primary,
  },
  tabLabel: {
    fontSize: 12,
    color: Theme.colors.textMuted,
    fontWeight: '500',
  },
  tabLabelActive: {
    color: Theme.colors.primary,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  errorText: {
    color: Theme.colors.error,
    marginTop: 10,
    textAlign: 'center',
  }
});

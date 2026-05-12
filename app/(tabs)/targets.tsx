import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, FlatList, RefreshControl, TouchableOpacity, TextInput, Modal, ActivityIndicator, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { 
  Target, 
  Search, 
  Plus, 
  Zap, 
  History, 
  ChevronRight, 
  Globe, 
  ShieldAlert,
  AlertTriangle,
  X,
  Biohazard
} from 'lucide-react-native';

import { Text, View } from '@/components/Themed';
import { Theme } from '../../src/constants/Theme';
import apiClient from '../../src/api/client';
import { useProjectStore } from '../../src/store/useProjectStore';
import MainScanModal from '../../src/components/Scan/MainScanModal';

interface TargetItem {
  id: number;
  name: string;
  project: {
    name: string;
    slug: string;
  };
  subdomain_count: number;
  vulnerability_count: number;
  insert_date: string;
}

export default function TargetsScreen() {
  const router = useRouter();
  const { currentProject } = useProjectStore();
  
  const [targets, setTargets] = useState<TargetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  // Modals state
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [scanModalVisible, setScanModalVisible] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState<TargetItem | null>(null);
  
  // Add Target form state
  const [newTargetName, setNewTargetName] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const fetchTargets = useCallback(async () => {
    try {
      setError(null);
      const response = await apiClient.get('listTargets/');
      const data = Array.isArray(response.data) ? response.data : (response.data.results || []);
      setTargets(data);
    } catch (err: any) {
      console.error('Error fetching targets:', err);
      setError(`Failed to load targets: ${err.message}`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchTargets();
  }, [fetchTargets]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTargets();
  };

  const handleAddTarget = async () => {
    if (!newTargetName.trim()) {
      Alert.alert('Error', 'Please enter a target domain/name');
      return;
    }
    if (!currentProject) {
      Alert.alert('Error', 'Please select a project first');
      return;
    }

    setIsAdding(true);
    try {
      const response = await apiClient.post('add/target/', {
        domain_name: newTargetName,
        project_slug: currentProject
      });
      
      if (response.data && response.data.status) {
        Alert.alert('Success', 'Target added successfully');
        setAddModalVisible(false);
        setNewTargetName('');
        fetchTargets();
      } else {
        Alert.alert('Error', response.data.message || 'Failed to add target');
      }
    } catch (err: any) {
      console.error('Error adding target:', err);
      Alert.alert('Error', err.response?.data?.message || 'An error occurred while adding the target');
    } finally {
      setIsAdding(false);
    }
  };

  const filteredTargets = targets.filter(t => 
    t.name.toLowerCase().includes(search.toLowerCase())
  );

  const renderItem = ({ item }: { item: TargetItem }) => (
    <View style={styles.targetCard}>
      <View style={styles.cardHeader}>
        <TouchableOpacity 
          style={styles.targetInfo}
          onPress={() => router.push(`/target/${item.id}` as any)}
        >
          <Text style={styles.targetName}>{item.name}</Text>
          <Text style={styles.projectLabel}>{item.project?.name || 'No Project'}</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.scanBtn}
          onPress={() => {
            setSelectedTarget(item);
            setScanModalVisible(true);
          }}
        >
          <Zap size={18} color={Theme.colors.warning} />
        </TouchableOpacity>
      </View>

      <View style={styles.statsRow}>
        <View style={[styles.statBadge, { backgroundColor: Theme.colors.primary + '15' }]}>
          <Globe size={14} color={Theme.colors.primary} />
          <Text style={[styles.statValue, { color: Theme.colors.primary }]}>{item.subdomain_count ?? 0}</Text>
          <Text style={styles.statLabel}>Subdomains</Text>
        </View>
        <View style={[styles.statBadge, { backgroundColor: Theme.colors.error + '15' }]}>
          <Biohazard size={14} color={Theme.colors.error} />
          <Text style={[styles.statValue, { color: Theme.colors.error }]}>{item.vulnerability_count ?? 0}</Text>
          <Text style={styles.statLabel}>Vulns</Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <TouchableOpacity 
          style={styles.historyBtn}
          onPress={() => {
            router.push({
              pathname: '/scans',
              params: { targetId: item.id, targetName: item.name }
            });
          }}
        >
          <History size={14} color={Theme.colors.textMuted} />
          <Text style={styles.footerBtnText}>View History</Text>
          <ChevronRight size={14} color={Theme.colors.textMuted} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ 
        title: 'Targets',
        headerRight: () => (
          <TouchableOpacity 
            style={styles.headerPlus} 
            onPress={() => setAddModalVisible(true)}
          >
            <Plus size={24} color={Theme.colors.primary} />
          </TouchableOpacity>
        )
      }} />

      <View style={styles.searchContainer}>
        <Search size={18} color={Theme.colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search targets..."
          placeholderTextColor={Theme.colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <X size={16} color={Theme.colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <AlertTriangle size={24} color={Theme.colors.error} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchTargets}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={filteredTargets}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            tintColor={Theme.colors.primary} 
          />
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <Target size={48} color={Theme.colors.border} />
              <Text style={styles.emptyTitle}>No Targets Found</Text>
              <Text style={styles.emptySub}>Add your first target to start scanning.</Text>
              <TouchableOpacity 
                style={styles.emptyAddBtn}
                onPress={() => setAddModalVisible(true)}
              >
                <Text style={styles.emptyAddText}>Add Target</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color={Theme.colors.primary} />
            </View>
          )
        }
      />

      {/* Add Target Modal */}
      <Modal
        visible={addModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setAddModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Target</Text>
              <TouchableOpacity onPress={() => setAddModalVisible(false)}>
                <X size={24} color={Theme.colors.text} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalBody}>
              <Text style={styles.inputLabel}>Domain or Name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. google.com or internal_net"
                placeholderTextColor={Theme.colors.textMuted}
                value={newTargetName}
                onChangeText={setNewTargetName}
                autoFocus
              />
              <Text style={styles.inputHint}>
                Target will be added to the current project: {currentProject || 'None'}
              </Text>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.modalCancelBtn}
                onPress={() => setAddModalVisible(false)}
                disabled={isAdding}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalAddBtn, isAdding && { opacity: 0.7 }]}
                onPress={handleAddTarget}
                disabled={isAdding}
              >
                {isAdding ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalAddText}>Add Target</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Main Scan Modal */}
      {selectedTarget && (
        <MainScanModal
          visible={scanModalVisible}
          onClose={() => setScanModalVisible(false)}
          targetId={selectedTarget.id}
          targetName={selectedTarget.name}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  headerPlus: {
    marginRight: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.surface,
    margin: Theme.spacing.md,
    paddingHorizontal: 12,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    color: Theme.colors.text,
    fontSize: 15,
  },
  listContent: {
    paddingHorizontal: Theme.spacing.md,
    paddingBottom: 80,
  },
  targetCard: {
    backgroundColor: Theme.colors.surface,
    borderRadius: 16,
    padding: Theme.spacing.md,
    marginBottom: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    backgroundColor: 'transparent',
  },
  targetInfo: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  targetName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Theme.colors.text,
    marginBottom: 4,
  },
  projectLabel: {
    fontSize: 12,
    color: Theme.colors.textMuted,
  },
  scanBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Theme.colors.warning + '11',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Theme.colors.warning + '33',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: 'transparent',
    marginBottom: 16,
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    color: Theme.colors.textMuted,
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border + '33',
    paddingTop: 12,
    backgroundColor: 'transparent',
  },
  historyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    gap: 8,
  },
  footerBtnText: {
    flex: 1,
    fontSize: 13,
    color: Theme.colors.textMuted,
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Theme.colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySub: {
    fontSize: 14,
    color: Theme.colors.textMuted,
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyAddBtn: {
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyAddText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  loaderContainer: {
    padding: 100,
    alignItems: 'center',
  },
  errorContainer: {
    padding: 40,
    alignItems: 'center',
    gap: 12,
  },
  errorText: {
    color: Theme.colors.error,
    textAlign: 'center',
    fontSize: 14,
  },
  retryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: Theme.colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  retryText: {
    color: Theme.colors.primary,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Theme.spacing.xl,
  },
  modalContent: {
    width: '100%',
    backgroundColor: Theme.colors.surface,
    borderRadius: 20,
    padding: Theme.spacing.lg,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    backgroundColor: 'transparent',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: Theme.colors.text,
    fontFamily: 'Orbitron',
  },
  modalBody: {
    backgroundColor: 'transparent',
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: Theme.colors.textMuted,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  input: {
    backgroundColor: Theme.colors.background,
    borderRadius: 12,
    height: 52,
    paddingHorizontal: 16,
    color: Theme.colors.text,
    fontSize: 16,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  inputHint: {
    fontSize: 11,
    color: Theme.colors.textMuted,
    marginTop: 10,
    fontStyle: 'italic',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: 'transparent',
  },
  modalCancelBtn: {
    flex: 1,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  modalCancelText: {
    color: Theme.colors.textMuted,
    fontWeight: 'bold',
  },
  modalAddBtn: {
    flex: 2,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: Theme.colors.primary,
  },
  modalAddText: {
    color: '#fff',
    fontWeight: 'bold',
  }
});

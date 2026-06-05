import React, { useEffect, useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator, 
  Share,
  TextInput,
  Modal,
  ScrollView,
  Clipboard,
  Alert,
  Switch
} from 'react-native';
import { Theme } from '../../constants/Theme';
import AnsiText from '../AnsiText';
import { observabilityApi } from '../../api/observability';
import { 
  Terminal, 
  RefreshCw, 
  Share2, 
  AlertTriangle, 
  Info, 
  CheckCircle,
  Clock,
  Search,
  X,
  Copy,
  Database,
  Zap,
  Shield
} from 'lucide-react-native';
import { TacticalHaptics } from '../../utils/haptics';

export default function SystemLogViewer() {
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedType, setSelectedType] = useState<'system' | 'db' | 'temporal' | 'scan'>('system');
  const [searchQuery, setSearchQuery] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [autoScroll, setAutoScroll] = useState(true);
  const [selectedLine, setSelectedLine] = useState<string | null>(null);
  
  const flatListRef = useRef<FlatList>(null);

  // Map log types to UI representation
  const logTypes = [
    { id: 'system' as const, label: 'SYSTEM', icon: Info, color: Theme.colors.info },
    { id: 'db' as const, label: 'DATABASE', icon: Database, color: Theme.colors.primary },
    { id: 'temporal' as const, label: 'TEMPORAL', icon: Zap, color: Theme.colors.warning },
    { id: 'scan' as const, label: 'SCAN', icon: Shield, color: Theme.colors.success },
  ];

  const fetchLogs = async (type: string) => {
    try {
      const data = await observabilityApi.getSystemLogs(type);
      if (data.status) {
        setLogs(data.logs);
      }
    } catch (err) {
      console.error(`Failed to fetch system logs (${type}):`, err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLogs(selectedType);
    
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      fetchLogs(selectedType);
    }, 15000); // Auto refresh every 15s if enabled
    
    return () => clearInterval(interval);
  }, [selectedType, autoRefresh]);

  const handleManualRefresh = () => {
    TacticalHaptics.trigger();
    setRefreshing(true);
    fetchLogs(selectedType);
  };

  const handleShare = async () => {
    try {
      TacticalHaptics.soft();
      await Share.share({
        message: logs.join('\n'),
        title: `reNgine ${selectedType.toUpperCase()} Logs`
      });
    } catch (error) {
      console.error('Error sharing logs:', error);
    }
  };

  const handleTabSelect = (type: 'system' | 'db' | 'temporal' | 'scan') => {
    TacticalHaptics.soft();
    setSelectedType(type);
    setLoading(true);
    fetchLogs(type);
  };

  const handleCopyLine = () => {
    if (selectedLine) {
      Clipboard.setString(selectedLine);
      TacticalHaptics.success();
      Alert.alert('Copied', 'Selected log line copied to clipboard');
    }
  };

  const getLogLevel = (line: string) => {
    const upperLine = line.toUpperCase();
    if (upperLine.includes('ERROR') || upperLine.includes('CRITICAL')) return 'error';
    if (upperLine.includes('WARNING') || upperLine.includes('WARN')) return 'warning';
    if (upperLine.includes('SUCCESS') || upperLine.includes('DONE')) return 'success';
    return 'info';
  };

  const renderLogItem = ({ item }: { item: string }) => {
    const level = getLogLevel(item);
    let borderLeftColor = '#475569'; // default Slate 600
    let icon = <Info size={12} color={Theme.colors.textMuted} />;

    if (level === 'error') {
      borderLeftColor = Theme.colors.error;
      icon = <AlertTriangle size={12} color={Theme.colors.error} />;
    } else if (level === 'warning') {
      borderLeftColor = Theme.colors.warning;
      icon = <AlertTriangle size={12} color={Theme.colors.warning} />;
    } else if (level === 'success') {
      borderLeftColor = Theme.colors.success;
      icon = <CheckCircle size={12} color={Theme.colors.success} />;
    }

    return (
      <TouchableOpacity 
        style={[styles.logLine, { borderLeftColor }]}
        onPress={() => {
          TacticalHaptics.soft();
          setSelectedLine(item);
        }}
      >
        <View style={styles.logIcon}>{icon}</View>
        <AnsiText text={item} style={styles.logText} />
      </TouchableOpacity>
    );
  };

  const filteredLogs = logs.filter(line => 
    line.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeTabConfig = logTypes.find(t => t.id === selectedType);

  return (
    <View style={styles.container}>
      {/* Header Panel */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <Terminal size={20} color={Theme.colors.secondary} />
          <Text style={styles.title}>SYSTEM OBSERVABILITY</Text>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity onPress={handleShare} style={styles.actionBtn} activeOpacity={0.7}>
            <Share2 size={18} color="white" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleManualRefresh} style={styles.actionBtn} activeOpacity={0.7}>
            {refreshing ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <RefreshCw size={18} color="white" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Log Type Segmented Tabs */}
      <View style={styles.tabsContainer}>
        {logTypes.map((tab) => {
          const isActive = selectedType === tab.id;
          const TabIcon = tab.icon;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.tabBtn,
                isActive && {
                  backgroundColor: Theme.colors.surface,
                  borderColor: tab.color,
                }
              ]}
              onPress={() => handleTabSelect(tab.id)}
              activeOpacity={0.8}
            >
              <TabIcon size={14} color={isActive ? tab.color : Theme.colors.textMuted} />
              <Text style={[styles.tabText, isActive && { color: tab.color, fontWeight: '700' }]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Filter and Control Panel */}
      <View style={styles.controlsPanel}>
        <View style={styles.searchContainer}>
          <Search size={16} color={Theme.colors.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search operational stream..."
            placeholderTextColor={Theme.colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearSearchBtn}>
              <X size={14} color={Theme.colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.switchesContainer}>
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>AUTO-REFRESH</Text>
            <Switch
              value={autoRefresh}
              onValueChange={(val) => {
                TacticalHaptics.soft();
                setAutoRefresh(val);
              }}
              trackColor={{ false: '#334155', true: Theme.colors.primary + '88' }}
              thumbColor={autoRefresh ? Theme.colors.primary : '#94A3B8'}
            />
          </View>
          <View style={[styles.switchRow, { marginLeft: 16 }]}>
            <Text style={styles.switchLabel}>AUTOSCROLL</Text>
            <Switch
              value={autoScroll}
              onValueChange={(val) => {
                TacticalHaptics.soft();
                setAutoScroll(val);
              }}
              trackColor={{ false: '#334155', true: Theme.colors.primary + '88' }}
              thumbColor={autoScroll ? Theme.colors.primary : '#94A3B8'}
            />
          </View>
        </View>
      </View>

      {/* Main Terminal View */}
      <View style={styles.terminalContainer}>
        {loading && !refreshing ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={Theme.colors.primary} />
            <Text style={styles.statusText}>LOADING DATA SOURCE...</Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={filteredLogs}
            renderItem={renderLogItem}
            keyExtractor={(_, index) => `log-${index}`}
            contentContainerStyle={styles.listContent}
            onContentSizeChange={() => {
              if (autoScroll && filteredLogs.length > 0) {
                flatListRef.current?.scrollToEnd({ animated: true });
              }
            }}
            ListEmptyComponent={
              <View style={styles.centered}>
                <Clock size={40} color={Theme.colors.textMuted} />
                <Text style={styles.emptyText}>NO ACTIVE EVENTS RECORDED</Text>
              </View>
            }
          />
        )}
      </View>

      {/* Details Modal */}
      <Modal
        visible={selectedLine !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedLine(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>LOG LINE INSPECTOR</Text>
              <TouchableOpacity onPress={() => setSelectedLine(null)} style={styles.modalCloseBtn}>
                <X size={20} color="white" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              <Text style={styles.modalText}>{selectedLine}</Text>
            </ScrollView>
            <View style={styles.modalFooter}>
              <TouchableOpacity onPress={handleCopyLine} style={styles.modalCopyBtn}>
                <Copy size={16} color="white" />
                <Text style={styles.modalCopyText}>COPY TO CLIPBOARD</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Footer Banner */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          STREAM: {activeTabConfig?.label}.LOG • TAIL {logs.length} LINES
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
    backgroundColor: Theme.colors.surface,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    color: Theme.colors.secondary,
    fontFamily: 'Bangers',
    fontSize: 18,
    marginLeft: 10,
    letterSpacing: 1,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionBtn: {
    padding: 8,
    marginLeft: 8,
    backgroundColor: Theme.colors.background,
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  tabsContainer: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: Theme.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
    justifyContent: 'space-between',
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1,
    borderColor: 'transparent',
    gap: 6,
  },
  tabText: {
    color: Theme.colors.textMuted,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  controlsPanel: {
    padding: 12,
    backgroundColor: Theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.background,
    borderRadius: Theme.borderRadius.md,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    height: 38,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: Theme.colors.text,
    fontSize: 13,
    paddingVertical: 4,
  },
  clearSearchBtn: {
    padding: 4,
  },
  switchesContainer: {
    flexDirection: 'row',
    marginTop: 8,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  switchLabel: {
    color: Theme.colors.textMuted,
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  terminalContainer: {
    flex: 1,
    backgroundColor: '#050505',
    margin: 10,
    borderRadius: Theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    overflow: 'hidden',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  listContent: {
    padding: 10,
  },
  logLine: {
    flexDirection: 'row',
    marginBottom: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderLeftWidth: 3,
    backgroundColor: '#090D16',
    borderRadius: Theme.borderRadius.sm,
  },
  logIcon: {
    width: 20,
    marginTop: 2,
    alignItems: 'center',
  },
  logText: {
    flex: 1,
    fontFamily: 'monospace',
    color: '#E2E8F0',
    fontSize: 11,
    lineHeight: 16,
  },
  statusText: {
    color: Theme.colors.textMuted,
    marginTop: 16,
    fontFamily: 'Bangers',
    letterSpacing: 1,
  },
  emptyText: {
    color: Theme.colors.textMuted,
    marginTop: 12,
    fontFamily: 'Bangers',
    textAlign: 'center',
  },
  footer: {
    padding: 10,
    paddingBottom: 24,
    backgroundColor: Theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
    alignItems: 'center',
  },
  footerText: {
    color: Theme.colors.textMuted,
    fontSize: 9,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxHeight: '80%',
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Theme.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  modalTitle: {
    color: Theme.colors.secondary,
    fontFamily: 'Bangers',
    fontSize: 16,
    letterSpacing: 1,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalBody: {
    padding: 16,
  },
  modalText: {
    color: '#F1F5F9',
    fontFamily: 'monospace',
    fontSize: 12,
    lineHeight: 18,
  },
  modalFooter: {
    padding: 12,
    backgroundColor: Theme.colors.background,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
    alignItems: 'center',
  },
  modalCopyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: Theme.borderRadius.md,
    gap: 8,
  },
  modalCopyText: {
    color: 'white',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
});

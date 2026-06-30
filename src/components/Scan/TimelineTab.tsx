import React, { useState } from 'react';
import { StyleSheet, FlatList, Modal, ScrollView, RefreshControl } from 'react-native';
import { CheckCircle2, Clock, XCircle, AlertCircle, Terminal, X, Copy, ChevronRight, RefreshCw } from 'lucide-react-native';

import { Text, View } from '@/components/Themed';
import { Theme } from '../../constants/Theme';

interface CommandOutput {
  command: string;
  output: string;
  return_code: number;
}

interface TimelineActivity {
  id: string | number;
  title: string;
  status: string;
  time: string;
  commands?: CommandOutput[];
}

interface TimelineTabProps {
  timeline: TimelineActivity[];
  refreshing?: boolean;
  onRefresh?: () => void;
  isTerminal?: boolean;
  onRetryTask?: (activity: TimelineActivity) => void;
}

export default function TimelineTab({ timeline = [], refreshing = false, onRefresh, isTerminal = false, onRetryTask }: TimelineTabProps) {
  const [selectedLog, setSelectedLog] = useState<CommandOutput | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  
  const handleViewOutput = (commands?: CommandOutput[]) => {
    if (commands && commands.length > 0) {
      setSelectedLog(commands[0]);
      setModalVisible(true);
    }
  };
  
  const formatTime = (timeString: string) => {
    if (!timeString) return '--:--';
    const date = new Date(timeString);
    if (isNaN(date.getTime())) return '--:--';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusColor = (status: string) => {
    const s = status.toUpperCase();
    if (s === 'SUCCESS') return Theme.colors.success;
    if (s === 'FAILED' || s === 'ABORTED') return Theme.colors.error;
    if (s === 'RUNNING') return Theme.colors.info;
    return Theme.colors.warning;
  };

  const getStatusIcon = (status: string) => {
    const s = status.toUpperCase();
    const color = getStatusColor(status);
    if (s === 'SUCCESS') return <CheckCircle2 size={16} color={color} />;
    if (s === 'FAILED' || s === 'ABORTED') return <XCircle size={16} color={color} />;
    if (s === 'RUNNING') return <Clock size={16} color={color} />;
    return <AlertCircle size={16} color={color} />;
  };

  const renderItem = ({ item, index }: { item: TimelineActivity, index: number }) => {
    const isLast = index === timeline.length - 1;
    
    return (
      <View style={styles.timelineItem}>
        <View style={styles.leftColumn}>
          <View style={styles.iconContainer}>
            {getStatusIcon(item.status)}
          </View>
          {!isLast && <View style={styles.verticalLine} />}
        </View>
        
        <View style={styles.contentContainer}>
          <View style={styles.itemHeader}>
            <Text style={styles.itemTitle}>{item.title}</Text>
            <Text style={styles.itemTime}>{formatTime(item.time)}</Text>
          </View>

          <View style={styles.statusRow}>
             <Text style={[styles.statusText, { color: item.status.toUpperCase() === 'SUCCESS' ? Theme.colors.success : Theme.colors.textMuted }]}>
               {item.status.toUpperCase()}
             </Text>
             
             {/* Action buttons */}
             <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'transparent' }}>
               {item.commands && item.commands.length > 0 && (
                 <TouchableOpacity 
                   style={styles.logButton}
                   onPress={() => handleViewOutput(item.commands)}
                 >
                    <Terminal size={12} color={Theme.colors.primary} />
                    <Text style={styles.logButtonText}>VIEW OUTPUT</Text>
                 </TouchableOpacity>
               )}

               {isTerminal && onRetryTask && item.title !== 'Raw Scan History' && (
                 <TouchableOpacity 
                   style={[styles.logButton, { borderColor: Theme.colors.primary + '40', backgroundColor: Theme.colors.primary + '10' }]}
                   onPress={() => onRetryTask(item)}
                 >
                    <RefreshCw size={12} color={Theme.colors.primary} />
                    <Text style={[styles.logButtonText, { color: Theme.colors.primary }]}>RETRY</Text>
                 </TouchableOpacity>
               )}
             </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {timeline.length === 0 ? (
        <ScrollView 
          contentContainerStyle={styles.emptyContainer}
          refreshControl={
            onRefresh ? (
              <RefreshControl 
                refreshing={refreshing} 
                onRefresh={onRefresh}
                tintColor={Theme.colors.primary}
                colors={[Theme.colors.primary]}
              />
            ) : undefined
          }
        >
          <Text style={styles.emptyText}>No activity logs recorded for this scan.</Text>
        </ScrollView>
      ) : (
        <FlatList
          data={[...timeline].reverse()} // Show newest first
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            onRefresh ? (
              <RefreshControl 
                refreshing={refreshing} 
                onRefresh={onRefresh}
                tintColor={Theme.colors.primary}
                colors={[Theme.colors.primary]}
              />
            ) : undefined
          }
        />
      )}

      {/* Output Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderTitleRow}>
                <Terminal size={20} color={Theme.colors.primary} />
                <Text style={styles.modalTitle}>Command Output</Text>
              </View>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                <X size={24} color={Theme.colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {selectedLog && (
                <>
                  <View style={styles.logSection}>
                    <Text style={styles.logSectionTitle}>COMMAND</Text>
                    <View style={styles.commandBox}>
                      <Text style={styles.commandText}>{selectedLog.command}</Text>
                    </View>
                  </View>

                  <View style={styles.logSection}>
                    <View style={styles.logSectionHeader}>
                      <Text style={styles.logSectionTitle}>OUTPUT</Text>
                      <View style={[styles.statusMiniBadge, { backgroundColor: selectedLog.return_code === 0 ? Theme.colors.success + '22' : Theme.colors.error + '22' }]}>
                        <Text style={[styles.statusMiniText, { color: selectedLog.return_code === 0 ? Theme.colors.success : Theme.colors.error }]}>
                          EXIT: {selectedLog.return_code}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.outputBox}>
                      <Text style={styles.outputText}>{selectedLog.output || 'No output recorded.'}</Text>
                    </View>
                  </View>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// Re-using TouchableOpacity from react-native
import { TouchableOpacity } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  listContent: {
    padding: Theme.spacing.md,
    paddingBottom: Theme.spacing.xl,
  },
  timelineItem: {
    flexDirection: 'row',
    backgroundColor: 'transparent',
    minHeight: 80,
  },
  leftColumn: {
    alignItems: 'center',
    width: 30,
    backgroundColor: 'transparent',
  },
  iconContainer: {
    zIndex: 1,
    backgroundColor: Theme.colors.background,
    paddingVertical: 2,
  },
  verticalLine: {
    flex: 1,
    width: 2,
    backgroundColor: Theme.colors.border,
  },
  contentContainer: {
    flex: 1,
    paddingLeft: 12,
    paddingBottom: Theme.spacing.lg,
    backgroundColor: 'transparent',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'transparent',
    marginBottom: 4,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Theme.colors.text,
  },
  itemTime: {
    fontSize: 10,
    color: Theme.colors.textMuted,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    backgroundColor: 'transparent',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  logButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    alignSelf: 'flex-start',
    gap: 6,
  },
  logButtonText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: Theme.colors.primary,
  },
  emptyContainer: {
    padding: 60,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  emptyText: {
    color: Theme.colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Theme.colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '85%',
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
    backgroundColor: Theme.colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'transparent',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Theme.colors.text,
  },
  closeBtn: {
    padding: 4,
  },
  modalBody: {
    flex: 1,
    padding: 20,
  },
  logSection: {
    marginBottom: 24,
    backgroundColor: 'transparent',
  },
  logSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    backgroundColor: 'transparent',
  },
  logSectionTitle: {
    fontSize: 16,
    color: Theme.colors.textMuted,
    fontFamily: 'Bangers',
    letterSpacing: 1,
    marginBottom: 12,
  },
  commandBox: {
    backgroundColor: '#000',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  commandText: {
    fontFamily: 'monospace',
    color: '#00ff00',
    fontSize: 12,
  },
  outputBox: {
    backgroundColor: '#000',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    minHeight: 100,
  },
  outputText: {
    fontFamily: 'monospace',
    color: '#e2e8f0',
    fontSize: 11,
    lineHeight: 16,
  },
  statusMiniBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusMiniText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
});

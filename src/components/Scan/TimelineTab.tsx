import React, { useState } from 'react';
import { StyleSheet, FlatList, Modal, ScrollView } from 'react-native';
import { CheckCircle2, Clock, XCircle, AlertCircle, Terminal, X, Copy, ChevronRight } from 'lucide-react-native';

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
}

export default function TimelineTab({ timeline = [] }: TimelineTabProps) {
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

  const getStatusIcon = (status: string) => {
    const s = status.toUpperCase();
    if (s === 'SUCCESS') return <CheckCircle2 size={16} color={Theme.colors.success} />;
    if (s === 'FAILED' || s === 'ABORTED') return <XCircle size={16} color={Theme.colors.error} />;
    if (s === 'RUNNING') return <Clock size={16} color={Theme.colors.info} />;
    return <AlertCircle size={16} color={Theme.colors.warning} />;
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
          </View>
          
          {/* View Logs button if logs are available */}
          {item.commands && item.commands.length > 0 && (
            <TouchableOpacity 
              style={styles.logButton}
              onPress={() => handleViewOutput(item.commands)}
            >
               <Terminal size={12} color={Theme.colors.primary} />
               <Text style={styles.logButtonText}>VIEW OUTPUT</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {timeline.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No activity logs recorded for this scan.</Text>
        </View>
      ) : (
        <FlatList
          data={[...timeline].reverse()} // Show newest first
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
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
    fontSize: 12,
    fontWeight: '900',
    color: Theme.colors.textMuted,
    letterSpacing: 1,
    marginBottom: 8,
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

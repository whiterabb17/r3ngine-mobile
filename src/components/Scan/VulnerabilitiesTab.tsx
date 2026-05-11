import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, ScrollView, Modal, FlatList } from 'react-native';
import { ShieldAlert, ChevronRight, X, AlertCircle, Info, ExternalLink, Brain, Loader2 } from 'lucide-react-native';
import apiClient from '../../api/client';

import { Text, View } from '@/components/Themed';
import { Theme } from '../../constants/Theme';

interface Vulnerability {
  id: number;
  name: string;
  severity: number | string;
  url: string;
  description: string;
  remediation: string;
  impact?: string;
  matched_at: string;
}

interface VulnerabilitiesTabProps {
  vulnerabilities: Vulnerability[];
}

export default function VulnerabilitiesTab({ vulnerabilities = [] }: VulnerabilitiesTabProps) {
  const [selectedVuln, setSelectedVuln] = useState<Vulnerability | null>(null);
  const [isLlmLoading, setIsLlmLoading] = useState(false);

  const fetchLlmReport = async (id: number) => {
    setIsLlmLoading(true);
    try {
      const response = await apiClient.get(`tools/gpt_vulnerability_report/?id=${id}`);
      if (response.data) {
        // Update the selected vulnerability with the new data
        setSelectedVuln(prev => prev ? {
          ...prev,
          description: response.data.description || prev.description,
          impact: response.data.impact || prev.impact,
          remediation: response.data.remediation || prev.remediation,
        } : null);
      }
    } catch (error) {
      console.error('Failed to fetch LLM report', error);
    } finally {
      setIsLlmLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'N/A';
    return date.toLocaleDateString();
  };

  const getSeverityInfo = (severity: number | string) => {
    const s = String(severity).toLowerCase();
    if (s === '4' || s === 'critical') return { label: 'CRITICAL', color: Theme.colors.vulnerabilities.critical };
    if (s === '3' || s === 'high') return { label: 'HIGH', color: Theme.colors.vulnerabilities.high };
    if (s === '2' || s === 'medium') return { label: 'MEDIUM', color: Theme.colors.vulnerabilities.medium };
    if (s === '1' || s === 'low') return { label: 'LOW', color: Theme.colors.vulnerabilities.low };
    return { label: 'INFO', color: Theme.colors.vulnerabilities.info };
  };

  const renderVulnItem = (vuln: Vulnerability) => {
    const { label, color } = getSeverityInfo(vuln.severity);
    
    return (
      <TouchableOpacity 
        style={[styles.card, { borderLeftColor: color, borderLeftWidth: 4 }]}
        onPress={() => setSelectedVuln(vuln)}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.vulnName} numberOfLines={2}>{vuln.name}</Text>
          <View style={[styles.badge, { backgroundColor: color + '22' }]}>
            <Text style={[styles.badgeText, { color }]}>{label}</Text>
          </View>
        </View>
        <Text style={styles.vulnUrl} numberOfLines={1}>{vuln.url}</Text>
        <View style={styles.cardFooter}>
          <Text style={styles.timeText}>{formatDate(vuln.matched_at)}</Text>
          <ChevronRight size={14} color={Theme.colors.border} />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={vulnerabilities}
        renderItem={({ item }) => renderVulnItem(item)}
        keyExtractor={(item, index) => item.id ? String(item.id) : `vuln-${index}`}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <ShieldAlert size={48} color={Theme.colors.border} />
            <Text style={styles.emptyText}>No vulnerabilities discovered yet.</Text>
          </View>
        }
      />

      {/* Detail Modal */}
      <Modal
        visible={!!selectedVuln}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedVuln(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.headerTitleRow}>
                <Text style={styles.modalTitle}>Vulnerability Detail</Text>
                {selectedVuln && (
                   <TouchableOpacity 
                    style={styles.aiTrigger} 
                    onPress={() => fetchLlmReport(selectedVuln.id)}
                    disabled={isLlmLoading}
                  >
                    {isLlmLoading ? (
                      <Loader2 size={20} color={Theme.colors.primary} />
                    ) : (
                      <Brain size={20} color={Theme.colors.primary} />
                    )}
                  </TouchableOpacity>
                )}
              </View>
              <TouchableOpacity onPress={() => setSelectedVuln(null)}>
                <X size={24} color={Theme.colors.text} />
              </TouchableOpacity>
            </View>

            {selectedVuln && (
              <ScrollView style={styles.modalBody}>
                <View style={[styles.modalSeverityBadge, { backgroundColor: getSeverityInfo(selectedVuln.severity).color }]}>
                  <Text style={styles.modalSeverityText}>{getSeverityInfo(selectedVuln.severity).label}</Text>
                </View>

                <Text style={styles.detailName}>{selectedVuln.name}</Text>
                
                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>AFFECTED URL</Text>
                  <Text style={styles.detailValue}>{selectedVuln.url}</Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>DESCRIPTION</Text>
                  <Text style={styles.detailBody}>{selectedVuln.description || 'No description provided.'}</Text>
                </View>

                {selectedVuln.impact && (
                   <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>IMPACT</Text>
                    <Text style={styles.detailBody}>{selectedVuln.impact}</Text>
                  </View>
                )}

                {selectedVuln.remediation && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>REMEDIATION</Text>
                    <View style={styles.remediationBox}>
                      <Text style={styles.detailBody}>{selectedVuln.remediation}</Text>
                    </View>
                  </View>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  listContent: {
    padding: Theme.spacing.md,
    paddingBottom: Theme.spacing.xl,
  },
  card: {
    backgroundColor: Theme.colors.surface,
    borderRadius: 8,
    padding: Theme.spacing.md,
    marginBottom: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    backgroundColor: 'transparent',
    gap: 8,
    marginBottom: 8,
  },
  vulnName: {
    flex: 1,
    fontSize: 14,
    fontWeight: 'bold',
    color: Theme.colors.text,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '900',
  },
  vulnUrl: {
    fontSize: 11,
    color: Theme.colors.textMuted,
    marginBottom: 12,
    fontFamily: 'monospace',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  timeText: {
    fontSize: 10,
    color: Theme.colors.textMuted,
  },
  emptyContainer: {
    padding: 60,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  emptyText: {
    marginTop: 16,
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
    padding: Theme.spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.lg,
    backgroundColor: 'transparent',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Theme.colors.text,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'transparent',
  },
  aiTrigger: {
    padding: 4,
    backgroundColor: 'rgba(0, 184, 148, 0.1)',
    borderRadius: 8,
  },
  modalBody: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  modalSeverityBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 12,
  },
  modalSeverityText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  detailName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Theme.colors.text,
    marginBottom: Theme.spacing.lg,
  },
  detailSection: {
    marginBottom: Theme.spacing.lg,
    backgroundColor: 'transparent',
  },
  detailLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: Theme.colors.textMuted,
    letterSpacing: 1,
    marginBottom: 8,
  },
  detailValue: {
    fontSize: 12,
    color: Theme.colors.primary,
    fontFamily: 'monospace',
  },
  detailBody: {
    fontSize: 14,
    color: Theme.colors.text,
    lineHeight: 20,
  },
  remediationBox: {
    backgroundColor: Theme.colors.surface,
    padding: Theme.spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  }
});

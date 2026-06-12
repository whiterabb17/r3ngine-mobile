import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, Modal, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { Brain, X, ShieldAlert, Bug, Globe } from 'lucide-react-native';
import { Text, View } from '@/components/Themed';
import { Theme } from '../../src/constants/Theme';
import AttackPathNarrative from '../../src/components/Intelligence/AttackPathNarrative';
import { explainAttackPath, getVulnerabilityDetails } from '../../src/api/reports';

export default function AttackPathDetail() {
  const { pathId, pathData } = useLocalSearchParams<{ pathId: string, pathData: string }>();
  
  const [selectedVuln, setSelectedVuln] = useState<any | null>(null);
  const [fetchingVuln, setFetchingVuln] = useState(false);

  const [explanation, setExplanation] = useState<string | null>(null);
  const [explaining, setExplaining] = useState(false);
  const [showExplanationModal, setShowExplanationModal] = useState(false);

  const data = React.useMemo(() => {
    if (pathData) {
      try {
        const parsed = JSON.parse(pathData);
        if (parsed.explanation) {
          setExplanation(parsed.explanation);
        }
        return parsed;
      } catch (e) {
        console.error('Failed to parse pathData', e);
        return null;
      }
    }
    return null;
  }, [pathData]);

  const handleViewVulnerability = async (vulnId: number) => {
    setFetchingVuln(true);
    try {
      const details = await getVulnerabilityDetails(vulnId);
      setSelectedVuln(details);
    } catch (err) {
      console.error('Failed to fetch vulnerability details', err);
      Alert.alert('Error', 'Failed to fetch vulnerability details');
    } finally {
      setFetchingVuln(false);
    }
  };

  const handleExplainPath = async () => {
    if (!pathId) return;
    setShowExplanationModal(true);
    if (explanation) return; // already loaded/persisted

    setExplaining(true);
    try {
      const response = await explainAttackPath(pathId);
      if (response && response.status === 'success') {
        setExplanation(response.explanation);
      } else {
        throw new Error('Invalid response');
      }
    } catch (err) {
      console.error('Failed to generate path explanation', err);
      Alert.alert('Error', 'Failed to generate path explanation. Please try again.');
      setShowExplanationModal(false);
    } finally {
      setExplaining(false);
    }
  };

  if (!data) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Tactical data not found for {pathId}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ 
        title: `Path: ${pathId}`,
        headerRight: () => (
          <TouchableOpacity style={styles.headerBtn} onPress={handleExplainPath}>
            <Brain size={22} color={Theme.colors.primary} />
          </TouchableOpacity>
        )
      }} />
      
      {fetchingVuln && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator color={Theme.colors.primary} size="large" />
          <Text style={styles.loadingOverlayText}>Fetching Threat Intel...</Text>
        </View>
      )}

      <AttackPathNarrative 
        steps={data.steps} 
        score={data.score} 
        risk={data.risk} 
        onViewVulnerability={handleViewVulnerability}
      />

      {/* Vulnerability Detail Modal */}
      <Modal
        visible={!!selectedVuln}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedVuln(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setSelectedVuln(null)}
        >
          <View style={[styles.modalContent, { height: '80%', paddingBottom: 30 }]}>
            <View style={styles.vulnModalHeader}>
              <Text style={styles.vulnModalTitle}>Vulnerability Detail</Text>
              <TouchableOpacity onPress={() => setSelectedVuln(null)}>
                <X size={24} color={Theme.colors.text} />
              </TouchableOpacity>
            </View>

            {selectedVuln && (
              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                <View style={[styles.modalSeverityBadge, { backgroundColor: selectedVuln.severity === 4 ? Theme.colors.vulnerabilities.critical : selectedVuln.severity === 3 ? Theme.colors.vulnerabilities.high : selectedVuln.severity === 2 ? Theme.colors.vulnerabilities.medium : selectedVuln.severity === 1 ? Theme.colors.vulnerabilities.low : Theme.colors.vulnerabilities.info }]}>
                  <Text style={styles.modalSeverityText}>
                    {selectedVuln.severity === 4 ? 'CRITICAL' : 
                     selectedVuln.severity === 3 ? 'HIGH' : 
                     selectedVuln.severity === 2 ? 'MEDIUM' : 
                     selectedVuln.severity === 1 ? 'LOW' : 'INFO'}
                  </Text>
                </View>

                <Text style={styles.detailName}>{selectedVuln.name}</Text>
                
                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>DOMAIN / TARGET</Text>
                  <Text style={styles.detailValue}>
                    {selectedVuln.subdomain?.name || 
                     selectedVuln.target_domain?.name || 
                     selectedVuln.scan_history?.domain?.name || 
                     'N/A'}
                  </Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>AFFECTED URL</Text>
                  <Text style={styles.detailValue}>{selectedVuln.http_url || selectedVuln.url || 'N/A'}</Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>DESCRIPTION</Text>
                  <Text style={styles.detailBody}>{selectedVuln.description || 'No description provided.'}</Text>
                </View>

                {selectedVuln.impact ? (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>IMPACT</Text>
                    <Text style={styles.detailBody}>{selectedVuln.impact}</Text>
                  </View>
                ) : null}

                {selectedVuln.remediation ? (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>REMEDIATION</Text>
                    <View style={styles.remediationBox}>
                      <Text style={styles.detailBody}>{selectedVuln.remediation}</Text>
                    </View>
                  </View>
                ) : null}
              </ScrollView>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* AI Explanation Modal */}
      <Modal
        visible={showExplanationModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowExplanationModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowExplanationModal(false)}
        >
          <View style={[styles.modalContent, { height: '70%', paddingBottom: 30 }]}>
            <View style={styles.vulnModalHeader}>
              <View style={styles.aiHeaderRow}>
                <Brain size={20} color={Theme.colors.primary} />
                <Text style={[styles.vulnModalTitle, { marginLeft: 8 }]}>Tactical AI Explanation</Text>
              </View>
              <TouchableOpacity onPress={() => setShowExplanationModal(false)}>
                <X size={24} color={Theme.colors.text} />
              </TouchableOpacity>
            </View>

            <View style={{ flex: 1, backgroundColor: 'transparent' }}>
              {explaining ? (
                <View style={styles.aiLoadingContainer}>
                  <ActivityIndicator color={Theme.colors.primary} size="large" />
                  <Text style={styles.aiLoadingText}>AI Analyzing Path Vector...</Text>
                  <Text style={styles.aiLoadingSubtext}>Anonymizing PII and mapping attack flow patterns.</Text>
                </View>
              ) : (
                <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                  <Text style={styles.explanationParagraph}>
                    {explanation || 'No explanation generated.'}
                  </Text>
                </ScrollView>
              )}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: Theme.colors.danger,
    fontFamily: 'Bangers',
    fontSize: 12,
  },
  headerBtn: {
    marginRight: 16,
    padding: 4,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    zIndex: 99,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingOverlayText: {
    marginTop: 16,
    color: Theme.colors.text,
    fontSize: 12,
    fontFamily: 'Orbitron',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Theme.colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  vulnModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border + '33',
    backgroundColor: 'transparent',
  },
  vulnModalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Theme.colors.text,
    fontFamily: 'Orbitron',
  },
  aiHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  modalBody: {
    padding: 20,
  },
  modalSeverityBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 16,
  },
  modalSeverityText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#000',
    fontFamily: 'Orbitron',
  },
  detailName: {
    fontSize: 18,
    fontWeight: '800',
    color: Theme.colors.text,
    marginBottom: 20,
  },
  detailSection: {
    marginBottom: 20,
    backgroundColor: 'transparent',
  },
  detailLabel: {
    fontSize: 9,
    fontWeight: '900',
    color: Theme.colors.textMuted,
    marginBottom: 6,
    fontFamily: 'Orbitron',
    letterSpacing: 1,
  },
  detailValue: {
    fontSize: 13,
    color: Theme.colors.text,
    fontWeight: '600',
  },
  detailBody: {
    fontSize: 13,
    color: 'rgba(248, 250, 252, 0.8)',
    lineHeight: 20,
  },
  remediationBox: {
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 8,
    padding: 12,
  },
  aiLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: 'transparent',
  },
  aiLoadingText: {
    marginTop: 20,
    fontSize: 14,
    fontWeight: '700',
    color: Theme.colors.primary,
    fontFamily: 'Orbitron',
  },
  aiLoadingSubtext: {
    marginTop: 8,
    fontSize: 10,
    color: Theme.colors.textMuted,
    textAlign: 'center',
  },
  explanationParagraph: {
    fontSize: 13,
    color: 'rgba(248, 250, 252, 0.85)',
    lineHeight: 22,
    marginBottom: 20,
  }
});


import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { Server, Lock, Zap, Key, ShieldAlert, CheckCircle2, HelpCircle } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Text, View } from 'react-native';
import { Theme } from '../../constants/Theme';

export interface EnrichedNode {
  id: string;
  type: string;
  subtype: string;
  name?: string;
  severity?: number;
  cvss_score?: number;
  vuln_id?: number | null;
}

export interface PathStepData {
  from: string;
  to: string;
  action: string;
  confidence: number;
  edge_type: string;
  validated: boolean;
  status?: 'validated' | 'inferred';
  from_node?: EnrichedNode;
  to_node?: EnrichedNode;
}

interface AttackPathStepProps {
  step: PathStepData;
  index: number;
  isLast: boolean;
  onViewVulnerability?: (vulnId: number) => void;
}

const RenderNode: React.FC<{ node: EnrichedNode | undefined; rawId: string; onViewVulnerability?: (vulnId: number) => void }> = ({ node, rawId, onViewVulnerability }) => {
  const type = node?.type ?? (rawId.startsWith('vuln::') ? 'Vulnerability' : rawId.startsWith('goal::capability::') ? 'Capability' : rawId.startsWith('goal::privilege::') ? 'Privilege' : 'Asset');
  const subtype = node?.subtype ?? rawId.split('::').pop() ?? '';
  const name = node?.name ?? (type === 'Vulnerability' ? `Vulnerability #${subtype}` : subtype);

  let color = '#00f3ff';
  let icon = <Server size={16} color={color} />;
  let bgColor = 'rgba(0, 243, 255, 0.03)';
  let borderColor = 'rgba(0, 243, 255, 0.1)';

  if (type === 'Vulnerability') {
    const severity = node?.severity ?? 2;
    const sevColors = ['#00ff62', '#00ff62', '#fffc00', '#ff9f00', '#ff003c'];
    color = sevColors[severity] ?? '#ff9f00';
    icon = <ShieldAlert size={16} color={color} />;
    bgColor = `${color}08`;
    borderColor = `${color}20`;
  } else if (type === 'Capability') {
    color = '#d500f9';
    icon = <Zap size={16} color={color} />;
    bgColor = 'rgba(213, 0, 249, 0.03)';
    borderColor = 'rgba(213, 0, 249, 0.1)';
  } else if (type === 'Privilege') {
    color = '#ffab00';
    icon = <Key size={16} color={color} />;
    bgColor = 'rgba(255, 171, 0, 0.03)';
    borderColor = 'rgba(255, 171, 0, 0.1)';
  } else if (type === 'Credential') {
    color = '#ffab00';
    icon = <Lock size={16} color={color} />;
    bgColor = 'rgba(255, 171, 0, 0.03)';
    borderColor = 'rgba(255, 171, 0, 0.1)';
  }

  return (
    <View style={[styles.nodeCard, { backgroundColor: bgColor, borderColor: borderColor }]}>
      <View style={[styles.nodeIconBox, { backgroundColor: `${color}15`, borderColor: `${color}33` }]}>
        {icon}
      </View>
      <View style={styles.nodeMeta}>
        <View style={styles.nodeHeaderRow}>
          <Text style={styles.nodeTypeText}>{type.toUpperCase()} ({subtype.toUpperCase()})</Text>
          {type === 'Vulnerability' && node?.cvss_score !== undefined && (
            <View style={styles.cvssBadge}>
              <Text style={styles.cvssText}>CVSS {node.cvss_score}</Text>
            </View>
          )}
        </View>
        <Text style={styles.nodeNameText} numberOfLines={1}>{name}</Text>
      </View>
      {type === 'Vulnerability' && node?.vuln_id && onViewVulnerability && (
        <TouchableOpacity 
          style={[styles.viewButton, { borderColor: color }]}
          onPress={() => onViewVulnerability(node.vuln_id!)}
        >
          <Text style={[styles.viewButtonText, { color }]}>VIEW</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default function AttackPathStep({ step, index, isLast, onViewVulnerability }: AttackPathStepProps) {
  const isValidated = step.validated;
  const edgeColor = isValidated ? '#00ff62' : '#ff9f00';
  const EdgeIcon = isValidated ? CheckCircle2 : HelpCircle;

  return (
    <Animated.View 
      entering={FadeInDown.delay(index * 150).duration(400)}
      style={styles.container}
    >
      <RenderNode node={step.from_node} rawId={step.from} onViewVulnerability={onViewVulnerability} />

      <View style={styles.edgeContainer}>
        <View style={[styles.edgeLine, { borderLeftColor: edgeColor + '44' }]} />
        <View style={styles.actionBox}>
          <View style={styles.edgeHeaderRow}>
            <View style={[styles.actionBadge, { borderColor: edgeColor + '44', backgroundColor: 'rgba(255,255,255,0.01)' }]}>
              <Text style={[styles.actionText, { color: Theme.colors.text }]}>{step.edge_type.toUpperCase()}</Text>
            </View>
            <View style={styles.statusRow}>
              <EdgeIcon size={10} color={edgeColor} />
              <Text style={[styles.statusText, { color: edgeColor }]}>{(step.status || 'inferred').toUpperCase()}</Text>
            </View>
          </View>
          <Text style={styles.actionDescription}>{step.action}</Text>
          <View style={styles.confidenceRow}>
            <Text style={styles.confidenceLabel}>Confidence:</Text>
            <Text style={styles.confidenceValue}>{(step.confidence * 100).toFixed(0)}%</Text>
          </View>
        </View>
      </View>

      {isLast && (
        <RenderNode node={step.to_node} rawId={step.to} onViewVulnerability={onViewVulnerability} />
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
    width: '100%',
  },
  nodeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    width: '100%',
  },
  nodeIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nodeMeta: {
    flex: 1,
  },
  nodeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  nodeTypeText: {
    fontSize: 9,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.4)',
    fontFamily: 'Orbitron',
  },
  cvssBadge: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  cvssText: {
    fontSize: 8,
    fontFamily: 'monospace',
    color: '#fff',
  },
  nodeNameText: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.95)',
  },
  viewButton: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  viewButtonText: {
    fontSize: 9,
    fontWeight: '900',
    fontFamily: 'Orbitron',
  },
  edgeContainer: {
    flexDirection: 'row',
    marginLeft: 27,
    minHeight: 80,
  },
  edgeLine: {
    width: 2,
    borderLeftWidth: 2,
    borderStyle: 'dashed',
  },
  actionBox: {
    flex: 1,
    paddingLeft: 20,
    justifyContent: 'center',
    paddingVertical: 8,
  },
  edgeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  actionBadge: {
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  actionText: {
    fontSize: 9,
    fontWeight: '900',
    fontFamily: 'Orbitron',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusText: {
    fontSize: 8,
    fontWeight: '900',
    fontFamily: 'Orbitron',
  },
  actionDescription: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 4,
    lineHeight: 14,
  },
  confidenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  confidenceLabel: {
    fontSize: 9,
    color: Theme.colors.textMuted,
  },
  confidenceValue: {
    fontSize: 9,
    fontWeight: 'bold',
    color: Theme.colors.primary,
  },
});


import React from 'react';
import { StyleSheet } from 'react-native';
import { Globe, Server, Database, Lock, Zap, Search, Key, ChevronDown } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Text, View } from '@/components/Themed';
import { Theme } from '../../constants/Theme';

export interface PathStepData {
  from: string;
  to: string;
  action: string;
  confidence: number;
  edge_type: string;
  validated: boolean;
}

interface AttackPathStepProps {
  step: PathStepData;
  index: number;
  isLast: boolean;
}

export default function AttackPathStep({ step, index, isLast }: AttackPathStepProps) {
  const getIcon = (type: string, label: string) => {
    const l = label.toLowerCase();
    if (l === 'internet') return <Globe size={20} color={Theme.colors.textMuted} />;
    if (l.includes('db') || l.includes('data')) return <Database size={20} color={Theme.colors.primary} />;
    if (l.includes('internal') || l.includes('private')) return <Lock size={20} color={Theme.colors.warning} />;
    return <Server size={20} color={Theme.colors.primary} />;
  };

  const getEdgeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'exploit': return <Zap size={14} color={Theme.colors.danger} />;
      case 'discovery': return <Search size={14} color={Theme.colors.info} />;
      case 'access': return <Key size={14} color={Theme.colors.warning} />;
      default: return <Zap size={14} color={Theme.colors.textMuted} />;
    }
  };

  const getEdgeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'exploit': return Theme.colors.danger;
      case 'discovery': return Theme.colors.info;
      case 'access': return Theme.colors.warning;
      default: return Theme.colors.border;
    }
  };

  return (
    <Animated.View 
      entering={FadeInDown.delay(index * 200).duration(500)}
      style={styles.container}
    >
      {/* Origin Node */}
      <View style={styles.nodeRow}>
        <View style={styles.iconCircle}>
          {getIcon('node', step.from)}
        </View>
        <View style={styles.nodeInfo}>
          <Text style={styles.nodeLabel}>{step.from}</Text>
        </View>
      </View>

      {/* Exploit Edge (The Action) */}
      <View style={styles.edgeContainer}>
        <View style={[styles.edgeLine, { backgroundColor: getEdgeColor(step.edge_type) }]} />
        <View style={styles.actionBox}>
          <View style={[styles.actionBadge, { borderColor: getEdgeColor(step.edge_type) }]}>
            {getEdgeIcon(step.edge_type)}
            <Text style={styles.actionText}>{step.action}</Text>
          </View>
          <View style={styles.confidenceRow}>
            <Text style={styles.confidenceLabel}>Confidence:</Text>
            <Text style={styles.confidenceValue}>{(step.confidence * 100).toFixed(0)}%</Text>
          </View>
        </View>
      </View>

      {/* If it's the last step, we need to show the final "To" node explicitly */}
      {isLast && (
        <View style={styles.nodeRow}>
          <View style={[styles.iconCircle, styles.targetCircle]}>
            {getIcon('node', step.to)}
          </View>
          <View style={styles.nodeInfo}>
            <Text style={[styles.nodeLabel, styles.targetLabel]}>{step.to}</Text>
            <View style={styles.impactBadge}>
              <Text style={styles.impactText}>CRITICAL IMPACT</Text>
            </View>
          </View>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
  },
  nodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'transparent',
    zIndex: 2,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Theme.colors.surface,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  targetCircle: {
    borderColor: Theme.colors.danger,
    shadowColor: Theme.colors.danger,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 5,
  },
  nodeInfo: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  nodeLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: Theme.colors.text,
    fontFamily: 'monospace',
  },
  targetLabel: {
    color: Theme.colors.danger,
    fontWeight: '900',
  },
  edgeContainer: {
    flexDirection: 'row',
    marginLeft: 19, // Align with center of iconCircle
    minHeight: 80,
    backgroundColor: 'transparent',
  },
  edgeLine: {
    width: 2,
    height: '100%',
    opacity: 0.5,
  },
  actionBox: {
    flex: 1,
    paddingLeft: 24,
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  actionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Theme.colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '800',
    color: Theme.colors.text,
    fontFamily: 'Orbitron',
  },
  confidenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'transparent',
  },
  confidenceLabel: {
    fontSize: 10,
    color: Theme.colors.textMuted,
  },
  confidenceValue: {
    fontSize: 10,
    fontWeight: 'bold',
    color: Theme.colors.primary,
  },
  impactBadge: {
    backgroundColor: Theme.colors.danger + '22',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 4,
    borderWidth: 0.5,
    borderColor: Theme.colors.danger,
  },
  impactText: {
    fontSize: 9,
    fontWeight: '900',
    color: Theme.colors.danger,
    letterSpacing: 1,
  }
});

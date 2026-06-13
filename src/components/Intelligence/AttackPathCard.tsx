import React from 'react';
import { StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { ChevronRight, ShieldAlert, Footprints, Zap } from 'lucide-react-native';
import { Text, View } from '@/components/Themed';
import { Theme } from '../../constants/Theme';

const TACTIC_COLORS: Record<string, string> = {
  'initial-access':       '#ff4444',
  'execution':            '#ff8800',
  'persistence':          '#ffcc00',
  'privilege-escalation': '#aa00ff',
  'defense-evasion':      '#0088ff',
  'credential-access':    '#00aaff',
  'discovery':            '#00ff88',
  'lateral-movement':     '#ff00aa',
  'collection':           '#ff6600',
  'command-and-control':  '#9944ff',
  'exfiltration':         '#ff0066',
  'impact':               '#ff0000',
  'resource-development': '#888888',
  'reconnaissance':       '#44aaff',
};

interface AttackPathCardProps {
  path: {
    path_id: string;
    risk: string;
    score: number;
    step_count: number;
    potential_impact: string;
    mitre_tactics?: string[];
  };
  onPress: () => void;
}

export default function AttackPathCard({ path, onPress }: AttackPathCardProps) {
  const isCritical = path.risk.toLowerCase() === 'critical';
  
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.header}>
        <View style={styles.idBadge}>
          <Text style={styles.idText}>{path.path_id}</Text>
        </View>
        <View style={[styles.riskBadge, { backgroundColor: isCritical ? Theme.colors.danger + '22' : Theme.colors.warning + '22', borderColor: isCritical ? Theme.colors.danger : Theme.colors.warning }]}>
          <Text style={[styles.riskText, { color: isCritical ? Theme.colors.danger : Theme.colors.warning }]}>{path.risk.toUpperCase()}</Text>
        </View>
      </View>

      <Text style={styles.impactText} numberOfLines={2}>{path.potential_impact}</Text>

      {path.mitre_tactics && path.mitre_tactics.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tacticScroll}
          contentContainerStyle={styles.tacticScrollContent}
        >
          {path.mitre_tactics.map((tactic) => {
            const color = TACTIC_COLORS[tactic] ?? '#888888';
            return (
              <View
                key={tactic}
                style={[
                  styles.tacticPill,
                  { borderColor: color + '44', backgroundColor: color + '12' },
                ]}
              >
                <Text style={[styles.tacticText, { color }]}>
                  {tactic.replace(/-/g, ' ').toUpperCase()}
                </Text>
              </View>
            );
          })}
        </ScrollView>
      )}

      <View style={styles.footer}>
        <View style={styles.stat}>
          <Footprints size={14} color={Theme.colors.textMuted} />
          <Text style={styles.statText}>{path.step_count} Steps</Text>
        </View>
        <View style={styles.stat}>
          <Zap size={14} color={Theme.colors.primary} />
          <Text style={styles.statText}>Score: {path.score.toFixed(1)}</Text>
        </View>
        <View style={{ flex: 1 }} />
        <ChevronRight size={18} color={Theme.colors.textMuted} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Theme.colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: 'transparent',
  },
  idBadge: {
    backgroundColor: Theme.colors.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  idText: {
    fontSize: 10,
    fontWeight: '800',
    color: Theme.colors.primary,
    fontFamily: 'Orbitron',
  },
  riskBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  riskText: {
    fontSize: 10,
    fontWeight: '900',
    fontFamily: 'Orbitron',
  },
  impactText: {
    fontSize: 13,
    color: Theme.colors.text,
    fontWeight: '600',
    lineHeight: 18,
    marginBottom: 16,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: 'transparent',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border + '33',
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'transparent',
  },
  statText: {
    fontSize: 11,
    color: Theme.colors.textMuted,
    fontWeight: '700',
  },
  tacticScroll: {
    marginBottom: 12,
  },
  tacticScrollContent: {
    gap: 6,
    paddingRight: 4,
  },
  tacticPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
  },
  tacticText: {
    fontSize: 7,
    fontWeight: '900',
    fontFamily: 'Orbitron',
    letterSpacing: 0.5,
  },
});

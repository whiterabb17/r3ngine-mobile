import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { ChevronRight, ShieldAlert, Footprints, Zap } from 'lucide-react-native';
import { Text, View } from '@/components/Themed';
import { Theme } from '../../constants/Theme';

interface AttackPathCardProps {
  path: {
    path_id: string;
    risk: string;
    score: number;
    step_count: number;
    potential_impact: string;
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
  }
});

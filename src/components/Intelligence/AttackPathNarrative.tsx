import React from 'react';
import { StyleSheet, ScrollView } from 'react-native';
import { Text, View } from '@/components/Themed';
import { Theme } from '../../constants/Theme';
import AttackPathStep, { PathStepData } from './AttackPathStep';

interface AttackPathNarrativeProps {
  steps: PathStepData[];
  score: number;
  risk: string;
}

export default function AttackPathNarrative({ steps, score, risk }: AttackPathNarrativeProps) {
  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View style={styles.scoreBox}>
          <Text style={styles.scoreValue}>{score.toFixed(1)}</Text>
          <Text style={styles.scoreLabel}>RISK SCORE</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.infoBox}>
          <Text style={[styles.riskValue, { color: risk.toLowerCase() === 'critical' ? Theme.colors.danger : Theme.colors.warning }]}>
            {risk.toUpperCase()}
          </Text>
          <Text style={styles.infoLabel}>SEVERITY LEVEL</Text>
        </View>
      </View>

      <View style={styles.narrativeContainer}>
        {steps.map((step, index) => (
          <AttackPathStep 
            key={index} 
            step={step} 
            index={index} 
            isLast={index === steps.length - 1} 
          />
        ))}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          This path was modeled using predictive heuristics and historical scan data. 
          Manual verification is recommended for all inferred steps.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    backgroundColor: Theme.colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    alignItems: 'center',
  },
  scoreBox: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  scoreValue: {
    fontSize: 28,
    fontWeight: '900',
    color: Theme.colors.primary,
    fontFamily: 'Orbitron',
  },
  scoreLabel: {
    fontSize: 10,
    color: Theme.colors.textMuted,
    fontWeight: '700',
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: Theme.colors.border,
    marginHorizontal: 16,
  },
  infoBox: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  riskValue: {
    fontSize: 20,
    fontWeight: '900',
    fontFamily: 'Orbitron',
  },
  infoLabel: {
    fontSize: 10,
    color: Theme.colors.textMuted,
    fontWeight: '700',
  },
  narrativeContainer: {
    backgroundColor: 'transparent',
  },
  footer: {
    marginTop: 40,
    padding: 16,
    backgroundColor: Theme.colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderStyle: 'dashed',
  },
  footerText: {
    fontSize: 11,
    color: Theme.colors.textMuted,
    textAlign: 'center',
    lineHeight: 16,
    fontStyle: 'italic',
  }
});

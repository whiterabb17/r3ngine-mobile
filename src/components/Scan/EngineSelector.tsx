import React from 'react';
import { StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Shield, Zap, Info } from 'lucide-react-native';
import { Text, View } from '@/components/Themed';
import { Theme } from '../../constants/Theme';

interface Engine {
  id: number;
  engine_name: string;
}

interface EngineSelectorProps {
  engines: Engine[];
  selectedEngineId: number | null;
  onSelectEngine: (id: number) => void;
  loading?: boolean;
}

export default function EngineSelector({ 
  engines, 
  selectedEngineId, 
  onSelectEngine,
  loading 
}: EngineSelectorProps) {
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={Theme.colors.primary} />
        <Text style={styles.loadingText}>Loading Engines...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Select Scan Engine</Text>
      <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
        <View style={styles.grid}>
          {engines.map(engine => (
            <TouchableOpacity
              key={engine.id}
              style={[
                styles.card,
                selectedEngineId === engine.id && styles.selectedCard
              ]}
              onPress={() => onSelectEngine(engine.id)}
            >
              <View style={[
                styles.iconContainer,
                selectedEngineId === engine.id && styles.selectedIconContainer
              ]}>
                <Shield 
                  size={20} 
                  color={selectedEngineId === engine.id ? Theme.colors.primary : Theme.colors.textMuted} 
                />
              </View>
              <View style={styles.info}>
                <Text style={[
                  styles.name,
                  selectedEngineId === engine.id && styles.selectedText
                ]}>
                  {engine.engine_name}
                </Text>
                {selectedEngineId === engine.id && (
                  <Text style={styles.selectedBadge}>Active Configuration</Text>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.tipBox}>
          <Info size={16} color={Theme.colors.primary} />
          <Text style={styles.tipText}>
            Engines define which tools are executed. "Full Scan" includes discovery and vulnerabilities, while "Passive" skips active probing.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scroll: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    color: Theme.colors.text,
    fontFamily: 'Bangers',
    letterSpacing: 1,
    marginBottom: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    padding: 40,
  },
  loadingText: {
    marginTop: 12,
    color: Theme.colors.textMuted,
    fontSize: 12,
  },
  grid: {
    backgroundColor: 'transparent',
    gap: 12,
    marginBottom: 20,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.surface,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    gap: 16,
  },
  selectedCard: {
    borderColor: Theme.colors.primary,
    backgroundColor: Theme.colors.primary + '08',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  selectedIconContainer: {
    borderColor: Theme.colors.primary + '44',
    backgroundColor: Theme.colors.primary + '11',
  },
  info: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  name: {
    fontSize: 15,
    color: Theme.colors.text,
    fontWeight: '700',
  },
  selectedText: {
    color: Theme.colors.primary,
  },
  selectedBadge: {
    fontSize: 10,
    color: Theme.colors.primary,
    marginTop: 2,
    fontWeight: '600',
    opacity: 0.8,
  },
  tipBox: {
    flexDirection: 'row',
    backgroundColor: Theme.colors.surface,
    padding: 16,
    borderRadius: 12,
    gap: 12,
    alignItems: 'flex-start',
    borderLeftWidth: 3,
    borderLeftColor: Theme.colors.primary,
  },
  tipText: {
    flex: 1,
    fontSize: 11,
    color: Theme.colors.textMuted,
    lineHeight: 16,
  },
});

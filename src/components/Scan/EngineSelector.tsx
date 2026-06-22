import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, View, Text } from 'react-native';
import { Shield, Zap, Info, Cpu } from 'lucide-react-native';
import { Theme } from '../../constants/Theme';
import PipelineBuilderView from './PipelineBuilderView';

interface Engine {
  id: number;
  engine_name: string;
  tasks?: string[];
}

interface HardwareProfile {
  id: number;
  name: string;
  description?: string;
  threads: number;
  rate_limit: number;
  is_default: boolean;
  is_active: boolean;
}

interface EngineSelectorProps {
  engines: Engine[];
  selectedEngineId: number | null;
  onSelectEngine: (id: number) => void;
  profiles: HardwareProfile[];
  selectedProfileId: number | null;
  onSelectProfile: (id: number) => void;
  loading?: boolean;
}

export default function EngineSelector({
  engines,
  selectedEngineId,
  onSelectEngine,
  profiles,
  selectedProfileId,
  onSelectProfile,
  loading
}: EngineSelectorProps) {
  const [previewId, setPreviewId] = useState<number | null>(null);

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
      <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
        <Text style={styles.sectionTitle}>Select Scan Engine</Text>
        <View style={styles.grid}>
          {engines.map(engine => (
            <View key={engine.id} style={styles.engineWrapper}>
              <TouchableOpacity
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
              {selectedEngineId === engine.id && engine.tasks && engine.tasks.length > 0 && (
                <>
                  <TouchableOpacity
                    onPress={() => setPreviewId(previewId === engine.id ? null : engine.id)}
                    style={styles.pipelineToggle}
                  >
                    <Text style={styles.pipelineToggleText}>
                      {previewId === engine.id ? '▲ Hide Pipeline' : '▼ Show Pipeline'}
                    </Text>
                  </TouchableOpacity>
                  {previewId === engine.id && (
                    <View style={styles.pipelineContainer}>
                      <PipelineBuilderView tasks={engine.tasks} />
                    </View>
                  )}
                </>
              )}
            </View>
          ))}
        </View>

        <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Hardware Profile / Speed</Text>
        <View style={styles.grid}>
          {profiles.filter(p => p.is_active).map(profile => (
            <TouchableOpacity
              key={profile.id}
              style={[
                styles.card,
                selectedProfileId === profile.id && styles.selectedCard
              ]}
              onPress={() => onSelectProfile(profile.id)}
            >
              <View style={[
                styles.iconContainer,
                selectedProfileId === profile.id && styles.selectedIconContainer
              ]}>
                <Cpu 
                  size={20} 
                  color={selectedProfileId === profile.id ? Theme.colors.primary : Theme.colors.textMuted} 
                />
              </View>
              <View style={styles.info}>
                <View style={styles.profileHeader}>
                  <Text style={[
                    styles.name,
                    selectedProfileId === profile.id && styles.selectedText
                  ]}>
                    {profile.name.toUpperCase()}
                  </Text>
                  {profile.is_default && (
                    <View style={styles.defaultBadgeContainer}>
                      <Text style={styles.defaultBadgeText}>DEFAULT</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.profileDetails}>
                  Threads: {profile.threads} | Rate: {profile.rate_limit}/s
                </Text>
                {profile.description ? (
                  <Text style={styles.profileDesc} numberOfLines={2}>
                    {profile.description}
                  </Text>
                ) : null}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.tipBox}>
          <Info size={16} color={Theme.colors.primary} />
          <Text style={styles.tipText}>
            Engines define which tools are executed. Hardware profiles override execution settings (threads, rate limits) to match scanner resources.
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
  engineWrapper: {
    backgroundColor: 'transparent',
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
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'transparent',
  },
  defaultBadgeContainer: {
    backgroundColor: Theme.colors.primary + '22',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: Theme.colors.primary + '44',
  },
  defaultBadgeText: {
    fontSize: 8,
    color: Theme.colors.primary,
    fontWeight: '800',
  },
  profileDetails: {
    fontSize: 12,
    color: Theme.colors.textMuted,
    marginTop: 4,
    fontWeight: '600',
  },
  profileDesc: {
    fontSize: 11,
    color: Theme.colors.textMuted,
    marginTop: 2,
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
    marginTop: 10,
    marginBottom: 20,
  },
  tipText: {
    flex: 1,
    fontSize: 11,
    color: Theme.colors.textMuted,
    lineHeight: 16,
  },
  pipelineToggle: {
    marginTop: 6,
    paddingVertical: 4,
    alignItems: 'center',
  },
  pipelineToggleText: {
    fontSize: 10,
    color: Theme.colors.primary,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  pipelineContainer: {
    marginTop: 8,
    maxHeight: 300,
  },
});


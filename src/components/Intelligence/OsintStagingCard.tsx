import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { Mail, User, Phone, Globe, Shield, CheckCircle2, XCircle, Info } from 'lucide-react-native';
import { Text, View } from '../Themed';
import { Theme } from '../../constants/Theme';

export interface StagingItem {
  id: number;
  osint_type: string;
  content: string;
  source: string;
  confidence: number;
  status: 'pending' | 'validated' | 'ignored';
  discovered_date_humanized: string;
  target_domain_name: string;
}

interface Props {
  item: StagingItem;
  selected: boolean;
  onSelect: (id: number) => void;
  onPromote: (id: number) => void;
  onDiscard: (id: number) => void;
}

export default function OsintStagingCard({ item, selected, onSelect, onPromote, onDiscard }: Props) {
  const getIcon = () => {
    switch (item.osint_type.toLowerCase()) {
      case 'email': return <Mail size={16} color={Theme.colors.primary} />;
      case 'employee': return <User size={16} color={Theme.colors.primary} />;
      case 'phone': return <Phone size={16} color={Theme.colors.primary} />;
      default: return <Globe size={16} color={Theme.colors.primary} />;
    }
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 80) return Theme.colors.success;
    if (score >= 50) return Theme.colors.warning;
    return Theme.colors.error;
  };

  return (
    <TouchableOpacity 
      style={[styles.container, selected && styles.selectedContainer]} 
      onPress={() => onSelect(item.id)}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.typeTag}>
          {getIcon()}
          <Text style={styles.typeText}>{item.osint_type.toUpperCase()}</Text>
        </View>
        <View style={[styles.confidenceBadge, { borderColor: getConfidenceColor(item.confidence) + '44' }]}>
          <Text style={[styles.confidenceText, { color: getConfidenceColor(item.confidence) }]}>
            {item.confidence}% CONFIDENCE
          </Text>
        </View>
      </View>

      <Text style={styles.content} numberOfLines={2}>{item.content}</Text>
      
      <View style={styles.footer}>
        <View style={styles.metaInfo}>
          <Text style={styles.metaLabel}>SOURCE: <Text style={styles.metaValue}>{item.source}</Text></Text>
          <Text style={styles.metaLabel}>TARGET: <Text style={styles.metaValue}>{item.target_domain_name}</Text></Text>
        </View>
        
        <View style={styles.actions}>
          <TouchableOpacity 
            onPress={() => onDiscard(item.id)}
            style={[styles.actionBtn, styles.discardBtn]}
          >
            <XCircle size={18} color={Theme.colors.error} />
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => onPromote(item.id)}
            style={[styles.actionBtn, styles.promoteBtn]}
          >
            <CheckCircle2 size={18} color={Theme.colors.success} />
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.dateText}>{item.discovered_date_humanized}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Theme.colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  selectedContainer: {
    borderColor: Theme.colors.primary,
    backgroundColor: Theme.colors.primary + '08',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    backgroundColor: 'transparent',
  },
  typeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Theme.colors.primary + '15',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  typeText: {
    fontSize: 10,
    color: Theme.colors.primary,
    fontFamily: 'Bangers',
    letterSpacing: 0.5,
  },
  confidenceBadge: {
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: 'transparent',
  },
  confidenceText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  content: {
    fontSize: 15,
    color: Theme.colors.text,
    fontFamily: 'Bangers',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    backgroundColor: 'transparent',
  },
  metaInfo: {
    flex: 1,
    backgroundColor: 'transparent',
    gap: 2,
  },
  metaLabel: {
    fontSize: 10,
    color: Theme.colors.textMuted,
    fontWeight: 'bold',
  },
  metaValue: {
    color: Theme.colors.text,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: 'transparent',
  },
  actionBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: '#222',
  },
  discardBtn: {
    borderColor: Theme.colors.error + '33',
  },
  promoteBtn: {
    borderColor: Theme.colors.success + '33',
  },
  dateText: {
    position: 'absolute',
    top: 14,
    right: 14,
    fontSize: 8,
    color: Theme.colors.textMuted,
    backgroundColor: 'transparent',
  },
});

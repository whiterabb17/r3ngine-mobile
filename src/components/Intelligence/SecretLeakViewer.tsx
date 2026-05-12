import React from 'react';
import { StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Key, ShieldAlert, ExternalLink, Code, CheckCircle, AlertTriangle, Eye, EyeOff } from 'lucide-react-native';
import { Text, View } from '@/components/Themed';
import { Theme } from '../../constants/Theme';

interface SecretLeak {
  id: number;
  tool_name: string;
  secret_type: string;
  source_url: string;
  match_content: string;
  status: 'unverified' | 'verified' | 'false_positive';
  discovered_date: string;
  subdomain?: {
    name: string;
  };
}

interface SecretLeakViewerProps {
  leaks: SecretLeak[];
  onRefresh?: () => void;
}

export default function SecretLeakViewer({ leaks, onRefresh }: SecretLeakViewerProps) {
  const [visibleSecrets, setVisibleSecrets] = React.useState<Record<number, boolean>>({});

  const toggleSecretVisibility = (id: number) => {
    setVisibleSecrets(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return Theme.colors.success;
      case 'false_positive': return Theme.colors.textMuted;
      default: return Theme.colors.warning;
    }
  };

  const renderLeakItem = (leak: SecretLeak) => {
    const isVisible = visibleSecrets[leak.id];
    
    return (
      <View key={leak.id} style={styles.leakCard}>
        <View style={styles.cardHeader}>
          <View style={styles.toolBadge}>
            <Text style={styles.toolName}>{leak.tool_name}</Text>
          </View>
          <View style={[styles.statusBadge, { borderColor: getStatusColor(leak.status) }]}>
            <Text style={[styles.statusText, { color: getStatusColor(leak.status) }]}>{leak.status}</Text>
          </View>
        </View>

        <View style={styles.typeRow}>
          <Key size={16} color={Theme.colors.primary} />
          <Text style={styles.secretType}>{leak.secret_type}</Text>
        </View>

        <Text style={styles.subdomainText}>{leak.subdomain?.name || 'N/A'}</Text>

        <View style={styles.contentBox}>
          <View style={styles.contentHeader}>
            <Code size={14} color={Theme.colors.textMuted} />
            <Text style={styles.contentTitle}>Discovered Payload</Text>
            <TouchableOpacity onPress={() => toggleSecretVisibility(leak.id)} style={styles.eyeBtn}>
              {isVisible ? <EyeOff size={16} color={Theme.colors.primary} /> : <Eye size={16} color={Theme.colors.primary} />}
            </TouchableOpacity>
          </View>
          <View style={styles.matchBox}>
            <Text style={styles.matchText} numberOfLines={isVisible ? 0 : 2}>
              {isVisible ? leak.match_content : '••••••••••••••••••••••••••••••••'}
            </Text>
          </View>
        </View>

        <View style={styles.sourceBox}>
          <Text style={styles.sourceLabel}>Source Context:</Text>
          <Text style={styles.sourceUrl} numberOfLines={1}>{leak.source_url}</Text>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.actionBtn}>
            <CheckCircle size={14} color={Theme.colors.success} />
            <Text style={[styles.actionText, { color: Theme.colors.success }]}>Verify</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn}>
            <AlertTriangle size={14} color={Theme.colors.textMuted} />
            <Text style={styles.actionText}>False Positive</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {leaks.length === 0 ? (
        <View style={styles.emptyState}>
          <ShieldAlert size={48} color={Theme.colors.surface} />
          <Text style={styles.emptyText}>No Secrets Leaked</Text>
          <Text style={styles.emptySubtext}>Your infrastructure seems clean of exposed credentials.</Text>
        </View>
      ) : (
        leaks.map(renderLeakItem)
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  contentContainer: {
    padding: 16,
    gap: 16,
  },
  leakCard: {
    backgroundColor: Theme.colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: 'transparent',
  },
  toolBadge: {
    backgroundColor: Theme.colors.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  toolName: {
    fontSize: 10,
    fontWeight: '800',
    color: Theme.colors.primary,
    textTransform: 'uppercase',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
    backgroundColor: 'transparent',
  },
  secretType: {
    fontSize: 16,
    fontWeight: '800',
    color: Theme.colors.text,
    fontFamily: 'Orbitron',
  },
  subdomainText: {
    fontSize: 12,
    color: Theme.colors.primary,
    fontWeight: '600',
    marginBottom: 12,
  },
  contentBox: {
    backgroundColor: Theme.colors.background,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Theme.colors.border + '33',
  },
  contentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
    backgroundColor: 'transparent',
  },
  contentTitle: {
    fontSize: 11,
    color: Theme.colors.textMuted,
    fontWeight: '700',
    flex: 1,
  },
  eyeBtn: {
    padding: 4,
  },
  matchBox: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    padding: 10,
    borderRadius: 6,
  },
  matchText: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: Theme.colors.success,
    lineHeight: 16,
  },
  sourceBox: {
    marginBottom: 16,
    backgroundColor: 'transparent',
  },
  sourceLabel: {
    fontSize: 11,
    color: Theme.colors.textMuted,
    marginBottom: 4,
  },
  sourceUrl: {
    fontSize: 11,
    color: Theme.colors.text,
    fontFamily: 'monospace',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: 'transparent',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border + '33',
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Theme.colors.background,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '700',
    color: Theme.colors.text,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: 'bold',
    color: Theme.colors.text,
    fontFamily: 'Orbitron',
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 12,
    color: Theme.colors.textMuted,
    textAlign: 'center',
  }
});

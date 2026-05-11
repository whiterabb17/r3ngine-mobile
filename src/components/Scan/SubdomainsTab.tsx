import React, { useState, useMemo } from 'react';
import { StyleSheet, FlatList, TextInput, TouchableOpacity, Image, Modal, ScrollView, Dimensions } from 'react-native';
import { 
  Search, 
  Globe, 
  ChevronRight, 
  Copy, 
  ExternalLink, 
  Bug, 
  Zap, 
  ShieldAlert, 
  AlertTriangle,
  Info,
  Timer,
  FileText,
  X,
  Camera
} from 'lucide-react-native';

import { Text, View } from '@/components/Themed';
import { Theme } from '../../constants/Theme';
import { useSettingsStore } from '../../store/useSettingsStore';
import { getMediaSource } from '../../api/client';

interface Port {
  number: number;
  service_name: string;
  is_uncommon: boolean;
}

interface IpAddress {
  address: string;
  is_cdn: boolean;
  ports: Port[];
}

interface Subdomain {
  name: string;
  http_status: number;
  page_title: string;
  http_url: string;
  origin_ip: string;
  response_time: number;
  screenshot_path: string;
  critical_count: number;
  high_count: number;
  medium_count: number;
  low_count: number;
  info_count: number;
  content_length: number;
  ip_addresses: IpAddress[];
}

interface SubdomainsTabProps {
  subdomains: Subdomain[];
}

export default function SubdomainsTab({ subdomains = [] }: SubdomainsTabProps) {
  const [search, setSearch] = useState('');
  const [selectedScreenshot, setSelectedScreenshot] = useState<string | null>(null);
  const { serverIp } = useSettingsStore();

  const getFullImageUrl = (path: string) => {
    return getMediaSource(path);
  };

  const filteredSubdomains = useMemo(() => {
    return subdomains.filter(s => 
      s.name.toLowerCase().includes(search.toLowerCase()) || 
      (s.origin_ip && s.origin_ip.includes(search))
    );
  }, [subdomains, search]);

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return Theme.colors.success;
    if (status >= 300 && status < 400) return Theme.colors.info;
    if (status >= 400 && status < 500) return Theme.colors.warning;
    if (status >= 500) return Theme.colors.error;
    return Theme.colors.textMuted;
  };

  const SeverityCount = ({ count, color, icon: Icon }: any) => {
    if (count === 0) return null;
    return (
      <View style={styles.severityTag}>
        <Icon size={10} color={color} />
        <Text style={[styles.severityText, { color }]}>{count}</Text>
      </View>
    );
  };

  const renderItem = ({ item }: { item: Subdomain }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.nameSection}>
          <Text style={styles.subdomainName} numberOfLines={1}>{item.name}</Text>
          <TouchableOpacity style={styles.copyBtn}>
            <Copy size={12} color={Theme.colors.textMuted} />
          </TouchableOpacity>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.http_status) + '22', borderColor: getStatusColor(item.http_status) + '44' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.http_status) }]}>
            {item.http_status || '404'}
          </Text>
        </View>
      </View>

      {/* Vulnerability Counts */}
      {(item.critical_count > 0 || item.high_count > 0 || item.medium_count > 0 || item.low_count > 0 || item.info_count > 0) && (
        <View style={styles.vulnRow}>
          <SeverityCount count={item.critical_count} color={Theme.colors.vulnerabilities.critical} icon={Bug} />
          <SeverityCount count={item.high_count} color={Theme.colors.vulnerabilities.high} icon={ShieldAlert} />
          <SeverityCount count={item.medium_count} color={Theme.colors.vulnerabilities.medium} icon={AlertTriangle} />
          <SeverityCount count={item.low_count} color={Theme.colors.vulnerabilities.low} icon={ShieldAlert} />
          <SeverityCount count={item.info_count} color={Theme.colors.vulnerabilities.info} icon={Info} />
        </View>
      )}

      {/* IP and Ports */}
      <View style={styles.detailSection}>
        {item.ip_addresses?.length > 0 ? (
          item.ip_addresses.map((ip, idx) => (
            <View key={idx} style={[styles.ipGroup, idx > 0 && { marginTop: 8 }]}>
              <View style={styles.ipHeader}>
                <Globe size={12} color={ip.is_cdn ? Theme.colors.warning : Theme.colors.textMuted} />
                <Text style={[styles.detailText, ip.is_cdn && { color: Theme.colors.warning }]}>
                  {ip.address} {ip.is_cdn ? '(CDN)' : ''}
                </Text>
              </View>
              {ip.ports?.length > 0 && (
                <View style={styles.portsRow}>
                  {ip.ports.map((port, pIdx) => (
                    <View key={pIdx} style={[styles.portBadge, port.is_uncommon && styles.uncommonPort]}>
                      <Text style={[styles.portText, port.is_uncommon && styles.uncommonPortText]}>
                        {port.number}/{port.service_name}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          ))
        ) : (
          <View style={styles.detailRow}>
            <Globe size={12} color={Theme.colors.textMuted} />
            <Text style={styles.detailText}>{item.origin_ip || 'No IP'}</Text>
          </View>
        )}
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.footerMetrics}>
          <View style={styles.metric}>
            <Timer size={10} color={Theme.colors.error} />
            <Text style={styles.metricText}>{item.response_time ? `${item.response_time.toFixed(3)}s` : '-'}</Text>
          </View>
          <View style={styles.metric}>
            <FileText size={10} color={Theme.colors.textMuted} />
            <Text style={styles.metricText}>{item.content_length?.toLocaleString() || 0}</Text>
          </View>
        </View>

        <View style={styles.actionRow}>
          {item.screenshot_path && (
            <TouchableOpacity 
              style={styles.actionBtn}
              onPress={() => setSelectedScreenshot(item.screenshot_path)}
            >
              <Camera size={16} color={Theme.colors.primary} />
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.actionBtn}>
            <ExternalLink size={16} color={Theme.colors.textMuted} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Search size={18} color={Theme.colors.textMuted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Filter Subdomains (e.g. name, ip)"
          placeholderTextColor={Theme.colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <FlatList
        data={filteredSubdomains}
        keyExtractor={(item, index) => `${item.name}-${index}`}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No subdomains found matching your search.</Text>
          </View>
        }
      />

      {/* Screenshot Modal */}
      <Modal
        visible={!!selectedScreenshot}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedScreenshot(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Visual Proof</Text>
              <TouchableOpacity onPress={() => setSelectedScreenshot(null)} style={styles.closeBtn}>
                <X size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.modalScroll}>
              {selectedScreenshot && (
                <Image 
                  source={getMediaSource(selectedScreenshot) as any} 
                  style={styles.screenshotImage}
                  resizeMode="contain"
                />
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Theme.spacing.md,
    backgroundColor: 'transparent',
  },
  searchContainer: {
    marginHorizontal: Theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.surface,
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  listContent: {
    paddingHorizontal: Theme.spacing.md,
    paddingBottom: Theme.spacing.xl,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    color: Theme.colors.text,
    fontSize: 14,
  },
  card: {
    backgroundColor: Theme.colors.surface,
    borderRadius: 12,
    padding: Theme.spacing.md,
    marginBottom: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    backgroundColor: 'transparent',
    marginBottom: 8,
  },
  nameSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    gap: 6,
  },
  subdomainName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#fff',
    maxWidth: '85%',
  },
  copyBtn: {
    padding: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '900',
    fontFamily: 'monospace',
  },
  vulnRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    backgroundColor: 'transparent',
    marginBottom: 12,
  },
  severityTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  severityText: {
    fontSize: 10,
    fontWeight: '800',
  },
  detailSection: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 8,
    padding: 8,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: 'transparent',
    marginBottom: 8,
  },
  ipList: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  detailText: {
    fontSize: 11,
    color: Theme.colors.textMuted,
    fontFamily: 'monospace',
  },
  ipGroup: {
    backgroundColor: 'transparent',
  },
  ipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'transparent',
    marginBottom: 4,
  },
  portsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    backgroundColor: 'transparent',
  },
  portBadge: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  portText: {
    fontSize: 9,
    fontWeight: '700',
    color: Theme.colors.textMuted,
  },
  uncommonPort: {
    backgroundColor: Theme.colors.error + '11',
    borderColor: Theme.colors.error + '33',
  },
  uncommonPortText: {
    color: Theme.colors.error,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'transparent',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border + '33',
  },
  footerMetrics: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: 'transparent',
  },
  metric: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'transparent',
  },
  metricText: {
    fontSize: 10,
    color: Theme.colors.textMuted,
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: 'transparent',
  },
  actionBtn: {
    padding: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '95%',
    height: '80%',
    backgroundColor: Theme.colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
    backgroundColor: Theme.colors.surface,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: Theme.colors.primary,
    fontFamily: 'Orbitron',
    letterSpacing: 1,
  },
  closeBtn: {
    padding: 4,
  },
  modalScroll: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  screenshotImage: {
    width: Dimensions.get('window').width * 0.85,
    height: Dimensions.get('window').height * 0.6,
    borderRadius: 8,
  },
  emptyContainer: {
    padding: Theme.spacing.xl,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  emptyText: {
    color: Theme.colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
  }
});


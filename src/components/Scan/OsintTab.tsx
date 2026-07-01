import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, View, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { Text } from '@/components/Themed';
import { Theme } from '../../constants/Theme';
import { Mail, User, ShieldAlert, Folder, Search, CheckCircle2, FileText, Database } from 'lucide-react-native';
import OsintStagingCard, { StagingItem } from '../Intelligence/OsintStagingCard';
import apiClient from '../../api/client';
import { TacticalHaptics } from '../../utils/haptics';
import { useRouter } from 'expo-router';

interface OsintTabProps {
  data: any;
  scanId: number;
  refreshing?: boolean;
  onRefresh?: () => void;
}

export default function OsintTab({ scanId, data, refreshing, onRefresh }: OsintTabProps) {
  const router = useRouter();
  const [stagedItems, setStagedItems] = useState<StagingItem[]>(data?.osint_staging || []);
  const [activeSection, setActiveSection] = useState<string>('');

  useEffect(() => {
    setStagedItems(data?.osint_staging || []);
  }, [data?.osint_staging]);

  const SECTIONS = [
    { id: 'STAGED', label: 'Staged OSINT', icon: (color: string) => <ShieldAlert size={14} color={color} /> },
    { id: 'EMAILS', label: 'Emails', icon: (color: string) => <Mail size={14} color={color} /> },
    { id: 'EMPLOYEES', label: 'Employees', icon: (color: string) => <User size={14} color={color} /> },
    { id: 'SECRETS', label: 'Secrets', icon: (color: string) => <ShieldAlert size={14} color={color} /> },
    { id: 'BUCKETS', label: 'S3 Buckets', icon: (color: string) => <Database size={14} color={color} /> },
    { id: 'DORKS', label: 'Dorks', icon: (color: string) => <Search size={14} color={color} /> },
    { id: 'DOCS', label: 'Documents', icon: (color: string) => <FileText size={14} color={color} /> }
  ];

  const availableSections = SECTIONS.filter(s => {
    if (s.id === 'STAGED') return stagedItems.length > 0;
    if (s.id === 'EMAILS') return data?.emails?.length > 0;
    if (s.id === 'EMPLOYEES') return data?.employees?.length > 0;
    if (s.id === 'SECRETS') return data?.secret_leaks?.length > 0;
    if (s.id === 'BUCKETS') return data?.buckets?.length > 0;
    if (s.id === 'DORKS') return data?.dorks?.length > 0;
    if (s.id === 'DOCS') return data?.documents?.length > 0;
    return false;
  });

  useEffect(() => {
    if (availableSections.length > 0 && !availableSections.find(s => s.id === activeSection)) {
      setActiveSection(availableSections[0].id);
    }
  }, [stagedItems, data, activeSection]);

  const handlePromote = async (id: number) => {
    try {
      TacticalHaptics.impact();
      await apiClient.post(`/mapi/osintStaging/${id}/promote/`);
      setStagedItems(prev => prev.filter(item => item.id !== id));
      TacticalHaptics.success();
      if (onRefresh) onRefresh();
    } catch (err) {
      Alert.alert('Promotion Failed', 'Failed to promote OSINT item.');
    }
  };

  const handleDiscard = async (id: number) => {
    try {
      TacticalHaptics.impact();
      await apiClient.post(`/mapi/osintStaging/${id}/discard/`);
      setStagedItems(prev => prev.filter(item => item.id !== id));
      if (onRefresh) onRefresh();
    } catch (err) {
      Alert.alert('Discard Failed', 'Failed to remove staging item.');
    }
  };

  const navigateToEmailBreaches = (email: any) => {
    if (email.id) {
      router.push(`/scan/email-breach/${email.id}?scanId=${scanId}&address=${encodeURIComponent(email.address || email.email)}`);
    } else {
      Alert.alert('Notice', 'This email does not have a valid ID for breach lookup.');
    }
  };

  const renderSectionHeader = (title: string, icon: React.ReactNode) => (
    <View style={styles.sectionHeader}>
      {icon}
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {availableSections.length > 0 ? (
        <View style={{flex: 1}}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabBar} contentContainerStyle={styles.tabBarContent}>
            {availableSections.map((section) => {
              const isActive = activeSection === section.id;
              return (
                <TouchableOpacity
                  key={section.id}
                  style={[styles.tabButton, isActive && styles.tabButtonActive]}
                  onPress={() => setActiveSection(section.id)}
                >
                  {section.icon(isActive ? '#fff' : Theme.colors.textMuted)}
                  <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                    {section.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <ScrollView 
            style={styles.contentScroll} 
            contentContainerStyle={styles.content}
            refreshControl={
              <RefreshControl 
                refreshing={refreshing || false} 
                onRefresh={onRefresh} 
                tintColor={Theme.colors.primary} 
                colors={[Theme.colors.primary]} 
              />
            }
          >
            {activeSection === 'STAGED' && (
              <View style={styles.section}>
                {renderSectionHeader('STAGED OSINT', <ShieldAlert size={18} color={Theme.colors.warning} />)}
                {stagedItems.map(item => (
                  <OsintStagingCard
                    key={item.id}
                    item={item}
                    selected={false}
                    onSelect={() => {}}
                    onPromote={handlePromote}
                    onDiscard={handleDiscard}
                  />
                ))}
              </View>
            )}

            {activeSection === 'EMAILS' && (
              <View style={styles.section}>
                {renderSectionHeader('BREACHED EMAILS', <Mail size={18} color={Theme.colors.primary} />)}
                <Text style={styles.instructionText}>Tap an email to view breach details.</Text>
                {data.emails.map((email: any, idx: number) => (
                  <TouchableOpacity key={idx} style={styles.itemCardTouchable} onPress={() => navigateToEmailBreaches(email)}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                      <Text style={[styles.itemTitle, { marginBottom: 0 }]}>{email.address || email.email}</Text>
                      {email.breach_count > 0 && (
                        <View style={{ backgroundColor: Theme.colors.error + '33', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: Theme.colors.error }}>
                          <Text style={{ fontSize: 9, color: Theme.colors.error, fontWeight: 'bold' }}>{email.breach_count} BREACH{email.breach_count > 1 ? 'ES' : ''}</Text>
                        </View>
                      )}
                    </View>
                    {email.password && <Text style={styles.itemSub}>Password: {email.password}</Text>}
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {activeSection === 'EMPLOYEES' && (
              <View style={styles.section}>
                {renderSectionHeader('EMPLOYEES', <User size={18} color={Theme.colors.primary} />)}
                {data.employees.map((emp: any, idx: number) => (
                  <View key={idx} style={styles.itemCard}>
                    <Text style={styles.itemTitle}>{emp.name || emp.full_name}</Text>
                    {emp.designation && <Text style={styles.itemSub}>{emp.designation}</Text>}
                  </View>
                ))}
              </View>
            )}

            {activeSection === 'SECRETS' && (
              <View style={styles.section}>
                {renderSectionHeader('SECRET LEAKS', <ShieldAlert size={18} color={Theme.colors.error} />)}
                {data.secret_leaks.map((leak: any, idx: number) => (
                  <View key={idx} style={styles.itemCard}>
                    <Text style={styles.itemTitle}>{leak.secret_type || leak.tool_name || 'Secret'}</Text>
                    <Text style={styles.itemSub}>URL: {leak.source_url || 'N/A'}</Text>
                    {leak.match_content && <Text style={styles.itemSub}>Match: {leak.match_content}</Text>}
                  </View>
                ))}
              </View>
            )}

            {activeSection === 'BUCKETS' && (
              <View style={styles.section}>
                {renderSectionHeader('S3 BUCKETS', <Database size={18} color={Theme.colors.primary} />)}
                {data.buckets.map((bucket: any, idx: number) => (
                  <View key={idx} style={styles.itemCard}>
                    <Text style={styles.itemTitle}>{bucket.name}</Text>
                    {bucket.region && <Text style={styles.itemSub}>Region: {bucket.region}</Text>}
                  </View>
                ))}
              </View>
            )}

            {activeSection === 'DORKS' && (
              <View style={styles.section}>
                {renderSectionHeader('DORKS', <Search size={18} color={Theme.colors.primary} />)}
                {data.dorks.map((dork: any, idx: number) => (
                  <View key={idx} style={styles.itemCard}>
                    <Text style={styles.itemTitle}>{dork.description || dork.type}</Text>
                    {dork.url && <Text style={styles.itemSub}>{dork.url}</Text>}
                  </View>
                ))}
              </View>
            )}

            {activeSection === 'DOCS' && (
              <View style={styles.section}>
                {renderSectionHeader('METADATA DOCUMENTS', <FileText size={18} color={Theme.colors.primary} />)}
                {data.documents.map((doc: any, idx: number) => (
                  <View key={idx} style={styles.itemCard}>
                    <Text style={styles.itemTitle}>{doc.url || doc.name}</Text>
                    {doc.author && <Text style={styles.itemSub}>Author: {doc.author}</Text>}
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
        </View>
      ) : (
        <View style={styles.emptyContainer}>
          <ShieldAlert size={48} color={Theme.colors.textMuted} opacity={0.5} />
          <Text style={styles.emptyText}>NO OSINT DATA FOUND</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  tabBar: {
    maxHeight: 50,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
    backgroundColor: Theme.colors.surface,
  },
  tabBarContent: {
    paddingHorizontal: Theme.spacing.md,
    alignItems: 'center',
    gap: 8,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'transparent',
    gap: 6,
  },
  tabButtonActive: {
    backgroundColor: Theme.colors.primary,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Theme.colors.textMuted,
  },
  tabLabelActive: {
    color: '#fff',
  },
  contentScroll: {
    flex: 1,
  },
  content: {
    padding: Theme.spacing.md,
    paddingBottom: 100,
  },
  section: {
    marginBottom: 24,
    marginTop: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Bangers',
    color: Theme.colors.text,
    letterSpacing: 1,
  },
  itemCard: {
    backgroundColor: Theme.colors.surface,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  itemCardTouchable: {
    backgroundColor: Theme.colors.surface,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  itemTitle: {
    fontSize: 14,
    color: Theme.colors.text,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  itemSub: {
    fontSize: 12,
    color: Theme.colors.textMuted,
  },
  instructionText: {
    fontSize: 12,
    color: Theme.colors.textMuted,
    marginBottom: 12,
    fontStyle: 'italic',
  },
  emptyContainer: {
    paddingTop: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    marginTop: 16,
    color: Theme.colors.textMuted,
    fontFamily: 'Bangers',
    fontSize: 18,
    letterSpacing: 1,
  }
});

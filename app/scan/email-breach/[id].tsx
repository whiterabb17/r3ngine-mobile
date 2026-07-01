import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { Text } from '@/components/Themed';
import { useLocalSearchParams, Stack } from 'expo-router';
import { Theme } from '../../../src/constants/Theme';
import { Mail, ShieldAlert, Calendar, FileText } from 'lucide-react-native';
import apiClient from '../../../src/api/client';

export default function EmailBreachesScreen() {
  const { id: emailId, scanId, address } = useLocalSearchParams();
  const [breaches, setBreaches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBreaches();
  }, [scanId, emailId]);

  const fetchBreaches = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/mapi/emailBreaches/?scan_id=${scanId}&email_id=${emailId}`);
      setBreaches(response.data.results || response.data || []);
    } catch (err) {
      console.error('Failed to fetch breaches', err);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <ShieldAlert size={20} color={Theme.colors.error} />
        <Text style={styles.breachName}>{item.breach_name}</Text>
      </View>
      {item.breach_date && (
        <View style={styles.row}>
          <Calendar size={14} color={Theme.colors.textMuted} />
          <Text style={styles.dateText}>{item.breach_date}</Text>
        </View>
      )}
      {item.description && (
        <Text style={styles.description}>{item.description}</Text>
      )}
      {item.compromised_data && item.compromised_data.length > 0 && (
        <View style={styles.dataContainer}>
          <Text style={styles.dataLabel}>Compromised Data:</Text>
          <View style={styles.dataTags}>
            {item.compromised_data.map((d: string, idx: number) => (
              <View key={idx} style={styles.tag}>
                <Text style={styles.tagText}>{d}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ 
        title: 'EMAIL BREACHES', 
        headerBackTitle: 'Back',
        headerStyle: { backgroundColor: Theme.colors.surface },
        headerTintColor: Theme.colors.text,
        headerTitleStyle: {
          fontFamily: 'Bangers',
          fontSize: 22,
          color: Theme.colors.primary,
        }
      }} />
      <View style={styles.header}>
        <Mail size={24} color={Theme.colors.primary} />
        <Text style={styles.headerEmail}>{address}</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={Theme.colors.primary} style={{ marginTop: 40 }} />
      ) : breaches.length === 0 ? (
        <View style={styles.emptyContainer}>
          <ShieldAlert size={48} color={Theme.colors.textMuted} opacity={0.5} />
          <Text style={styles.emptyText}>NO BREACHES FOUND</Text>
        </View>
      ) : (
        <FlatList
          data={breaches}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Theme.spacing.lg,
    backgroundColor: Theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
    gap: 12,
  },
  headerEmail: {
    fontSize: 18,
    fontFamily: 'Bangers',
    color: Theme.colors.text,
    letterSpacing: 1,
  },
  list: {
    padding: Theme.spacing.md,
  },
  card: {
    backgroundColor: Theme.colors.surface,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  breachName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Theme.colors.text,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  dateText: {
    fontSize: 14,
    color: Theme.colors.textMuted,
  },
  description: {
    fontSize: 14,
    color: Theme.colors.text,
    marginBottom: 16,
    lineHeight: 20,
  },
  dataContainer: {
    marginTop: 8,
  },
  dataLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: Theme.colors.textMuted,
    marginBottom: 8,
  },
  dataTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  tagText: {
    fontSize: 12,
    color: Theme.colors.text,
  },
  emptyContainer: {
    paddingTop: 80,
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

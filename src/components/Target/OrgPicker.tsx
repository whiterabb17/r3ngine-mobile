import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Building2 } from 'lucide-react-native';
import { Theme } from '../../constants/Theme';
import apiClient from '../../api/client';
import { TacticalHaptics } from '../../utils/haptics';

interface Organization {
  id: number;
  name: string;
}

interface OrgPickerProps {
  selectedOrgId: number | null;
  onOrgChange: (orgId: number | null) => void;
}

export default function OrgPicker({ selectedOrgId, onOrgChange }: OrgPickerProps) {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrgs = async () => {
      try {
        const response = await apiClient.get('/api/listOrganizations/');
        setOrganizations(response.data.organizations || []);
      } catch (err) {
        console.error('Failed to fetch orgs for picker:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrgs();
  }, []);

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="small" color={Theme.colors.primary} />
      </View>
    );
  }

  if (organizations.length === 0) return null;

  return (
    <View style={styles.container}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
      >
        <TouchableOpacity
          style={[styles.chip, selectedOrgId === null && styles.chipActive]}
          onPress={() => {
            onOrgChange(null);
            TacticalHaptics.soft();
          }}
        >
          <Text style={[styles.chipText, selectedOrgId === null && styles.chipTextActive]}>
            ALL UNITS
          </Text>
        </TouchableOpacity>

        {organizations.map((org) => (
          <TouchableOpacity
            key={org.id}
            style={[styles.chip, selectedOrgId === org.id && styles.chipActive]}
            onPress={() => {
              onOrgChange(org.id);
              TacticalHaptics.soft();
            }}
          >
            <Building2 
              size={12} 
              color={selectedOrgId === org.id ? '#000' : Theme.colors.textMuted} 
              style={{ marginRight: 6 }} 
            />
            <Text style={[styles.chipText, selectedOrgId === org.id && styles.chipTextActive]}>
              {org.name.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
    marginBottom: Theme.spacing.md,
  },
  scrollContent: {
    paddingHorizontal: Theme.spacing.md,
    gap: 10,
  },
  loading: {
    padding: Theme.spacing.md,
    alignItems: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  chipActive: {
    backgroundColor: Theme.colors.primary,
    borderColor: Theme.colors.primary,
  },
  chipText: {
    color: Theme.colors.textMuted,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  chipTextActive: {
    color: '#000',
  },
});

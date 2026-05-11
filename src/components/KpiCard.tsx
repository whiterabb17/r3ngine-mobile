import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LucideIcon } from 'lucide-react-native';
import { Theme } from '../constants/Theme';

interface KpiCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color: string;
  onPress?: () => void;
}

export const KpiCard = ({ title, value, icon: Icon, color, onPress }: KpiCardProps) => {
  return (
    <TouchableOpacity 
      style={styles.card} 
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
        <Icon size={20} color={color} />
      </View>
      <View style={styles.content}>
        <Text style={styles.value}>{value}</Text>
        <Text style={styles.title}>{title}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Theme.colors.border,
    marginBottom: Theme.spacing.md,
    flex: 1,
    minWidth: '45%',
    marginHorizontal: Theme.spacing.xs,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: Theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Theme.spacing.md,
  },
  content: {
    flex: 1,
  },
  value: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Theme.colors.text,
  },
  title: {
    fontSize: 12,
    color: Theme.colors.textMuted,
    marginTop: 2,
  },
});

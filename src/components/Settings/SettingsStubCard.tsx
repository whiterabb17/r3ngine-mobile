import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Lock, ExternalLink } from 'lucide-react-native';
import { Theme } from '../../constants/Theme';

interface Props {
  title: string;
  subtitle?: string;
  linkLabel?: string;
  onLinkPress?: () => void;
}

export default function SettingsStubCard({ title, subtitle, linkLabel, onLinkPress }: Props) {
  return (
    <View style={styles.card}>
      <Lock size={32} color={Theme.colors.textMuted} style={styles.icon} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>
        {subtitle ?? 'Full configuration is available in the r3ngine web interface.'}
      </Text>
      {linkLabel && onLinkPress && (
        <TouchableOpacity style={styles.link} onPress={onLinkPress}>
          <ExternalLink size={14} color={Theme.colors.primary} />
          <Text style={styles.linkText}>{linkLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    margin: Theme.spacing.md,
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  icon: { marginBottom: Theme.spacing.md },
  title: {
    fontSize: 18,
    fontFamily: 'Bangers',
    color: Theme.colors.text,
    letterSpacing: 1,
    marginBottom: Theme.spacing.sm,
    textAlign: 'center',
  },
  body: {
    fontSize: 14,
    color: Theme.colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: Theme.spacing.lg,
  },
  linkText: { color: Theme.colors.primary, fontSize: 14, fontWeight: '600' },
});

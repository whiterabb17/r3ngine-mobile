import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { DollarSign, FileText, Bookmark } from 'lucide-react-native';
import { Theme } from '../../constants/Theme';
import { BountyProgram } from '../../api/bounty';

interface Props {
  program: BountyProgram;
  onPress: () => void;
}

export default function ProgramCard({ program, onPress }: Props) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.row}>
        <Text style={styles.name} numberOfLines={1}>{program.name}</Text>
        {program.bookmarked && <Bookmark size={14} color={Theme.colors.warning} fill={Theme.colors.warning} />}
      </View>
      <Text style={styles.handle}>@{program.handle}</Text>
      <View style={styles.meta}>
        <View style={styles.badge}>
          <DollarSign size={12} color={Theme.colors.success} />
          <Text style={styles.badgeText}>Bounty</Text>
        </View>
        <View style={[styles.badge, styles.badgeSecondary]}>
          <FileText size={12} color={Theme.colors.textMuted} />
          <Text style={styles.badgeTextMuted}>{program.number_of_reports_for_user} reports</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.md,
    marginBottom: Theme.spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Theme.colors.border,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { color: Theme.colors.text, fontSize: 15, fontWeight: '600', flex: 1 },
  handle: { color: Theme.colors.textMuted, fontSize: 12, marginTop: 2, marginBottom: Theme.spacing.sm },
  meta: { flexDirection: 'row', gap: Theme.spacing.sm, flexWrap: 'wrap' },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Theme.colors.success + '22', borderRadius: Theme.borderRadius.sm, paddingHorizontal: 6, paddingVertical: 2 },
  badgeSecondary: { backgroundColor: Theme.colors.surface },
  badgeText: { color: Theme.colors.success, fontSize: 11 },
  badgeTextMuted: { color: Theme.colors.textMuted, fontSize: 11 },
});

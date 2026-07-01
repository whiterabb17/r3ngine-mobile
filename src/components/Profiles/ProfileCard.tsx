import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Lock, Sliders } from 'lucide-react-native';
import { Theme } from '../../constants/Theme';
import { ScanProfile } from '../../api/profiles';

const CATEGORY_COLOR: Record<string, string> = {
  full: Theme.colors.vulnerabilities.critical,
  stealth: Theme.colors.accent,
  basic: Theme.colors.info,
  custom: Theme.colors.primary,
};

interface Props { profile: ScanProfile }

export default function ProfileCard({ profile }: Props) {
  const catColor = CATEGORY_COLOR[profile.category?.toLowerCase()] ?? Theme.colors.textMuted;

  return (
    <View style={styles.card}>
      <View style={styles.iconWrap}>
        <Sliders size={20} color={catColor} />
      </View>
      <View style={styles.body}>
        <View style={styles.row}>
          <Text style={styles.name}>{profile.name}</Text>
          {profile.is_builtin && <Lock size={12} color={Theme.colors.textMuted} />}
        </View>
        {!!profile.description && (
          <Text style={styles.desc} numberOfLines={2}>{profile.description}</Text>
        )}
        <View style={[styles.catBadge, { backgroundColor: catColor + '22' }]}>
          <Text style={[styles.catText, { color: catColor }]}>{profile.category}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: Theme.colors.surface, borderRadius: Theme.borderRadius.md, padding: Theme.spacing.md, marginBottom: Theme.spacing.sm, borderWidth: StyleSheet.hairlineWidth, borderColor: Theme.colors.border },
  iconWrap: { width: 36, height: 36, borderRadius: Theme.borderRadius.md, backgroundColor: Theme.colors.background, alignItems: 'center', justifyContent: 'center', marginRight: Theme.spacing.sm },
  body: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { color: Theme.colors.text, fontSize: 14, fontWeight: '600', flex: 1 },
  desc: { color: Theme.colors.textMuted, fontSize: 12, marginTop: 2, marginBottom: Theme.spacing.xs },
  catBadge: { alignSelf: 'flex-start', borderRadius: Theme.borderRadius.sm, paddingHorizontal: 6, paddingVertical: 2 },
  catText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
});

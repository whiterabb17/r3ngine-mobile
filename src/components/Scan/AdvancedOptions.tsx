import React from 'react';
import { StyleSheet, TextInput, Switch, ScrollView } from 'react-native';
import { Target, Globe, ShieldAlert, Bug, Cpu } from 'lucide-react-native';
import { Text, View } from '@/components/Themed';
import { Theme } from '../../constants/Theme';

interface AdvancedOptionsProps {
  data: {
    importSubdomainTextArea: string;
    outOfScopeSubdomainTextarea: string;
    startingPointPath: string;
    excludedPaths: string;
    customDorkTextarea: string;
    customDorkSwitch: boolean;
    spiderfoot_scan: boolean;
  };
  onChange: (key: string, value: any) => void;
}

export default function AdvancedOptions({ data, onChange }: AdvancedOptionsProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Advanced Configuration</Text>
      <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
        
        {/* Subdomain Inputs */}
        <View style={styles.inputGroup}>
          <View style={styles.labelRow}>
            <Globe size={14} color={Theme.colors.primary} />
            <Text style={styles.label}>Import Subdomains</Text>
          </View>
          <TextInput
            style={styles.textArea}
            multiline
            numberOfLines={3}
            placeholder="One per line..."
            placeholderTextColor={Theme.colors.textMuted}
            value={data.importSubdomainTextArea}
            onChangeText={(text) => onChange('importSubdomainTextArea', text)}
          />
        </View>

        <View style={styles.inputGroup}>
          <View style={styles.labelRow}>
            <ShieldAlert size={14} color={Theme.colors.danger} />
            <Text style={styles.label}>Out of Scope</Text>
          </View>
          <TextInput
            style={styles.textArea}
            multiline
            numberOfLines={3}
            placeholder="Targets to exclude..."
            placeholderTextColor={Theme.colors.textMuted}
            value={data.outOfScopeSubdomainTextarea}
            onChangeText={(text) => onChange('outOfScopeSubdomainTextarea', text)}
          />
        </View>

        {/* Path Inputs */}
        <View style={styles.row}>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <View style={styles.labelRow}>
              <Target size={14} color={Theme.colors.primary} />
              <Text style={styles.label}>Start Path</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="/ (root)"
              placeholderTextColor={Theme.colors.textMuted}
              value={data.startingPointPath}
              onChangeText={(text) => onChange('startingPointPath', text)}
            />
          </View>
        </View>

        {/* Toggles */}
        <View style={styles.toggleRow}>
          <View style={styles.toggleInfo}>
            <Cpu size={18} color={Theme.colors.text} />
            <View style={styles.toggleTextContainer}>
              <Text style={styles.toggleLabel}>Spiderfoot Scan</Text>
              <Text style={styles.toggleDesc}>Deep OSINT integration</Text>
            </View>
          </View>
          <Switch
            value={data.spiderfoot_scan}
            onValueChange={(val) => onChange('spiderfoot_scan', val)}
            trackColor={{ false: Theme.colors.surface, true: Theme.colors.primary }}
            thumbColor="#fff"
          />
        </View>

        <View style={[styles.toggleRow, { borderBottomWidth: 0 }]}>
          <View style={styles.toggleInfo}>
            <Bug size={18} color={Theme.colors.text} />
            <View style={styles.toggleTextContainer}>
              <Text style={styles.toggleLabel}>Custom Dorks</Text>
              <Text style={styles.toggleDesc}>Custom search patterns</Text>
            </View>
          </View>
          <Switch
            value={data.customDorkSwitch}
            onValueChange={(val) => onChange('customDorkSwitch', val)}
            trackColor={{ false: Theme.colors.surface, true: Theme.colors.primary }}
            thumbColor="#fff"
          />
        </View>

        {data.customDorkSwitch && (
          <View style={styles.dorkAreaContainer}>
            <TextInput
              style={[styles.textArea, styles.dorkArea]}
              multiline
              numberOfLines={4}
              placeholder="Enter custom dorks..."
              placeholderTextColor={Theme.colors.textMuted}
              value={data.customDorkTextarea}
              onChangeText={(text) => onChange('customDorkTextarea', text)}
            />
          </View>
        )}

        <View style={styles.spacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scroll: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    color: Theme.colors.text,
    fontFamily: 'Bangers',
    letterSpacing: 1,
    marginBottom: 16,
  },
  inputGroup: {
    backgroundColor: 'transparent',
    marginBottom: 16,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
    backgroundColor: 'transparent',
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: Theme.colors.text,
  },
  input: {
    backgroundColor: Theme.colors.surface,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderRadius: 12,
    padding: 12,
    color: Theme.colors.text,
    fontSize: 14,
  },
  textArea: {
    backgroundColor: Theme.colors.surface,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderRadius: 12,
    padding: 12,
    color: Theme.colors.text,
    fontSize: 14,
    height: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: 'transparent',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
    backgroundColor: 'transparent',
  },
  toggleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'transparent',
  },
  toggleTextContainer: {
    backgroundColor: 'transparent',
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: Theme.colors.text,
  },
  toggleDesc: {
    fontSize: 11,
    color: Theme.colors.textMuted,
    marginTop: 2,
  },
  dorkAreaContainer: {
    marginTop: 12,
    backgroundColor: 'transparent',
  },
  dorkArea: {
    borderColor: Theme.colors.primary + '44',
  },
  spacer: {
    height: 40,
    backgroundColor: 'transparent',
  }
});

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, Map } from 'lucide-react-native';
import { Theme } from '../../../src/constants/Theme';
import AssetGraph from '../../../src/components/Observability/AssetGraph';

export default function AttackSurfaceScreen() {
  const router = useRouter();
  const { id, targetId, domainName } = useLocalSearchParams<{
    id: string;
    targetId?: string;
    domainName?: string;
  }>();

  const scanId = id ? Number(id) : undefined;
  const parsedTargetId = targetId ? Number(targetId) : undefined;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{
        headerShown: false,
      }} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={26} color={Theme.colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Map size={16} color={Theme.colors.primary} />
          <Text style={styles.headerTitle} numberOfLines={1}>
            {domainName ? domainName : `Scan #${id}`}
          </Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.graphContainer}>
        <AssetGraph scanId={scanId} targetId={parsedTargetId} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: Theme.spacing.md,
    paddingBottom: Theme.spacing.md,
    backgroundColor: Theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  backBtn: { padding: 4 },
  headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontFamily: 'Bangers', color: Theme.colors.text, letterSpacing: 1 },
  headerSpacer: { width: 34 },
  graphContainer: { flex: 1 },
});

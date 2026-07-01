import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { Theme } from '../../src/constants/Theme';
import SettingsStubCard from '../../src/components/Settings/SettingsStubCard';

export default function ApiVaultScreen() {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <Stack.Screen options={{
        title: 'API Vault',
        headerStyle: { backgroundColor: Theme.colors.surface },
        headerTintColor: Theme.colors.primary,
        headerTitleStyle: { fontFamily: 'Bangers', fontSize: 22 },
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ChevronLeft size={26} color={Theme.colors.text} />
          </TouchableOpacity>
        ),
      }} />
      <SettingsStubCard title="API Vault" subtitle="Manage external API keys and credentials in the r3ngine web interface." />
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  backBtn: { marginLeft: 4, padding: 4 },
});

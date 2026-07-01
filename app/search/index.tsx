import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  TextInput,
  Text,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Stack } from 'expo-router';
import { Search, X } from 'lucide-react-native';
import { Theme } from '../../src/constants/Theme';
import { universalSearch, getSearchHistory, SearchResults } from '../../src/api/search';
import SearchHistoryChips from '../../src/components/Search/SearchHistoryChips';
import SearchResultsView from '../../src/components/Search/SearchResults';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<SearchResults | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    getSearchHistory().then(setHistory).catch(() => {});
  }, []);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await universalSearch(q.trim());
      setResults(data);
      setHistory((prev) => [q, ...prev.filter((h) => h !== q)].slice(0, 5));
    } catch (e: any) {
      setError('Search failed. Check your connection.');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = (text: string) => {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(text), 500);
  };

  const handleClear = () => {
    setQuery('');
    setResults(null);
    setError(null);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Search', headerStyle: { backgroundColor: Theme.colors.background }, headerTintColor: '#fff' }} />

      <View style={styles.inputRow}>
        <Search size={18} color={Theme.colors.textMuted} style={styles.icon} />
        <TextInput
          style={styles.input}
          value={query}
          onChangeText={handleChange}
          placeholder="Search subdomains, endpoints, vulns…"
          placeholderTextColor={Theme.colors.textMuted}
          autoFocus
          returnKeyType="search"
          onSubmitEditing={() => doSearch(query)}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={handleClear}>
            <X size={18} color={Theme.colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {!results && !loading && (
        <SearchHistoryChips history={history} onSelect={(q) => { setQuery(q); doSearch(q); }} />
      )}

      {loading && <ActivityIndicator color={Theme.colors.primary} style={styles.spinner} />}
      {error && <Text style={styles.error}>{error}</Text>}
      {results && <SearchResultsView results={results} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.surface,
    margin: Theme.spacing.md,
    borderRadius: Theme.borderRadius.md,
    paddingHorizontal: Theme.spacing.sm,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  icon: { marginRight: Theme.spacing.xs },
  input: { flex: 1, color: Theme.colors.text, paddingVertical: Theme.spacing.sm, fontSize: 15 },
  spinner: { marginTop: Theme.spacing.lg },
  error: { color: Theme.colors.error, textAlign: 'center', marginTop: Theme.spacing.md },
});

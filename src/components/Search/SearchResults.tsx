import React from 'react';
import { View, Text, SectionList, TouchableOpacity, StyleSheet } from 'react-native';
import { Globe, Link, AlertTriangle } from 'lucide-react-native';
import { Theme } from '../../constants/Theme';
import { SearchResults as SearchResultsType, SearchSubdomain, SearchEndpoint, SearchVulnerability } from '../../api/search';

const SEVERITY_COLOR: Record<number, string> = {
  0: Theme.colors.vulnerabilities.info,
  1: Theme.colors.vulnerabilities.low,
  2: Theme.colors.vulnerabilities.medium,
  3: Theme.colors.vulnerabilities.high,
  4: Theme.colors.vulnerabilities.critical,
};

type SearchItem = SearchSubdomain | SearchEndpoint | SearchVulnerability;

interface Section {
  title: string;
  data: SearchItem[];
  type: 'subdomain' | 'endpoint' | 'vuln';
}

interface Props {
  results: SearchResultsType;
  onSubdomainPress?: (id: number) => void;
}

export default function SearchResultsView({ results, onSubdomainPress }: Props) {
  const allSections: Section[] = [
    {
      title: `Subdomains (${results.subdomains.length})`,
      data: results.subdomains,
      type: 'subdomain' as const,
    },
    {
      title: `Endpoints (${results.endpoints.length})`,
      data: results.endpoints,
      type: 'endpoint' as const,
    },
    {
      title: `Vulnerabilities (${results.vulnerabilities.length})`,
      data: results.vulnerabilities,
      type: 'vuln' as const,
    },
  ];
  const sections = allSections.filter((s) => s.data.length > 0);

  if (sections.length === 0) {
    return <Text style={styles.empty}>No results found.</Text>;
  }

  return (
    <SectionList<SearchItem, Section>
      sections={sections}
      keyExtractor={(item, i) => `${item.id}-${i}`}
      renderSectionHeader={({ section }) => (
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
        </View>
      )}
      renderItem={({ item, section }) => {
        if (section.type === 'subdomain') {
          const subdomain = item as SearchSubdomain;
          return (
            <TouchableOpacity
              style={styles.row}
              onPress={() => onSubdomainPress?.(subdomain.id)}
            >
              <Globe size={14} color={Theme.colors.primary} />
              <Text style={styles.rowText} numberOfLines={1}>{subdomain.name}</Text>
            </TouchableOpacity>
          );
        }
        if (section.type === 'endpoint') {
          const endpoint = item as SearchEndpoint;
          return (
            <View style={styles.row}>
              <Link size={14} color={Theme.colors.accent} />
              <Text style={styles.rowText} numberOfLines={1}>{endpoint.http_url}</Text>
            </View>
          );
        }
        // vuln
        const vuln = item as SearchVulnerability;
        return (
          <View style={styles.row}>
            <AlertTriangle size={14} color={SEVERITY_COLOR[vuln.severity] ?? Theme.colors.warning} />
            <Text style={styles.rowText} numberOfLines={1}>{vuln.name}</Text>
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  sectionHeader: {
    backgroundColor: Theme.colors.background,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.xs,
  },
  sectionTitle: { color: Theme.colors.textMuted, fontSize: 12, fontWeight: '600', textTransform: 'uppercase' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Theme.colors.border,
    backgroundColor: Theme.colors.surface,
  },
  rowText: { color: Theme.colors.text, fontSize: 14, flex: 1 },
  empty: { color: Theme.colors.textMuted, textAlign: 'center', marginTop: Theme.spacing.xl },
});

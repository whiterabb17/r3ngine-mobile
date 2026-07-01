import apiClient from './client';

export interface SearchSubdomain {
  id: number;
  name: string;
  http_url: string | null;
  page_title: string | null;
}

export interface SearchEndpoint {
  id: number;
  http_url: string;
  page_title: string | null;
}

export interface SearchVulnerability {
  id: number;
  name: string;
  severity: number;
  http_url: string | null;
}

export interface SearchResults {
  subdomains: SearchSubdomain[];
  endpoints: SearchEndpoint[];
  vulnerabilities: SearchVulnerability[];
}

export async function universalSearch(query: string): Promise<SearchResults> {
  const resp = await apiClient.get<{ status: boolean; results: SearchResults }>(
    '/mapi/search/',
    { params: { query } }
  );
  return resp.data.results ?? { subdomains: [], endpoints: [], vulnerabilities: [] };
}

export async function getSearchHistory(): Promise<string[]> {
  const resp = await apiClient.get<{ status: boolean; results: Array<{ query: string }> }>(
    '/mapi/search/history/'
  );
  return (resp.data.results ?? []).map((h) => h.query);
}

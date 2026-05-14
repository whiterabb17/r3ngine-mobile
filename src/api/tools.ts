import apiClient from './client';
import { paths } from '../types/api';
import { format } from 'date-fns';

type WhoisResponse = any;
type ReverseWhoisResponse = any;
type IpToDomainResponse = any;
type CmsDetectorResponse = any;
type WafDetectorResponse = any;
type DomainIpHistoryResponse = any;

export const fetchSubdomainHistory = async (subdomainId: number) => {
  // Falling back to any because schema content is missing
  return apiClient.get<any>(`/mapi/subdomain/history/`, {
    params: { subdomain_id: subdomainId }
  });
};

export const fetchScanMetrics = async (scanId: number) => {
  return apiClient.get<any>(`/mapi/observability/metrics/`, {
    params: { scan_id: scanId }
  });
};

export const fetchWhoisData = async (domainId: number) => {
  // Falling back to any because schema content is missing
  return apiClient.get<any>(`/mapi/whois/`, {
    params: { domain_id: domainId }
  });
};

export const fetchDomainIpHistory = async (domainName: string) => {
  // Using path string directly if schema is missing the key
  return apiClient.get<any>(`/mapi/tools/domain_ip_history/`, {
    params: { domain_name: domainName }
  });
};

export const queryWhois = async (target: string, forceUpdate: boolean = false): Promise<WhoisResponse> => {
  const params = { target, is_reload: forceUpdate ? 'true' : 'false' };
  const response = await apiClient.get<WhoisResponse>('/mapi/tools/whois/', { params });
  return response.data;
};

export const queryReverseWhois = async (lookupKeyword: string): Promise<ReverseWhoisResponse> => {
  const params = { lookup_keyword: lookupKeyword };
  const response = await apiClient.get<ReverseWhoisResponse>('/mapi/tools/reverse/whois/', { params });
  return response.data;
};

export const queryIpToDomain = async (ipAddress: string): Promise<IpToDomainResponse> => {
  const params = { ip_address: ipAddress };
  const response = await apiClient.get<IpToDomainResponse>('/mapi/tools/ip_to_domain/', { params });
  return response.data;
};

export const queryCmsDetector = async (url: string): Promise<CmsDetectorResponse> => {
  const params = { url };
  const response = await apiClient.get<CmsDetectorResponse>('/mapi/tools/cms_detector/', { params });
  return response.data;
};

export const queryWafDetector = async (url: string): Promise<WafDetectorResponse> => {
  const params = { url };
  const response = await apiClient.get<WafDetectorResponse>('/mapi/tools/waf_detector/', { params });
  return response.data;
};

export const queryDomainIpHistory = async (domain: string): Promise<DomainIpHistoryResponse> => {
  const params = { domain };
  const response = await apiClient.get<DomainIpHistoryResponse>('/mapi/tools/domain_ip_history/', { params });
  return response.data;
};

import apiClient from './client';

export const queryWhois = async (target: string, forceUpdate: boolean = false) => {
  const params = { target, is_reload: forceUpdate ? 'true' : 'false' };
  const response = await apiClient.get('api/tools/whois/', { params });
  return response.data;
};

export const queryReverseWhois = async (lookupKeyword: string) => {
  const params = { lookup_keyword: lookupKeyword };
  const response = await apiClient.get('api/tools/reverse/whois/', { params });
  return response.data;
};

export const queryIpToDomain = async (ipAddress: string) => {
  const params = { ip_address: ipAddress };
  const response = await apiClient.get('api/tools/ip_to_domain/', { params });
  return response.data;
};

export const queryCmsDetector = async (url: string) => {
  const params = { url };
  const response = await apiClient.get('api/tools/cms_detector/', { params });
  return response.data;
};

export const queryWafDetector = async (url: string) => {
  const params = { url };
  const response = await apiClient.get('api/tools/waf_detector/', { params });
  return response.data;
};

export const queryDomainIpHistory = async (domain: string) => {
  const params = { domain };
  const response = await apiClient.get('api/tools/domain_ip_history/', { params });
  return response.data;
};

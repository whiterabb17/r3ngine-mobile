import { mock } from '../setup';
import {
  listAPIIntelProfiles,
  getAPIIntelProfile,
  API_INTEL_KEYS,
} from '../../src/api/apiIntel';

const PROFILE_FIXTURE = {
  id: 1,
  scan_history: 5,
  target_domain: 1,
  subdomain: null,
  base_url: 'https://api.example.test/v1',
  api_type: 'rest' as const,
  endpoint_count: 12,
  requires_auth: true,
  auth_scheme: 'Bearer',
  parameters_sample: [],
  graphql_schema_snippet: null,
  raw_endpoints: [{ url: 'https://api.example.test/v1/users', status: 200 }],
};

describe('apiIntel — listAPIIntelProfiles', () => {
  it('GETs /mapi/api-intel/ without params when no scanId', async () => {
    mock.onGet('/mapi/api-intel/').reply(200, []);
    const res = await listAPIIntelProfiles();
    expect(res).toEqual([]);
    expect(mock.history.get[0].params).toBeUndefined();
  });

  it('passes scan_id when provided', async () => {
    mock.onGet('/mapi/api-intel/').reply(200, [PROFILE_FIXTURE]);
    const res = await listAPIIntelProfiles(5);
    expect(res).toHaveLength(1);
    expect(res[0].api_type).toBe('rest');
    expect(mock.history.get[0].params).toEqual({ scan_id: 5 });
  });

  it('normalises paginated response (results wrapper)', async () => {
    mock.onGet('/mapi/api-intel/').reply(200, { count: 1, results: [PROFILE_FIXTURE] });
    const res = await listAPIIntelProfiles();
    expect(Array.isArray(res)).toBe(true);
    expect(res).toHaveLength(1);
  });
});

describe('apiIntel — getAPIIntelProfile', () => {
  it('GETs /mapi/api-intel/<id>/', async () => {
    mock.onGet('/mapi/api-intel/1/').reply(200, PROFILE_FIXTURE);
    const res = await getAPIIntelProfile(1);
    expect(res.id).toBe(1);
    expect(res.requires_auth).toBe(true);
    expect(res.auth_scheme).toBe('Bearer');
    expect(res.raw_endpoints).toHaveLength(1);
  });
});

describe('apiIntel — API_INTEL_KEYS', () => {
  it('list key with no scanId is stable', () => {
    expect(API_INTEL_KEYS.list()).toEqual(['api-intel', 'list', undefined]);
  });

  it('list key with scanId is stable', () => {
    expect(API_INTEL_KEYS.list(5)).toEqual(['api-intel', 'list', 5]);
  });

  it('detail key is stable', () => {
    expect(API_INTEL_KEYS.detail(3)).toEqual(['api-intel', 'detail', 3]);
  });
});

import { mock } from './setup';
import { listIdentityInfra, confirmIdentityProvider, dismissIdentityDiscovery } from '../src/api/identity';

const sample = {
  id: 1, provider: 'okta' as const, match_strength: 'high' as const,
  detection_signals: { matched_urls: [], matched_titles: [], matched_headers: {} },
  first_seen: '2026-06-20',
};

describe('identity API', () => {
  it('lists and normalizes', async () => {
    mock.onGet('/mapi/identity/').reply(200, [sample]);
    expect((await listIdentityInfra()).length).toBe(1);
  });

  it('lists with scan_id', async () => {
    mock.onGet('/mapi/identity/').reply(200, []);
    await listIdentityInfra(7);
    expect(mock.history.get[0].params).toEqual({ scan_id: 7 });
  });

  it('confirm PATCHes', async () => {
    mock.onPatch('/mapi/identity/1/confirm/').reply(200, sample);
    await confirmIdentityProvider(1, true);
    expect(JSON.parse(mock.history.patch[0].data)).toEqual({ confirmed: true });
  });

  it('dismiss PATCHes with reason', async () => {
    mock.onPatch('/mapi/identity/1/dismiss/').reply(200, sample);
    await dismissIdentityDiscovery(1, 'false match');
    expect(JSON.parse(mock.history.patch[0].data)).toEqual({ reason: 'false match' });
  });

  it('dismiss rejects reason > 1000 chars', async () => {
    await expect(dismissIdentityDiscovery(1, 'x'.repeat(1001))).rejects.toThrow(/reason/i);
  });
});

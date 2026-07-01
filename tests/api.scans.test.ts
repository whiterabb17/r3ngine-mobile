import { mock } from './setup';
import { listScheduledScans, listSubScans, getScanEngineConfig } from '../src/api/scans';

describe('scans API', () => {
  it('listScheduledScans calls /mapi/scheduledScans/ with project param', async () => {
    mock.onGet('/mapi/scheduledScans/').reply(200, [{ id: 1, name: 'test', frequency: 'Every 7 days', enabled: true, last_run_at: null }]);
    const result = await listScheduledScans('default');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(1);
    expect(mock.history.get[0].params).toEqual({ project: 'default' });
  });

  it('listSubScans calls /mapi/subscans/ with project param', async () => {
    mock.onGet('/mapi/subscans/').reply(200, { results: [{ id: 2, subdomain_name: 'api.example.com', type: 'port_scan', status: 2 }] });
    const result = await listSubScans('default');
    expect(result[0].subdomain_name).toBe('api.example.com');
    expect(mock.history.get[0].params).toEqual({ project: 'default' });
  });

  it('getScanEngineConfig calls /mapi/scan-config/', async () => {
    mock.onGet('/mapi/scan-config/').reply(200, { engines: [{ id: 1, engine_name: 'Full', tasks: ['subdomain_discovery', 'http_crawl'] }], configurations: [] });
    const result = await getScanEngineConfig();
    expect(result.engines[0].tasks).toContain('subdomain_discovery');
  });
});

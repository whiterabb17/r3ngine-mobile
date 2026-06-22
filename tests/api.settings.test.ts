import { mock } from './setup';
import {
  getWorkers, patchWorker, listTools,
  getReNgineSettings, getReportSettings, getNotificationSettings,
} from '../src/api/settings';

describe('settings API', () => {
  it('getWorkers calls GET /mapi/workers/', async () => {
    mock.onGet('/mapi/workers/').reply(200, [{ id: 1, name: 'worker-1', is_active: true }]);
    const result = await getWorkers();
    expect(mock.history.get[0].url).toBe('/mapi/workers/');
    expect(result[0].name).toBe('worker-1');
  });

  it('patchWorker calls PATCH /mapi/workers/{id}/', async () => {
    mock.onPatch('/mapi/workers/1/').reply(200, { id: 1, is_active: false });
    const result = await patchWorker(1, { is_active: false });
    expect(mock.history.patch[0].url).toBe('/mapi/workers/1/');
    expect(result.is_active).toBe(false);
  });

  it('listTools calls GET /mapi/listTools/', async () => {
    mock.onGet('/mapi/listTools/').reply(200, [{ id: 1, name: 'amass' }]);
    const result = await listTools();
    expect(mock.history.get[0].url).toBe('/mapi/listTools/');
    expect(result[0].name).toBe('amass');
  });

  it('getReNgineSettings calls GET /mapi/rengine/system-settings/', async () => {
    mock.onGet('/mapi/rengine/system-settings/').reply(200, { total: 100, used: 40, free: 60, consumed_percent: 40, enable_scan_queueing: false });
    const result = await getReNgineSettings();
    expect(mock.history.get[0].url).toBe('/mapi/rengine/system-settings/');
    expect(result.consumed_percent).toBe(40);
  });

  it('getReportSettings calls GET /mapi/report-settings/', async () => {
    mock.onGet('/mapi/report-settings/').reply(200, { company_name: 'ACME', enable_llm_report_generation: false });
    const result = await getReportSettings();
    expect(mock.history.get[0].url).toBe('/mapi/report-settings/');
    expect(result.company_name).toBe('ACME');
  });

  it('getNotificationSettings calls GET /mapi/notification-settings/', async () => {
    mock.onGet('/mapi/notification-settings/').reply(200, { send_to_slack: false, send_to_discord: true });
    const result = await getNotificationSettings();
    expect(mock.history.get[0].url).toBe('/mapi/notification-settings/');
    expect(result.send_to_discord).toBe(true);
  });
});

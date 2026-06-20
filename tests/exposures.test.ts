import { mock } from './setup';
import { listExposures, getExposureStats, updateExposureStatus, bulkUpdateExposureStatus } from '../src/api/exposures';

describe('exposures API', () => {
  it('listExposures normalizes paginated response', async () => {
    mock.onGet('/mapi/exposures/').reply(200, {
      results: [{ id: 1, title: 'x', status: 'open', severity: 'high', asset_summary: {}, evidence_data: {}, linked_vulnerability_ids: [], created_at: '2026-06-20' }],
    });
    const res = await listExposures();
    expect(res).toHaveLength(1);
  });

  it('listExposures filters by scanId + status', async () => {
    mock.onGet('/mapi/exposures/').reply(200, []);
    await listExposures(42, 'open');
    expect(mock.history.get[0].params).toEqual({ scan_id: 42, status: 'open' });
  });

  it('getExposureStats returns counts', async () => {
    mock.onGet('/mapi/exposures/stats/').reply(200, {
      total: 10, open: 4, accepted: 2, false_positive: 1, resolved: 3,
      by_severity: { critical: 1, high: 3, medium: 4, low: 2, info: 0 },
    });
    const res = await getExposureStats();
    expect(res.open).toBe(4);
  });

  it('updateExposureStatus PATCHes with note', async () => {
    mock.onPatch('/mapi/exposures/1/status/').reply(200, { id: 1 });
    await updateExposureStatus(1, 'accepted', 'risk taken');
    expect(JSON.parse(mock.history.patch[0].data)).toEqual({ status: 'accepted', note: 'risk taken' });
  });

  it('bulkUpdateExposureStatus POSTs ids[]', async () => {
    mock.onPost('/mapi/exposures/bulk-status/').reply(200, { updated: [1, 2], rejected: [3] });
    const res = await bulkUpdateExposureStatus([1, 2, 3], 'resolved');
    expect(res.rejected).toEqual([3]);
  });

  it('updateExposureStatus rejects note > 1000 chars', async () => {
    await expect(updateExposureStatus(1, 'accepted', 'x'.repeat(1001))).rejects.toThrow(/note/i);
  });
});

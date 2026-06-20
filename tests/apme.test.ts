import { mock } from './setup';
import { getRiskSummary, getImpactAssessment, getAttackTree, regenerateImpactAssessment, markPathDismissed } from '../src/api/apme';

describe('apme API — read', () => {
  it('getRiskSummary GETs /mapi/apme/risk-summary/ with scan_id', async () => {
    mock.onGet('/mapi/apme/risk-summary/').reply(200, {
      score: 72, priority: 'P1', path_count: 4, speculative_count: 1, top_risk_factors: ['exposed-admin'],
    });
    const res = await getRiskSummary(42);
    expect(res.priority).toBe('P1');
    expect(mock.history.get[0].params).toEqual({ scan_id: 42 });
  });

  it('getImpactAssessment GETs by pathId', async () => {
    mock.onGet('/mapi/apme/impact/abc/').reply(200, {
      business_impact: 'data loss', technical_impact: 'rce',
      affected_assets: [], mitre_techniques: [],
    });
    const res = await getImpactAssessment('abc');
    expect(res.business_impact).toBe('data loss');
  });

  it('getAttackTree URL-encodes targetId', async () => {
    mock.onGet(/\/mapi\/apme\/tree\//).reply(200, { paths: [] });
    await getAttackTree('foo bar/baz');
    expect(mock.history.get[0].url).toBe('/mapi/apme/tree/foo%20bar%2Fbaz/');
  });
});

describe('apme mutations', () => {
  it('regenerateImpactAssessment POSTs', async () => {
    mock.onPost('/mapi/apme/impact/regenerate/').reply(202, { queued: true });
    const res = await regenerateImpactAssessment('p1');
    expect(res.queued).toBe(true);
    expect(JSON.parse(mock.history.post[0].data)).toEqual({ path_id: 'p1' });
  });

  it('markPathDismissed PATCHes with reason', async () => {
    mock.onPatch(/\/mapi\/apme\/path\/.*\/dismiss\//).reply(200, { status: 'dismissed' });
    const res = await markPathDismissed('p1', 'false positive');
    expect(res.status).toBe('dismissed');
    expect(JSON.parse(mock.history.patch[0].data)).toEqual({ reason: 'false positive' });
  });
});

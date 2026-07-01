import { mock } from './setup';
import { listCertificates, getCertificateDetail, resyncCertificate, flagCertificateAnomaly } from '../src/api/certificates';

const sample = {
  id: 1, subject_cn: 'a', issuer_cn: 'b', san: [], not_before: '', not_after: '',
  sha256_fingerprint: 'x', sha1_fingerprint: 'y', chain: [], is_self_signed: false, is_expired: false,
};

describe('certificates API', () => {
  it('listCertificates GETs and normalizes', async () => {
    mock.onGet('/mapi/certificates/').reply(200, [sample]);
    expect((await listCertificates()).length).toBe(1);
  });

  it('listCertificates passes scan_id', async () => {
    mock.onGet('/mapi/certificates/').reply(200, []);
    await listCertificates(5);
    expect(mock.history.get[0].params).toEqual({ scan_id: 5 });
  });

  it('getCertificateDetail GETs by id', async () => {
    mock.onGet('/mapi/certificates/1/').reply(200, sample);
    const res = await getCertificateDetail(1);
    expect(res.subject_cn).toBe('a');
  });

  it('resync POSTs', async () => {
    mock.onPost('/mapi/certificates/1/resync/').reply(202, { queued: true });
    expect((await resyncCertificate(1)).queued).toBe(true);
  });

  it('flag PATCHes with body', async () => {
    mock.onPatch('/mapi/certificates/1/flag/').reply(200, sample);
    await flagCertificateAnomaly(1, 'weak-key', 'rsa-1024');
    expect(JSON.parse(mock.history.patch[0].data)).toEqual({ flag: 'weak-key', note: 'rsa-1024' });
  });

  it('flag rejects unknown flag', async () => {
    // @ts-expect-error
    await expect(flagCertificateAnomaly(1, 'bogus')).rejects.toThrow(/flag/i);
  });
});

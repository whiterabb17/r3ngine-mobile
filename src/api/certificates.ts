import apiClient from './client';

export type CertFlag = 'expired-not-revoked' | 'weak-key' | 'suspicious-san' | 'other';

export interface Certificate {
  id: number;
  subject_cn: string;
  issuer_cn: string;
  san: string[];
  not_before: string;
  not_after: string;
  sha256_fingerprint: string;
  sha1_fingerprint: string;
  chain: Array<{ subject: string; issuer: string; depth: number }>;
  scan_id?: number;
  is_self_signed: boolean;
  is_expired: boolean;
}

export const CERTS_KEYS = {
  list: (scanId?: number) => ['certificates', 'list', scanId ?? 'all'] as const,
  detail: (id: number) => ['certificates', 'detail', id] as const,
};

const VALID_FLAGS: CertFlag[] = ['expired-not-revoked', 'weak-key', 'suspicious-san', 'other'];

export async function listCertificates(scanId?: number): Promise<Certificate[]> {
  const res = await apiClient.get<Certificate[] | { results: Certificate[] }>('/mapi/certificates/', {
    params: scanId !== undefined ? { scan_id: scanId } : undefined,
  });
  return Array.isArray(res.data) ? res.data : (res.data.results ?? []);
}

export async function getCertificateDetail(id: number): Promise<Certificate> {
  const res = await apiClient.get<Certificate>(`/mapi/certificates/${id}/`);
  return res.data;
}

export async function resyncCertificate(id: number): Promise<{ queued: boolean }> {
  const res = await apiClient.post<{ queued: boolean }>(`/mapi/certificates/${id}/resync/`);
  return res.data;
}

export async function flagCertificateAnomaly(id: number, flag: CertFlag, note?: string): Promise<Certificate> {
  if (!VALID_FLAGS.includes(flag)) throw new Error(`Invalid flag: ${flag}`);
  if (note !== undefined && note.length > 1000) throw new Error('note exceeds 1000 chars');
  const body: Record<string, unknown> = { flag };
  if (note) body.note = note;
  const res = await apiClient.patch<Certificate>(`/mapi/certificates/${id}/flag/`, body);
  return res.data;
}

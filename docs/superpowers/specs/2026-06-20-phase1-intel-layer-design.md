# Phase 1 — v3.7.0 Intelligence Layer (Design Spec)

**Date:** 2026-06-20
**Mobile baseline:** v1.4.1 (target: v1.5.0)
**Core compatibility:** r3ngine v3.7.0+

## Summary

Bring four v3.7.0 intelligence features to r3ngine-mobile: Exposure Correlation, enhanced APME Attack Paths, Certificate Intelligence, and Identity Infrastructure. Read **and write parity** with web. No graph-tree visualization in this phase.

This spec is Phase 1 of the 5-phase roadmap in [`docs/ROADMAP.md`](../../ROADMAP.md). Each later phase will get its own spec.

## Decisions

| # | Decision | Choice |
|---|---|---|
| 1 | Layout strategy | Hybrid: refresh existing `app/intelligence/` hub **and** add per-scan tabs to `app/scan/[id].tsx`. Same components, two entry points. |
| 2 | APME viewer fidelity | Enhanced vertical list (no native graph tree). Adds RiskSummaryBar, PriorityBadge, ScoreTooltip, SpeculativePathsSection, LEAF detectability chip. |
| 3 | Action surface | Read + **full write parity** with web (status updates, dismiss, resync, flag, confirm, regenerate impact). |

## Navigation

Bottom tab bar unchanged (5 tabs). Two entry surfaces:

**Intel Hub** (`app/intelligence/`):

```
app/intelligence/
├── _layout.tsx
├── index.tsx                NEW — Hub landing (KpiCard grid + recent activity)
├── attack-paths.tsx         existing — enhanced
├── notes.tsx                existing
├── secrets.tsx              existing
├── staging.tsx              existing
├── [pathId].tsx             existing
├── exposures/
│   ├── index.tsx            NEW — ExposureList
│   └── [exposureId].tsx     NEW — ExposureDetail
├── certificates/
│   ├── index.tsx            NEW — CertList
│   └── [certId].tsx         NEW — CertDetail
└── identity/
    ├── index.tsx            NEW — IdentityInfraList
    └── [discoveryId].tsx    NEW — IdentityInfraDetail
```

**Scan Detail** (`app/scan/[id].tsx`) — add four lazy tabs: `ExposuresTab`, enhanced `AttackPathsTab`, `CertIntelTab`, `IdentityInfraTab`. Same React components, mounted with `scan_id` filter pre-applied.

## Component Boundaries

```
src/components/
├── Intelligence/           existing folder — additions
│   ├── RiskSummaryBar.tsx
│   ├── PriorityBadge.tsx
│   ├── ScoreTooltip.tsx
│   └── SpeculativePathsSection.tsx
├── Exposures/              NEW
│   ├── ExposureCard.tsx
│   ├── ExposureStatusChip.tsx
│   ├── ExposureStatsBar.tsx
│   ├── ExposureEvidenceList.tsx
│   ├── ExposureLinkedVulns.tsx
│   └── ExposureFilters.tsx
├── Certificates/           NEW
│   ├── CertCard.tsx
│   ├── CertChainViewer.tsx
│   ├── SanList.tsx
│   └── FingerprintRow.tsx
└── Identity/               NEW
    ├── IdentityInfraCard.tsx
    ├── IdentityEvidence.tsx
    └── IdentityProviderBadge.tsx
```

Rules:
- All cards consume `Theme` tokens from `src/constants/Theme.ts`. No hardcoded hex.
- Glassmorphic card pattern matches existing `AttackPathCard`.
- `KpiCard` (existing) reused for hub landing counts.
- Every new component file ≤ ~150 LOC.

## API Layer

Four new modules under `src/api/`, all following `apiClient` + JWT interceptor pattern:

```
src/api/
├── exposures.ts        NEW
├── certificates.ts     NEW
├── identity.ts         NEW
└── apme.ts             NEW (extracts existing attack-path calls + new endpoints)
```

### Endpoints

| Module | Function | HTTP | Path |
|---|---|---|---|
| `exposures.ts` | `listExposures(scanId?, status?)` | GET | `/mapi/exposures/` |
| | `getExposureDetail(id)` | GET | `/mapi/exposures/{id}/` |
| | `getExposureStats(scanId?)` | GET | `/mapi/exposures/stats/` |
| | `updateExposureStatus(id, status, note?)` | PATCH | `/mapi/exposures/{id}/status/` |
| | `bulkUpdateExposureStatus(ids[], status)` | POST | `/mapi/exposures/bulk-status/` |
| `apme.ts` | `getAttackTree(targetId)` | GET | `/mapi/apme/tree/{targetId}/` (URL-encoded) |
| | `getRiskSummary(scanId)` | GET | `/mapi/apme/risk-summary/` |
| | `getImpactAssessment(pathId)` | GET | `/mapi/apme/impact/{pathId}/` |
| | `recalculateAttackPaths(scanId)` | POST | `/mapi/apme/recalculate/` (existing) |
| | `explainPath(pathId)` | POST | `/mapi/apme/explain/` (existing) |
| | `regenerateImpactAssessment(pathId)` | POST | `/mapi/apme/impact/regenerate/` |
| | `markPathDismissed(pathId, reason?)` | PATCH | `/mapi/apme/path/{pathId}/dismiss/` |
| `certificates.ts` | `listCertificates(scanId?)` | GET | `/mapi/certificates/` |
| | `getCertificateDetail(id)` | GET | `/mapi/certificates/{id}/` |
| | `resyncCertificate(id)` | POST | `/mapi/certificates/{id}/resync/` |
| | `flagCertificateAnomaly(id, flag, note?)` | PATCH | `/mapi/certificates/{id}/flag/` |
| `identity.ts` | `listIdentityInfra(scanId?)` | GET | `/mapi/identity/` |
| | `getIdentityInfraDetail(id)` | GET | `/mapi/identity/{id}/` |
| | `confirmIdentityProvider(id, confirmed)` | PATCH | `/mapi/identity/{id}/confirm/` |
| | `dismissIdentityDiscovery(id, reason?)` | PATCH | `/mapi/identity/{id}/dismiss/` |

Conventions:
- Typed request/response interfaces declared at top of each module.
- Pagination normalized as `Array<T> | { results: T[] }` (matches existing `listPlugins`).
- All requests via `apiClient` — no raw `fetch`.
- `openapi.json` regeneration deferred; types declared inline this phase.
- Invalidation keys exported as module-level constants (e.g. `EXPOSURES_KEYS.list(scanId)`) so queries and mutations stay in sync.

### Backend contract verification (per slice)

Before writing UI for a slice: curl every endpoint listed for that module against a running backend. If the `/mapi/` shim doesn't exist, open a companion task in the main r3ngine repo to add it. Mobile UI work blocks on shim availability.

## Data Shapes

### Exposures
```ts
interface Exposure {
  id: number;
  title: string;
  status: 'open' | 'accepted' | 'false_positive' | 'resolved';
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  asset_summary: { hostname?: string; ip?: string; port?: number; service?: string };
  evidence_data: Record<string, unknown>;
  evidence_timestamps?: { first_seen: string; last_seen: string };
  linked_vulnerability_ids: number[];
  scan_id?: number;
  created_at: string;
}
interface ExposureStats {
  total: number; open: number; accepted: number; false_positive: number; resolved: number;
  by_severity: Record<Exposure['severity'], number>;
}
```

### APME (new pieces only)
```ts
interface RiskSummary {
  score: number;                 // 0–100
  priority: 'P0' | 'P1' | 'P2' | 'P3';
  path_count: number;
  speculative_count: number;
  top_risk_factors: string[];
}
interface AttackPathExtended extends AttackPath {
  priority: RiskSummary['priority'];
  is_speculative: boolean;
  score_breakdown?: { exploitability: number; impact: number; confidence: number };
  leaf_detectability?: 'low' | 'medium' | 'high' | null;
}
interface ImpactAssessment {
  business_impact: string;
  technical_impact: string;
  affected_assets: { id: number; name: string }[];
  mitre_techniques: { id: string; name: string; tactic: string }[];
}
```

### Certificates
```ts
interface Certificate {
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
```

### Identity Infrastructure
```ts
interface IdentityInfraDiscovery {
  id: number;
  provider: 'okta' | 'azure_ad' | 'auth0' | 'ping' | 'onelogin' | 'jumpcloud' | 'other';
  match_strength: 'high' | 'medium' | 'low';
  detection_signals: {
    matched_urls: string[];
    matched_titles: string[];
    matched_headers: Record<string, string>;
  };
  target_id?: number;
  scan_id?: number;
  first_seen: string;
  confirmed?: boolean;
  dismissed?: boolean;
}
```

**Discriminated-union policy** — all status/severity/priority/provider fields are string literals. Unknown values render as a neutral `?` chip; never crash the list.

## Per-screen behavior

### Intel Hub landing (`app/intelligence/index.tsx`)
- 2×2 `KpiCard` grid: Exposures / Attack Paths / Certificates / Identity (count + dominant severity dot).
- Below: "Recent Activity" — last 10 intel items across all 4 areas, sorted by `created_at`. Pull-to-refresh.
- Implementation: parallel `useQuery` per stats endpoint (`getExposureStats`, `getRiskSummary`, `listCertificates({page_size:5})`, `listIdentityInfra({page_size:5})`) for counts; per-card skeleton on load.
- "Recent Activity" feed: client-side merge of the latest 5 items from each of the four lists, sorted by `created_at` desc, sliced to 10. No new backend endpoint required.

### Exposures list (`app/intelligence/exposures/index.tsx`)
- Top: `ExposureStatsBar` (5 status counts + severity breakdown).
- `ExposureFilters` — status chip row + free-text search.
- `FlatList` of `ExposureCard` with `getItemLayout`.
- Long-press → multi-select mode → bottom action bar (`Mark Accepted` / `Mark FP` / `Mark Resolved` / `Reopen`) → `bulkUpdateExposureStatus`.
- Tap → exposure detail (modal stack).

### Exposure detail (`app/intelligence/exposures/[exposureId].tsx`)
- Header: title, severity chip, status chip, asset summary line.
- `ExposureEvidenceList` (monospaced for raw strings).
- `ExposureLinkedVulns` — vuln pills tap into existing vulnerability detail modal.
- Bottom action sheet: status mutation actions. Optional 1000-char-capped note for destructive transitions.
- Reversible actions: optimistic update + 5s undo snackbar. Destructive: modal confirm.

### Attack Paths (enhanced) (`app/intelligence/attack-paths.tsx`)
- Top: `RiskSummaryBar` (score + priority + path count + speculative count).
- `AttackPathCard` list — each card header gets `PriorityBadge`.
- Tap-and-hold on score → `ScoreTooltip` reveals breakdown.
- Per-card overflow menu (⋮): `Regenerate Impact`, `Dismiss Path`.
  - `Regenerate Impact` → POST + non-blocking toast.
  - `Dismiss Path` → optimistic removal + undo snackbar.
- Below main list: `SpeculativePathsSection` (collapsed by default).
- `AttackPathStep` extended: LEAF detectability chip.
- Existing "Explain This" + APME recalc actions preserved.

### Certificates list (`app/intelligence/certificates/index.tsx`)
- Filter chips: All / Expired / Self-signed / Expiring (<30d).
- `CertCard`: subject CN bold, issuer dim, expiry color (red expired / amber <30d).

### Certificate detail (`app/intelligence/certificates/[certId].tsx`)
- `CertChainViewer` (vertical, depth-indented).
- `SanList` collapsible.
- `FingerprintRow` ×2 with `expo-clipboard` tap-to-copy.
- Header actions: `Resync` (icon button, spinner, client-rate-limited 1 in-flight), `Flag Anomaly` (chip selector: `expired-not-revoked` / `weak-key` / `suspicious-san` / `other` + optional note).

### Identity list (`app/intelligence/identity/index.tsx`)
- Grouped by `provider` with section headers.
- `IdentityInfraCard`: provider badge + match strength chip + asset count.

### Identity detail (`app/intelligence/identity/[discoveryId].tsx`)
- `IdentityProviderBadge` header.
- `IdentityEvidence` — 3 collapsible bands: matched URLs, titles, headers. Long URLs ellipsized with tap-to-expand.
- Primary actions: `Confirm Provider` (✓), `Dismiss as False Match` (✗) with optional reason. Confirmed/dismissed state shown distinctly in list view.

### Scan-detail tabs
- Same components, `scan_id` pre-applied.
- Lazy-render on tab focus (matches existing tab pattern).

### Live updates
- Read-only refresh: pull-to-refresh on all lists + existing 5s silent auto-poll while `scan.status === 1`. No new WebSocket channels.

## State, theme, error handling

**State**
- TanStack Query for all server state. One key per endpoint. `staleTime: 30s`.
- No new Zustand stores (existing auth/settings/project stores cover everything).
- Filter UI state local to screen via `useState`.

**Mutations**
- `useMutation` per action; `onMutate` optimistic update via `queryClient.setQueryData`; `onError` rollback; `onSettled` invalidate.
- Shared `src/hooks/useUndoableMutation.ts`: 5s undo snackbar window, cancellable, cleanup on unmount.
- Bulk mutations: partial-success response flips rejected rows back with per-row error chip.

**Theme**
- All colors via `src/constants/Theme.ts` tokens.
- Add priority palette: `Theme.colors.priority.{p0..p3}`.
- Bangers for titles; SpaceMono for fingerprints/evidence/JSON.
- No hardcoded hex in new component folders (review gate: `grep -rE "#[0-9a-fA-F]{3,6}"` returns empty).

**Error & empty states**
- Every list: skeleton (3 placeholders) / empty (themed + retry) / error (themed + retry; raw error never rendered per security Rule 8.1).
- Per-card render wrapped so a malformed item renders as neutral placeholder, not a crash.
- 401 handled by `apiClient` interceptor — components never see it.

**Performance**
- `FlatList` everywhere; `getItemLayout` for stable-height rows.
- Tab content lazy on first focus.
- `useMemo` for derived chip counts in `ExposureStatsBar`.

**Security**
- Logs use `%s` formatting; Authorization already masked in `client.ts`.
- All rendered strings via `<Text>` (RN auto-escapes).
- URLs from evidence/SANs sanitized before `Linking.openURL`: `http`/`https` only.
- Clipboard copies (fingerprints) never logged.
- Mutation bodies validated client-side: status enum check, note ≤ 1000 chars.
- Optimistic updates cancelled in `useEffect` cleanup.
- `Resync` rate-limited client-side: 1 in-flight per cert.

## Testing

```
tests/
├── exposures/
│   ├── ExposureCard.test.tsx
│   ├── ExposureStatsBar.test.tsx
│   └── ExposuresList.integration.test.tsx
├── apme/
│   ├── PriorityBadge.test.tsx
│   ├── RiskSummaryBar.test.tsx
│   └── AttackPathsList.integration.test.tsx
├── certificates/
│   ├── CertChainViewer.test.tsx
│   └── CertificatesList.integration.test.tsx
├── identity/
│   ├── IdentityInfraCard.test.tsx
│   └── IdentityList.integration.test.tsx
└── hooks/
    └── useUndoableMutation.test.ts
```

Per integration test file:
- Happy-path mutation (optimistic apply → API resolves → cache reflects final).
- Rollback (optimistic apply → API rejects → cache reverts → error chip visible).

Plus one bulk-mutation partial-failure test in `ExposuresList.integration.test.tsx`.

`useUndoableMutation` covers: fire-after-timeout, cancel-before-timeout, unmount-mid-window.

API calls mocked via `jest.mock('../src/api/<module>')`. No real HTTP/WebSocket.

## Quality gates per implementation step

- `npx tsc --noEmit` clean.
- New tests green.
- Hex audit on new component folders returns empty.
- Final commit of each slice: `npx expo prebuild --no-install && cd android && ./gradlew assembleDebug` smoke build.

## Rollout

Slice order (within Phase 1):

1. **APME enhancement** — building blocks (`PriorityBadge`, `RiskSummaryBar`, `ScoreTooltip`, `SpeculativePathsSection`, LEAF detectability) + mutation actions. Goes first because the priority/score primitives are reused by the next three slices.
2. **Exposures** — full list + detail + status mutations + bulk actions.
3. **Certificates** — list + detail + resync + flag.
4. **Identity Infrastructure** — list + detail + confirm/dismiss.

Each slice independently shippable, separate commits to `r3ngine-mobile` repo (mobile is a separate repo from main `r3ngine`).

After all four slices land:
- Bump mobile to **v1.5.0**.
- Update [CHANGELOG.md](../../../CHANGELOG.md) with four feature blocks.
- Update [README.md](../../../README.md) compatibility badge to `core v3.7.0+`.
- Mark Phase 1 complete in [ROADMAP.md](../../ROADMAP.md).

## Out of scope (Phase 1)

- Native graph-tree visualization for APME — possible Phase 1.5.
- WebSocket live-update channel for intel.
- Project switcher (deferred to Phase 3).
- Multi-target aggregate views beyond the Hub landing counts.
- `openapi.json` regeneration (deferred; inline types this phase).

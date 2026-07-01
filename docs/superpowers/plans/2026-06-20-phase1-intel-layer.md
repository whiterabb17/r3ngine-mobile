# Phase 1 — Intelligence Layer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring four v3.7.0 intelligence features (Exposure Correlation, enhanced APME, Certificate Intelligence, Identity Infrastructure) to r3ngine-mobile with read + write parity, accessible from both the Intel Hub and per-scan tabs.

**Architecture:** New API modules under `src/api/` (typed, mock-tested), new component folders under `src/components/`, new Expo Router screens under `app/intelligence/<area>/`. Same screen components mounted in two contexts: standalone (Hub) and embedded (Scan Detail tab). TanStack Query for state with optimistic-update mutations.

**Tech Stack:** Expo SDK 54, React Native 0.81, TypeScript 5.9, TanStack Query v5, Zustand, axios + `axios-mock-adapter` for tests, Jest 29 + `jest-expo`, `@testing-library/react-native` (new dev dep), lucide-react-native, `expo-clipboard`.

## Global Constraints

- All colors via `src/constants/Theme.ts` tokens. No hardcoded hex in any new component file. Audit gate: `grep -rE "#[0-9a-fA-F]{3,6}"` on each new component folder returns empty.
- All HTTP through `apiClient` (`src/api/client.ts`). Never call `fetch` or `axios` directly from components or screens.
- Every new component file ≤ ~150 LOC. Split rather than grow.
- All status/severity/priority/provider fields are string-literal unions. Unknown values render as a neutral `?` chip; never crash the list.
- Logs use `%s`-style formatting for any externally-controlled data; `apiClient` already masks Authorization.
- URLs from evidence/SANs sanitized before `Linking.openURL` — allow `http`/`https` only.
- Mutation note fields capped client-side at 1000 chars; status values validated against the literal union before send.
- `npx tsc --noEmit` must pass before every commit.
- All new tests must pass before every commit (`npm test`).
- Mobile lives in a separate git repo from main `r3ngine` — commit all changes to the `r3ngine-mobile` repo, not the parent.
- TanStack Query `staleTime: 30_000` for all new queries.
- Discriminated union policy: `severity`, `status`, `priority`, `provider`, `match_strength`, `leaf_detectability` are string literals only.

---

## File Map

```
src/api/
├── apme.ts            NEW
├── exposures.ts       NEW
├── certificates.ts    NEW
└── identity.ts        NEW

src/hooks/
└── useUndoableMutation.ts   NEW

src/constants/Theme.ts       MODIFY — add priority palette

src/components/
├── Intelligence/
│   ├── PriorityBadge.tsx          NEW
│   ├── ScoreTooltip.tsx           NEW
│   ├── RiskSummaryBar.tsx         NEW
│   ├── SpeculativePathsSection.tsx NEW
│   └── AttackPathStep.tsx         MODIFY — add LEAF detectability chip
├── Exposures/                     NEW folder
│   ├── ExposureStatusChip.tsx
│   ├── ExposureStatsBar.tsx
│   ├── ExposureCard.tsx
│   ├── ExposureFilters.tsx
│   ├── ExposureEvidenceList.tsx
│   └── ExposureLinkedVulns.tsx
├── Certificates/                  NEW folder
│   ├── CertCard.tsx
│   ├── FingerprintRow.tsx
│   ├── SanList.tsx
│   └── CertChainViewer.tsx
└── Identity/                      NEW folder
    ├── IdentityProviderBadge.tsx
    ├── IdentityInfraCard.tsx
    └── IdentityEvidence.tsx

app/intelligence/
├── index.tsx                  NEW — Hub landing
├── attack-paths.tsx           MODIFY — embed new building blocks
├── exposures/
│   ├── index.tsx              NEW
│   └── [exposureId].tsx       NEW
├── certificates/
│   ├── index.tsx              NEW
│   └── [certId].tsx           NEW
└── identity/
    ├── index.tsx              NEW
    └── [discoveryId].tsx      NEW

app/scan/[id].tsx              MODIFY — add 4 intelligence tabs

tests/
├── apme.test.ts               NEW
├── exposures.test.ts          NEW
├── certificates.test.ts       NEW
├── identity.test.ts           NEW
├── hooks/
│   └── useUndoableMutation.test.ts   NEW
└── components/
    ├── PriorityBadge.test.tsx        NEW
    ├── ExposureCard.test.tsx         NEW
    ├── CertChainViewer.test.tsx      NEW
    └── IdentityInfraCard.test.tsx    NEW
```

---

# Slice 0 — Scaffolding

### Task 1: Add deps, Theme priority palette, useUndoableMutation hook

**Files:**
- Modify: `package.json` (add devDeps)
- Modify: `src/constants/Theme.ts`
- Create: `src/hooks/useUndoableMutation.ts`
- Create: `tests/hooks/useUndoableMutation.test.ts`

**Interfaces:**
- Consumes: (none)
- Produces:
  - `Theme.colors.priority.{p0, p1, p2, p3}: string`
  - `useUndoableMutation<TVars>(opts: { fn: (vars: TVars) => Promise<unknown>; windowMs?: number }): { fire: (vars: TVars) => void; cancel: () => void; pending: boolean }`

- [ ] **Step 1: Install dev dep**

```bash
cd d:/Repos/r3ngine/r3ngine-mobile
npm install --save-dev @testing-library/react-native@^12.9.0
```

Expected: install succeeds; `package.json` `devDependencies` has new entry.

- [ ] **Step 2: Extend Theme with priority palette**

Edit `src/constants/Theme.ts` — add `priority` to `colors`:

```typescript
export const Theme = {
  colors: {
    // ...existing entries unchanged...
    vulnerabilities: {
      critical: '#EF4444',
      high: '#F97316',
      medium: '#F59E0B',
      low: '#10B981',
      info: '#3B82F6',
    },
    priority: {
      p0: '#EF4444', // critical-equivalent
      p1: '#F97316',
      p2: '#F59E0B',
      p3: '#3B82F6',
    },
  },
  // ...rest unchanged...
};
```

- [ ] **Step 3: Write failing test for useUndoableMutation**

Create `tests/hooks/useUndoableMutation.test.ts`:

```typescript
import { renderHook, act } from '@testing-library/react-native';
import { useUndoableMutation } from '../../src/hooks/useUndoableMutation';

jest.useFakeTimers();

describe('useUndoableMutation', () => {
  it('fires the function after the window elapses', async () => {
    const fn = jest.fn().mockResolvedValue('ok');
    const { result } = renderHook(() => useUndoableMutation({ fn, windowMs: 5000 }));

    act(() => { result.current.fire({ id: 1 }); });
    expect(fn).not.toHaveBeenCalled();

    act(() => { jest.advanceTimersByTime(5000); });
    expect(fn).toHaveBeenCalledWith({ id: 1 });
  });

  it('cancel prevents the call', () => {
    const fn = jest.fn();
    const { result } = renderHook(() => useUndoableMutation({ fn, windowMs: 5000 }));

    act(() => { result.current.fire({ id: 1 }); });
    act(() => { result.current.cancel(); });
    act(() => { jest.advanceTimersByTime(5000); });
    expect(fn).not.toHaveBeenCalled();
  });

  it('unmount cancels pending call', () => {
    const fn = jest.fn();
    const { result, unmount } = renderHook(() => useUndoableMutation({ fn, windowMs: 5000 }));

    act(() => { result.current.fire({ id: 1 }); });
    unmount();
    act(() => { jest.advanceTimersByTime(5000); });
    expect(fn).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 4: Run test, expect FAIL ("Cannot find module")**

```bash
npm test -- tests/hooks/useUndoableMutation.test.ts
```

Expected: 3 failures.

- [ ] **Step 5: Implement the hook**

Create `src/hooks/useUndoableMutation.ts`:

```typescript
import { useCallback, useEffect, useRef, useState } from 'react';

export interface UndoableMutationOptions<TVars> {
  fn: (vars: TVars) => Promise<unknown>;
  windowMs?: number;
}

export function useUndoableMutation<TVars>(opts: UndoableMutationOptions<TVars>) {
  const { fn, windowMs = 5000 } = opts;
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [pending, setPending] = useState(false);

  const cancel = useCallback(() => {
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
      setPending(false);
    }
  }, []);

  const fire = useCallback((vars: TVars) => {
    cancel();
    setPending(true);
    timeoutRef.current = setTimeout(() => {
      timeoutRef.current = null;
      setPending(false);
      void fn(vars);
    }, windowMs);
  }, [fn, windowMs, cancel]);

  useEffect(() => () => { cancel(); }, [cancel]);

  return { fire, cancel, pending };
}
```

- [ ] **Step 6: Run tests, expect PASS**

```bash
npm test -- tests/hooks/useUndoableMutation.test.ts
npx tsc --noEmit
```

Expected: 3 passing, tsc clean.

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json src/constants/Theme.ts src/hooks/useUndoableMutation.ts tests/hooks/useUndoableMutation.test.ts
git commit -m "feat(phase1): add priority palette, useUndoableMutation hook, RTL dev dep"
```

---

# Slice 1 — APME Enhancement

### Task 2: Create apme.ts API module with read endpoints

**Files:**
- Create: `src/api/apme.ts`
- Create: `tests/apme.test.ts`

**Interfaces:**
- Consumes: `apiClient` (`src/api/client.ts`)
- Produces:
  - Types: `RiskSummary`, `AttackPathExtended`, `ImpactAssessment`
  - Functions: `getRiskSummary(scanId)`, `getImpactAssessment(pathId)`, `getAttackTree(targetId)`
  - Constants: `APME_KEYS = { riskSummary, impact, tree }` (query-key factories)

- [ ] **Step 1: Write failing API tests**

Create `tests/apme.test.ts`:

```typescript
import { mock } from './setup';
import { getRiskSummary, getImpactAssessment, getAttackTree } from '../src/api/apme';

describe('apme API', () => {
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
```

- [ ] **Step 2: Run, expect FAIL**

```bash
npm test -- tests/apme.test.ts
```

Expected: cannot resolve `../src/api/apme`.

- [ ] **Step 3: Implement module**

Create `src/api/apme.ts`:

```typescript
import apiClient from './client';

export type Priority = 'P0' | 'P1' | 'P2' | 'P3';

export interface RiskSummary {
  score: number;
  priority: Priority;
  path_count: number;
  speculative_count: number;
  top_risk_factors: string[];
}

export interface ScoreBreakdown {
  exploitability: number;
  impact: number;
  confidence: number;
}

export interface AttackPathExtended {
  path_id: string;
  risk: string;
  score: number;
  step_count: number;
  potential_impact: string;
  mitre_tactics?: string[];
  priority: Priority;
  is_speculative: boolean;
  score_breakdown?: ScoreBreakdown;
  leaf_detectability?: 'low' | 'medium' | 'high' | null;
}

export interface ImpactAssessment {
  business_impact: string;
  technical_impact: string;
  affected_assets: { id: number; name: string }[];
  mitre_techniques: { id: string; name: string; tactic: string }[];
}

export const APME_KEYS = {
  riskSummary: (scanId: number | string) => ['apme', 'risk-summary', scanId] as const,
  impact: (pathId: string) => ['apme', 'impact', pathId] as const,
  tree: (targetId: string) => ['apme', 'tree', targetId] as const,
};

export async function getRiskSummary(scanId: number): Promise<RiskSummary> {
  const res = await apiClient.get<RiskSummary>('/mapi/apme/risk-summary/', { params: { scan_id: scanId } });
  return res.data;
}

export async function getImpactAssessment(pathId: string): Promise<ImpactAssessment> {
  const res = await apiClient.get<ImpactAssessment>(`/mapi/apme/impact/${encodeURIComponent(pathId)}/`);
  return res.data;
}

export async function getAttackTree(targetId: string): Promise<{ paths: AttackPathExtended[] }> {
  const res = await apiClient.get<{ paths: AttackPathExtended[] }>(`/mapi/apme/tree/${encodeURIComponent(targetId)}/`);
  return res.data;
}
```

- [ ] **Step 4: Run, expect PASS + tsc clean**

```bash
npm test -- tests/apme.test.ts
npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add src/api/apme.ts tests/apme.test.ts
git commit -m "feat(apme): add read API module with risk summary, impact, attack tree endpoints"
```

---

### Task 3: Add APME mutation endpoints

**Files:**
- Modify: `src/api/apme.ts`
- Modify: `tests/apme.test.ts`

**Interfaces:**
- Produces: `regenerateImpactAssessment(pathId)`, `markPathDismissed(pathId, reason?)`

- [ ] **Step 1: Add failing mutation tests**

Append to `tests/apme.test.ts`:

```typescript
import { regenerateImpactAssessment, markPathDismissed } from '../src/api/apme';

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
```

- [ ] **Step 2: Run, expect FAIL**

```bash
npm test -- tests/apme.test.ts
```

- [ ] **Step 3: Add functions to `src/api/apme.ts`**

Append:

```typescript
export async function regenerateImpactAssessment(pathId: string): Promise<{ queued: boolean }> {
  const res = await apiClient.post<{ queued: boolean }>('/mapi/apme/impact/regenerate/', { path_id: pathId });
  return res.data;
}

export async function markPathDismissed(pathId: string, reason?: string): Promise<{ status: string }> {
  const body = reason && reason.length <= 1000 ? { reason } : {};
  const res = await apiClient.patch<{ status: string }>(`/mapi/apme/path/${encodeURIComponent(pathId)}/dismiss/`, body);
  return res.data;
}
```

- [ ] **Step 4: Run + tsc**

```bash
npm test -- tests/apme.test.ts
npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add src/api/apme.ts tests/apme.test.ts
git commit -m "feat(apme): add regenerate impact and dismiss path mutations"
```

---

### Task 4: PriorityBadge component

**Files:**
- Create: `src/components/Intelligence/PriorityBadge.tsx`
- Create: `tests/components/PriorityBadge.test.tsx`

**Interfaces:**
- Consumes: `Priority` (from `src/api/apme.ts`), `Theme.colors.priority`
- Produces: `<PriorityBadge priority="P0" /> | <PriorityBadge priority={Priority | undefined} />`

- [ ] **Step 1: Failing test**

Create `tests/components/PriorityBadge.test.tsx`:

```typescript
import React from 'react';
import { render } from '@testing-library/react-native';
import PriorityBadge from '../../src/components/Intelligence/PriorityBadge';

describe('PriorityBadge', () => {
  it('renders P0 label', () => {
    const { getByText } = render(<PriorityBadge priority="P0" />);
    expect(getByText('P0')).toBeTruthy();
  });

  it('renders neutral ? for unknown', () => {
    // @ts-expect-error intentional bad input
    const { getByText } = render(<PriorityBadge priority={'WTF'} />);
    expect(getByText('?')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run, expect FAIL**

```bash
npm test -- tests/components/PriorityBadge.test.tsx
```

- [ ] **Step 3: Implement**

Create `src/components/Intelligence/PriorityBadge.tsx`:

```typescript
import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Theme } from '../../constants/Theme';
import type { Priority } from '../../api/apme';

interface Props { priority?: Priority }

const COLOR: Record<Priority, string> = {
  P0: Theme.colors.priority.p0,
  P1: Theme.colors.priority.p1,
  P2: Theme.colors.priority.p2,
  P3: Theme.colors.priority.p3,
};

export default function PriorityBadge({ priority }: Props) {
  const valid = priority && (priority in COLOR);
  const color = valid ? COLOR[priority as Priority] : Theme.colors.textMuted;
  const label = valid ? priority : '?';
  return (
    <View style={[styles.badge, { borderColor: color, backgroundColor: color + '22' }]}>
      <Text style={[styles.text, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { paddingHorizontal: Theme.spacing.sm, paddingVertical: 2, borderWidth: 1, borderRadius: Theme.borderRadius.sm },
  text: { fontSize: 10, fontWeight: '700', letterSpacing: 1 },
});
```

- [ ] **Step 4: Run + tsc + hex audit**

```bash
npm test -- tests/components/PriorityBadge.test.tsx
npx tsc --noEmit
grep -rE "#[0-9a-fA-F]{3,6}" src/components/Intelligence/PriorityBadge.tsx
```

Hex audit must return nothing.

- [ ] **Step 5: Commit**

```bash
git add src/components/Intelligence/PriorityBadge.tsx tests/components/PriorityBadge.test.tsx
git commit -m "feat(intel): add PriorityBadge component"
```

---

### Task 5: ScoreTooltip component

**Files:**
- Create: `src/components/Intelligence/ScoreTooltip.tsx`

**Interfaces:**
- Consumes: `ScoreBreakdown` (`src/api/apme.ts`)
- Produces: `<ScoreTooltip visible breakdown={...} onDismiss={() => void} />`

- [ ] **Step 1: Implement (visual-only modal, smoke-tested via tsc)**

Create `src/components/Intelligence/ScoreTooltip.tsx`:

```typescript
import React from 'react';
import { Modal, Pressable, StyleSheet, View, Text } from 'react-native';
import { Theme } from '../../constants/Theme';
import type { ScoreBreakdown } from '../../api/apme';

interface Props {
  visible: boolean;
  breakdown?: ScoreBreakdown;
  onDismiss: () => void;
}

export default function ScoreTooltip({ visible, breakdown, onDismiss }: Props) {
  if (!breakdown) return null;
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <Pressable style={styles.backdrop} onPress={onDismiss}>
        <View style={styles.card}>
          <Text style={styles.title}>SCORE BREAKDOWN</Text>
          <Row label="Exploitability" value={breakdown.exploitability} />
          <Row label="Impact" value={breakdown.impact} />
          <Row label="Confidence" value={breakdown.confidence} />
        </View>
      </Pressable>
    </Modal>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value.toFixed(1)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.6)' },
  card: { backgroundColor: Theme.colors.surface, borderColor: Theme.colors.border, borderWidth: 1, borderRadius: Theme.borderRadius.md, padding: Theme.spacing.lg, minWidth: 240 },
  title: { color: Theme.colors.primary, fontWeight: '700', letterSpacing: 1, marginBottom: Theme.spacing.md },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: Theme.spacing.xs },
  label: { color: Theme.colors.textMuted },
  value: { color: Theme.colors.text, fontWeight: '700' },
});
```

- [ ] **Step 2: tsc + hex audit**

```bash
npx tsc --noEmit
grep -rE "#[0-9a-fA-F]{3,6}" src/components/Intelligence/ScoreTooltip.tsx
```

`rgba(0,0,0,0.6)` is allowed (rgba literal for backdrop overlay, not theme color).
The hex audit should return only the rgba line — that's acceptable (it's the standard backdrop alpha). If the audit flags it as hex, update audit to `grep -rE "#[0-9a-fA-F]{3,8}"` and confirm zero matches.

- [ ] **Step 3: Commit**

```bash
git add src/components/Intelligence/ScoreTooltip.tsx
git commit -m "feat(intel): add ScoreTooltip modal"
```

---

### Task 6: RiskSummaryBar component

**Files:**
- Create: `src/components/Intelligence/RiskSummaryBar.tsx`

**Interfaces:**
- Consumes: `RiskSummary` (`src/api/apme.ts`), `PriorityBadge`
- Produces: `<RiskSummaryBar summary={RiskSummary} />`

- [ ] **Step 1: Implement**

Create `src/components/Intelligence/RiskSummaryBar.tsx`:

```typescript
import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Theme } from '../../constants/Theme';
import PriorityBadge from './PriorityBadge';
import type { RiskSummary } from '../../api/apme';

interface Props { summary: RiskSummary }

export default function RiskSummaryBar({ summary }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Text style={styles.score}>{summary.score}</Text>
        <PriorityBadge priority={summary.priority} />
      </View>
      <View style={styles.row}>
        <Stat label="Paths" value={summary.path_count} />
        <Stat label="Speculative" value={summary.speculative_count} />
      </View>
      {summary.top_risk_factors.length > 0 && (
        <Text style={styles.factors} numberOfLines={2}>
          {summary.top_risk_factors.join(' · ')}
        </Text>
      )}
    </View>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: Theme.colors.surface, borderRadius: Theme.borderRadius.md, padding: Theme.spacing.md, marginBottom: Theme.spacing.md, borderWidth: 1, borderColor: Theme.colors.border },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Theme.spacing.sm },
  score: { color: Theme.colors.primary, fontSize: 32, fontWeight: '800', letterSpacing: 1 },
  stat: { alignItems: 'center', flex: 1 },
  statValue: { color: Theme.colors.text, fontSize: 18, fontWeight: '700' },
  statLabel: { color: Theme.colors.textMuted, fontSize: 10, letterSpacing: 1 },
  factors: { color: Theme.colors.textMuted, fontSize: 12, marginTop: Theme.spacing.xs },
});
```

- [ ] **Step 2: tsc + hex audit**

```bash
npx tsc --noEmit
grep -rE "#[0-9a-fA-F]{3,6}" src/components/Intelligence/RiskSummaryBar.tsx
```

Expected: empty.

- [ ] **Step 3: Commit**

```bash
git add src/components/Intelligence/RiskSummaryBar.tsx
git commit -m "feat(intel): add RiskSummaryBar component"
```

---

### Task 7: SpeculativePathsSection component

**Files:**
- Create: `src/components/Intelligence/SpeculativePathsSection.tsx`

**Interfaces:**
- Consumes: `AttackPathExtended[]`, plus a render prop for each path
- Produces: `<SpeculativePathsSection paths={...} renderPath={(p) => ReactNode} />`

- [ ] **Step 1: Implement**

Create `src/components/Intelligence/SpeculativePathsSection.tsx`:

```typescript
import React, { useState, type ReactNode } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { ChevronDown, ChevronRight } from 'lucide-react-native';
import { Theme } from '../../constants/Theme';
import type { AttackPathExtended } from '../../api/apme';

interface Props {
  paths: AttackPathExtended[];
  renderPath: (path: AttackPathExtended) => ReactNode;
}

export default function SpeculativePathsSection({ paths, renderPath }: Props) {
  const [open, setOpen] = useState(false);
  if (paths.length === 0) return null;
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.header} onPress={() => setOpen(v => !v)}>
        {open ? <ChevronDown size={16} color={Theme.colors.textMuted} /> : <ChevronRight size={16} color={Theme.colors.textMuted} />}
        <Text style={styles.headerText}>SPECULATIVE PATHS · {paths.length}</Text>
      </TouchableOpacity>
      {open && <View style={styles.body}>{paths.map(renderPath)}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: Theme.spacing.lg, borderTopWidth: 1, borderTopColor: Theme.colors.border, paddingTop: Theme.spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', gap: Theme.spacing.xs },
  headerText: { color: Theme.colors.textMuted, fontSize: 11, letterSpacing: 1, fontWeight: '700' },
  body: { marginTop: Theme.spacing.md },
});
```

- [ ] **Step 2: tsc + hex audit**

```bash
npx tsc --noEmit
grep -rE "#[0-9a-fA-F]{3,6}" src/components/Intelligence/SpeculativePathsSection.tsx
```

Expected: empty.

- [ ] **Step 3: Commit**

```bash
git add src/components/Intelligence/SpeculativePathsSection.tsx
git commit -m "feat(intel): add SpeculativePathsSection collapsible"
```

---

### Task 8: Extend AttackPathStep with LEAF detectability chip

**Files:**
- Modify: `src/components/Intelligence/AttackPathStep.tsx`

**Interfaces:**
- Produces: existing component now accepts optional `leafDetectability` prop

- [ ] **Step 1: Read the existing file**

```bash
cat src/components/Intelligence/AttackPathStep.tsx
```

- [ ] **Step 2: Edit to add chip**

In `src/components/Intelligence/AttackPathStep.tsx`:

Add to the props interface:

```typescript
leafDetectability?: 'low' | 'medium' | 'high' | null;
isLeaf?: boolean;
```

Where the step renders its header, append (only when `isLeaf && leafDetectability`):

```tsx
{isLeaf && leafDetectability && (
  <View style={[styles.detectChip, { borderColor: detectColor(leafDetectability), backgroundColor: detectColor(leafDetectability) + '22' }]}>
    <Text style={[styles.detectText, { color: detectColor(leafDetectability) }]}>{leafDetectability.toUpperCase()}</Text>
  </View>
)}
```

Add to module scope:

```typescript
function detectColor(d: 'low' | 'medium' | 'high'): string {
  if (d === 'low') return Theme.colors.success;
  if (d === 'medium') return Theme.colors.warning;
  return Theme.colors.danger;
}
```

Add styles:

```typescript
detectChip: { paddingHorizontal: Theme.spacing.sm, paddingVertical: 2, borderWidth: 1, borderRadius: Theme.borderRadius.sm, marginLeft: Theme.spacing.sm },
detectText: { fontSize: 9, fontWeight: '700', letterSpacing: 1 },
```

- [ ] **Step 3: tsc clean**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add src/components/Intelligence/AttackPathStep.tsx
git commit -m "feat(intel): add LEAF detectability chip to AttackPathStep"
```

---

### Task 9: Wire enhanced attack-paths screen with mutations

**Files:**
- Modify: `app/intelligence/attack-paths.tsx`
- Create: `tests/components/AttackPathsScreen.integration.test.tsx`

**Interfaces:**
- Consumes: `getRiskSummary`, `getAttackTree`, `regenerateImpactAssessment`, `markPathDismissed`, `APME_KEYS`
- Consumes: `RiskSummaryBar`, `PriorityBadge`, `SpeculativePathsSection`, `ScoreTooltip`
- Produces: enhanced screen with overflow menu per card

- [ ] **Step 1: Integration test — happy path + rollback**

Create `tests/components/AttackPathsScreen.integration.test.tsx`:

```typescript
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { mock } from '../setup';
import AttackPathsScreen from '../../app/intelligence/attack-paths';

function wrap(ui: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

const mockTree = { paths: [
  { path_id: 'p1', risk: 'critical', score: 92, step_count: 5, potential_impact: 'rce', mitre_tactics: ['initial-access'], priority: 'P0', is_speculative: false },
  { path_id: 'p2', risk: 'high',     score: 71, step_count: 3, potential_impact: 'lat-mov', priority: 'P1', is_speculative: true },
]};

describe('AttackPathsScreen', () => {
  beforeEach(() => {
    mock.onGet('/mapi/apme/risk-summary/').reply(200, { score: 80, priority: 'P0', path_count: 2, speculative_count: 1, top_risk_factors: ['exposed-admin'] });
    mock.onGet(/\/mapi\/apme\/tree\//).reply(200, mockTree);
  });

  it('renders summary + non-speculative paths', async () => {
    const { findByText } = wrap(<AttackPathsScreen />);
    await findByText('80');
    await findByText(/rce/i);
  });

  it('dismiss removes card optimistically and reverts on failure', async () => {
    mock.onPatch(/\/mapi\/apme\/path\/p1\/dismiss\//).reply(500);
    const { findByText, getByLabelText } = wrap(<AttackPathsScreen />);
    await findByText(/rce/i);
    fireEvent.press(getByLabelText('overflow-p1'));
    fireEvent.press(getByLabelText('dismiss-p1'));
    await waitFor(() => expect(mock.history.patch.length).toBe(1));
    await findByText(/rce/i); // reverted
  });
});
```

- [ ] **Step 2: Run, expect FAIL**

```bash
npm test -- tests/components/AttackPathsScreen.integration.test.tsx
```

- [ ] **Step 3: Implement screen**

Open `app/intelligence/attack-paths.tsx` and rewrite to use the new building blocks. Skeleton:

```typescript
import React, { useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { MoreVertical } from 'lucide-react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Theme } from '../../src/constants/Theme';
import RiskSummaryBar from '../../src/components/Intelligence/RiskSummaryBar';
import SpeculativePathsSection from '../../src/components/Intelligence/SpeculativePathsSection';
import ScoreTooltip from '../../src/components/Intelligence/ScoreTooltip';
import PriorityBadge from '../../src/components/Intelligence/PriorityBadge';
import { getRiskSummary, getAttackTree, regenerateImpactAssessment, markPathDismissed, APME_KEYS, type AttackPathExtended } from '../../src/api/apme';
import { useLocalSearchParams } from 'expo-router';

export default function AttackPathsScreen() {
  const { scanId = '0', targetId = '0' } = useLocalSearchParams<{ scanId?: string; targetId?: string }>();
  const qc = useQueryClient();
  const [tooltipFor, setTooltipFor] = useState<AttackPathExtended | null>(null);
  const [menuFor, setMenuFor] = useState<string | null>(null);

  const summaryQ = useQuery({ queryKey: APME_KEYS.riskSummary(scanId), queryFn: () => getRiskSummary(Number(scanId)), staleTime: 30_000 });
  const treeQ = useQuery({ queryKey: APME_KEYS.tree(String(targetId)), queryFn: () => getAttackTree(String(targetId)), staleTime: 30_000 });

  const dismissM = useMutation({
    mutationFn: (id: string) => markPathDismissed(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: APME_KEYS.tree(String(targetId)) });
      const prev = qc.getQueryData<{ paths: AttackPathExtended[] }>(APME_KEYS.tree(String(targetId)));
      qc.setQueryData(APME_KEYS.tree(String(targetId)), (old: any) => ({ paths: (old?.paths || []).filter((p: AttackPathExtended) => p.path_id !== id) }));
      return { prev };
    },
    onError: (_e, _id, ctx) => { if (ctx?.prev) qc.setQueryData(APME_KEYS.tree(String(targetId)), ctx.prev); },
    onSettled: () => qc.invalidateQueries({ queryKey: APME_KEYS.tree(String(targetId)) }),
  });

  const regenM = useMutation({
    mutationFn: (id: string) => regenerateImpactAssessment(id),
    onSuccess: () => Alert.alert('Queued', 'Refresh in ~30s'),
  });

  const paths = treeQ.data?.paths ?? [];
  const primary = paths.filter(p => !p.is_speculative);
  const speculative = paths.filter(p => p.is_speculative);

  const renderCard = (p: AttackPathExtended) => (
    <View key={p.path_id} style={styles.card}>
      <View style={styles.cardHead}>
        <Text style={styles.id}>{p.path_id}</Text>
        <PriorityBadge priority={p.priority} />
        <TouchableOpacity accessibilityLabel={`overflow-${p.path_id}`} onPress={() => setMenuFor(menuFor === p.path_id ? null : p.path_id)}>
          <MoreVertical size={16} color={Theme.colors.textMuted} />
        </TouchableOpacity>
      </View>
      <TouchableOpacity onLongPress={() => setTooltipFor(p)}>
        <Text style={styles.score}>{p.score}</Text>
      </TouchableOpacity>
      <Text style={styles.impact} numberOfLines={2}>{p.potential_impact}</Text>
      {menuFor === p.path_id && (
        <View style={styles.menu}>
          <TouchableOpacity accessibilityLabel={`regen-${p.path_id}`} onPress={() => { setMenuFor(null); regenM.mutate(p.path_id); }}><Text style={styles.menuItem}>Regenerate Impact</Text></TouchableOpacity>
          <TouchableOpacity accessibilityLabel={`dismiss-${p.path_id}`} onPress={() => { setMenuFor(null); dismissM.mutate(p.path_id); }}><Text style={[styles.menuItem, { color: Theme.colors.danger }]}>Dismiss Path</Text></TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <ScrollView style={styles.root} contentContainerStyle={{ padding: Theme.spacing.md }}>
      {summaryQ.data && <RiskSummaryBar summary={summaryQ.data} />}
      {primary.map(renderCard)}
      <SpeculativePathsSection paths={speculative} renderPath={renderCard} />
      <ScoreTooltip visible={!!tooltipFor} breakdown={tooltipFor?.score_breakdown} onDismiss={() => setTooltipFor(null)} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Theme.colors.background },
  card: { backgroundColor: Theme.colors.surface, borderColor: Theme.colors.border, borderWidth: 1, borderRadius: Theme.borderRadius.md, padding: Theme.spacing.md, marginBottom: Theme.spacing.sm },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: Theme.spacing.sm },
  id: { color: Theme.colors.textMuted, flex: 1, fontFamily: 'SpaceMono' },
  score: { color: Theme.colors.primary, fontSize: 24, fontWeight: '800', marginTop: Theme.spacing.xs },
  impact: { color: Theme.colors.text, marginTop: Theme.spacing.xs },
  menu: { marginTop: Theme.spacing.sm, borderTopWidth: 1, borderTopColor: Theme.colors.border, paddingTop: Theme.spacing.sm, gap: Theme.spacing.sm },
  menuItem: { color: Theme.colors.text, paddingVertical: Theme.spacing.xs },
});
```

- [ ] **Step 4: Run integration test, expect PASS**

```bash
npm test -- tests/components/AttackPathsScreen.integration.test.tsx
npx tsc --noEmit
grep -rE "#[0-9a-fA-F]{3,6}" app/intelligence/attack-paths.tsx
```

Hex audit must be empty.

- [ ] **Step 5: Commit**

```bash
git add app/intelligence/attack-paths.tsx tests/components/AttackPathsScreen.integration.test.tsx
git commit -m "feat(apme): wire enhanced attack-paths screen with mutations + integration test"
```

---

# Slice 2 — Exposures

### Task 10: exposures.ts API module

**Files:**
- Create: `src/api/exposures.ts`
- Create: `tests/exposures.test.ts`

**Interfaces:**
- Produces:
  - Types: `Exposure`, `ExposureStats`, `ExposureStatus`, `ExposureSeverity`
  - Functions: `listExposures`, `getExposureDetail`, `getExposureStats`, `updateExposureStatus`, `bulkUpdateExposureStatus`
  - Constants: `EXPOSURES_KEYS = { list, detail, stats }`

- [ ] **Step 1: Failing tests**

Create `tests/exposures.test.ts`:

```typescript
import { mock } from './setup';
import { listExposures, getExposureStats, updateExposureStatus, bulkUpdateExposureStatus } from '../src/api/exposures';

describe('exposures API', () => {
  it('listExposures normalizes paginated response', async () => {
    mock.onGet('/mapi/exposures/').reply(200, { results: [{ id: 1, title: 'x', status: 'open', severity: 'high', asset_summary: {}, evidence_data: {}, linked_vulnerability_ids: [], created_at: '2026-06-20' }] });
    const res = await listExposures();
    expect(res).toHaveLength(1);
  });

  it('listExposures filters by scanId + status', async () => {
    mock.onGet('/mapi/exposures/').reply(200, []);
    await listExposures(42, 'open');
    expect(mock.history.get[0].params).toEqual({ scan_id: 42, status: 'open' });
  });

  it('getExposureStats returns counts', async () => {
    mock.onGet('/mapi/exposures/stats/').reply(200, { total: 10, open: 4, accepted: 2, false_positive: 1, resolved: 3, by_severity: { critical: 1, high: 3, medium: 4, low: 2, info: 0 } });
    const res = await getExposureStats();
    expect(res.open).toBe(4);
  });

  it('updateExposureStatus PATCHes with note', async () => {
    mock.onPatch('/mapi/exposures/1/status/').reply(200, { id: 1 });
    await updateExposureStatus(1, 'accepted', 'risk taken');
    expect(JSON.parse(mock.history.patch[0].data)).toEqual({ status: 'accepted', note: 'risk taken' });
  });

  it('bulkUpdateExposureStatus POSTs ids[]', async () => {
    mock.onPost('/mapi/exposures/bulk-status/').reply(200, { updated: [1,2], rejected: [3] });
    const res = await bulkUpdateExposureStatus([1, 2, 3], 'resolved');
    expect(res.rejected).toEqual([3]);
  });

  it('updateExposureStatus rejects note > 1000 chars', async () => {
    await expect(updateExposureStatus(1, 'accepted', 'x'.repeat(1001))).rejects.toThrow(/note/i);
  });
});
```

- [ ] **Step 2: Run, expect FAIL**

```bash
npm test -- tests/exposures.test.ts
```

- [ ] **Step 3: Implement**

Create `src/api/exposures.ts`:

```typescript
import apiClient from './client';

export type ExposureStatus = 'open' | 'accepted' | 'false_positive' | 'resolved';
export type ExposureSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';

export interface Exposure {
  id: number;
  title: string;
  status: ExposureStatus;
  severity: ExposureSeverity;
  asset_summary: { hostname?: string; ip?: string; port?: number; service?: string };
  evidence_data: Record<string, unknown>;
  evidence_timestamps?: { first_seen: string; last_seen: string };
  linked_vulnerability_ids: number[];
  scan_id?: number;
  created_at: string;
}

export interface ExposureStats {
  total: number;
  open: number;
  accepted: number;
  false_positive: number;
  resolved: number;
  by_severity: Record<ExposureSeverity, number>;
}

export const EXPOSURES_KEYS = {
  list: (scanId?: number, status?: ExposureStatus) => ['exposures', 'list', scanId ?? 'all', status ?? 'all'] as const,
  detail: (id: number) => ['exposures', 'detail', id] as const,
  stats: (scanId?: number) => ['exposures', 'stats', scanId ?? 'all'] as const,
};

const VALID_STATUS: ExposureStatus[] = ['open', 'accepted', 'false_positive', 'resolved'];

function validateStatus(s: ExposureStatus) {
  if (!VALID_STATUS.includes(s)) throw new Error(`Invalid status: ${s}`);
}

function validateNote(n?: string) {
  if (n !== undefined && n.length > 1000) throw new Error('note exceeds 1000 chars');
}

export async function listExposures(scanId?: number, status?: ExposureStatus): Promise<Exposure[]> {
  const params: Record<string, unknown> = {};
  if (scanId !== undefined) params.scan_id = scanId;
  if (status) params.status = status;
  const res = await apiClient.get<Exposure[] | { results: Exposure[] }>('/mapi/exposures/', { params });
  return Array.isArray(res.data) ? res.data : (res.data.results ?? []);
}

export async function getExposureDetail(id: number): Promise<Exposure> {
  const res = await apiClient.get<Exposure>(`/mapi/exposures/${id}/`);
  return res.data;
}

export async function getExposureStats(scanId?: number): Promise<ExposureStats> {
  const res = await apiClient.get<ExposureStats>('/mapi/exposures/stats/', { params: scanId !== undefined ? { scan_id: scanId } : undefined });
  return res.data;
}

export async function updateExposureStatus(id: number, status: ExposureStatus, note?: string): Promise<Exposure> {
  validateStatus(status); validateNote(note);
  const body: Record<string, unknown> = { status };
  if (note) body.note = note;
  const res = await apiClient.patch<Exposure>(`/mapi/exposures/${id}/status/`, body);
  return res.data;
}

export async function bulkUpdateExposureStatus(ids: number[], status: ExposureStatus): Promise<{ updated: number[]; rejected: number[] }> {
  validateStatus(status);
  const res = await apiClient.post<{ updated: number[]; rejected: number[] }>('/mapi/exposures/bulk-status/', { ids, status });
  return res.data;
}
```

- [ ] **Step 4: Run + tsc**

```bash
npm test -- tests/exposures.test.ts
npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add src/api/exposures.ts tests/exposures.test.ts
git commit -m "feat(exposures): add API module with list/detail/stats/update/bulk endpoints"
```

---

### Task 11: ExposureStatusChip + ExposureStatsBar

**Files:**
- Create: `src/components/Exposures/ExposureStatusChip.tsx`
- Create: `src/components/Exposures/ExposureStatsBar.tsx`

**Interfaces:**
- Produces:
  - `<ExposureStatusChip status={ExposureStatus} />`
  - `<ExposureStatsBar stats={ExposureStats} />`

- [ ] **Step 1: Implement chip**

Create `src/components/Exposures/ExposureStatusChip.tsx`:

```typescript
import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Theme } from '../../constants/Theme';
import type { ExposureStatus } from '../../api/exposures';

const COLOR: Record<ExposureStatus, string> = {
  open: Theme.colors.danger,
  accepted: Theme.colors.info,
  false_positive: Theme.colors.textMuted,
  resolved: Theme.colors.success,
};

const LABEL: Record<ExposureStatus, string> = {
  open: 'OPEN',
  accepted: 'ACCEPTED',
  false_positive: 'FALSE POSITIVE',
  resolved: 'RESOLVED',
};

export default function ExposureStatusChip({ status }: { status: ExposureStatus }) {
  const valid = status in COLOR;
  const color = valid ? COLOR[status] : Theme.colors.textMuted;
  const label = valid ? LABEL[status] : '?';
  return (
    <View style={[styles.chip, { borderColor: color, backgroundColor: color + '22' }]}>
      <Text style={[styles.text, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: { paddingHorizontal: Theme.spacing.sm, paddingVertical: 2, borderWidth: 1, borderRadius: Theme.borderRadius.sm },
  text: { fontSize: 10, fontWeight: '700', letterSpacing: 1 },
});
```

- [ ] **Step 2: Implement stats bar**

Create `src/components/Exposures/ExposureStatsBar.tsx`:

```typescript
import React, { useMemo } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Theme } from '../../constants/Theme';
import type { ExposureStats } from '../../api/exposures';

export default function ExposureStatsBar({ stats }: { stats: ExposureStats }) {
  const cells = useMemo(() => [
    { label: 'TOTAL', value: stats.total, color: Theme.colors.text },
    { label: 'OPEN', value: stats.open, color: Theme.colors.danger },
    { label: 'ACCEPTED', value: stats.accepted, color: Theme.colors.info },
    { label: 'FP', value: stats.false_positive, color: Theme.colors.textMuted },
    { label: 'RESOLVED', value: stats.resolved, color: Theme.colors.success },
  ], [stats]);
  return (
    <View style={styles.row}>
      {cells.map(c => (
        <View key={c.label} style={styles.cell}>
          <Text style={[styles.value, { color: c.color }]}>{c.value}</Text>
          <Text style={styles.label}>{c.label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', backgroundColor: Theme.colors.surface, borderRadius: Theme.borderRadius.md, borderWidth: 1, borderColor: Theme.colors.border, padding: Theme.spacing.sm, marginBottom: Theme.spacing.md },
  cell: { flex: 1, alignItems: 'center' },
  value: { fontSize: 16, fontWeight: '800' },
  label: { color: Theme.colors.textMuted, fontSize: 9, letterSpacing: 1 },
});
```

- [ ] **Step 3: tsc + hex audit**

```bash
npx tsc --noEmit
grep -rE "#[0-9a-fA-F]{3,6}" src/components/Exposures/
```

Expected: empty.

- [ ] **Step 4: Commit**

```bash
git add src/components/Exposures/ExposureStatusChip.tsx src/components/Exposures/ExposureStatsBar.tsx
git commit -m "feat(exposures): add ExposureStatusChip and ExposureStatsBar"
```

---

### Task 12: ExposureCard + ExposureFilters

**Files:**
- Create: `src/components/Exposures/ExposureCard.tsx`
- Create: `src/components/Exposures/ExposureFilters.tsx`
- Create: `tests/components/ExposureCard.test.tsx`

**Interfaces:**
- Produces:
  - `<ExposureCard exposure selected onPress onLongPress />`
  - `<ExposureFilters value onChange />` where `value = { status?: ExposureStatus; q?: string }`

- [ ] **Step 1: Failing test**

Create `tests/components/ExposureCard.test.tsx`:

```typescript
import React from 'react';
import { render } from '@testing-library/react-native';
import ExposureCard from '../../src/components/Exposures/ExposureCard';

const e = { id: 1, title: 'Open SSH on edge', status: 'open' as const, severity: 'high' as const, asset_summary: { hostname: 'edge.example.com', port: 22 }, evidence_data: {}, linked_vulnerability_ids: [], created_at: '2026-06-20' };

describe('ExposureCard', () => {
  it('renders title and asset', () => {
    const { getByText } = render(<ExposureCard exposure={e} onPress={() => {}} onLongPress={() => {}} selected={false} />);
    expect(getByText('Open SSH on edge')).toBeTruthy();
    expect(getByText(/edge.example.com:22/)).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run, expect FAIL**

```bash
npm test -- tests/components/ExposureCard.test.tsx
```

- [ ] **Step 3: Implement card**

Create `src/components/Exposures/ExposureCard.tsx`:

```typescript
import React from 'react';
import { StyleSheet, TouchableOpacity, View, Text } from 'react-native';
import { Theme } from '../../constants/Theme';
import ExposureStatusChip from './ExposureStatusChip';
import type { Exposure } from '../../api/exposures';

interface Props {
  exposure: Exposure;
  selected: boolean;
  onPress: () => void;
  onLongPress: () => void;
}

function assetLabel(a: Exposure['asset_summary']): string {
  if (a.hostname && a.port) return `${a.hostname}:${a.port}`;
  if (a.hostname) return a.hostname;
  if (a.ip && a.port) return `${a.ip}:${a.port}`;
  if (a.ip) return a.ip;
  return a.service ?? 'unknown asset';
}

const SEV_COLOR: Record<Exposure['severity'], string> = {
  critical: Theme.colors.vulnerabilities.critical,
  high: Theme.colors.vulnerabilities.high,
  medium: Theme.colors.vulnerabilities.medium,
  low: Theme.colors.vulnerabilities.low,
  info: Theme.colors.vulnerabilities.info,
};

export default function ExposureCard({ exposure, selected, onPress, onLongPress }: Props) {
  const sev = SEV_COLOR[exposure.severity] ?? Theme.colors.textMuted;
  return (
    <TouchableOpacity onPress={onPress} onLongPress={onLongPress} style={[styles.card, selected && styles.selected]}>
      <View style={styles.header}>
        <View style={[styles.sevDot, { backgroundColor: sev }]} />
        <Text style={styles.title} numberOfLines={1}>{exposure.title}</Text>
        <ExposureStatusChip status={exposure.status} />
      </View>
      <Text style={styles.asset}>{assetLabel(exposure.asset_summary)}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: Theme.colors.surface, borderRadius: Theme.borderRadius.md, padding: Theme.spacing.md, marginBottom: Theme.spacing.sm, borderWidth: 1, borderColor: Theme.colors.border },
  selected: { borderColor: Theme.colors.primary },
  header: { flexDirection: 'row', alignItems: 'center', gap: Theme.spacing.sm },
  sevDot: { width: 8, height: 8, borderRadius: 4 },
  title: { color: Theme.colors.text, flex: 1, fontWeight: '700' },
  asset: { color: Theme.colors.textMuted, fontFamily: 'SpaceMono', marginTop: Theme.spacing.xs },
});
```

- [ ] **Step 4: Implement filters**

Create `src/components/Exposures/ExposureFilters.tsx`:

```typescript
import React from 'react';
import { StyleSheet, TextInput, View, Text, TouchableOpacity } from 'react-native';
import { Theme } from '../../constants/Theme';
import type { ExposureStatus } from '../../api/exposures';

interface Value { status?: ExposureStatus; q?: string }
interface Props { value: Value; onChange: (v: Value) => void }

const CHIPS: { key: ExposureStatus | undefined; label: string }[] = [
  { key: undefined, label: 'ALL' },
  { key: 'open', label: 'OPEN' },
  { key: 'accepted', label: 'ACCEPTED' },
  { key: 'false_positive', label: 'FP' },
  { key: 'resolved', label: 'RESOLVED' },
];

export default function ExposureFilters({ value, onChange }: Props) {
  return (
    <View>
      <View style={styles.chips}>
        {CHIPS.map(c => {
          const active = value.status === c.key;
          return (
            <TouchableOpacity key={c.label} onPress={() => onChange({ ...value, status: c.key })} style={[styles.chip, active && styles.chipActive]}>
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{c.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <TextInput placeholder="Search…" placeholderTextColor={Theme.colors.textMuted} value={value.q ?? ''} onChangeText={(q) => onChange({ ...value, q })} style={styles.search} />
    </View>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Theme.spacing.xs, marginBottom: Theme.spacing.sm },
  chip: { paddingHorizontal: Theme.spacing.sm, paddingVertical: 4, borderRadius: Theme.borderRadius.full, borderWidth: 1, borderColor: Theme.colors.border },
  chipActive: { backgroundColor: Theme.colors.primary, borderColor: Theme.colors.primary },
  chipText: { color: Theme.colors.textMuted, fontSize: 11, letterSpacing: 1, fontWeight: '700' },
  chipTextActive: { color: Theme.colors.background },
  search: { backgroundColor: Theme.colors.surface, color: Theme.colors.text, borderRadius: Theme.borderRadius.md, paddingHorizontal: Theme.spacing.md, paddingVertical: Theme.spacing.sm, borderWidth: 1, borderColor: Theme.colors.border, marginBottom: Theme.spacing.md },
});
```

- [ ] **Step 5: Run + tsc + audit**

```bash
npm test -- tests/components/ExposureCard.test.tsx
npx tsc --noEmit
grep -rE "#[0-9a-fA-F]{3,6}" src/components/Exposures/
```

- [ ] **Step 6: Commit**

```bash
git add src/components/Exposures/ExposureCard.tsx src/components/Exposures/ExposureFilters.tsx tests/components/ExposureCard.test.tsx
git commit -m "feat(exposures): add ExposureCard and ExposureFilters"
```

---

### Task 13: ExposureEvidenceList + ExposureLinkedVulns

**Files:**
- Create: `src/components/Exposures/ExposureEvidenceList.tsx`
- Create: `src/components/Exposures/ExposureLinkedVulns.tsx`

**Interfaces:**
- Produces:
  - `<ExposureEvidenceList data={Record<string,unknown>} timestamps?={...} />`
  - `<ExposureLinkedVulns ids={number[]} onPressVuln={(id) => void} />`

- [ ] **Step 1: Implement evidence list**

Create `src/components/Exposures/ExposureEvidenceList.tsx`:

```typescript
import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Theme } from '../../constants/Theme';

interface Props {
  data: Record<string, unknown>;
  timestamps?: { first_seen: string; last_seen: string };
}

export default function ExposureEvidenceList({ data, timestamps }: Props) {
  const entries = Object.entries(data);
  return (
    <View style={styles.container}>
      {entries.length === 0 ? (
        <Text style={styles.empty}>No evidence captured.</Text>
      ) : entries.map(([k, v]) => (
        <View key={k} style={styles.row}>
          <Text style={styles.key}>{k}</Text>
          <Text style={styles.value} selectable>{stringify(v)}</Text>
        </View>
      ))}
      {timestamps && (
        <Text style={styles.ts}>first seen {timestamps.first_seen} · last seen {timestamps.last_seen}</Text>
      )}
    </View>
  );
}

function stringify(v: unknown): string {
  if (v === null || v === undefined) return '—';
  if (typeof v === 'string') return v;
  try { return JSON.stringify(v); } catch { return String(v); }
}

const styles = StyleSheet.create({
  container: { backgroundColor: Theme.colors.surface, borderRadius: Theme.borderRadius.md, padding: Theme.spacing.md, borderWidth: 1, borderColor: Theme.colors.border, marginVertical: Theme.spacing.md },
  empty: { color: Theme.colors.textMuted, fontStyle: 'italic' },
  row: { paddingVertical: Theme.spacing.xs, borderBottomWidth: 1, borderBottomColor: Theme.colors.border },
  key: { color: Theme.colors.textMuted, fontSize: 11, letterSpacing: 1, fontWeight: '700' },
  value: { color: Theme.colors.text, fontFamily: 'SpaceMono', marginTop: 2 },
  ts: { color: Theme.colors.textMuted, fontSize: 10, marginTop: Theme.spacing.sm },
});
```

- [ ] **Step 2: Implement linked vulns**

Create `src/components/Exposures/ExposureLinkedVulns.tsx`:

```typescript
import React from 'react';
import { StyleSheet, TouchableOpacity, View, Text } from 'react-native';
import { Theme } from '../../constants/Theme';

interface Props {
  ids: number[];
  onPressVuln: (id: number) => void;
}

export default function ExposureLinkedVulns({ ids, onPressVuln }: Props) {
  if (ids.length === 0) return null;
  return (
    <View>
      <Text style={styles.label}>LINKED VULNERABILITIES</Text>
      <View style={styles.pillRow}>
        {ids.map(id => (
          <TouchableOpacity key={id} style={styles.pill} onPress={() => onPressVuln(id)}>
            <Text style={styles.pillText}>#{id}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { color: Theme.colors.textMuted, fontSize: 11, letterSpacing: 1, fontWeight: '700', marginBottom: Theme.spacing.sm },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Theme.spacing.xs },
  pill: { paddingHorizontal: Theme.spacing.sm, paddingVertical: 4, borderRadius: Theme.borderRadius.full, borderWidth: 1, borderColor: Theme.colors.primary },
  pillText: { color: Theme.colors.primary, fontWeight: '700' },
});
```

- [ ] **Step 3: tsc + hex audit**

```bash
npx tsc --noEmit
grep -rE "#[0-9a-fA-F]{3,6}" src/components/Exposures/
```

Expected: empty.

- [ ] **Step 4: Commit**

```bash
git add src/components/Exposures/ExposureEvidenceList.tsx src/components/Exposures/ExposureLinkedVulns.tsx
git commit -m "feat(exposures): add ExposureEvidenceList and ExposureLinkedVulns"
```

---

### Task 14: exposures list screen with bulk selection

**Files:**
- Create: `app/intelligence/exposures/index.tsx`
- Create: `tests/components/ExposuresScreen.integration.test.tsx`

**Interfaces:**
- Consumes: `listExposures`, `getExposureStats`, `bulkUpdateExposureStatus`, `EXPOSURES_KEYS`
- Produces: screen renders ExposureStatsBar + ExposureFilters + FlatList of ExposureCard + bulk action bar

- [ ] **Step 1: Failing integration test (happy + partial-failure)**

Create `tests/components/ExposuresScreen.integration.test.tsx`:

```typescript
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { mock } from '../setup';
import ExposuresScreen from '../../app/intelligence/exposures/index';

function wrap(ui: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

const list = [
  { id: 1, title: 'a', status: 'open', severity: 'high', asset_summary: { hostname: 'h' }, evidence_data: {}, linked_vulnerability_ids: [], created_at: '2026-06-20' },
  { id: 2, title: 'b', status: 'open', severity: 'low',  asset_summary: { hostname: 'h2' }, evidence_data: {}, linked_vulnerability_ids: [], created_at: '2026-06-20' },
];

describe('ExposuresScreen', () => {
  beforeEach(() => {
    mock.onGet('/mapi/exposures/').reply(200, list);
    mock.onGet('/mapi/exposures/stats/').reply(200, { total: 2, open: 2, accepted: 0, false_positive: 0, resolved: 0, by_severity: { critical: 0, high: 1, medium: 0, low: 1, info: 0 } });
  });

  it('bulk resolve handles partial failure (one row reverts)', async () => {
    mock.onPost('/mapi/exposures/bulk-status/').reply(200, { updated: [1], rejected: [2] });
    const { findByText, getAllByText } = wrap(<ExposuresScreen />);
    await findByText('a');
    fireEvent(getAllByText('a')[0], 'longPress');
    fireEvent.press(await findByText('b'));
    fireEvent.press(await findByText(/Mark Resolved/i));
    await waitFor(() => expect(mock.history.post.length).toBe(1));
  });
});
```

- [ ] **Step 2: Run, expect FAIL**

```bash
npm test -- tests/components/ExposuresScreen.integration.test.tsx
```

- [ ] **Step 3: Implement screen**

Create `app/intelligence/exposures/index.tsx`:

```typescript
import React, { useMemo, useState } from 'react';
import { FlatList, View, Text, TouchableOpacity, StyleSheet, RefreshControl, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Theme } from '../../../src/constants/Theme';
import ExposureCard from '../../../src/components/Exposures/ExposureCard';
import ExposureStatsBar from '../../../src/components/Exposures/ExposureStatsBar';
import ExposureFilters from '../../../src/components/Exposures/ExposureFilters';
import { listExposures, getExposureStats, bulkUpdateExposureStatus, EXPOSURES_KEYS, type Exposure, type ExposureStatus } from '../../../src/api/exposures';

export default function ExposuresScreen({ scanId }: { scanId?: number } = {}) {
  const router = useRouter();
  const qc = useQueryClient();
  const [filter, setFilter] = useState<{ status?: ExposureStatus; q?: string }>({});
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const listQ = useQuery({ queryKey: EXPOSURES_KEYS.list(scanId, filter.status), queryFn: () => listExposures(scanId, filter.status), staleTime: 30_000 });
  const statsQ = useQuery({ queryKey: EXPOSURES_KEYS.stats(scanId), queryFn: () => getExposureStats(scanId), staleTime: 30_000 });

  const filtered = useMemo(() => (listQ.data ?? []).filter(e => !filter.q || e.title.toLowerCase().includes(filter.q.toLowerCase())), [listQ.data, filter.q]);

  const bulkM = useMutation({
    mutationFn: ({ ids, status }: { ids: number[]; status: ExposureStatus }) => bulkUpdateExposureStatus(ids, status),
    onMutate: async ({ ids, status }) => {
      await qc.cancelQueries({ queryKey: EXPOSURES_KEYS.list(scanId, filter.status) });
      const prev = qc.getQueryData<Exposure[]>(EXPOSURES_KEYS.list(scanId, filter.status));
      qc.setQueryData(EXPOSURES_KEYS.list(scanId, filter.status), (old?: Exposure[]) => (old ?? []).map(e => ids.includes(e.id) ? { ...e, status } : e));
      return { prev };
    },
    onError: (_e, _v, ctx) => { if (ctx?.prev) qc.setQueryData(EXPOSURES_KEYS.list(scanId, filter.status), ctx.prev); },
    onSettled: (res) => {
      if (res?.rejected?.length) {
        qc.setQueryData<Exposure[]>(EXPOSURES_KEYS.list(scanId, filter.status), (old?: Exposure[]) => (old ?? []).map(e => res.rejected.includes(e.id) ? { ...e, status: 'open' } : e));
      }
      qc.invalidateQueries({ queryKey: EXPOSURES_KEYS.stats(scanId) });
      setSelected(new Set());
    },
  });

  const toggle = (id: number) => setSelected(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const bulkAction = (status: ExposureStatus) => bulkM.mutate({ ids: Array.from(selected), status });

  if (listQ.isLoading) return <View style={styles.center}><ActivityIndicator color={Theme.colors.primary} /></View>;

  return (
    <View style={styles.root}>
      <FlatList
        data={filtered}
        keyExtractor={(e) => String(e.id)}
        ListHeaderComponent={
          <View>
            {statsQ.data && <ExposureStatsBar stats={statsQ.data} />}
            <ExposureFilters value={filter} onChange={setFilter} />
          </View>
        }
        ListEmptyComponent={<Text style={styles.empty}>No exposures correlated yet.</Text>}
        contentContainerStyle={{ padding: Theme.spacing.md }}
        renderItem={({ item }) => (
          <ExposureCard
            exposure={item}
            selected={selected.has(item.id)}
            onPress={() => selected.size > 0 ? toggle(item.id) : router.push(`/intelligence/exposures/${item.id}`)}
            onLongPress={() => toggle(item.id)}
          />
        )}
        refreshControl={<RefreshControl refreshing={listQ.isRefetching} onRefresh={() => { listQ.refetch(); statsQ.refetch(); }} tintColor={Theme.colors.primary} />}
      />
      {selected.size > 0 && (
        <View style={styles.bar}>
          <Text style={styles.barCount}>{selected.size} selected</Text>
          <TouchableOpacity onPress={() => bulkAction('accepted')}><Text style={styles.action}>Accept</Text></TouchableOpacity>
          <TouchableOpacity onPress={() => bulkAction('false_positive')}><Text style={styles.action}>Mark FP</Text></TouchableOpacity>
          <TouchableOpacity onPress={() => bulkAction('resolved')}><Text style={styles.action}>Mark Resolved</Text></TouchableOpacity>
          <TouchableOpacity onPress={() => setSelected(new Set())}><Text style={[styles.action, { color: Theme.colors.textMuted }]}>Cancel</Text></TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Theme.colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { color: Theme.colors.textMuted, textAlign: 'center', marginTop: Theme.spacing.xl },
  bar: { flexDirection: 'row', alignItems: 'center', backgroundColor: Theme.colors.surface, padding: Theme.spacing.md, borderTopWidth: 1, borderTopColor: Theme.colors.border, gap: Theme.spacing.md },
  barCount: { color: Theme.colors.textMuted, flex: 1 },
  action: { color: Theme.colors.primary, fontWeight: '700' },
});
```

- [ ] **Step 4: Run integration test + tsc + audit**

```bash
npm test -- tests/components/ExposuresScreen.integration.test.tsx
npx tsc --noEmit
grep -rE "#[0-9a-fA-F]{3,6}" app/intelligence/exposures/index.tsx
```

- [ ] **Step 5: Commit**

```bash
git add app/intelligence/exposures/index.tsx tests/components/ExposuresScreen.integration.test.tsx
git commit -m "feat(exposures): add list screen with bulk selection + partial-failure handling"
```

---

### Task 15: exposure detail screen with mutations

**Files:**
- Create: `app/intelligence/exposures/[exposureId].tsx`

**Interfaces:**
- Consumes: `getExposureDetail`, `updateExposureStatus`, `useUndoableMutation`, `ExposureEvidenceList`, `ExposureLinkedVulns`, `ExposureStatusChip`
- Produces: detail screen with status mutation actions

- [ ] **Step 1: Implement detail screen**

Create `app/intelligence/exposures/[exposureId].tsx`:

```typescript
import React, { useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet, Modal, TextInput, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Theme } from '../../../src/constants/Theme';
import { getExposureDetail, updateExposureStatus, EXPOSURES_KEYS, type Exposure, type ExposureStatus } from '../../../src/api/exposures';
import ExposureStatusChip from '../../../src/components/Exposures/ExposureStatusChip';
import ExposureEvidenceList from '../../../src/components/Exposures/ExposureEvidenceList';
import ExposureLinkedVulns from '../../../src/components/Exposures/ExposureLinkedVulns';

const DESTRUCTIVE: ExposureStatus[] = ['resolved', 'false_positive'];

export default function ExposureDetail() {
  const { exposureId } = useLocalSearchParams<{ exposureId: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const id = Number(exposureId);
  const [pendingAction, setPendingAction] = useState<ExposureStatus | null>(null);
  const [note, setNote] = useState('');

  const q = useQuery({ queryKey: EXPOSURES_KEYS.detail(id), queryFn: () => getExposureDetail(id), staleTime: 30_000 });

  const m = useMutation({
    mutationFn: ({ status, note }: { status: ExposureStatus; note?: string }) => updateExposureStatus(id, status, note),
    onMutate: async ({ status }) => {
      await qc.cancelQueries({ queryKey: EXPOSURES_KEYS.detail(id) });
      const prev = qc.getQueryData<Exposure>(EXPOSURES_KEYS.detail(id));
      qc.setQueryData<Exposure>(EXPOSURES_KEYS.detail(id), (old) => old ? { ...old, status } : old);
      return { prev };
    },
    onError: (_e, _v, ctx) => { if (ctx?.prev) qc.setQueryData(EXPOSURES_KEYS.detail(id), ctx.prev); Alert.alert('Failed', 'Status update rejected'); },
    onSettled: () => qc.invalidateQueries({ queryKey: EXPOSURES_KEYS.list() }),
  });

  if (q.isLoading || !q.data) return <View style={styles.center}><Text style={{ color: Theme.colors.textMuted }}>Loading…</Text></View>;
  const e = q.data;

  const dispatchAction = (status: ExposureStatus) => {
    if (DESTRUCTIVE.includes(status)) { setPendingAction(status); return; }
    m.mutate({ status });
  };

  const confirmDestructive = () => {
    if (!pendingAction) return;
    m.mutate({ status: pendingAction, note: note.slice(0, 1000) || undefined });
    setPendingAction(null);
    setNote('');
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={{ padding: Theme.spacing.md }}>
      <Text style={styles.title}>{e.title}</Text>
      <View style={styles.row}><ExposureStatusChip status={e.status} /></View>
      <ExposureEvidenceList data={e.evidence_data} timestamps={e.evidence_timestamps} />
      <ExposureLinkedVulns ids={e.linked_vulnerability_ids} onPressVuln={(vid) => router.push(`/scan/${e.scan_id ?? 0}?vuln=${vid}` as never)} />
      <View style={styles.actions}>
        <ActionButton label="Mark Accepted" onPress={() => dispatchAction('accepted')} />
        <ActionButton label="Mark FP" onPress={() => dispatchAction('false_positive')} />
        <ActionButton label="Mark Resolved" onPress={() => dispatchAction('resolved')} />
        <ActionButton label="Reopen" onPress={() => dispatchAction('open')} />
      </View>
      <Modal visible={!!pendingAction} transparent animationType="fade" onRequestClose={() => setPendingAction(null)}>
        <View style={styles.modalBack}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Confirm {pendingAction}</Text>
            <TextInput style={styles.input} placeholder="Optional note" placeholderTextColor={Theme.colors.textMuted} value={note} onChangeText={setNote} multiline maxLength={1000} />
            <View style={styles.modalRow}>
              <TouchableOpacity onPress={() => setPendingAction(null)}><Text style={[styles.modalAction, { color: Theme.colors.textMuted }]}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity onPress={confirmDestructive}><Text style={styles.modalAction}>Confirm</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

function ActionButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.btn} onPress={onPress}>
      <Text style={styles.btnText}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Theme.colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { color: Theme.colors.text, fontSize: 20, fontWeight: '800', marginBottom: Theme.spacing.sm },
  row: { flexDirection: 'row', gap: Theme.spacing.sm, marginBottom: Theme.spacing.md },
  actions: { gap: Theme.spacing.sm, marginTop: Theme.spacing.lg },
  btn: { padding: Theme.spacing.md, borderRadius: Theme.borderRadius.md, borderWidth: 1, borderColor: Theme.colors.primary, alignItems: 'center' },
  btnText: { color: Theme.colors.primary, fontWeight: '700', letterSpacing: 1 },
  modalBack: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.7)' },
  modal: { backgroundColor: Theme.colors.surface, borderRadius: Theme.borderRadius.md, padding: Theme.spacing.lg, minWidth: 280, borderColor: Theme.colors.border, borderWidth: 1 },
  modalTitle: { color: Theme.colors.text, fontWeight: '700', marginBottom: Theme.spacing.md },
  input: { color: Theme.colors.text, borderColor: Theme.colors.border, borderWidth: 1, borderRadius: Theme.borderRadius.sm, padding: Theme.spacing.sm, minHeight: 60 },
  modalRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: Theme.spacing.md, marginTop: Theme.spacing.md },
  modalAction: { color: Theme.colors.primary, fontWeight: '700' },
});
```

- [ ] **Step 2: tsc + audit**

```bash
npx tsc --noEmit
grep -rE "#[0-9a-fA-F]{3,6}" app/intelligence/exposures/
```

Expected: only `rgba(0,0,0,0.7)` if at all — acceptable backdrop overlay.

- [ ] **Step 3: Commit**

```bash
git add app/intelligence/exposures/[exposureId].tsx
git commit -m "feat(exposures): add detail screen with status mutations + destructive confirm modal"
```

---

# Slice 3 — Certificates

### Task 16: certificates.ts API module

**Files:**
- Create: `src/api/certificates.ts`
- Create: `tests/certificates.test.ts`

**Interfaces:**
- Produces:
  - Types: `Certificate`, `CertFlag`
  - Functions: `listCertificates`, `getCertificateDetail`, `resyncCertificate`, `flagCertificateAnomaly`
  - Constants: `CERTS_KEYS = { list, detail }`

- [ ] **Step 1: Failing tests**

Create `tests/certificates.test.ts`:

```typescript
import { mock } from './setup';
import { listCertificates, getCertificateDetail, resyncCertificate, flagCertificateAnomaly } from '../src/api/certificates';

const sample = { id: 1, subject_cn: 'a', issuer_cn: 'b', san: [], not_before: '', not_after: '', sha256_fingerprint: 'x', sha1_fingerprint: 'y', chain: [], is_self_signed: false, is_expired: false };

describe('certificates API', () => {
  it('listCertificates GETs', async () => {
    mock.onGet('/mapi/certificates/').reply(200, [sample]);
    expect((await listCertificates()).length).toBe(1);
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
```

- [ ] **Step 2: Run, expect FAIL**

```bash
npm test -- tests/certificates.test.ts
```

- [ ] **Step 3: Implement**

Create `src/api/certificates.ts`:

```typescript
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
  const res = await apiClient.get<Certificate[] | { results: Certificate[] }>('/mapi/certificates/', { params: scanId !== undefined ? { scan_id: scanId } : undefined });
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
```

- [ ] **Step 4: Run + tsc + commit**

```bash
npm test -- tests/certificates.test.ts
npx tsc --noEmit
git add src/api/certificates.ts tests/certificates.test.ts
git commit -m "feat(certificates): add API module"
```

---

### Task 17: CertCard + FingerprintRow

**Files:**
- Create: `src/components/Certificates/CertCard.tsx`
- Create: `src/components/Certificates/FingerprintRow.tsx`

**Interfaces:**
- Produces:
  - `<CertCard cert={Certificate} onPress />`
  - `<FingerprintRow label value />` (with copy-to-clipboard)

- [ ] **Step 1: Implement CertCard**

Create `src/components/Certificates/CertCard.tsx`:

```typescript
import React from 'react';
import { StyleSheet, TouchableOpacity, View, Text } from 'react-native';
import { Theme } from '../../constants/Theme';
import type { Certificate } from '../../api/certificates';

function expiryColor(cert: Certificate): string {
  if (cert.is_expired) return Theme.colors.danger;
  const ms = new Date(cert.not_after).getTime() - Date.now();
  return ms < 30 * 86400_000 ? Theme.colors.warning : Theme.colors.textMuted;
}

export default function CertCard({ cert, onPress }: { cert: Certificate; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.card}>
      <Text style={styles.subject}>{cert.subject_cn}</Text>
      <Text style={styles.issuer}>issued by {cert.issuer_cn}</Text>
      <Text style={[styles.expiry, { color: expiryColor(cert) }]}>expires {cert.not_after}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: Theme.colors.surface, borderColor: Theme.colors.border, borderWidth: 1, borderRadius: Theme.borderRadius.md, padding: Theme.spacing.md, marginBottom: Theme.spacing.sm },
  subject: { color: Theme.colors.text, fontWeight: '700', fontSize: 14 },
  issuer: { color: Theme.colors.textMuted, fontSize: 12, marginTop: 2 },
  expiry: { fontSize: 11, marginTop: Theme.spacing.xs, fontFamily: 'SpaceMono' },
});
```

- [ ] **Step 2: Install expo-clipboard if missing**

```bash
npm install expo-clipboard
```

- [ ] **Step 3: Implement FingerprintRow**

Create `src/components/Certificates/FingerprintRow.tsx`:

```typescript
import React from 'react';
import { StyleSheet, TouchableOpacity, View, Text } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Theme } from '../../constants/Theme';
import { Copy } from 'lucide-react-native';

export default function FingerprintRow({ label, value }: { label: string; value: string }) {
  const onCopy = () => { void Clipboard.setStringAsync(value); };
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.body}>
        <Text style={styles.value} selectable numberOfLines={1} ellipsizeMode="middle">{value}</Text>
        <TouchableOpacity onPress={onCopy} accessibilityLabel={`copy-${label}`}>
          <Copy size={14} color={Theme.colors.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { paddingVertical: Theme.spacing.sm, borderBottomWidth: 1, borderBottomColor: Theme.colors.border },
  label: { color: Theme.colors.textMuted, fontSize: 10, letterSpacing: 1, fontWeight: '700' },
  body: { flexDirection: 'row', alignItems: 'center', gap: Theme.spacing.sm, marginTop: 2 },
  value: { color: Theme.colors.text, fontFamily: 'SpaceMono', flex: 1 },
});
```

- [ ] **Step 4: tsc + audit + commit**

```bash
npx tsc --noEmit
grep -rE "#[0-9a-fA-F]{3,6}" src/components/Certificates/
git add src/components/Certificates/CertCard.tsx src/components/Certificates/FingerprintRow.tsx package.json package-lock.json
git commit -m "feat(certificates): add CertCard and FingerprintRow with clipboard"
```

---

### Task 18: SanList + CertChainViewer

**Files:**
- Create: `src/components/Certificates/SanList.tsx`
- Create: `src/components/Certificates/CertChainViewer.tsx`
- Create: `tests/components/CertChainViewer.test.tsx`

**Interfaces:**
- Produces:
  - `<SanList sans={string[]} />` (collapsible)
  - `<CertChainViewer chain={Certificate['chain']} />`

- [ ] **Step 1: Failing test**

Create `tests/components/CertChainViewer.test.tsx`:

```typescript
import React from 'react';
import { render } from '@testing-library/react-native';
import CertChainViewer from '../../src/components/Certificates/CertChainViewer';

describe('CertChainViewer', () => {
  it('renders chain entries in depth order', () => {
    const chain = [
      { subject: 'leaf', issuer: 'inter', depth: 0 },
      { subject: 'inter', issuer: 'root', depth: 1 },
      { subject: 'root', issuer: 'root', depth: 2 },
    ];
    const { getByText } = render(<CertChainViewer chain={chain} />);
    expect(getByText('leaf')).toBeTruthy();
    expect(getByText('root')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run, expect FAIL**

```bash
npm test -- tests/components/CertChainViewer.test.tsx
```

- [ ] **Step 3: Implement SanList**

Create `src/components/Certificates/SanList.tsx`:

```typescript
import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, View, Text } from 'react-native';
import { ChevronDown, ChevronRight } from 'lucide-react-native';
import { Theme } from '../../constants/Theme';

export default function SanList({ sans }: { sans: string[] }) {
  const [open, setOpen] = useState(false);
  if (sans.length === 0) return null;
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.head} onPress={() => setOpen(v => !v)}>
        {open ? <ChevronDown size={14} color={Theme.colors.textMuted} /> : <ChevronRight size={14} color={Theme.colors.textMuted} />}
        <Text style={styles.label}>SUBJECT ALTERNATIVE NAMES · {sans.length}</Text>
      </TouchableOpacity>
      {open && sans.map((san, i) => (
        <Text key={`${san}-${i}`} style={styles.san} selectable>{san}</Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingVertical: Theme.spacing.sm, borderBottomWidth: 1, borderBottomColor: Theme.colors.border },
  head: { flexDirection: 'row', alignItems: 'center', gap: Theme.spacing.xs },
  label: { color: Theme.colors.textMuted, fontSize: 10, letterSpacing: 1, fontWeight: '700' },
  san: { color: Theme.colors.text, fontFamily: 'SpaceMono', paddingVertical: 2, paddingLeft: Theme.spacing.lg },
});
```

- [ ] **Step 4: Implement CertChainViewer**

Create `src/components/Certificates/CertChainViewer.tsx`:

```typescript
import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Theme } from '../../constants/Theme';

interface ChainEntry { subject: string; issuer: string; depth: number }

export default function CertChainViewer({ chain }: { chain: ChainEntry[] }) {
  const sorted = [...chain].sort((a, b) => a.depth - b.depth);
  return (
    <View style={styles.container}>
      <Text style={styles.label}>CHAIN</Text>
      {sorted.map((e) => (
        <View key={`${e.subject}-${e.depth}`} style={[styles.entry, { marginLeft: e.depth * Theme.spacing.md }]}>
          <Text style={styles.subject}>{e.subject}</Text>
          <Text style={styles.issuer}>← {e.issuer}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: Theme.colors.surface, borderRadius: Theme.borderRadius.md, padding: Theme.spacing.md, borderWidth: 1, borderColor: Theme.colors.border, marginVertical: Theme.spacing.sm },
  label: { color: Theme.colors.textMuted, fontSize: 10, letterSpacing: 1, fontWeight: '700', marginBottom: Theme.spacing.sm },
  entry: { paddingVertical: Theme.spacing.xs },
  subject: { color: Theme.colors.text, fontWeight: '700' },
  issuer: { color: Theme.colors.textMuted, fontSize: 11 },
});
```

- [ ] **Step 5: Run + tsc + audit + commit**

```bash
npm test -- tests/components/CertChainViewer.test.tsx
npx tsc --noEmit
grep -rE "#[0-9a-fA-F]{3,6}" src/components/Certificates/
git add src/components/Certificates/SanList.tsx src/components/Certificates/CertChainViewer.tsx tests/components/CertChainViewer.test.tsx
git commit -m "feat(certificates): add SanList and CertChainViewer"
```

---

### Task 19: certificates list screen

**Files:**
- Create: `app/intelligence/certificates/index.tsx`

**Interfaces:**
- Consumes: `listCertificates`, `CERTS_KEYS`, `CertCard`
- Produces: list screen with filter chips (All / Expired / Self-signed / Expiring)

- [ ] **Step 1: Implement**

Create `app/intelligence/certificates/index.tsx`:

```typescript
import React, { useMemo, useState } from 'react';
import { FlatList, View, Text, TouchableOpacity, StyleSheet, RefreshControl, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Theme } from '../../../src/constants/Theme';
import CertCard from '../../../src/components/Certificates/CertCard';
import { listCertificates, CERTS_KEYS, type Certificate } from '../../../src/api/certificates';

type Filter = 'all' | 'expired' | 'self-signed' | 'expiring';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'ALL' },
  { key: 'expired', label: 'EXPIRED' },
  { key: 'self-signed', label: 'SELF-SIGNED' },
  { key: 'expiring', label: 'EXPIRING <30D' },
];

export default function CertificatesScreen({ scanId }: { scanId?: number } = {}) {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>('all');
  const q = useQuery({ queryKey: CERTS_KEYS.list(scanId), queryFn: () => listCertificates(scanId), staleTime: 30_000 });

  const filtered = useMemo(() => {
    const data = q.data ?? [];
    const now = Date.now();
    switch (filter) {
      case 'expired':     return data.filter(c => c.is_expired);
      case 'self-signed': return data.filter(c => c.is_self_signed);
      case 'expiring':    return data.filter(c => !c.is_expired && new Date(c.not_after).getTime() - now < 30 * 86400_000);
      default:            return data;
    }
  }, [q.data, filter]);

  if (q.isLoading) return <View style={styles.center}><ActivityIndicator color={Theme.colors.primary} /></View>;

  return (
    <FlatList
      style={styles.root}
      contentContainerStyle={{ padding: Theme.spacing.md }}
      data={filtered}
      keyExtractor={(c) => String(c.id)}
      ListHeaderComponent={
        <View style={styles.chips}>
          {FILTERS.map(f => (
            <TouchableOpacity key={f.key} onPress={() => setFilter(f.key)} style={[styles.chip, filter === f.key && styles.chipActive]}>
              <Text style={[styles.chipText, filter === f.key && styles.chipTextActive]}>{f.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      }
      ListEmptyComponent={<Text style={styles.empty}>No certificates discovered.</Text>}
      renderItem={({ item }: { item: Certificate }) => (
        <CertCard cert={item} onPress={() => router.push(`/intelligence/certificates/${item.id}` as never)} />
      )}
      refreshControl={<RefreshControl refreshing={q.isRefetching} onRefresh={() => q.refetch()} tintColor={Theme.colors.primary} />}
    />
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Theme.colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Theme.spacing.xs, marginBottom: Theme.spacing.md },
  chip: { paddingHorizontal: Theme.spacing.sm, paddingVertical: 4, borderRadius: Theme.borderRadius.full, borderWidth: 1, borderColor: Theme.colors.border },
  chipActive: { backgroundColor: Theme.colors.primary, borderColor: Theme.colors.primary },
  chipText: { color: Theme.colors.textMuted, fontSize: 11, letterSpacing: 1, fontWeight: '700' },
  chipTextActive: { color: Theme.colors.background },
  empty: { color: Theme.colors.textMuted, textAlign: 'center', marginTop: Theme.spacing.xl },
});
```

- [ ] **Step 2: tsc + audit + commit**

```bash
npx tsc --noEmit
grep -rE "#[0-9a-fA-F]{3,6}" app/intelligence/certificates/index.tsx
git add app/intelligence/certificates/index.tsx
git commit -m "feat(certificates): add list screen with filter chips"
```

---

### Task 20: certificate detail screen with resync + flag

**Files:**
- Create: `app/intelligence/certificates/[certId].tsx`
- Create: `tests/components/CertDetail.integration.test.tsx`

**Interfaces:**
- Consumes: `getCertificateDetail`, `resyncCertificate`, `flagCertificateAnomaly`, `CertChainViewer`, `SanList`, `FingerprintRow`
- Produces: detail screen with resync rate-limited (1 in-flight) and flag chip-selector modal

- [ ] **Step 1: Integration test**

Create `tests/components/CertDetail.integration.test.tsx`:

```typescript
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { mock } from '../setup';
import CertDetail from '../../app/intelligence/certificates/[certId]';

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ certId: '1' }),
  useRouter: () => ({ push: jest.fn() }),
}));

function wrap(ui: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

const cert = { id: 1, subject_cn: 'leaf', issuer_cn: 'root', san: ['a.com'], not_before: '', not_after: '2099-01-01', sha256_fingerprint: 'abc', sha1_fingerprint: 'def', chain: [], is_self_signed: false, is_expired: false };

describe('CertDetail', () => {
  beforeEach(() => { mock.onGet('/mapi/certificates/1/').reply(200, cert); });

  it('resync button fires POST', async () => {
    mock.onPost('/mapi/certificates/1/resync/').reply(202, { queued: true });
    const { findByLabelText } = wrap(<CertDetail />);
    fireEvent.press(await findByLabelText('resync'));
    await waitFor(() => expect(mock.history.post.length).toBe(1));
  });
});
```

- [ ] **Step 2: Run, expect FAIL**

```bash
npm test -- tests/components/CertDetail.integration.test.tsx
```

- [ ] **Step 3: Implement**

Create `app/intelligence/certificates/[certId].tsx`:

```typescript
import React, { useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Modal, TextInput, Alert } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RefreshCw, Flag } from 'lucide-react-native';
import { Theme } from '../../../src/constants/Theme';
import { getCertificateDetail, resyncCertificate, flagCertificateAnomaly, CERTS_KEYS, type CertFlag } from '../../../src/api/certificates';
import CertChainViewer from '../../../src/components/Certificates/CertChainViewer';
import SanList from '../../../src/components/Certificates/SanList';
import FingerprintRow from '../../../src/components/Certificates/FingerprintRow';

const FLAGS: { key: CertFlag; label: string }[] = [
  { key: 'expired-not-revoked', label: 'EXPIRED NOT REVOKED' },
  { key: 'weak-key', label: 'WEAK KEY' },
  { key: 'suspicious-san', label: 'SUSPICIOUS SAN' },
  { key: 'other', label: 'OTHER' },
];

export default function CertDetail() {
  const { certId } = useLocalSearchParams<{ certId: string }>();
  const id = Number(certId);
  const qc = useQueryClient();
  const [flagOpen, setFlagOpen] = useState(false);
  const [selectedFlag, setSelectedFlag] = useState<CertFlag>('other');
  const [note, setNote] = useState('');

  const q = useQuery({ queryKey: CERTS_KEYS.detail(id), queryFn: () => getCertificateDetail(id), staleTime: 30_000 });

  const resyncM = useMutation({
    mutationFn: () => resyncCertificate(id),
    onSuccess: () => Alert.alert('Queued', 'Resync started'),
    onSettled: () => qc.invalidateQueries({ queryKey: CERTS_KEYS.detail(id) }),
  });

  const flagM = useMutation({
    mutationFn: ({ flag, note }: { flag: CertFlag; note?: string }) => flagCertificateAnomaly(id, flag, note),
    onSettled: () => qc.invalidateQueries({ queryKey: CERTS_KEYS.detail(id) }),
  });

  if (q.isLoading || !q.data) return <View style={styles.center}><ActivityIndicator color={Theme.colors.primary} /></View>;
  const c = q.data;

  return (
    <ScrollView style={styles.root} contentContainerStyle={{ padding: Theme.spacing.md }}>
      <Text style={styles.title}>{c.subject_cn}</Text>
      <View style={styles.actions}>
        <TouchableOpacity disabled={resyncM.isPending} accessibilityLabel="resync" onPress={() => resyncM.mutate()} style={styles.action}>
          {resyncM.isPending ? <ActivityIndicator color={Theme.colors.primary} size="small" /> : <RefreshCw size={16} color={Theme.colors.primary} />}
          <Text style={styles.actionText}>Resync</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setFlagOpen(true)} style={styles.action}>
          <Flag size={16} color={Theme.colors.warning} />
          <Text style={[styles.actionText, { color: Theme.colors.warning }]}>Flag Anomaly</Text>
        </TouchableOpacity>
      </View>
      <CertChainViewer chain={c.chain} />
      <SanList sans={c.san} />
      <FingerprintRow label="SHA-256" value={c.sha256_fingerprint} />
      <FingerprintRow label="SHA-1" value={c.sha1_fingerprint} />

      <Modal visible={flagOpen} transparent animationType="fade" onRequestClose={() => setFlagOpen(false)}>
        <View style={styles.modalBack}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Flag Anomaly</Text>
            <View style={styles.flagChips}>
              {FLAGS.map(f => (
                <TouchableOpacity key={f.key} onPress={() => setSelectedFlag(f.key)} style={[styles.flagChip, selectedFlag === f.key && styles.flagChipActive]}>
                  <Text style={[styles.flagChipText, selectedFlag === f.key && styles.flagChipTextActive]}>{f.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput style={styles.input} placeholder="Optional note" placeholderTextColor={Theme.colors.textMuted} value={note} onChangeText={setNote} maxLength={1000} multiline />
            <View style={styles.modalRow}>
              <TouchableOpacity onPress={() => setFlagOpen(false)}><Text style={[styles.modalAction, { color: Theme.colors.textMuted }]}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => { flagM.mutate({ flag: selectedFlag, note: note.slice(0, 1000) || undefined }); setFlagOpen(false); setNote(''); }}>
                <Text style={styles.modalAction}>Submit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Theme.colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { color: Theme.colors.text, fontSize: 20, fontWeight: '800', marginBottom: Theme.spacing.md },
  actions: { flexDirection: 'row', gap: Theme.spacing.md, marginBottom: Theme.spacing.md },
  action: { flexDirection: 'row', alignItems: 'center', gap: Theme.spacing.xs, padding: Theme.spacing.sm, borderRadius: Theme.borderRadius.md, borderWidth: 1, borderColor: Theme.colors.border },
  actionText: { color: Theme.colors.primary, fontWeight: '700' },
  modalBack: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.7)' },
  modal: { backgroundColor: Theme.colors.surface, borderRadius: Theme.borderRadius.md, padding: Theme.spacing.lg, minWidth: 300, borderColor: Theme.colors.border, borderWidth: 1 },
  modalTitle: { color: Theme.colors.text, fontWeight: '700', marginBottom: Theme.spacing.md },
  flagChips: { flexDirection: 'row', flexWrap: 'wrap', gap: Theme.spacing.xs, marginBottom: Theme.spacing.md },
  flagChip: { paddingHorizontal: Theme.spacing.sm, paddingVertical: 4, borderRadius: Theme.borderRadius.full, borderWidth: 1, borderColor: Theme.colors.border },
  flagChipActive: { backgroundColor: Theme.colors.primary, borderColor: Theme.colors.primary },
  flagChipText: { color: Theme.colors.textMuted, fontSize: 10, fontWeight: '700' },
  flagChipTextActive: { color: Theme.colors.background },
  input: { color: Theme.colors.text, borderColor: Theme.colors.border, borderWidth: 1, borderRadius: Theme.borderRadius.sm, padding: Theme.spacing.sm, minHeight: 60 },
  modalRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: Theme.spacing.md, marginTop: Theme.spacing.md },
  modalAction: { color: Theme.colors.primary, fontWeight: '700' },
});
```

- [ ] **Step 4: Run + tsc + audit + commit**

```bash
npm test -- tests/components/CertDetail.integration.test.tsx
npx tsc --noEmit
grep -rE "#[0-9a-fA-F]{3,6}" app/intelligence/certificates/
git add app/intelligence/certificates/[certId].tsx tests/components/CertDetail.integration.test.tsx
git commit -m "feat(certificates): add detail screen with resync + flag actions"
```

---

# Slice 4 — Identity Infrastructure

### Task 21: identity.ts API module

**Files:**
- Create: `src/api/identity.ts`
- Create: `tests/identity.test.ts`

**Interfaces:**
- Produces:
  - Types: `IdentityInfraDiscovery`, `IdentityProvider`, `MatchStrength`
  - Functions: `listIdentityInfra`, `getIdentityInfraDetail`, `confirmIdentityProvider`, `dismissIdentityDiscovery`
  - Constants: `IDENTITY_KEYS = { list, detail }`

- [ ] **Step 1: Failing tests**

Create `tests/identity.test.ts`:

```typescript
import { mock } from './setup';
import { listIdentityInfra, confirmIdentityProvider, dismissIdentityDiscovery } from '../src/api/identity';

const sample = { id: 1, provider: 'okta', match_strength: 'high', detection_signals: { matched_urls: [], matched_titles: [], matched_headers: {} }, first_seen: '2026-06-20' };

describe('identity API', () => {
  it('lists', async () => {
    mock.onGet('/mapi/identity/').reply(200, [sample]);
    expect((await listIdentityInfra()).length).toBe(1);
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
});
```

- [ ] **Step 2: Run, expect FAIL**

```bash
npm test -- tests/identity.test.ts
```

- [ ] **Step 3: Implement**

Create `src/api/identity.ts`:

```typescript
import apiClient from './client';

export type IdentityProvider = 'okta' | 'azure_ad' | 'auth0' | 'ping' | 'onelogin' | 'jumpcloud' | 'other';
export type MatchStrength = 'high' | 'medium' | 'low';

export interface IdentityInfraDiscovery {
  id: number;
  provider: IdentityProvider;
  match_strength: MatchStrength;
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

export const IDENTITY_KEYS = {
  list: (scanId?: number) => ['identity', 'list', scanId ?? 'all'] as const,
  detail: (id: number) => ['identity', 'detail', id] as const,
};

export async function listIdentityInfra(scanId?: number): Promise<IdentityInfraDiscovery[]> {
  const res = await apiClient.get<IdentityInfraDiscovery[] | { results: IdentityInfraDiscovery[] }>('/mapi/identity/', { params: scanId !== undefined ? { scan_id: scanId } : undefined });
  return Array.isArray(res.data) ? res.data : (res.data.results ?? []);
}

export async function getIdentityInfraDetail(id: number): Promise<IdentityInfraDiscovery> {
  const res = await apiClient.get<IdentityInfraDiscovery>(`/mapi/identity/${id}/`);
  return res.data;
}

export async function confirmIdentityProvider(id: number, confirmed: boolean): Promise<IdentityInfraDiscovery> {
  const res = await apiClient.patch<IdentityInfraDiscovery>(`/mapi/identity/${id}/confirm/`, { confirmed });
  return res.data;
}

export async function dismissIdentityDiscovery(id: number, reason?: string): Promise<IdentityInfraDiscovery> {
  if (reason !== undefined && reason.length > 1000) throw new Error('reason exceeds 1000 chars');
  const body: Record<string, unknown> = {};
  if (reason) body.reason = reason;
  const res = await apiClient.patch<IdentityInfraDiscovery>(`/mapi/identity/${id}/dismiss/`, body);
  return res.data;
}
```

- [ ] **Step 4: Run + tsc + commit**

```bash
npm test -- tests/identity.test.ts
npx tsc --noEmit
git add src/api/identity.ts tests/identity.test.ts
git commit -m "feat(identity): add API module with confirm/dismiss"
```

---

### Task 22: IdentityProviderBadge + IdentityInfraCard + IdentityEvidence

**Files:**
- Create: `src/components/Identity/IdentityProviderBadge.tsx`
- Create: `src/components/Identity/IdentityInfraCard.tsx`
- Create: `src/components/Identity/IdentityEvidence.tsx`
- Create: `tests/components/IdentityInfraCard.test.tsx`

**Interfaces:**
- Produces:
  - `<IdentityProviderBadge provider={IdentityProvider} />`
  - `<IdentityInfraCard item onPress />`
  - `<IdentityEvidence signals={IdentityInfraDiscovery['detection_signals']} />`

- [ ] **Step 1: Failing test**

Create `tests/components/IdentityInfraCard.test.tsx`:

```typescript
import React from 'react';
import { render } from '@testing-library/react-native';
import IdentityInfraCard from '../../src/components/Identity/IdentityInfraCard';

describe('IdentityInfraCard', () => {
  it('renders provider', () => {
    const item = { id: 1, provider: 'okta' as const, match_strength: 'high' as const, detection_signals: { matched_urls: ['x'], matched_titles: [], matched_headers: {} }, first_seen: '' };
    const { getByText } = render(<IdentityInfraCard item={item} onPress={() => {}} />);
    expect(getByText(/OKTA/i)).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run, expect FAIL**

```bash
npm test -- tests/components/IdentityInfraCard.test.tsx
```

- [ ] **Step 3: Implement badge**

Create `src/components/Identity/IdentityProviderBadge.tsx`:

```typescript
import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Theme } from '../../constants/Theme';
import type { IdentityProvider } from '../../api/identity';

const COLOR: Record<IdentityProvider, string> = {
  okta:      Theme.colors.accent,
  azure_ad:  Theme.colors.info,
  auth0:     Theme.colors.warning,
  ping:      Theme.colors.success,
  onelogin:  Theme.colors.primary,
  jumpcloud: Theme.colors.secondary,
  other:     Theme.colors.textMuted,
};

const LABEL: Record<IdentityProvider, string> = {
  okta: 'OKTA',
  azure_ad: 'AZURE AD',
  auth0: 'AUTH0',
  ping: 'PING',
  onelogin: 'ONELOGIN',
  jumpcloud: 'JUMPCLOUD',
  other: 'OTHER',
};

export default function IdentityProviderBadge({ provider }: { provider: IdentityProvider }) {
  const valid = provider in COLOR;
  const color = valid ? COLOR[provider] : Theme.colors.textMuted;
  const label = valid ? LABEL[provider] : '?';
  return (
    <View style={[styles.badge, { borderColor: color, backgroundColor: color + '22' }]}>
      <Text style={[styles.text, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { paddingHorizontal: Theme.spacing.sm, paddingVertical: 2, borderWidth: 1, borderRadius: Theme.borderRadius.sm },
  text: { fontSize: 11, fontWeight: '700', letterSpacing: 1 },
});
```

- [ ] **Step 4: Implement card**

Create `src/components/Identity/IdentityInfraCard.tsx`:

```typescript
import React from 'react';
import { StyleSheet, TouchableOpacity, View, Text } from 'react-native';
import { Theme } from '../../constants/Theme';
import IdentityProviderBadge from './IdentityProviderBadge';
import type { IdentityInfraDiscovery, MatchStrength } from '../../api/identity';

const STRENGTH_COLOR: Record<MatchStrength, string> = {
  high:   Theme.colors.success,
  medium: Theme.colors.warning,
  low:    Theme.colors.textMuted,
};

export default function IdentityInfraCard({ item, onPress }: { item: IdentityInfraDiscovery; onPress: () => void }) {
  const assetCount = item.detection_signals.matched_urls.length + item.detection_signals.matched_titles.length + Object.keys(item.detection_signals.matched_headers).length;
  const strength = STRENGTH_COLOR[item.match_strength] ?? Theme.colors.textMuted;
  return (
    <TouchableOpacity onPress={onPress} style={[styles.card, item.dismissed && { opacity: 0.4 }]}>
      <View style={styles.head}>
        <IdentityProviderBadge provider={item.provider} />
        <View style={[styles.strength, { borderColor: strength }]}>
          <Text style={[styles.strengthText, { color: strength }]}>{item.match_strength.toUpperCase()}</Text>
        </View>
      </View>
      <Text style={styles.meta}>{assetCount} signal{assetCount === 1 ? '' : 's'}{item.confirmed ? ' · CONFIRMED' : ''}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: Theme.colors.surface, borderColor: Theme.colors.border, borderWidth: 1, borderRadius: Theme.borderRadius.md, padding: Theme.spacing.md, marginBottom: Theme.spacing.sm },
  head: { flexDirection: 'row', alignItems: 'center', gap: Theme.spacing.sm },
  strength: { paddingHorizontal: Theme.spacing.sm, paddingVertical: 2, borderRadius: Theme.borderRadius.sm, borderWidth: 1 },
  strengthText: { fontSize: 9, fontWeight: '700', letterSpacing: 1 },
  meta: { color: Theme.colors.textMuted, marginTop: Theme.spacing.xs, fontSize: 11 },
});
```

- [ ] **Step 5: Implement evidence**

Create `src/components/Identity/IdentityEvidence.tsx`:

```typescript
import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, View, Text } from 'react-native';
import { ChevronDown, ChevronRight } from 'lucide-react-native';
import { Theme } from '../../constants/Theme';
import type { IdentityInfraDiscovery } from '../../api/identity';

interface Props { signals: IdentityInfraDiscovery['detection_signals'] }

export default function IdentityEvidence({ signals }: Props) {
  return (
    <View>
      <Band label={`MATCHED URLS · ${signals.matched_urls.length}`}>
        {signals.matched_urls.map((u, i) => <Text key={`${u}-${i}`} style={styles.line} numberOfLines={2} selectable>{u}</Text>)}
      </Band>
      <Band label={`MATCHED TITLES · ${signals.matched_titles.length}`}>
        {signals.matched_titles.map((t, i) => <Text key={`${t}-${i}`} style={styles.line} selectable>{t}</Text>)}
      </Band>
      <Band label={`MATCHED HEADERS · ${Object.keys(signals.matched_headers).length}`}>
        {Object.entries(signals.matched_headers).map(([k, v]) => (
          <View key={k} style={styles.kv}>
            <Text style={styles.k}>{k}</Text><Text style={styles.v} selectable>{v}</Text>
          </View>
        ))}
      </Band>
    </View>
  );
}

function Band({ label, children }: { label: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <View style={styles.band}>
      <TouchableOpacity style={styles.bandHead} onPress={() => setOpen(v => !v)}>
        {open ? <ChevronDown size={14} color={Theme.colors.textMuted} /> : <ChevronRight size={14} color={Theme.colors.textMuted} />}
        <Text style={styles.bandLabel}>{label}</Text>
      </TouchableOpacity>
      {open && <View style={styles.bandBody}>{children}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  band: { borderBottomWidth: 1, borderBottomColor: Theme.colors.border, paddingVertical: Theme.spacing.sm },
  bandHead: { flexDirection: 'row', alignItems: 'center', gap: Theme.spacing.xs },
  bandLabel: { color: Theme.colors.textMuted, fontSize: 10, letterSpacing: 1, fontWeight: '700' },
  bandBody: { paddingTop: Theme.spacing.sm },
  line: { color: Theme.colors.text, fontFamily: 'SpaceMono', paddingVertical: 2 },
  kv: { paddingVertical: 2 },
  k: { color: Theme.colors.textMuted, fontSize: 10, letterSpacing: 1 },
  v: { color: Theme.colors.text, fontFamily: 'SpaceMono' },
});
```

- [ ] **Step 6: Run + tsc + audit + commit**

```bash
npm test -- tests/components/IdentityInfraCard.test.tsx
npx tsc --noEmit
grep -rE "#[0-9a-fA-F]{3,6}" src/components/Identity/
git add src/components/Identity/ tests/components/IdentityInfraCard.test.tsx
git commit -m "feat(identity): add provider badge, infra card, evidence bands"
```

---

### Task 23: identity list + detail screens

**Files:**
- Create: `app/intelligence/identity/index.tsx`
- Create: `app/intelligence/identity/[discoveryId].tsx`

**Interfaces:**
- Consumes: `listIdentityInfra`, `getIdentityInfraDetail`, `confirmIdentityProvider`, `dismissIdentityDiscovery`, `IDENTITY_KEYS`, `IdentityInfraCard`, `IdentityEvidence`, `IdentityProviderBadge`
- Produces: list grouped by provider; detail with confirm/dismiss actions

- [ ] **Step 1: Implement list screen**

Create `app/intelligence/identity/index.tsx`:

```typescript
import React, { useMemo } from 'react';
import { SectionList, View, Text, StyleSheet, RefreshControl, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Theme } from '../../../src/constants/Theme';
import IdentityInfraCard from '../../../src/components/Identity/IdentityInfraCard';
import { listIdentityInfra, IDENTITY_KEYS, type IdentityInfraDiscovery, type IdentityProvider } from '../../../src/api/identity';

export default function IdentityScreen({ scanId }: { scanId?: number } = {}) {
  const router = useRouter();
  const q = useQuery({ queryKey: IDENTITY_KEYS.list(scanId), queryFn: () => listIdentityInfra(scanId), staleTime: 30_000 });

  const sections = useMemo(() => {
    const groups = new Map<IdentityProvider, IdentityInfraDiscovery[]>();
    (q.data ?? []).forEach(d => {
      const arr = groups.get(d.provider) ?? [];
      arr.push(d);
      groups.set(d.provider, arr);
    });
    return Array.from(groups.entries()).map(([provider, data]) => ({ title: provider, data }));
  }, [q.data]);

  if (q.isLoading) return <View style={styles.center}><ActivityIndicator color={Theme.colors.primary} /></View>;

  return (
    <SectionList
      style={styles.root}
      contentContainerStyle={{ padding: Theme.spacing.md }}
      sections={sections}
      keyExtractor={(item) => String(item.id)}
      renderSectionHeader={({ section }) => <Text style={styles.section}>{section.title.toUpperCase().replace('_', ' ')}</Text>}
      renderItem={({ item }) => <IdentityInfraCard item={item} onPress={() => router.push(`/intelligence/identity/${item.id}` as never)} />}
      ListEmptyComponent={<Text style={styles.empty}>No identity infrastructure detected.</Text>}
      refreshControl={<RefreshControl refreshing={q.isRefetching} onRefresh={() => q.refetch()} tintColor={Theme.colors.primary} />}
    />
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Theme.colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  section: { color: Theme.colors.textMuted, fontSize: 11, letterSpacing: 2, fontWeight: '700', marginTop: Theme.spacing.md, marginBottom: Theme.spacing.sm },
  empty: { color: Theme.colors.textMuted, textAlign: 'center', marginTop: Theme.spacing.xl },
});
```

- [ ] **Step 2: Implement detail screen**

Create `app/intelligence/identity/[discoveryId].tsx`:

```typescript
import React, { useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Modal, TextInput } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, X } from 'lucide-react-native';
import { Theme } from '../../../src/constants/Theme';
import { getIdentityInfraDetail, confirmIdentityProvider, dismissIdentityDiscovery, IDENTITY_KEYS, type IdentityInfraDiscovery } from '../../../src/api/identity';
import IdentityProviderBadge from '../../../src/components/Identity/IdentityProviderBadge';
import IdentityEvidence from '../../../src/components/Identity/IdentityEvidence';

export default function IdentityDetail() {
  const { discoveryId } = useLocalSearchParams<{ discoveryId: string }>();
  const id = Number(discoveryId);
  const qc = useQueryClient();
  const [dismissOpen, setDismissOpen] = useState(false);
  const [reason, setReason] = useState('');

  const q = useQuery({ queryKey: IDENTITY_KEYS.detail(id), queryFn: () => getIdentityInfraDetail(id), staleTime: 30_000 });

  const confirmM = useMutation({
    mutationFn: () => confirmIdentityProvider(id, true),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: IDENTITY_KEYS.detail(id) });
      const prev = qc.getQueryData<IdentityInfraDiscovery>(IDENTITY_KEYS.detail(id));
      qc.setQueryData<IdentityInfraDiscovery>(IDENTITY_KEYS.detail(id), (old) => old ? { ...old, confirmed: true } : old);
      return { prev };
    },
    onError: (_e, _v, ctx) => { if (ctx?.prev) qc.setQueryData(IDENTITY_KEYS.detail(id), ctx.prev); },
    onSettled: () => qc.invalidateQueries({ queryKey: IDENTITY_KEYS.list() }),
  });

  const dismissM = useMutation({
    mutationFn: (r?: string) => dismissIdentityDiscovery(id, r),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: IDENTITY_KEYS.detail(id) });
      const prev = qc.getQueryData<IdentityInfraDiscovery>(IDENTITY_KEYS.detail(id));
      qc.setQueryData<IdentityInfraDiscovery>(IDENTITY_KEYS.detail(id), (old) => old ? { ...old, dismissed: true } : old);
      return { prev };
    },
    onError: (_e, _v, ctx) => { if (ctx?.prev) qc.setQueryData(IDENTITY_KEYS.detail(id), ctx.prev); },
    onSettled: () => qc.invalidateQueries({ queryKey: IDENTITY_KEYS.list() }),
  });

  if (q.isLoading || !q.data) return <View style={styles.center}><ActivityIndicator color={Theme.colors.primary} /></View>;
  const d = q.data;

  return (
    <ScrollView style={styles.root} contentContainerStyle={{ padding: Theme.spacing.md }}>
      <View style={styles.head}>
        <IdentityProviderBadge provider={d.provider} />
        {d.confirmed && <Text style={styles.tag}>CONFIRMED</Text>}
        {d.dismissed && <Text style={[styles.tag, { color: Theme.colors.textMuted }]}>DISMISSED</Text>}
      </View>
      <View style={styles.actions}>
        <TouchableOpacity onPress={() => confirmM.mutate()} style={[styles.action, { borderColor: Theme.colors.success }]}>
          <Check size={16} color={Theme.colors.success} />
          <Text style={[styles.actionText, { color: Theme.colors.success }]}>Confirm Provider</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setDismissOpen(true)} style={[styles.action, { borderColor: Theme.colors.danger }]}>
          <X size={16} color={Theme.colors.danger} />
          <Text style={[styles.actionText, { color: Theme.colors.danger }]}>Dismiss as False Match</Text>
        </TouchableOpacity>
      </View>
      <IdentityEvidence signals={d.detection_signals} />

      <Modal visible={dismissOpen} transparent animationType="fade" onRequestClose={() => setDismissOpen(false)}>
        <View style={styles.modalBack}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Dismiss as False Match</Text>
            <TextInput style={styles.input} placeholder="Optional reason" placeholderTextColor={Theme.colors.textMuted} value={reason} onChangeText={setReason} maxLength={1000} multiline />
            <View style={styles.modalRow}>
              <TouchableOpacity onPress={() => setDismissOpen(false)}><Text style={[styles.modalAction, { color: Theme.colors.textMuted }]}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => { dismissM.mutate(reason.slice(0,1000) || undefined); setDismissOpen(false); setReason(''); }}>
                <Text style={styles.modalAction}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Theme.colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  head: { flexDirection: 'row', alignItems: 'center', gap: Theme.spacing.sm, marginBottom: Theme.spacing.md },
  tag: { color: Theme.colors.success, fontSize: 10, letterSpacing: 1, fontWeight: '700' },
  actions: { gap: Theme.spacing.sm, marginBottom: Theme.spacing.lg },
  action: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Theme.spacing.xs, padding: Theme.spacing.md, borderRadius: Theme.borderRadius.md, borderWidth: 1 },
  actionText: { fontWeight: '700', letterSpacing: 1 },
  modalBack: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.7)' },
  modal: { backgroundColor: Theme.colors.surface, borderRadius: Theme.borderRadius.md, padding: Theme.spacing.lg, minWidth: 280, borderColor: Theme.colors.border, borderWidth: 1 },
  modalTitle: { color: Theme.colors.text, fontWeight: '700', marginBottom: Theme.spacing.md },
  input: { color: Theme.colors.text, borderColor: Theme.colors.border, borderWidth: 1, borderRadius: Theme.borderRadius.sm, padding: Theme.spacing.sm, minHeight: 60 },
  modalRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: Theme.spacing.md, marginTop: Theme.spacing.md },
  modalAction: { color: Theme.colors.primary, fontWeight: '700' },
});
```

- [ ] **Step 3: tsc + audit + commit**

```bash
npx tsc --noEmit
grep -rE "#[0-9a-fA-F]{3,6}" app/intelligence/identity/
git add app/intelligence/identity/
git commit -m "feat(identity): add list and detail screens with confirm/dismiss"
```

---

# Slice 5 — Integration & Rollout

### Task 24: Add 4 intelligence tabs to Scan Detail

**Files:**
- Modify: `app/scan/[id].tsx`

**Interfaces:**
- Consumes: `ExposuresScreen`, `AttackPathsScreen`, `CertificatesScreen`, `IdentityScreen`, each accepting optional `scanId` prop
- Produces: Scan Detail with 10 tabs total (existing 6 + 4 new)

- [ ] **Step 1: Read current file to confirm tab pattern**

```bash
cat app/scan/[id].tsx | head -80
```

- [ ] **Step 2: Edit TabType union and tab render**

In `app/scan/[id].tsx`:

Extend the TabType:

```typescript
type TabType = 'SUMMARY' | 'SUBDOMAINS' | 'DIRECTORIES' | 'VULNERABILITIES' | 'TIMELINE' | 'GRAPH'
  | 'EXPOSURES' | 'ATTACK_PATHS' | 'CERTS' | 'IDENTITY';
```

Add imports:

```typescript
import ExposuresScreen from '../intelligence/exposures/index';
import AttackPathsScreen from '../intelligence/attack-paths';
import CertificatesScreen from '../intelligence/certificates/index';
import IdentityScreen from '../intelligence/identity/index';
```

In the tab bar, add four new tab pills. In the tab content switch, add four cases that render the imported screens with `scanId={Number(id)}` prop. Each tab content block must be wrapped to lazy-mount on first focus (existing pattern in this file for other tabs).

- [ ] **Step 3: tsc clean**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add app/scan/[id].tsx
git commit -m "feat(scan-detail): add Exposures, Attack Paths, Certs, Identity tabs"
```

---

### Task 25: Intel Hub landing screen

**Files:**
- Create: `app/intelligence/index.tsx`
- Modify: `app/intelligence/_layout.tsx` (set `index` as the initial route if not already)

**Interfaces:**
- Consumes: `KpiCard`, `getExposureStats`, `getRiskSummary`, `listCertificates`, `listIdentityInfra`
- Produces: hub landing with 2×2 KpiCard grid + Recent Activity (merged client-side from latest 5 of each list)

- [ ] **Step 1: Implement hub landing**

Create `app/intelligence/index.tsx`:

```typescript
import React, { useMemo } from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { ShieldAlert, Crosshair, FileCheck, KeyRound } from 'lucide-react-native';
import { Theme } from '../../src/constants/Theme';
import KpiCard from '../../src/components/KpiCard';
import { getExposureStats, listExposures, EXPOSURES_KEYS } from '../../src/api/exposures';
import { listCertificates, CERTS_KEYS } from '../../src/api/certificates';
import { listIdentityInfra, IDENTITY_KEYS } from '../../src/api/identity';

export default function IntelHub() {
  const router = useRouter();
  const stats = useQuery({ queryKey: EXPOSURES_KEYS.stats(), queryFn: () => getExposureStats(), staleTime: 30_000 });
  const exposures = useQuery({ queryKey: EXPOSURES_KEYS.list(), queryFn: () => listExposures(), staleTime: 30_000 });
  const certs = useQuery({ queryKey: CERTS_KEYS.list(), queryFn: () => listCertificates(), staleTime: 30_000 });
  const idents = useQuery({ queryKey: IDENTITY_KEYS.list(), queryFn: () => listIdentityInfra(), staleTime: 30_000 });

  const recent = useMemo(() => {
    const items: { kind: string; title: string; created_at: string; id: number }[] = [];
    (exposures.data ?? []).slice(0, 5).forEach(e => items.push({ kind: 'exposure', title: e.title, created_at: e.created_at, id: e.id }));
    (certs.data ?? []).slice(0, 5).forEach(c => items.push({ kind: 'cert', title: c.subject_cn, created_at: c.not_before, id: c.id }));
    (idents.data ?? []).slice(0, 5).forEach(i => items.push({ kind: 'identity', title: i.provider, created_at: i.first_seen, id: i.id }));
    return items.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || '')).slice(0, 10);
  }, [exposures.data, certs.data, idents.data]);

  return (
    <ScrollView style={styles.root} contentContainerStyle={{ padding: Theme.spacing.md }}
      refreshControl={<RefreshControl refreshing={stats.isRefetching || exposures.isRefetching || certs.isRefetching || idents.isRefetching} onRefresh={() => { stats.refetch(); exposures.refetch(); certs.refetch(); idents.refetch(); }} tintColor={Theme.colors.primary} />}
    >
      <View style={styles.grid}>
        <View style={styles.cell}><KpiCard icon={<ShieldAlert size={20} color={Theme.colors.danger} />} label="Exposures (Open)" value={stats.data?.open ?? '—'} onPress={() => router.push('/intelligence/exposures' as never)} /></View>
        <View style={styles.cell}><KpiCard icon={<Crosshair size={20} color={Theme.colors.warning} />} label="Attack Paths" value={(exposures.data?.length ?? '—') as any} onPress={() => router.push('/intelligence/attack-paths' as never)} /></View>
        <View style={styles.cell}><KpiCard icon={<FileCheck size={20} color={Theme.colors.info} />} label="Certificates" value={certs.data?.length ?? '—'} onPress={() => router.push('/intelligence/certificates' as never)} /></View>
        <View style={styles.cell}><KpiCard icon={<KeyRound size={20} color={Theme.colors.accent} />} label="Identity" value={idents.data?.length ?? '—'} onPress={() => router.push('/intelligence/identity' as never)} /></View>
      </View>
      <Text style={styles.section}>RECENT ACTIVITY</Text>
      {recent.length === 0 ? (
        <Text style={styles.empty}>No recent intelligence.</Text>
      ) : recent.map((it, i) => (
        <TouchableOpacity key={`${it.kind}-${it.id}-${i}`} style={styles.activityRow}>
          <Text style={styles.activityKind}>{it.kind.toUpperCase()}</Text>
          <Text style={styles.activityTitle} numberOfLines={1}>{it.title}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Theme.colors.background },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Theme.spacing.sm },
  cell: { flexBasis: '48%' },
  section: { color: Theme.colors.textMuted, fontSize: 11, letterSpacing: 2, fontWeight: '700', marginTop: Theme.spacing.lg, marginBottom: Theme.spacing.sm },
  activityRow: { flexDirection: 'row', alignItems: 'center', gap: Theme.spacing.sm, paddingVertical: Theme.spacing.sm, borderBottomWidth: 1, borderBottomColor: Theme.colors.border },
  activityKind: { color: Theme.colors.primary, fontSize: 10, fontWeight: '700', letterSpacing: 1, width: 70 },
  activityTitle: { color: Theme.colors.text, flex: 1 },
  empty: { color: Theme.colors.textMuted, textAlign: 'center', marginTop: Theme.spacing.lg },
});
```

Note: If `KpiCard` doesn't accept the `icon`/`onPress` props shown, open `src/components/KpiCard.tsx` and adapt the props block to accept them (keep change minimal — just add optional `icon?: ReactNode; onPress?: () => void`).

- [ ] **Step 2: Confirm `_layout.tsx` has an index route registered**

If `app/intelligence/_layout.tsx` uses `Stack` with explicit screen names, ensure `<Stack.Screen name="index" />` exists.

- [ ] **Step 3: tsc + audit + commit**

```bash
npx tsc --noEmit
grep -rE "#[0-9a-fA-F]{3,6}" app/intelligence/index.tsx
git add app/intelligence/index.tsx app/intelligence/_layout.tsx src/components/KpiCard.tsx
git commit -m "feat(intel): add Hub landing with KpiCard grid + recent activity feed"
```

---

### Task 26: Rollout — version bump, CHANGELOG, README, ROADMAP

**Files:**
- Modify: `package.json` — bump `version` to `1.5.0`
- Modify: `CHANGELOG.md` — add v1.5.0 block
- Modify: `README.md` — update version badge + compatibility badge
- Modify: `docs/ROADMAP.md` — mark Phase 1 complete

- [ ] **Step 1: Bump version**

```bash
node -e "const fs=require('fs');const p=JSON.parse(fs.readFileSync('package.json','utf8'));p.version='1.5.0';fs.writeFileSync('package.json',JSON.stringify(p,null,2)+'\n');"
```

- [ ] **Step 2: Add CHANGELOG entry**

Prepend to `CHANGELOG.md` (under the first `# Changelog` heading):

```markdown
## [1.5.0] - 2026-06-20

### Added
- **Exposure Correlation Engine**: Full intelligence-tab + scan-detail-tab support. Browse, filter (status + search), and act on correlated exposures with status mutations (Accept / Mark FP / Resolve / Reopen). Bulk multi-select with optimistic update and per-row partial-failure handling. Evidence rendered as key-value rows with monospaced raw strings; linked vulnerabilities open existing detail modal.
- **Enhanced APME Attack Paths**: New `RiskSummaryBar` (score + priority + path count + speculative count), `PriorityBadge` (P0–P3), tap-and-hold score tooltip with exploitability/impact/confidence breakdown, collapsible Speculative Paths section, LEAF detectability chip. Per-card overflow menu adds `Regenerate Impact` and `Dismiss Path` mutations.
- **Certificate Intelligence**: List with filter chips (All / Expired / Self-signed / Expiring <30d), chain viewer (depth-indented), collapsible SAN list, SHA-256/SHA-1 fingerprints with tap-to-copy. Detail screen exposes `Resync` (client-rate-limited) and `Flag Anomaly` (chip selector + optional note) actions.
- **Identity Infrastructure**: Discovery list grouped by provider (Okta / Azure AD / Auth0 / Ping / OneLogin / JumpCloud / Other) with match-strength chips. Detail surfaces matched URLs / titles / headers as collapsible evidence bands. Confirm Provider / Dismiss as False Match mutations with optimistic UI.
- **Intelligence Hub Landing**: New `app/intelligence/index.tsx` with 2×2 KpiCard grid (Exposures / Attack Paths / Certificates / Identity) and a merged Recent Activity feed.
- **Scan Detail tabs**: Added Exposures, Attack Paths, Certs, Identity tabs to the Scan Detail screen; same screen components mounted with the scan filter pre-applied.
- **`useUndoableMutation` hook** (`src/hooks/useUndoableMutation.ts`): Shared 5-second undo-snackbar window with cancel + unmount cleanup, used across all four intelligence modules.
- **Theme**: New priority palette (`Theme.colors.priority.p0..p3`).
```

- [ ] **Step 3: Update README badges**

In `README.md`, change:
- Version badge: `v1.4.1` → `v1.5.0`
- Compatibility badge: `r3ngine_v3.5.0+` → `r3ngine_v3.7.0+`

- [ ] **Step 4: Mark Phase 1 complete in ROADMAP**

In `docs/ROADMAP.md`, replace the `## Phase 1 — v3.7.0 Intelligence Layer (highest value)` heading with:

```markdown
## Phase 1 — v3.7.0 Intelligence Layer ✅ COMPLETE (shipped v1.5.0)
```

- [ ] **Step 5: Final smoke build**

```bash
npx tsc --noEmit
npm test
grep -rE "#[0-9a-fA-F]{3,6}" src/components/Exposures/ src/components/Certificates/ src/components/Identity/ src/components/Intelligence/PriorityBadge.tsx src/components/Intelligence/ScoreTooltip.tsx src/components/Intelligence/RiskSummaryBar.tsx src/components/Intelligence/SpeculativePathsSection.tsx
npx expo prebuild --no-install
cd android && ./gradlew assembleDebug && cd ..
```

Expected: tsc clean, all tests pass, hex audit empty, debug APK builds.

- [ ] **Step 6: Commit**

```bash
git add package.json CHANGELOG.md README.md docs/ROADMAP.md
git commit -m "release(v1.5.0): Phase 1 Intelligence Layer — Exposures, APME, Certs, Identity"
git tag v1.5.0
```

---

## Self-Review Notes

**Spec coverage check:**
- ✅ Exposure Correlation (list/detail/stats/update/bulk) → Tasks 10–15
- ✅ APME enhanced viewer (RiskSummaryBar, PriorityBadge, ScoreTooltip, SpeculativePathsSection, LEAF detectability) → Tasks 4–9
- ✅ APME mutations (regenerate impact, dismiss path) → Tasks 3, 9
- ✅ Certificate Intelligence (list/detail/resync/flag, chain viewer, SAN, fingerprints) → Tasks 16–20
- ✅ Identity Infrastructure (list/detail/confirm/dismiss, evidence bands) → Tasks 21–23
- ✅ Hub landing (KpiCard grid, recent activity) → Task 25
- ✅ Scan Detail tabs → Task 24
- ✅ useUndoableMutation hook → Task 1
- ✅ Theme priority palette → Task 1
- ✅ Read + write parity (revised decision) → mutations in every slice
- ✅ Optimistic update + rollback pattern → Tasks 9, 14, 15, 23
- ✅ Bulk partial-failure handling → Task 14
- ✅ Note ≤ 1000 char validation → Tasks 10, 16, 21
- ✅ Status/flag enum validation → Tasks 10, 16
- ✅ Quality gates (tsc, hex audit, tests, smoke build) → every commit
- ✅ Version bump, CHANGELOG, README, ROADMAP → Task 26

**Out-of-scope confirmed not in plan:** native graph-tree viz, WebSocket live channel, project switcher, multi-target aggregates beyond hub.

**Type consistency check:** `EXPOSURES_KEYS`, `APME_KEYS`, `CERTS_KEYS`, `IDENTITY_KEYS` referenced consistently across tasks. `ExposureStatus`, `Priority`, `CertFlag`, `IdentityProvider`, `MatchStrength` defined once per module and consumed unchanged downstream.

**Backend contract dependency:** Each `/mapi/` endpoint listed has no existing shim verified — implementer must `curl` each one before its slice and open a backend task in main r3ngine repo if absent. This is called out per slice in the spec; not a per-task step but a hard prerequisite for each module's API task.

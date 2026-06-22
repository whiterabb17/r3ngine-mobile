# Phase 5 — Settings Expansion, Remote Workers & Multi-Instance Design Spec

**Date:** 2026-06-22  
**Status:** Approved

---

## Overview

Phase 5 closes the final ROADMAP gap by adding ten settings sub-pages to the mobile app and introducing saved-connection multi-instance support. Both features are anchored to the existing Settings tab (`app/(tabs)/settings.tsx`), which already functions as a navigation hub. No structural changes to that tab's pattern are needed — only new rows and a new section.

**Scope constraint (Option C):** Read/write for sub-pages that have a confirmed `/mapi/` endpoint; lightweight stub card ("Configure on web") for the rest.

---

## 1. Multi-Instance Connections

### 1.1 Data Model

A new persisted Zustand store `useInstanceStore` (`src/store/useInstanceStore.ts`) manages saved connections independently of the live session stores.

```typescript
interface Instance {
  id: string;           // uuid (generated client-side)
  label: string;        // user-chosen display name, e.g. "Production", "Lab"
  serverIp: string;     // full base URL, e.g. "http://192.168.1.100:8000"
  token: string | null;
  refreshToken: string | null;
}

interface InstanceStore {
  instances: Instance[];
  currentInstanceId: string | null;
  addInstance(instance: Omit<Instance, 'id'>): string;   // returns new id
  removeInstance(id: string): void;                       // rejects if id === currentInstanceId
  updateTokens(id: string, token: string, refreshToken: string): void;
  switchInstance(id: string): void;
  getCurrentInstance(): Instance | null;
}
```

Persisted via `expo-secure-store` (already installed) using the existing pattern from `useAuthStore`. Instance tokens are sensitive — store under a single encrypted key `r3ngine_instances`.

### 1.2 Session Integration

`switchInstance(id)` writes into the existing live-session stores so `apiClient` needs no changes:

```typescript
switchInstance(id) {
  const inst = instances.find(i => i.id === id);
  if (!inst) return;
  useSettingsStore.getState().setServerIp(inst.serverIp);
  useAuthStore.getState().setTokens(inst.token, inst.refreshToken);
  set({ currentInstanceId: id });
}
```

**Token refresh sync:** `useAuthStore.setTokens` is extended with one line to write refreshed tokens back into the instance store:

```typescript
// inside useAuthStore.setTokens:
useInstanceStore.getState().updateTokens(
  useInstanceStore.getState().currentInstanceId ?? '',
  token,
  refreshToken
);
```

This keeps the stored instance tokens current after background refreshes without touching `apiClient`.

### 1.3 Add Instance Flow

New modal component `src/components/Instances/AddInstanceModal.tsx`:

1. Fields: **Label** (text), **Server URL** (text, validated as `http(s)://...`), **Username**, **Password**
2. On "Connect": POST `${serverUrl}/auth/login/` with `{username, password}`
3. On success: call `addInstance({ label, serverIp: serverUrl, token, refreshToken })` then offer to switch immediately
4. On failure: show inline error, do not save

URL validation: scheme must be `http` or `https`; reject `javascript:`, `data:`, `file:` (security rule 3.2).

### 1.4 Instance Switcher UI

New component `src/components/Instances/InstanceSwitcherModal.tsx` — a bottom-sheet modal identical in structure to `ProjectSwitcherModal`:

- List of saved instances: label, truncated server URL, active checkmark, heartbeat-style age from last-used timestamp
- Tap to switch → calls `switchInstance`, closes modal, reloads root navigator
- "Add Instance" button → opens `AddInstanceModal`
- Long-press or swipe-to-delete → confirmation Alert; cannot delete the currently active instance

### 1.5 Entry Points

- **Settings tab** — new "Instances" row at the very top of the Settings screen, showing the current instance label as the value, opens `InstanceSwitcherModal`
- **Tab header** — the existing project-switcher `headerRight` button is extended to open a two-tab sheet: "Project" (existing) | "Instance" (new); no breaking change to current behavior

---

## 2. Settings Sub-Pages

All screens live under `app/settings/`. Each is a stack screen navigated from new rows in the Settings tab. All follow the existing `SettingRow` / `SwitchRow` / card pattern from `settings.tsx`.

### 2.1 API Layer

New module `src/api/settings.ts` with typed functions for the five endpoint-backed screens:

```typescript
// Remote Workers
getWorkers(): Promise<ScanWorker[]>                             // GET /mapi/workers/
patchWorker(id: number, data: Partial<ScanWorker>): Promise<ScanWorker>  // PATCH /mapi/workers/{id}/

// Tool Arsenal
listTools(): Promise<InstalledTool[]>                          // GET /mapi/listTools/
updateTool(name: string): Promise<{ status: boolean }>        // POST /mapi/tool/update/
uninstallTool(name: string): Promise<{ status: boolean }>     // POST /mapi/tool/uninstall/

// ReNgine Settings
getReNgineSettings(): Promise<ReNgineSettings>                 // GET /mapi/rengine/system-settings/
patchReNgineSettings(data: Partial<ReNgineSettings>): Promise<ReNgineSettings>  // POST /mapi/rengine/system-settings/

// Report Settings
getReportSettings(): Promise<ReportSettings>                   // GET /mapi/report-settings/
patchReportSettings(data: Partial<ReportSettings>): Promise<ReportSettings>  // POST /mapi/report-settings/

// Notification Settings
getNotificationSettings(): Promise<NotificationSettings>      // GET /mapi/notification-settings/
patchNotificationSettings(data: Partial<NotificationSettings>): Promise<{ status: boolean }>  // POST /mapi/notification-settings/
```

Types derived directly from the Django serializers (`ScanWorkerSerializer`, `VulnerabilityReportSettingSerializer`, `NotificationSettingsSerializer`).

### 2.2 Five Full Screens

#### Remote Workers — `app/settings/workers.tsx`

- **Data:** `GET /mapi/workers/` → list of `ScanWorker`
- **Display per card:** name, `task_queue`, IP address, last heartbeat formatted as relative age with color badge:
  - Green: < 5 min ago
  - Amber: 5–30 min ago
  - Red: > 30 min or null
- **Action:** `is_active` toggle → `PATCH /mapi/workers/{id}/` with `{ is_active: !current }`
- **Pull-to-refresh**

#### Tool Arsenal — `app/settings/tools.tsx`

- **Data:** `GET /mapi/listTools/` → list of tools with `name`, `installed_version`, `github_url`; `GET /mapi/external/tool/get_current_release/` per tool for latest version
- **Display:** tool name, installed version, latest version chip (green = current, amber = update available)
- **Actions:**
  - "Update" button (if `installed_version !== latest_version`) → `POST /mapi/tool/update/` with `{ name }` + confirmation Alert
  - "Uninstall" → `POST /mapi/tool/uninstall/` with `{ name }` + destructive confirmation Alert
- **Note:** Latest version fetch is per-tool and may be slow; show a loading placeholder per row

#### ReNgine Settings — `app/settings/rengine-settings.tsx`

- **Data:** `GET /mapi/rengine/system-settings/`
- **Display:**
  - Disk usage bar: used GB / total GB, fill color transitions warning→error at 80%/90%
  - `consumed_percent` numeric label
  - Free space remaining
- **Toggle:** `enable_scan_queueing` → `POST /mapi/rengine/system-settings/` with `{ enable_scan_queueing: !current }`
- **Read-only fields** (no edit on mobile): `total`, `used`, `free`

#### Report Settings — `app/settings/report-settings.tsx`

- **Data:** `GET /mapi/report-settings/`
- **Display/edit:**
  - Company name (text input)
  - Primary color (read-only hex chip — full color picker out of scope)
  - Secondary color (read-only hex chip)
  - `enable_llm_report_generation` toggle
  - `show_executive_summary` toggle
  - `show_footer` toggle
- **Save:** "Save" button → `POST /mapi/report-settings/` with changed fields
- Full `executive_summary_description` textarea is out of scope on mobile (too long)

#### Notification Settings — `app/settings/notification-settings.tsx`

- **Data:** `GET /mapi/notification-settings/`
- **Display/edit per channel:** Slack, Discord, Telegram, Lark
  - Per-channel: `send_to_X` toggle + webhook URL text input (shown only when toggle is on)
- **Event toggles:** `send_scan_status_notif`, `send_interesting_notif`, `send_vuln_notif`, `send_subdomain_changes_notif`
- **"Send Test" button** → `POST /mapi/notification-settings/` with `{ send_test: true }` + current values → shows success/error Alert
- **Save** updates all fields via POST

### 2.3 Five Stub Screens

Each stub uses a shared `SettingsStubCard` component that renders:
- A `Lock` icon
- The sub-page title
- Static text: "Full configuration is available in the r3ngine web interface."
- Optional `ExternalLink` icon linking to the relevant web route (if server URL is known)

Stubs:
- `app/settings/opsec.tsx` — "OpSec Configuration"
- `app/settings/api-vault.tsx` — "API Vault"  
- `app/settings/llm-toolkit.tsx` — "LLM Toolkit"
- `app/settings/tool-settings.tsx` — "Tool Settings" (additionally: a "View Hardware Profiles →" row linking to existing `/profiles` page)
- `app/settings/admin.tsx` — "Admin" with subtitle "User management and system administration"

### 2.4 Settings Tab Changes

**New "Instances" row** at the very top of `settings.tsx`, before the Connection section:

```
INSTANCES
[ Server icon ] Current Instance    "Production"   >
```

**New "Platform Config" section** inserted between "Infrastructure" and "Preferences":

```
PLATFORM CONFIG
[ Workers ]         Remote Workers        >
[ Wrench ]          Tool Arsenal          >
[ Settings ]        ReNgine Settings      >
[ FileText ]        Report Settings       >
[ Bell ]            Notification Settings >
[ Shield ]          OpSec                 >
[ Key ]             API Vault             >
[ Brain ]           LLM Toolkit           >
[ Sliders ]         Tool Settings         >
[ UserCog ]         Admin                 >
```

---

## 3. Component & File Map

**New stores:**
- `src/store/useInstanceStore.ts`

**New API module:**
- `src/api/settings.ts`

**New screens (11 total):**
- `app/settings/workers.tsx`
- `app/settings/tools.tsx`
- `app/settings/rengine-settings.tsx`
- `app/settings/report-settings.tsx`
- `app/settings/notification-settings.tsx`
- `app/settings/opsec.tsx`
- `app/settings/api-vault.tsx`
- `app/settings/llm-toolkit.tsx`
- `app/settings/tool-settings.tsx`
- `app/settings/admin.tsx`

**New components:**
- `src/components/Instances/InstanceSwitcherModal.tsx`
- `src/components/Instances/AddInstanceModal.tsx`
- `src/components/Settings/SettingsStubCard.tsx`

**Modified files:**
- `src/store/useAuthStore.ts` — extend `setTokens` to call `useInstanceStore.updateTokens`
- `app/(tabs)/settings.tsx` — add "Instances" row + "Platform Config" section
- `app/(tabs)/_layout.tsx` — extend `headerRight` to open Instance switcher alongside project switcher

---

## 4. Constraints

- No new npm dependencies
- No version bump (`package.json` stays at `1.6.0`)
- All colors via `Theme.colors.*`
- Instance tokens stored via `expo-secure-store` (already installed)
- URL scheme validation before any network call to a user-supplied server URL (security rule 3.2)
- Raw error messages never shown to the user — console.error + generic Alert (security rule 8.1)
- No Admin CRUD (deferred — no backend `/mapi/admin/` endpoint)

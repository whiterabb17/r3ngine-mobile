# Changelog

All notable changes to **r3ngine Mobile** are documented here.

## [1.6.0] - 2026-06-21

### Added
- **Single Task Retry**: Failed individual scan tasks can now be retried directly from the Scan Detail Timeline tab without re-running the entire scan. A retry button appears inline on any failed task row, dispatching a targeted re-run to the backend and updating the task status in real time.

### Fixed
- **expo-clipboard Dependency**: Corrected `expo-clipboard` to the version compatible with Expo SDK 54 (`~7.0.0`), resolving an R8 build failure caused by a missing `AnyTypeCache` class reference from an incompatible v56 package.
- **Login Error Message Extraction**: Improved error message parsing in the login flow to handle string-body error responses from the backend in addition to the standard `detail` field, reducing "Could not connect" false positives.

---

## [1.5.0] - 2026-06-20

### Added
- **Exposure Correlation Engine**: Full intelligence-tab + scan-detail-tab support. Browse, filter (status + search), and act on correlated exposures with status mutations (Accept / Mark FP / Resolve / Reopen). Bulk multi-select with optimistic update and per-row partial-failure handling. Evidence rendered as key-value rows with monospaced raw strings; linked vulnerabilities open existing detail modal.
- **Enhanced APME Attack Paths**: New `RiskSummaryBar` (score + priority + path count + speculative count), `PriorityBadge` (P0–P3), tap-and-hold score tooltip with exploitability/impact/confidence breakdown, collapsible Speculative Paths section, LEAF detectability chip. Per-card overflow menu adds `Regenerate Impact` and `Dismiss Path` mutations.
- **Certificate Intelligence**: List with filter chips (All / Expired / Self-signed / Expiring <30d), chain viewer (depth-indented), collapsible SAN list, SHA-256/SHA-1 fingerprints with tap-to-copy. Detail screen exposes `Resync` (client-rate-limited) and `Flag Anomaly` (chip selector + optional note) actions.
- **Identity Infrastructure**: Discovery list grouped by provider (Okta / Azure AD / Auth0 / Ping / OneLogin / JumpCloud / Other) with match-strength chips. Detail surfaces matched URLs / titles / headers as collapsible evidence bands. Confirm Provider / Dismiss as False Match mutations with optimistic UI.
- **Intelligence Hub Landing**: New `app/intelligence/index.tsx` with 2×2 KpiCard grid (Exposures / Attack Paths / Certificates / Identity) and a merged Recent Activity feed.
- **Scan Detail tabs**: Added Exposures, Attack Paths, Certs, Identity tabs to the Scan Detail screen (horizontally scrollable tab bar); same screen components mounted with the scan filter pre-applied.
- **`useUndoableMutation` hook** (`src/hooks/useUndoableMutation.ts`): Shared 5-second undo-snackbar window with cancel + unmount cleanup, used across all four intelligence modules.
- **Theme**: New priority palette (`Theme.colors.priority.p0..p3`).

---

## [1.4.1] - 2026-06-12

### Fixed
- **System Log Viewer Double Header**: Removed the duplicate navigation header on the System Observability screen. The redundant "SYSTEM OBSERVABILITY" title rendered by the navigation stack has been removed; the component's own styled header now sits flush at the top. The back button has been relocated into the component header, to the left of the terminal icon, preserving full navigation without visual duplication.

---

## [1.4.0] - 2026-06-12

### Added
- **AI Attack Path Explanations ("Explain This")**: Added an LLM-powered "Explain Path" feature that generates in-depth tactical analyses of attack vectors. Accessible via a dedicated brain icon button on the path detail screen. Persisted in the database to load instantly without regeneration on subsequent views.
- **Enriched Timeline Visualizer**: Replaced the simple vertical list of text nodes with a compromise chain timeline. Renders custom styled badges and severity colors for different node types (Asset, Vulnerability, Capability, Privilege, Credential), CVSS scores, and transitions.
- **Vulnerability Details Modal**: Integrated a details modal inside the Attack Path view. Tapping "VIEW" on any enriched vulnerability node fetches threat intel (Name, Severity, Domain/Target, URL, Description, Impact, Remediation) from `/mapi/listVulnerability/` and displays it.
- **On-Demand Recalculation**: Added a "RE-CALCULATE ATTACK PATHS" action button to the scan Summary Tab. Triggers a backend recalculation workflow and alerts the user upon background execution.

## [1.3.2] - 2026-06-11

### Fixed
- **Subdomains Tab Deduplication**: Implemented a robust deduplication mechanism in the mobile app's Scan Details Subdomains Tab. Duplicate entries across multiple scans are now seamlessly merged into a single cohesive entry, updating and aggregating vulnerability counts, screenshots, and discovered IP addresses without rendering duplicates.

### Added
- **Self-Hosted Background Notifications**: Migrated away from Expo Push Servers and Firebase Cloud Messaging (FCM). Implemented a completely self-hosted headless background polling mechanism using `expo-background-fetch` and `expo-task-manager` that speaks directly to the r3ngine backend, triggering native OS-level local notifications upon finding new alerts.
- **Background Polling Interval Selector**: Replaced the binary push notification toggle in Settings with a custom interval selection modal, allowing users to choose the background polling frequency (Every 15 Minutes, 30 Minutes, or 1 Hour).
- **Timeline Auto-Refresh & Manual Polling**: Added pull-to-refresh (`RefreshControl`) to the scan details Timeline tab. Additionally implemented silent periodic auto-polling every 5 seconds for the entire Scan Details page when a scan is actively running (`status === 1`), ensuring real-time visibility without manual intervention.


## [1.3.0] - 2026-06-05

### Added
- **Hardware Profile Selection (Main Scan Start Wizard)**: Select specific hardware resource profiles (CPU/RAM limits, worker queues) directly when starting a scan.
- **Hardware Profiles Tab (Infrastructure Hub)**: Added a dedicated tab in the mobile app's Infrastructure Hub inline with Engines, Tools, and Wordlists. Fetches profiles securely, displaying thread limits, rate limits, timeouts, request delays, description, and status with accent-colored styling and type guards to prevent layout-sync rendering crashes.
- **JWT WebSocket Authentication (Mobile Logs & Stress Telemetry)**: Appended JWT access tokens (`?token=${token}`) to WebSocket URLs, allowing React Native clients to stream scan and system logs securely.
- **System-Wide Log Viewer**: Designed a premium tactical interface for viewing multiple backend log categories (System, Database, Temporal, Scan). Added support for real-time search filtering, auto-refresh toggles, auto-scroll management, level highlighting, and a Clipboard-integrated log line details modal.
- **Production Build R8 Optimization**: Enabled R8 code minification and resource shrinking for release builds, reducing the final APK size significantly.


### Fixed
- **System Logs Endpoint**: Patched the backend `GetSystemLogs` API to dynamically resolve different log types and return an empty array if log files are not yet created, resolving client 404 errors during startup.
- **ASGI Gunicorn Startup Crash Loop**: Reordered imports inside ASGI routing to configure and setup Django before importing custom middleware or consumers.
- **Allowed Hosts IP/Domain Binding**: Added dynamic host parsing of `DOMAIN_NAME` and frame-level checking in `ALLOWED_HOSTS` to support private/public server IP connections.
- **Nginx HTTP-to-HTTPS Redirection Method Preservation**: Changed redirection status from `301` to `308` in `rengine.conf` on port 8082, preserving `POST` requests.
- **Backend compatibility check**: Upgraded minimum core backend compatibility limit to target `v3.5.0+`.

---

## [1.2.5] - 2026-06-02

### Added
- **Push Notification toggle (Settings)**: The Notifications row in the Preferences section is now a live toggle. Enabling it requests OS permission and registers the device's Expo push token with the backend; disabling it deactivates the token server-side so no further pushes are delivered.
- **Permission-aware Settings flow**: Before requesting the OS permission dialog, the toggle checks `canAskAgain`. If the OS will no longer prompt (permission permanently denied), the user is shown an alert with an **Open Settings** button that deep-links to the app's device notification settings via `Linking.openSettings()`. If permission is granted but the token fetch fails for another reason a distinct error message is shown instead, avoiding a false "Open Settings" prompt.
- **Push preference persistence**: The enabled/disabled choice is stored in `SecureStore` under `push_enabled` and reloaded on every app start. The root layout respects the stored preference — if the user has opted out, auto-registration on login is skipped.
- **Plugin Selection — Main Scan Wizard**: The scan orchestration wizard now includes a dedicated **Step 3: Plugins** step between Advanced Options and the Review screen. Enabled plugins are fetched from the backend and displayed as selectable cards (using the `Puzzle` icon). Users choose which plugins to include per-scan; leaving all unselected means all enabled plugins run (backward compatible). Selected plugin names appear as purple badges on the Review screen.
- **Plugin Selection — Subscan Modal**: The subscan modal now displays a plugin section below the task list (separated by a labelled divider). Each enabled plugin is shown as a task-style card with toggle selection. Selected plugins are included in the subscan payload.
- **`PluginSelector` component** (`src/components/Scan/PluginSelector.tsx`): Reusable plugin card list with selection state, `Puzzle` icon, `CheckCircle2` toggle, and a clean empty state for when no plugins are installed.
- **`listPlugins` API helper** (`src/api/control.ts`): Fetches `/mapi/plugins/` and normalises paginated or flat responses. Plugin fetch failures are caught silently — both modals degrade gracefully to an empty plugin list.

### Fixed
- **Settings footer hardcoded version**: The footer label `reNgine Mobile v1.0.0-alpha` now reads the version dynamically from `package.json`, keeping it automatically in sync with every release bump.

### Backend
- **`DELETE /mapi/push-token/register/`**: New endpoint on `RegisterPushTokenView`. Sets `is_active = False` for all push tokens belonging to the authenticated user, stopping server-side push delivery when the user opts out.
- Plugin selection is passed as `selected_plugins: string[]` in both the initiate-scan and initiate-subtask payloads. The backend routes these as `selected_plugin_slugs` into the Temporal workflow context, filtering `GetEnabledPluginsForTierActivity` to only dispatch the user's chosen plugins.

---

## [1.2.4] - 2026-05-31

### Added
- **Proxy Control — Fetch Limit selector**: New "Fetch Limit" section on the Proxy Control screen with orange preset chips (`5,000` / `10,000` / `25,000`) and a `Custom` chip that reveals a numeric input field. Selected limit is passed to the backend on every "FETCH & UPDATE" call, giving operators full control over how many proxies are scraped per run.
- **Real-Time Log Viewer**: Live streaming log viewer for scan and system logs with full ANSI colour support. WebSocket-backed, renders colour-coded log lines with tactical styling. Accessible via the Observability → System Logs flow.
- **ANSI Parser utility** (`src/utils/ansiParser.ts`) and **AnsiText component** (`src/components/AnsiText.tsx`) for rendering ANSI escape sequences as styled React Native `<Text>` spans.
- **Directories Tab — Push Notifications**: The Directories tab is now fully wired to backend data and emits a push notification on directory discovery events via `expo-notifications`. Added `src/utils/notifications.ts` utility for notification registration and dispatch.

### Fixed
- **Add Target crash (Targets tab)**: The "Add New Target" modal was sending `project_slug` in the POST body but the backend `/mapi/add/target/` endpoint reads `slug`. This caused an unhandled `Project.DoesNotExist` exception on the server, returning a 500 to the app on every attempt. Field renamed to `slug`.

### Build
- **Dynamic APK versioning**: `build:dev` and `build:prod` scripts now read the version from `package.json` at build time (`require('./package.json').version`) instead of hardcoded strings. Both APK filename and checksum call use the same resolved version, so bumping `version` in `package.json` is the only step needed for a release.
- **Fixed `build:prod` checksum invocation**: Replaced an absolute WSL path (`/bin/bash /mnt/d/...`) with the relative `bash .build/...` pattern used by `build:dev`, resolving a `status: 1` crash on Windows when `cmd.exe` could not resolve the Unix absolute path.
- **`build:eas`**: Renamed legacy `build` script to `build:eas` for clarity; EAS cloud builds are now invoked via `npm run build:eas`.

---

## [1.2.3] - 2026-05-30

### Added
- **Infrastructure Management module**: New "Infrastructure" section under System settings with a full Engines management screen. Browse all configured scan engines, view their task assignments, and identify the default engine at a glance (`app/system/engines/index.tsx`).
- **Monitoring Feed — Per-Target Toggle**: The Monitoring feed now includes a settings modal (gear icon) that lists all targets with live `is_monitored` toggles. Changes are applied optimistically with automatic rollback on failure.
- **Monitoring Feed — Filter controls**: Search and severity filter bar on the Monitoring feed screen.
- **Scan Details Dashboard**: Multi-tab scan detail view with real-time management controls (pause, resume, cancel), activity timeline, subdomain tree, and vulnerability summary (`app/(tabs)/scans/[id].tsx`).

### Fixed
- **SubdomainsTab screenshot fallback**: When `screenshot_path` is null, the component now falls back to `screenshots[0]` instead of rendering a broken image slot.

---

## [1.2.2] - 2026-05-29

### Added
- **Real-Time Intelligence Dashboard**: KPI command centre with target, subdomain, endpoint, and vulnerability counts; severity distribution chart; 7-day activity horizon; geo-tactical asset map with CSS-animated markers.
- **Scan Orchestration & Control**: Live scan progress tracking, remote scan initiation and cancellation via the unified StopScan API.
- **Vulnerability Feed**: Real-time feed of newly discovered threats with severity indicators and AI-enhanced reporting links.
- **Secure Credential Storage**: API keys and session tokens stored via Expo SecureStore.

---

## [1.2.1] - 2026-05-28

### Build
- Refactored local build and checksum scripts; introduced `.build/` output directory.

---

## [1.2.0] - 2026-05-27

### Added
- Network security exceptions configured for Android (`network-security-config.xml`) and iOS (`NSAppTransportSecurity`) to support self-signed r3ngine instances on local networks.
- Initial cross-platform release targeting Expo SDK 54 / React Native 0.81.

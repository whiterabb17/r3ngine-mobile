# Changelog

All notable changes to **r3ngine Mobile** are documented here.

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

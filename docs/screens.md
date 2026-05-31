# r3ngine Mobile — Screens Reference

## Tab Screens

### Dashboard (`app/(tabs)/index.tsx`)

The main home screen. Shows:
- **KPI Cards**: Total scans, running scans, vulnerabilities, targets.
- **Animated Activity Badge**: Animated indicator in the header if a scan is running. Tapping routes to the Scans tab.
- **Recent Scans**: List of the last 5 scan results.
- **System Health**: Quick-view of container/worker status.
- **Security Feed**: Latest security news/advisories feed.

**KPI Poll interval:** 30 seconds (via `refetchInterval` on scan status query).

---

### Scans (`app/(tabs)/scans.tsx`)

Lists all scan history records. For each scan:
- Domain name and scan type.
- Start time and duration.
- Status badge: `RUNNING`, `SUCCESS`, `FAILED`, `ABORTED`.
- Progress indicator for running scans.

**Tap a scan** → navigates to `/scan/{id}` (scan detail screen).

---

### Targets (`app/(tabs)/targets.tsx`)

Lists all target domains. For each target:
- Domain name.
- Number of subdomains discovered.
- Last scan date.
- Tag list.

**Tap a target** → navigates to `/target/{id}` (target detail screen).

**Swipe actions:** Start scan, edit, delete.

---

### Tools (`app/(tabs)/tools.tsx`)

Displays the status of installed security tools:
- Tool name and version.
- Health indicator (green = available, red = missing).
- Last updated timestamp.

**Refresh:** Pull-to-refresh triggers a `GET /mapi/tool_versions/` call.

---

### Settings (`app/(tabs)/settings.tsx`)

Configures the app:
- **Server IP**: Text field to update the r3ngine server address.
- **Theme**: Dark/Light toggle (dark is default).
- **Notifications**: Enable/disable push notifications.
- **Diagnostics**: Button → opens `diagnostics.tsx` modal.
- **Logout**: Clears tokens and redirects to login.

---

## Detail Screens

### Scan Detail (`app/scan/[id].tsx`)

Full scan detail view. Tabs:
- **Summary**: Scan metadata, engine, task list, timing.
- **Subdomains**: List of discovered subdomains with status indicators.
- **Vulnerabilities**: Vulnerability list with severity filters.
- **Endpoints**: Discovered URLs and endpoints.
- **Logs**: Real-time streaming log view (WebSocket connection).

---

### Target Detail (`app/target/[id].tsx`)

Target domain detail. Sections:
- **Target Information**: WHOIS, IP addresses, nameservers, history.
- **Scans**: List of all scans run against the target.
- **Vulnerabilities**: Aggregated vulnerabilities across all scans.

---

## Full-Page Screens

### Intelligence (`app/intelligence/index.tsx`)

Threat intelligence dashboard. Shows:
- OSINT-derived information.
- CVE/vulnerability feed relevant to discovered technologies.
- Attack path insights from APME.

---

### Control (`app/control/index.tsx`)

Scan control panel. Allows:
- Starting a new scan (select target, engine).
- Stopping a running scan.
- Scheduling periodic scans.

---

### Feeds (`app/feeds/index.tsx`)

Security news and vulnerability feed reader. Sources configured in the backend.

---

## Modal Screens

### Notifications (`app/notifications/index.tsx`)

In-app notification list. Shows:
- Scan completed notifications.
- Critical vulnerability alerts.
- System health alerts.

**Mark as read:** Swipe or tap the notification.

---

### Diagnostics (`app/diagnostics.tsx`)

System diagnostic view. Shows:
- Server connection status.
- API latency.
- Backend service health (Temporal, PostgreSQL, Redis, Neo4j).
- App version and build number.
- Active JWT token status (expires in N minutes).

---

## `AnimatedActivityBadge` Component

**File:** `src/components/Dashboard/AnimatedActivityBadge.tsx`  
**Docs:** `documentation/AnimatedActivityBadge.md`

An animated pulsing indicator shown in the Dashboard header when a scan is actively running.

- **Color:** Green pulsing dot.
- **Trigger:** `scan_status.is_active === true` (polled every 30s).
- **Tap action:** Routes to `/(tabs)/scans`.
- **Animation:** Uses `Animated.timing` for a looping opacity/scale pulse.

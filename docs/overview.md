# r3ngine Mobile — Overview

## Purpose

The r3ngine mobile app provides a field-ready companion for security professionals running r3ngine assessments. It gives operators immediate access to scan results, real-time task logs, target intelligence, vulnerability data, and system health metrics from any location.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | **Expo** (managed workflow) |
| Language | **TypeScript** |
| Navigation | **Expo Router** (file-based routing) |
| UI Components | **React Native** primitives + custom components |
| Icons | **Expo Vector Icons** (FontAwesome, MaterialIcons) |
| HTTP Client | **Axios** with JWT interceptors |
| WebSockets | Native React Native WebSocket API |
| State | **Zustand** (auth, settings, project) |
| Data Fetching | **TanStack Query** (React Query) |
| Fonts | **Bangers** (Google Fonts via Expo Fonts) |
| Build | **EAS Build** (Expo Application Services) |

---

## Design Philosophy

- **Dark-first**: All screens use a dark theme for field readability.
- **Offline-tolerant**: Stale data is shown from React Query cache when the server is unreachable.
- **Security-conscious**: Tokens are stored in Expo SecureStore, never in AsyncStorage plaintext.
- **Real-time**: Scan logs and activity updates are streamed over WebSocket connections.

---

## App Entry Point

**File:** `app/_layout.tsx` — `RootLayout`

1. Loads fonts (`SpaceMono`, `Bangers`, `FontAwesome`).
2. Prevents splash screen auto-hide until fonts are ready.
3. Renders `RootLayoutNav`.

### `RootLayoutNav`

1. Loads auth state from `useAuthStore` (reads from SecureStore).
2. Loads settings from `useSettingsStore` (reads server IP from SecureStore).
3. Handles **auth guard**: if `!isAuthenticated || !serverIp`, redirects to `/(auth)/login`.
4. Wraps the `Stack` navigator in `QueryClientProvider` (TanStack Query).

---

## Directory Structure

```
r3ngine-mobile/
├── app/                        # Expo Router pages
│   ├── _layout.tsx             # Root layout + auth guard
│   ├── (auth)/login.tsx        # Login screen
│   ├── (tabs)/                 # Bottom tab navigator screens
│   │   ├── index.tsx           # Dashboard (home)
│   │   ├── scans.tsx           # Scans list
│   │   ├── targets.tsx         # Targets list
│   │   ├── tools.tsx           # Tools status
│   │   └── settings.tsx        # Settings
│   ├── scan/                   # Scan detail screens
│   ├── target/                 # Target detail screens
│   ├── intelligence/           # Threat intelligence screens
│   ├── control/                # Scan control screens
│   ├── feeds/                  # Security feed screens
│   ├── notifications/          # Notifications modal
│   ├── diagnostics.tsx         # Diagnostics modal
│   └── tools/                  # Tool screens
├── src/
│   ├── api/                    # API client and endpoint functions
│   │   ├── client.ts           # Axios instance with auth interceptors
│   │   ├── control.ts          # Scan control API calls
│   │   ├── notifications.ts    # Notification API calls
│   │   ├── observability.ts    # System metrics API calls
│   │   ├── reports.ts          # Report API calls
│   │   ├── stress.ts           # Stress test API calls
│   │   └── tools.ts            # Tools API calls
│   ├── store/
│   │   ├── useAuthStore.ts     # Auth state (token, user, login/logout)
│   │   ├── useSettingsStore.ts # Settings (serverIp, theme)
│   │   └── useProjectStore.ts  # Active project context
│   └── components/             # Shared reusable components
│       ├── Dashboard/          # Dashboard-specific components
│       ├── Intelligence/       # Intelligence panel components
│       ├── Notifications/      # Notification list components
│       ├── Observability/      # System health components
│       ├── Scan/               # Scan list and detail components
│       ├── System/             # System status components
│       ├── Target/             # Target info components
│       └── Tools/              # Tool status components
├── components/                 # Expo template components (legacy location)
├── documentation/              # Component documentation
├── assets/                     # Images, fonts
├── package.json
├── eas.json                    # EAS Build configuration
└── app.json                    # Expo app configuration
```

---

## Build Configuration

**`app.json`:**
```json
{
  "expo": {
    "name": "r3ngine",
    "slug": "r3ngine-mobile",
    "version": "1.0.0",
    "scheme": "r3ngine",
    "ios": { "bundleIdentifier": "com.r3ngine.mobile" },
    "android": { "package": "com.r3ngine.mobile" }
  }
}
```

**`eas.json`:**
```json
{
  "build": {
    "development": { "developmentClient": true },
    "preview": { "distribution": "internal" },
    "production": {}
  }
}
```

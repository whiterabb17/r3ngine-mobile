# r3ngine Mobile — Navigation

## Overview

The app uses **Expo Router** (file-based routing), which maps the `app/` directory structure directly to navigation routes.

---

## Route Tree

```
/                           → (tabs)/index.tsx          (Dashboard)
/scans                      → (tabs)/scans.tsx           (Scans List)
/targets                    → (tabs)/targets.tsx         (Targets List)
/tools                      → (tabs)/tools.tsx           (Tools Status)
/settings                   → (tabs)/settings.tsx        (Settings)
/(auth)/login               → (auth)/login.tsx           (Login Screen)
/scan/[id]                  → scan/[id].tsx              (Scan Detail)
/target/[id]                → target/[id].tsx            (Target Detail)
/intelligence               → intelligence/index.tsx     (Intelligence)
/control                    → control/index.tsx          (Scan Control)
/feeds                      → feeds/index.tsx            (Feeds)
/notifications              → notifications/index.tsx    (Notifications modal)
/diagnostics                → diagnostics.tsx            (Diagnostics modal)
/tools/[name]               → tools/[name].tsx           (Tool detail)
```

---

## Root Layout (`app/_layout.tsx`)

Registers the following `Stack.Screen` entries:

| Screen | Presentation | Header |
|---|---|---|
| `(auth)/login` | Default | Hidden |
| `(tabs)` | Default | Hidden |
| `feeds` | Default | Hidden |
| `intelligence` | Default | Hidden |
| `diagnostics` | Modal | Shown |
| `notifications/index` | Modal | Title: "Notifications" |
| `modal` | Modal | Shown |

### Auth Guard

```tsx
useEffect(() => {
  const inAuthGroup = segments[0] === '(auth)';
  if (!serverIp || !isAuthenticated) {
    if (!inAuthGroup) {
      router.replace('/(auth)/login');
    }
  } else if (inAuthGroup) {
    router.replace('/(tabs)');
  }
}, [isAuthenticated, serverIp, segments]);
```

The guard runs whenever `isAuthenticated`, `serverIp`, or `segments` changes. It redirects unauthenticated users to login and prevents authenticated users from seeing the login screen.

---

## Tab Navigator (`app/(tabs)/_layout.tsx`)

Uses `expo-router`'s `Tabs` component with a custom bottom tab bar. Each tab has:

| Tab | Icon | Route |
|---|---|---|
| Dashboard | Home icon | `/(tabs)/` |
| Scans | Radar/scan icon | `/(tabs)/scans` |
| Targets | Target icon | `/(tabs)/targets` |
| Tools | Wrench icon | `/(tabs)/tools` |
| Settings | Gear icon | `/(tabs)/settings` |

---

## Dynamic Routes

### `app/scan/[id].tsx`

Scan detail screen. `id` is the `ScanHistory.id` from the backend.

**Navigation:**
```tsx
router.push(`/scan/${scanId}`);
```

### `app/target/[id].tsx`

Target detail screen. `id` is the `Domain.id` from the backend.

**Navigation:**
```tsx
router.push(`/target/${domainId}`);
```

---

## Modal Screens

### `app/notifications/index.tsx`

Presented as a modal. Accessible from the notification bell icon in the Dashboard header.

### `app/diagnostics.tsx`

Presented as a modal. Accessible from the Settings screen. Shows connection diagnostics, version info, and server health checks.

---

## Programmatic Navigation

Use `useRouter` from `expo-router`:

```tsx
import { useRouter } from 'expo-router';

const router = useRouter();

// Navigate to a screen
router.push('/scans');

// Replace current screen
router.replace('/(tabs)');

// Go back
router.back();
```

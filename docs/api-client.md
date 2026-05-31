# r3ngine Mobile — API Client

## Overview

**File:** `src/api/client.ts`

The mobile app communicates with the r3ngine backend via a single **Axios** instance configured with:
- Dynamic base URL from settings store.
- Automatic JWT token injection.
- Automatic 401/token refresh handling.
- Security-safe request logging (tokens are masked in logs).

---

## The `apiClient` Instance

```typescript
import axios from 'axios';
import { useSettingsStore } from '../store/useSettingsStore';
import { useAuthStore } from '../store/useAuthStore';

const apiClient = axios.create();
```

A bare Axios instance is created (no base URL set at creation time) because the server IP is stored in Zustand and may change without a full app reload.

---

## Request Interceptor

Before every request:

1. Reads `serverIp` from `useSettingsStore.getState()`.
2. Constructs `baseURL`:
   - If `serverIp` includes `://` → use as-is.
   - Otherwise → prepend `http://`.
   - Ensures trailing `/`.
3. Reads `token` from `useAuthStore.getState()`.
4. Sets `Authorization: Bearer {token}` header.
5. Logs the request (with token masked as `[MASKED]`).

---

## Response Interceptor

**Success path:** Logs the status code and URL, returns the response.

**Error path (401 handling):**

1. Checks `error.response.status === 401` and `!originalRequest._retry`.
2. Sets `originalRequest._retry = true` (prevents retry loops).
3. Reads `refreshToken` from the auth store.
4. Makes a direct `axios.post()` to `{baseUrl}mapi/auth/token/refresh/`.
5. On success: calls `setTokens(newAccess, refreshToken)`, updates the Authorization header, retries the original request.
6. On failure: calls `logout()`.

---

## Helper: `getMediaSource`

```typescript
export const getMediaSource = (path: string) => {
  const { serverIp } = useSettingsStore.getState();
  const { token } = useAuthStore.getState();

  const uri = `${baseUrl}mapi/media/?path=${encodeURIComponent(path)}`;
  return {
    uri,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  };
};
```

Returns an Image source object for React Native `<Image source={...} />` with auth headers for media file access.

---

## API Modules

Each module in `src/api/` wraps specific backend endpoints:

### `control.ts` — Scan Control

```typescript
// Start a scan
export const startScan = (domainId: number, engineId: number) => 
  apiClient.post('/mapi/startScan/', { scan_history_id: domainId, engine_id: engineId });

// Stop a scan
export const stopScan = (scanHistoryId: number) =>
  apiClient.post(`/mapi/stopScan/${scanHistoryId}/`);
```

### `notifications.ts` — Notifications

```typescript
export const getNotifications = () =>
  apiClient.get('/mapi/notifications/');

export const markRead = (id: number) =>
  apiClient.patch(`/mapi/notifications/${id}/`, { is_read: true });
```

### `observability.ts` — System Metrics

```typescript
export const getSystemHealth = () =>
  apiClient.get('/mapi/system/health/');

export const getScanStatus = () =>
  apiClient.get('/mapi/scan_status/');
```

### `reports.ts` — PDF Reports

```typescript
export const generateReport = (scanHistoryId: number, reportType: string) =>
  apiClient.post('/mapi/generateReport/', { 
    scan_history_id: scanHistoryId, 
    report_type: reportType 
  });
```

### `stress.ts` — Stress Testing

```typescript
export const runStressTest = (config: StressTestConfig) =>
  apiClient.post('/mapi/stress_test/', config);
```

### `tools.ts` — Tool Status

```typescript
export const getToolVersions = () =>
  apiClient.get('/mapi/tool_versions/');

export const checkToolHealth = () =>
  apiClient.get('/mapi/tools/health/');
```

---

## Making API Calls

The preferred pattern throughout the app is **TanStack Query** (`useQuery` / `useMutation`):

```typescript
import { useQuery } from '@tanstack/react-query';
import { getScanStatus } from '../../src/api/observability';

const { data, isLoading, error, refetch } = useQuery({
  queryKey: ['scan-status'],
  queryFn: getScanStatus,
  refetchInterval: 30000, // poll every 30s
});
```

For mutations:
```typescript
import { useMutation } from '@tanstack/react-query';
import { stopScan } from '../../src/api/control';

const { mutate, isPending } = useMutation({
  mutationFn: (scanId: number) => stopScan(scanId),
  onSuccess: () => { /* refresh query */ },
});
```

---

## API Base URL

The `/mapi/` prefix is the mobile-specific API route on the Django backend, separate from the web frontend's `/api/` prefix. This allows mobile-optimized response shapes where needed.

# r3ngine Mobile — State Management

## Overview

The app uses **Zustand** for global client state. Three stores manage the core shared state:

| Store | File | Purpose |
|---|---|---|
| `useAuthStore` | `src/store/useAuthStore.ts` | JWT tokens, authenticated user, login/logout |
| `useSettingsStore` | `src/store/useSettingsStore.ts` | Server IP, app preferences |
| `useProjectStore` | `src/store/useProjectStore.ts` | Active project context |

All stores use **Expo SecureStore** for persistence — state survives app restarts.

---

## `useAuthStore`

**File:** `src/store/useAuthStore.ts`

### State Shape

```typescript
interface AuthState {
  isAuthenticated: boolean;
  token: string | null;
  refreshToken: string | null;
  user: UserProfile | null;
}
```

### Actions

| Action | Description |
|---|---|
| `loadAuth()` | Reads tokens from SecureStore on app startup |
| `setTokens(access, refresh)` | Saves tokens and sets `isAuthenticated = true` |
| `logout()` | Clears tokens from SecureStore, resets state |

### Usage

```typescript
const { isAuthenticated, token, logout } = useAuthStore();
```

In API modules (sync access without a hook):
```typescript
const { token } = useAuthStore.getState();
```

---

## `useSettingsStore`

**File:** `src/store/useSettingsStore.ts`

### State Shape

```typescript
interface SettingsState {
  serverIp: string | null;
}
```

### Actions

| Action | Description |
|---|---|
| `loadSettings()` | Reads `server_ip` from SecureStore on startup |
| `setServerIp(ip)` | Saves the server IP to SecureStore and state |

### Usage

```typescript
const { serverIp, setServerIp } = useSettingsStore();
```

The server IP is used in the API client's request interceptor to build the base URL for every request.

---

## `useProjectStore`

**File:** `src/store/useProjectStore.ts`

### State Shape

```typescript
interface ProjectState {
  activeProjectSlug: string | null;
}
```

### Actions

| Action | Description |
|---|---|
| `setActiveProject(slug)` | Sets the currently active project |

The active project context is used to scope API queries (e.g., `/mapi/targets/?project={slug}`).

---

## TanStack Query (Server State)

**Server-side data** (scans, vulnerabilities, targets, etc.) is managed by **TanStack Query**:

```typescript
// In _layout.tsx
const queryClient = new QueryClient();

<QueryClientProvider client={queryClient}>
  {/* app */}
</QueryClientProvider>
```

### Cache Strategy

| Data | `staleTime` | `refetchInterval` | Notes |
|---|---|---|---|
| Scan status | 0 | 30s | Polls for active scans |
| Targets list | 5min | — | Refreshed on focus |
| Vulnerabilities | 10min | — | Refreshed on tab focus |
| Tool versions | 30min | — | Rarely changes |

### Cache Invalidation

After mutations (e.g., starting a scan), invalidate the relevant query:
```typescript
await queryClient.invalidateQueries({ queryKey: ['scans'] });
```

---

## Avoiding Common Pitfalls

### Reading Store State Outside Components

Use `.getState()` for synchronous reads outside React hooks (e.g., in API modules):
```typescript
// ✓ Correct — works outside components
const { token } = useAuthStore.getState();

// ✗ Incorrect — only works inside React components
const { token } = useAuthStore();
```

### Preventing Stale Closures

When subscribing to store state in long-lived callbacks (e.g., WebSocket handlers), always call `.getState()` inside the handler to get the latest value rather than closing over the initial value.

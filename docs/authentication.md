# r3ngine Mobile — Authentication

## Overview

The app uses **JWT (JSON Web Token)** authentication, matching the r3ngine backend's JWT-based auth system. Tokens are stored securely using **Expo SecureStore** — the platform's secure hardware-backed storage (Keychain on iOS, EncryptedSharedPreferences on Android).

---

## Auth Flow

```
User enters server IP + credentials
        │
        ▼
POST /mapi/auth/token/
        │
        ▼
Response: { access: "...", refresh: "..." }
        │
        ▼
Tokens saved to SecureStore
        │
        ▼
isAuthenticated = true → router.replace('/(tabs)')
```

---

## Token Storage (`useAuthStore.ts`)

**File:** `src/store/useAuthStore.ts`

```typescript
interface AuthState {
  isAuthenticated: boolean;
  token: string | null;
  refreshToken: string | null;
  user: UserProfile | null;

  loadAuth: () => Promise<void>;
  setTokens: (access: string, refresh: string) => Promise<void>;
  logout: () => Promise<void>;
}
```

### `loadAuth()`

Called on app startup in `_layout.tsx`. Reads `access_token` and `refresh_token` from SecureStore and restores the auth state.

### `setTokens(access, refresh)`

Saves tokens to SecureStore:
```typescript
await SecureStore.setItemAsync('access_token', access);
await SecureStore.setItemAsync('refresh_token', refresh);
```

Sets `isAuthenticated = true`.

### `logout()`

Clears tokens from SecureStore and resets auth state. Triggers the auth guard redirect to `/(auth)/login`.

---

## Server IP Storage (`useSettingsStore.ts`)

**File:** `src/store/useSettingsStore.ts`

The server IP is stored in SecureStore alongside tokens:
```typescript
await SecureStore.setItemAsync('server_ip', ip);
```

The server IP is required alongside authentication — both must be present for `isAuthenticated` to allow access to the main app.

---

## Token Refresh (Automatic)

**File:** `src/api/client.ts`

The Axios response interceptor automatically handles 401 errors:

```typescript
if (error.response?.status === 401 && !originalRequest._retry) {
  originalRequest._retry = true;
  const { refreshToken, setTokens, logout } = useAuthStore.getState();
  
  // Try to refresh using the refresh token
  const res = await axios.post(`${baseUrl}mapi/auth/token/refresh/`, {
    refresh: refreshToken,
  });
  
  // Update stored tokens
  await setTokens(res.data.access, refreshToken);
  
  // Retry the original request with the new access token
  originalRequest.headers.Authorization = `Bearer ${res.data.access}`;
  return apiClient(originalRequest);
}
```

If the refresh token is also expired or missing, `logout()` is called and the user is redirected to the login screen.

---

## Login Screen (`app/(auth)/login.tsx`)

### Fields

| Field | Type | Description |
|---|---|---|
| Server IP | Text | IP address or hostname of the r3ngine instance (e.g., `192.168.1.100` or `https://r3ngine.example.com`) |
| Username | Text | r3ngine username |
| Password | SecureText | r3ngine password |

### Behavior

1. Validates that server IP is provided.
2. Constructs the base URL:
   - If `serverIp` includes `://`, uses as-is.
   - Otherwise, prepends `http://`.
3. POSTs to `{baseUrl}/mapi/auth/token/`.
4. Calls `setTokens(access, refresh)` on success.
5. Saves `serverIp` to `useSettingsStore`.

### Error Handling

- Network errors → displays "Cannot connect to server. Check IP."
- `401` → displays "Invalid username or password."
- Any other error → displays the error message.

---

## API Endpoint

```http
POST /mapi/auth/token/
Content-Type: application/json

{
  "username": "admin",
  "password": "password"
}
```

**Response:**
```json
{
  "access": "eyJ...",
  "refresh": "eyJ..."
}
```

**Refresh:**
```http
POST /mapi/auth/token/refresh/
Content-Type: application/json

{
  "refresh": "eyJ..."
}
```

**Response:**
```json
{
  "access": "eyJ..."
}
```

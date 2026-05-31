# r3ngine Mobile — Development Guide

## Prerequisites

| Tool | Version | Notes |
|---|---|---|
| Node.js | 18+ | |
| npm | 9+ | |
| Expo CLI | Latest | `npm install -g expo-cli` |
| EAS CLI | Latest | `npm install -g eas-cli` |
| Android Studio | Latest | For Android emulator |
| Xcode | 15+ | macOS only, for iOS simulator |
| r3ngine instance | Running | Docker Compose dev stack |

---

## Initial Setup

```bash
cd r3ngine-mobile
npm install
```

---

## Running in Development

### Expo Go (Quick Start)

For rapid development without native build:
```bash
npx expo start
```

Scan the QR code with the **Expo Go** app on your phone, or press:
- `a` — open on Android emulator
- `i` — open on iOS simulator
- `w` — open in web browser

> **Note:** Some native features (SecureStore, push notifications) work only in a development client, not Expo Go.

### Development Client (Recommended)

Build a development client for full native feature support:
```bash
# Build for Android
eas build --profile development --platform android

# Build for iOS
eas build --profile development --platform ios
```

Then start the dev server:
```bash
npx expo start --dev-client
```

### Connecting to r3ngine

1. Start the r3ngine Docker Compose stack.
2. Find the Django container's IP (or use your machine's LAN IP if on the same network).
3. In the app, set the server IP in Settings or on the login screen.

> The default Docker Compose port is `80` (via nginx). Use `http://192.168.x.x` (no port needed for port 80).

---

## Project Structure for Development

```
app/           # Page components — matches URL routes
src/api/       # API call functions — one file per backend resource area
src/store/     # Zustand global state
src/components/ # Shared UI components organized by feature
```

### Adding a New Screen

1. Create `app/my-screen.tsx` or `app/my-screen/index.tsx`.
2. Expo Router auto-registers it as a route at `/my-screen`.
3. Add a `Stack.Screen` entry in `app/_layout.tsx` if you need custom presentation.

### Adding a New API Function

1. Identify the relevant API module in `src/api/`.
2. Add the function using `apiClient` (which handles auth automatically).
3. Use `useQuery` or `useMutation` from TanStack Query in the component.

---

## Environment Configuration

The app has no `.env` file — the server IP is entered by the user in the Settings screen and stored in SecureStore. This is intentional for security (no hardcoded endpoints).

For development, you can bypass this by setting the server IP programmatically in the Zustand store:
```typescript
// In a debug console or __DEV__ guard
useSettingsStore.getState().setServerIp('http://192.168.1.100');
```

---

## Building for Production

```bash
# Android APK/AAB
eas build --profile production --platform android

# iOS IPA
eas build --profile production --platform ios
```

### Internal Testing Build (`.apk` sideload)

```bash
eas build --profile preview --platform android
```

Download the APK and install via:
```bash
adb install path/to/app.apk
```

---

## Running Tests

```bash
# Run all tests
npm test

# Run with watch mode
npm run test:watch
```

Tests are located in `tests/`. The testing setup uses Jest with React Native Testing Library.

### Test File Naming

- `tests/screens/DashboardScreen.test.tsx`
- `tests/api/control.test.ts`
- `tests/store/useAuthStore.test.ts`

---

## TypeScript

The project uses strict TypeScript. Run the type checker:
```bash
npx tsc --noEmit
```

### Key Types

All API response types are auto-generated from `openapi.json` (the r3ngine OpenAPI spec). If the backend API changes, regenerate the types:
```bash
npx openapi-typescript openapi.json -o src/types/api.d.ts
```

---

## Common Issues

### "Cannot connect to server"

- Verify the r3ngine stack is running: `docker-compose ps`.
- Verify the IP is correct and accessible from the device/emulator.
- Android emulator uses `10.0.2.2` to reach the host machine. Use `http://10.0.2.2` instead of `localhost`.

### Tokens Not Persisting

SecureStore may not work in Expo Go. Use a development client build.

### Metro Bundler Cache

If you see unexpected module resolution errors:
```bash
npx expo start --clear
```

### Network Inspector

Enable the Network inspector in Expo DevTools to see all API requests and responses.

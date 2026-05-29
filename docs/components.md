# r3ngine Mobile — Components Reference

## Component Directories

```
src/components/
├── Dashboard/          # Dashboard tab components
├── Intelligence/       # Threat intelligence components
├── Notifications/      # Notification list components
├── Observability/      # System health and metrics
├── Scan/               # Scan list and detail components
├── System/             # System status components
├── Target/             # Target info components
├── Tools/              # Tool status components
└── KpiCard.tsx         # Shared KPI metric card
```

---

## `KpiCard.tsx`

**File:** `src/components/KpiCard.tsx`  
**Usage:** Used in Dashboard, Scan Detail, ERL plugin panel.

### Props

```typescript
interface KpiCardProps {
  title: string;
  value: number | string;
  icon?: React.ReactNode;
  color?: string;        // Text/icon accent color
  onPress?: () => void;  // Navigate on tap
}
```

### Example

```tsx
<KpiCard
  title="Critical Vulnerabilities"
  value={42}
  color="#E53E3E"
  onPress={() => router.push('/scans?filter=critical')}
/>
```

---

## `AnimatedActivityBadge`

**File:** `src/components/Dashboard/AnimatedActivityBadge.tsx`  
**Docs:** `documentation/AnimatedActivityBadge.md`

Animated pulsing indicator shown when a scan is running.

### Props

```typescript
interface AnimatedActivityBadgeProps {
  isActive: boolean;    // Whether to show the animated badge
  onPress?: () => void; // Action on tap (default: navigate to scans)
}
```

---

## Scan Components (`src/components/Scan/`)

| Component | Description |
|---|---|
| `ScanListItem.tsx` | Single scan row with status badge |
| `ScanStatusBadge.tsx` | Colored status chip (`RUNNING`, `SUCCESS`, `FAILED`, `ABORTED`) |
| `ScanProgressBar.tsx` | Progress bar for running scans |
| `ScanLogViewer.tsx` | Scrollable log viewer with WebSocket integration |
| `VulnerabilityList.tsx` | Vulnerability list with severity filters |
| `SubdomainList.tsx` | Discovered subdomain list |

---

## Target Components (`src/components/Target/`)

| Component | Description |
|---|---|
| `TargetListItem.tsx` | Single target row |
| `TargetInfoTabs.tsx` | Tab view: WHOIS, IP Addresses, Nameservers, History |
| `TargetTagList.tsx` | Horizontal tag chip list |

---

## Observability Components (`src/components/Observability/`)

| Component | Description |
|---|---|
| `SystemHealthCard.tsx` | Container status card (Temporal, PostgreSQL, Redis, Neo4j) |
| `ServiceStatusDot.tsx` | Colored dot indicator for service health |

---

## Creating a New Component

1. Create the file in the appropriate subdirectory: `src/components/{Feature}/MyComponent.tsx`.
2. Export the component as a named export.
3. Use React Native primitives (`View`, `Text`, `TouchableOpacity`, `FlatList`).
4. Support dark mode via the `useColorScheme` hook.
5. Create documentation in `documentation/MyComponent.md`.

### Template

```tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface MyComponentProps {
  title: string;
}

/**
 * MyComponent — brief description.
 * 
 * @param title - Display title
 */
export function MyComponent({ title }: MyComponentProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#1A1A2E',
    borderRadius: 8,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
```

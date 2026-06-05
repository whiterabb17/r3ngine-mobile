# AnimatedActivityBadge

The `AnimatedActivityBadge` component is a header indicator that alerts the user when a scan is actively running for the currently selected project.

## Purpose
It provides a visual, real-time indicator on the main mobile dashboard so that penetration testers and security operations staff know when background scanning is underway without having to drill down into menus or scan history.

## File Location
* Component: `r3ngine-mobile/src/components/Dashboard/AnimatedActivityBadge.tsx`

## Design & Properties

### Visual Layout
* **Icon**: Lucide React Native `Activity` icon.
* **Color**: Green (`Theme.colors.success`).
* **Placement**: Positioned inside the dashboard's `headerRight` container, directly next (to the left) of the alert bell.
* **Interactive Behavior**: Clicking on the badge redirects the user to the Scans list screen `/(tabs)/scans` via the Expo Router.

### Animation Logic
* Built using the React Native `Animated` API with `useNativeDriver: true` for GPU-accelerated 60fps execution.
* The badge continuously loops through an opacity pulse (ranging from `0.4` to `1.0`) and scale interpolation (ranging from `0.95` to `1.15`) with a transition duration of `1000ms` per direction (2000ms total loop duration).

## API Integration & Polling
* **Endpoint**: `/mapi/scan_status/?project={slug}`
* **State Hook**: Evaluates the `scans.scanning` array from the response. If the array is non-empty, the badge state `hasActiveScan` is set to `true` (making the badge visible).
* **Polling Cycle**: Fetched concurrently with the unread notifications count query, running once on mount, once on project selection changes, and on a `30-second` background interval loop.

## Usage Example

```tsx
import AnimatedActivityBadge from '../../src/components/Dashboard/AnimatedActivityBadge';

// Rendered conditionally inside expo-router Stack.Screen options
headerRight: () => (
  <View style={styles.headerRightContainer}>
    {hasActiveScan && (
      <AnimatedActivityBadge
        onPress={() => router.push('/(tabs)/scans')}
      />
    )}
    ...
  </View>
)
```

# r3ngine Mobile — WebSocket Integration

## Overview

The mobile app receives real-time scan log updates via a native **WebSocket** connection to the r3ngine backend. Django Channels handles the server-side WebSocket consumer.

---

## Scan Log Streaming

### Connection

Connected when the user navigates to the **Logs tab** of a scan detail screen.

**URL:** `ws://{serverIp}/ws/log/{scanId}/`

Authentication is passed via the `Authorization` header in the WebSocket upgrade request:
```
Authorization: Bearer <access_token>
```

> **Note:** React Native's WebSocket implementation does not support custom headers on iOS in older versions. The r3ngine mobile app sends the token as a query parameter as a fallback:
> ```
> ws://{serverIp}/ws/log/{scanId}/?token={accessToken}
> ```

---

## WebSocket Hook Pattern

The scan log WebSocket is managed via a custom hook in the Scan detail screen:

```typescript
useEffect(() => {
  const { serverIp } = useSettingsStore.getState();
  const { token } = useAuthStore.getState();
  
  const ws = new WebSocket(`ws://${serverIp}/ws/log/${scanId}/`);
  
  ws.onopen = () => {
    console.log('[WS] Log stream connected');
  };
  
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === 'log_line') {
      setLogs(prev => [...prev, data.line]);
    }
  };
  
  ws.onerror = (e) => {
    console.error('[WS] Error:', e);
  };
  
  ws.onclose = () => {
    console.log('[WS] Log stream closed');
  };
  
  return () => ws.close();
}, [scanId]);
```

---

## Message Format

### Server → Client: `log_line`

```json
{
  "type": "log_line",
  "command_id": 17,
  "line": "[INF] nuclei scanning https://target.example.com",
  "stream": "stdout"
}
```

| Field | Type | Description |
|---|---|---|
| `type` | `string` | Always `"log_line"` for log messages |
| `command_id` | `number` | ID of the `Command` DB record (for grouping by tool) |
| `line` | `string` | Single log line from the tool's stdout/stderr |
| `stream` | `string` | `"stdout"` or `"stderr"` |

### Server → Client: `scan_progress`

```json
{
  "type": "scan_progress",
  "scan_id": 42,
  "task_name": "subdomain_discovery",
  "status": "completed",
  "timestamp": "2025-05-29T10:00:00Z"
}
```

---

## Historical Log Replay

On connection, the server replays all historical log lines for the scan before streaming live updates. This means:

1. User navigates to the Logs tab.
2. WebSocket connects.
3. Server immediately sends all existing `Command` log lines for the scan.
4. Server continues streaming new lines as tools produce output.

This ensures the user sees a complete log even if they connect mid-scan.

---

## Scan Status Polling

In addition to WebSockets, the app **polls** scan status via REST API every 30 seconds:

```typescript
const { data } = useQuery({
  queryKey: ['scan-status'],
  queryFn: () => apiClient.get('/mapi/scan_status/'),
  refetchInterval: 30000,
});
```

This is used for the animated badge and scan list status updates. The WebSocket log stream is for detailed log viewing only.

---

## Reconnection Strategy

If the WebSocket disconnects (network loss, server restart):

```typescript
ws.onclose = () => {
  // Retry after 5 seconds
  setTimeout(() => connectWebSocket(), 5000);
};
```

The retry is limited to the component's lifecycle — if the user navigates away, the connection is not re-established.

---

## Connection Cleanup

WebSocket connections are always closed when the component unmounts:

```typescript
return () => {
  ws.close();
};
```

This prevents memory leaks and dangling WebSocket connections.

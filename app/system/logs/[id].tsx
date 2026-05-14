import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, View as RNView } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, Terminal, Shield, Play, Pause, Trash2, RefreshCw } from 'lucide-react-native';

import { Text, View } from '@/components/Themed';
import { Theme } from '../../../src/constants/Theme';
import { useSettingsStore } from '../../../src/store/useSettingsStore';
import { useAuthStore } from '../../../src/store/useAuthStore';
import { TacticalHaptics } from '../../../src/utils/haptics';

export default function LogViewerScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { serverIp } = useSettingsStore();
  const { token } = useAuthStore();
  
  const [logs, setLogs] = useState<string[]>([]);
  const [status, setStatus] = useState<'CONNECTING' | 'CONNECTED' | 'DISCONNECTED' | 'ERROR'>('CONNECTING');
  const [autoScroll, setAutoScroll] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  
  const scrollViewRef = useRef<ScrollView>(null);
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!id || !serverIp) return;

    connectWebSocket();

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [id, serverIp]);

  const connectWebSocket = () => {
    try {
      setStatus('CONNECTING');
      if (!serverIp) return;
      const protocol = serverIp.includes('https') ? 'wss' : 'ws';
      const host = serverIp.replace(/^https?:\/\//, '').replace(/\/$/, '');
      const wsUrl = `${protocol}://${host}/ws/logs/${id}/`;
      
      console.log(`[WebSocket] Connecting to ${wsUrl}`);
      
      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
        console.log('[WebSocket] Connected');
        setStatus('CONNECTED');
        TacticalHaptics.soft();
      };

      ws.current.onmessage = (e) => {
        if (isPaused) return;

        try {
          const message = JSON.parse(e.data);
          if (message.type === 'log_update') {
            const logLine = message.data.line;
            setLogs(prev => [...prev, logLine].slice(-500)); // Keep last 500 lines
          }
        } catch (err) {
          console.error('[WebSocket] Message Parse Error:', err);
        }
      };

      ws.current.onclose = (e) => {
        console.log('[WebSocket] Closed:', e.code, e.reason);
        setStatus('DISCONNECTED');
      };

      ws.current.onerror = (e) => {
        console.error('[WebSocket] Error:', e);
        setStatus('ERROR');
        TacticalHaptics.error();
      };
    } catch (err) {
      console.error('[WebSocket] Connection Error:', err);
      setStatus('ERROR');
    }
  };

  useEffect(() => {
    if (autoScroll && logs.length > 0) {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }
  }, [logs, autoScroll]);

  const handleClear = () => {
    setLogs([]);
    TacticalHaptics.impact();
  };

  const togglePause = () => {
    setIsPaused(!isPaused);
    TacticalHaptics.soft();
  };

  const getStatusColor = () => {
    switch (status) {
      case 'CONNECTED': return Theme.colors.success;
      case 'CONNECTING': return Theme.colors.warning;
      case 'ERROR': return Theme.colors.error;
      default: return Theme.colors.textMuted;
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ 
        title: 'TACTICAL LOGS',
        headerStyle: { backgroundColor: Theme.colors.surface },
        headerTintColor: Theme.colors.text,
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: -10, padding: 10 }}>
            <ChevronLeft size={24} color={Theme.colors.text} />
          </TouchableOpacity>
        ),
        headerRight: () => (
          <View style={{ flexDirection: 'row', backgroundColor: 'transparent', gap: 15, marginRight: 10 }}>
            <TouchableOpacity onPress={handleClear}>
              <Trash2 size={20} color={Theme.colors.textMuted} />
            </TouchableOpacity>
            <TouchableOpacity onPress={connectWebSocket}>
              <RefreshCw size={20} color={Theme.colors.primary} />
            </TouchableOpacity>
          </View>
        )
      }} />

      {/* Terminal View */}
      <View style={styles.terminalContainer}>
        <View style={styles.terminalHeader}>
          <View style={styles.headerLeft}>
            <Terminal size={14} color={Theme.colors.primary} />
            <Text style={styles.terminalTitle}>SCAN_{id}_STDOUT</Text>
          </View>
          <View style={styles.statusBadge}>
            <RNView style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
            <Text style={[styles.statusText, { color: getStatusColor() }]}>{status}</Text>
          </View>
        </View>

        <ScrollView 
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          onScrollBeginDrag={() => setAutoScroll(false)}
          onMomentumScrollEnd={(e) => {
            const offset = e.nativeEvent.contentOffset.y;
            const contentHeight = e.nativeEvent.contentSize.height;
            const layoutHeight = e.nativeEvent.layoutMeasurement.height;
            if (offset + layoutHeight >= contentHeight - 20) {
              setAutoScroll(true);
            }
          }}
        >
          {logs.length === 0 ? (
            <View style={styles.emptyContainer}>
              <ActivityIndicator color={Theme.colors.primary} />
              <Text style={styles.emptyText}>Awaiting operational data stream...</Text>
            </View>
          ) : (
            logs.map((line, index) => (
              <Text key={index} style={styles.logLine}>
                <Text style={styles.linePrompt}>➜ </Text>
                {line}
              </Text>
            ))
          )}
        </ScrollView>

        {/* Floating Controls */}
        <View style={styles.controls}>
          <TouchableOpacity 
            style={[styles.controlBtn, isPaused && styles.pausedBtn]} 
            onPress={togglePause}
          >
            {isPaused ? <Play size={20} color="#fff" fill="#fff" /> : <Pause size={20} color="#fff" fill="#fff" />}
            <Text style={styles.controlBtnText}>{isPaused ? 'RESUME FEED' : 'PAUSE FEED'}</Text>
          </TouchableOpacity>
          
          {!autoScroll && (
            <TouchableOpacity 
              style={styles.scrollLockBtn} 
              onPress={() => setAutoScroll(true)}
            >
              <Text style={styles.scrollLockText}>AUTOSCROLL ENABLED</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  terminalContainer: {
    flex: 1,
    backgroundColor: '#050505',
    margin: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1A1A1A',
    overflow: 'hidden',
  },
  terminalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#111',
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'transparent',
  },
  terminalTitle: {
    fontSize: 10,
    color: '#666',
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'transparent',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 12,
    paddingBottom: 80,
  },
  logLine: {
    color: '#E0E0E0',
    fontSize: 12,
    fontFamily: 'monospace',
    lineHeight: 18,
    marginBottom: 2,
  },
  linePrompt: {
    color: Theme.colors.primary,
    fontWeight: 'bold',
  },
  emptyContainer: {
    paddingTop: 100,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  emptyText: {
    color: '#666',
    marginTop: 16,
    fontSize: 14,
    fontFamily: 'Bangers',
    letterSpacing: 1,
  },
  controls: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'transparent',
  },
  controlBtn: {
    backgroundColor: Theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 30,
    gap: 10,
    shadowColor: Theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  pausedBtn: {
    backgroundColor: Theme.colors.warning,
    shadowColor: Theme.colors.warning,
  },
  controlBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },
  scrollLockBtn: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: Theme.colors.primary + '44',
  },
  scrollLockText: {
    color: Theme.colors.primary,
    fontSize: 10,
    fontWeight: 'bold',
  }
});

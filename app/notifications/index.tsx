import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { CheckCheck, Trash2, BellOff, ArrowLeft } from 'lucide-react-native';
import { getNotifications, markAsRead, markAllRead, clearAllNotifications, InAppNotification } from '../../src/api/notifications';
import NotificationCard from '../../src/components/Notifications/NotificationCard';
import { Theme } from '../../src/constants/Theme';
import { useSettingsStore } from '../../src/store/useSettingsStore';

const NotificationsScreen = () => {
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const fetchNotifications = async () => {
    try {
      const data = await getNotifications();
      setNotifications(data);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllRead();
      fetchNotifications();
    } catch (error) {
      Alert.alert('Error', 'Failed to mark notifications as read');
    }
  };

  const handleClearAll = () => {
    Alert.alert(
      'Clear Notifications',
      'Are you sure you want to delete all notifications?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear All', 
          style: 'destructive',
          onPress: async () => {
            try {
              await clearAllNotifications();
              setNotifications([]);
            } catch (error) {
              Alert.alert('Error', 'Failed to clear notifications');
            }
          }
        }
      ]
    );
  };

  const handleNotificationPress = async (notification: InAppNotification) => {
    if (!notification.is_read) {
      try {
        await markAsRead(notification.id);
        // Optimistically update local state
        setNotifications(prev => 
          prev.map(n => n.id === notification.id ? { ...n, is_read: true } : n)
        );
      } catch (error) {
        console.error('Failed to mark notification as read:', error);
      }
    }

    if (notification.redirect_link) {
        // Handle redirection logic if needed
        // For now, we just close the modal
        // router.back();
    }
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <BellOff size={64} color="#334155" />
      <Text style={styles.emptyTitle}>All caught up!</Text>
      <Text style={styles.emptySubtitle}>You have no new notifications.</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{
          title: 'Notification Center',
          headerTitleStyle: {
            fontFamily: 'Bangers',
            fontSize: 20,
            color: '#fff',
          },
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
              <ArrowLeft size={24} color="#fff" />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <View style={styles.headerActions}>
              {notifications.length > 0 && (
                <>
                  <TouchableOpacity onPress={handleMarkAllRead} style={styles.headerButton}>
                    <CheckCheck size={22} color="#fff" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleClearAll} style={styles.headerButton}>
                    <Trash2 size={22} color="#ef4444" />
                  </TouchableOpacity>
                </>
              )}
            </View>
          ),
        }}
      />
      
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <NotificationCard 
            notification={item} 
            onPress={handleNotificationPress} 
          />
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            tintColor={Theme.colors.primary} 
          />
        }
        ListEmptyComponent={loading ? null : renderEmpty}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    padding: 8,
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 100,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginTop: 16,
    fontFamily: 'Inter_700Bold',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#64748b',
    marginTop: 8,
    textAlign: 'center',
  },
});

export default NotificationsScreen;

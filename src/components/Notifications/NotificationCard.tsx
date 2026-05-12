import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Info, CheckCircle, AlertTriangle, XCircle, Bell, ExternalLink } from 'lucide-react-native';
import { formatDistanceToNow } from 'date-fns';
import { InAppNotification } from '../../api/notifications';

interface NotificationCardProps {
  notification: InAppNotification;
  onPress: (notification: InAppNotification) => void;
}

const NotificationCard: React.FC<NotificationCardProps> = ({ notification, onPress }) => {
  const getStatusIcon = () => {
    switch (notification.status) {
      case 'success':
        return <CheckCircle size={20} color="#10b981" />;
      case 'warning':
        return <AlertTriangle size={20} color="#f59e0b" />;
      case 'error':
        return <XCircle size={20} color="#ef4444" />;
      case 'info':
      default:
        return <Info size={20} color="#3b82f6" />;
    }
  };

  const getStatusColor = () => {
    switch (notification.status) {
      case 'success':
        return '#10b981';
      case 'warning':
        return '#f59e0b';
      case 'error':
        return '#ef4444';
      case 'info':
      default:
        return '#3b82f6';
    }
  };

  return (
    <TouchableOpacity 
      style={[
        styles.container, 
        !notification.is_read && styles.unreadContainer,
        { borderLeftColor: getStatusColor() }
      ]}
      onPress={() => onPress(notification)}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>
        {getStatusIcon()}
      </View>
      <View style={styles.contentContainer}>
        <View style={styles.header}>
          <Text style={[styles.title, !notification.is_read && styles.unreadText]}>
            {notification.title}
          </Text>
          {!notification.is_read && <View style={styles.unreadDot} />}
        </View>
        <Text style={styles.description} numberOfLines={2}>
          {notification.description}
        </Text>
        <View style={styles.footer}>
          <Text style={styles.time}>
            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
          </Text>
          {notification.redirect_link && (
            <View style={styles.linkIndicator}>
              <ExternalLink size={12} color="#94a3b8" />
              <Text style={styles.linkText}>View</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  unreadContainer: {
    backgroundColor: '#334155',
  },
  iconContainer: {
    marginRight: 12,
    justifyContent: 'center',
  },
  contentContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f8fafc',
    fontFamily: 'Inter_600SemiBold',
    flex: 1,
  },
  unreadText: {
    color: '#ffffff',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3b82f6',
    marginLeft: 8,
  },
  description: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 8,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  time: {
    fontSize: 12,
    color: '#64748b',
  },
  linkIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  linkText: {
    fontSize: 12,
    color: '#94a3b8',
    marginLeft: 4,
  },
});

export default NotificationCard;

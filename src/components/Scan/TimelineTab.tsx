import React from 'react';
import { StyleSheet, FlatList } from 'react-native';
import { CheckCircle2, Clock, XCircle, AlertCircle, Terminal } from 'lucide-react-native';

import { Text, View } from '@/components/Themed';
import { Theme } from '../../constants/Theme';

interface TimelineActivity {
  id: string | number;
  title: string;
  status: string;
  time: string;
}

interface TimelineTabProps {
  timeline: TimelineActivity[];
}

export default function TimelineTab({ timeline = [] }: TimelineTabProps) {
  
  const formatTime = (timeString: string) => {
    if (!timeString) return '--:--';
    const date = new Date(timeString);
    if (isNaN(date.getTime())) return '--:--';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusIcon = (status: string) => {
    const s = status.toUpperCase();
    if (s === 'SUCCESS') return <CheckCircle2 size={16} color={Theme.colors.success} />;
    if (s === 'FAILED' || s === 'ABORTED') return <XCircle size={16} color={Theme.colors.error} />;
    if (s === 'RUNNING') return <Clock size={16} color={Theme.colors.info} />;
    return <AlertCircle size={16} color={Theme.colors.warning} />;
  };

  const renderItem = ({ item, index }: { item: TimelineActivity, index: number }) => {
    const isLast = index === timeline.length - 1;
    
    return (
      <View style={styles.timelineItem}>
        <View style={styles.leftColumn}>
          <View style={styles.iconContainer}>
            {getStatusIcon(item.status)}
          </View>
          {!isLast && <View style={styles.verticalLine} />}
        </View>
        
        <View style={styles.contentContainer}>
          <View style={styles.itemHeader}>
            <Text style={styles.itemTitle}>{item.title}</Text>
            <Text style={styles.itemTime}>{formatTime(item.time)}</Text>
          </View>
          <View style={styles.statusRow}>
             <Text style={[styles.statusText, { color: item.status.toUpperCase() === 'SUCCESS' ? Theme.colors.success : Theme.colors.textMuted }]}>
               {item.status.toUpperCase()}
             </Text>
          </View>
          
          {/* Optional: Add a 'View Logs' button if logs are available */}
          <TouchableOpacity style={styles.logButton}>
             <Terminal size={12} color={Theme.colors.primary} />
             <Text style={styles.logButtonText}>VIEW OUTPUT</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {timeline.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No activity logs recorded for this scan.</Text>
        </View>
      ) : (
        <FlatList
          data={[...timeline].reverse()} // Show newest first
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

// Re-using TouchableOpacity from react-native
import { TouchableOpacity } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  listContent: {
    padding: Theme.spacing.md,
    paddingBottom: Theme.spacing.xl,
  },
  timelineItem: {
    flexDirection: 'row',
    backgroundColor: 'transparent',
    minHeight: 80,
  },
  leftColumn: {
    alignItems: 'center',
    width: 30,
    backgroundColor: 'transparent',
  },
  iconContainer: {
    zIndex: 1,
    backgroundColor: Theme.colors.background,
    paddingVertical: 2,
  },
  verticalLine: {
    flex: 1,
    width: 2,
    backgroundColor: Theme.colors.border,
  },
  contentContainer: {
    flex: 1,
    paddingLeft: 12,
    paddingBottom: Theme.spacing.lg,
    backgroundColor: 'transparent',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'transparent',
    marginBottom: 4,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Theme.colors.text,
  },
  itemTime: {
    fontSize: 10,
    color: Theme.colors.textMuted,
  },
  statusRow: {
    marginBottom: 8,
    backgroundColor: 'transparent',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  logButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    alignSelf: 'flex-start',
    gap: 6,
  },
  logButtonText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: Theme.colors.primary,
  },
  emptyContainer: {
    padding: 60,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  emptyText: {
    color: Theme.colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
  }
});

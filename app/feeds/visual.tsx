import React, { useEffect, useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  Image, 
  TouchableOpacity, 
  RefreshControl, 
  Dimensions, 
  ActivityIndicator,
  Modal
} from 'react-native';
import { Stack } from 'expo-router';
import { Search, Filter, Camera, X, ExternalLink, Globe, Calendar } from 'lucide-react-native';
import apiClient, { getMediaSource } from '../../src/api/client';
import { Theme } from '../../src/constants/Theme';
import { useProjectStore } from '../../src/store/useProjectStore';
import { TacticalHaptics } from '../../src/utils/haptics';

const { width } = Dimensions.get('window');
const COLUMN_COUNT = 2;
const ITEM_WIDTH = (width - Theme.spacing.md * 3) / COLUMN_COUNT;

interface Screenshot {
  id: number;
  url: string;
  title: string;
  screenshot_path: string;
  subdomain_name: string;
  created_at: string;
  status_code: number;
}

export default function VisualReconFeed() {
  const [screenshots, setScreenshots] = useState<Screenshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedImage, setSelectedImage] = useState<Screenshot | null>(null);
  const { currentProject } = useProjectStore();

  const fetchScreenshots = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (currentProject) params.project = currentProject;
      
      const response = await apiClient.get('/mapi/screenshots/', { params });
      setScreenshots(response.data.results || response.data || []);
    } catch (err) {
      console.error('Failed to fetch screenshots:', err);
      TacticalHaptics.error();
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentProject]);

  useEffect(() => {
    fetchScreenshots();
  }, [fetchScreenshots]);

  const onRefresh = () => {
    setRefreshing(true);
    TacticalHaptics.soft();
    fetchScreenshots();
  };

  const handleImagePress = (item: Screenshot) => {
    TacticalHaptics.trigger();
    setSelectedImage(item);
  };

  const renderItem = ({ item }: { item: Screenshot }) => {
    const mediaSource = getMediaSource(item.screenshot_path);

    return (
      <TouchableOpacity 
        style={styles.itemContainer} 
        activeOpacity={0.9}
        onPress={() => handleImagePress(item)}
      >
        <Image 
          source={mediaSource} 
          style={styles.thumbnail}
          resizeMode="cover"
        />
        <View style={styles.itemOverlay}>
          <Text style={styles.itemTitle} numberOfLines={1}>{item.subdomain_name}</Text>
          <View style={styles.badgeRow}>
            <View style={[styles.statusBadge, { backgroundColor: item.status_code === 200 ? Theme.colors.success : Theme.colors.warning }]}>
              <Text style={styles.statusText}>{item.status_code}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'VISUAL RECON', 
          headerStyle: { backgroundColor: Theme.colors.background }, 
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontFamily: 'Bangers',
          },
        }} 
      />

      <FlatList
        data={screenshots}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        numColumns={COLUMN_COUNT}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.columnWrapper}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Theme.colors.primary} />}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <Camera size={48} color={Theme.colors.textMuted} />
              <Text style={styles.emptyText}>No visual intelligence found.</Text>
            </View>
          ) : null
        }
        ListHeaderComponent={
          loading && !refreshing ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator color={Theme.colors.primary} />
            </View>
          ) : null
        }
      />

      {/* Lightbox Modal */}
      <Modal
        visible={!!selectedImage}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedImage(null)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.closeButton} 
            onPress={() => setSelectedImage(null)}
          >
            <X color="#fff" size={28} />
          </TouchableOpacity>

          {selectedImage && (
            <View style={styles.modalContent}>
              <Image 
                source={getMediaSource(selectedImage.screenshot_path)} 
                style={styles.fullImage}
                resizeMode="contain"
              />
              <View style={styles.modalDetails}>
                <View style={styles.detailRow}>
                  <Globe color={Theme.colors.primary} size={18} />
                  <Text style={styles.detailText}>{selectedImage.subdomain_name}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Calendar color={Theme.colors.textMuted} size={18} />
                  <Text style={styles.detailText}>
                    {new Date(selectedImage.created_at).toLocaleString()}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <ExternalLink color={Theme.colors.info} size={18} />
                  <Text style={[styles.detailText, { color: Theme.colors.info }]}>
                    {selectedImage.url}
                  </Text>
                </View>
              </View>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  listContent: {
    padding: Theme.spacing.md,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  itemContainer: {
    width: ITEM_WIDTH,
    height: ITEM_WIDTH * 0.75,
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadius.md,
    marginBottom: Theme.spacing.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  itemOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: Theme.spacing.xs,
  },
  itemTitle: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  badgeRow: {
    flexDirection: 'row',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  statusText: {
    color: '#fff',
    fontSize: 8,
    fontWeight: '900',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    color: Theme.colors.textMuted,
    fontFamily: 'Bangers',
    marginTop: Theme.spacing.md,
    fontSize: 18,
    letterSpacing: 1,
  },
  loaderContainer: {
    padding: Theme.spacing.xl,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
  },
  fullImage: {
    width: '100%',
    flex: 1,
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 10,
  },
  modalDetails: {
    padding: Theme.spacing.lg,
    backgroundColor: Theme.colors.surface,
    borderTopLeftRadius: Theme.borderRadius.xl,
    borderTopRightRadius: Theme.borderRadius.xl,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Theme.spacing.sm,
  },
  detailText: {
    color: Theme.colors.text,
    marginLeft: Theme.spacing.md,
    fontSize: 14,
    fontWeight: '500',
  },
});

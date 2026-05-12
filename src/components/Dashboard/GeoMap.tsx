import React, { useState } from 'react';
import { StyleSheet, Dimensions, ImageBackground, TouchableOpacity, Animated, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Text, View } from '@/components/Themed';
import { Theme } from '../../constants/Theme';
import { Globe, MapPin, Map as MapIcon, X } from 'lucide-react-native';
import { countryCentroids } from '../../constants/countryCentroids';
import * as Haptics from 'expo-haptics';

interface CountryData {
  name: string;
  iso: string;
  count: number;
}

interface GeoMapProps {
  data: CountryData[];
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MAP_WIDTH = SCREEN_WIDTH - 64; 
const MAP_HEIGHT = MAP_WIDTH * 0.55; 

const LAT_OFFSET = 18; 
const LON_OFFSET = -5;

export default function GeoMap({ data }: GeoMapProps) {
  const router = useRouter();
  const [selectedCountry, setSelectedCountry] = useState<CountryData | null>(null);
  
  const sortedData = [...data].sort((a, b) => b.count - a.count);
  const top5 = sortedData.slice(0, 5);
  const maxCount = sortedData.length > 0 ? sortedData[0].count : 1;

  const getCoordinates = (iso: string) => {
    const centroid = countryCentroids[iso.toUpperCase()];
    if (!centroid) return null;
    
    const [lat, lon] = centroid;
    const x = ((lon + 180 + LON_OFFSET) * (MAP_WIDTH / 360));
    const y = ((90 - lat + LAT_OFFSET) * (MAP_HEIGHT / 180));
    
    return { x, y };
  };

  const handleMarkerPress = (country: CountryData) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedCountry(country);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Globe size={18} color={Theme.colors.primary} />
        <Text style={styles.title}>Global Asset Footprint</Text>
      </View>

      <View style={styles.mapContainer}>
        <ImageBackground 
          source={require('../../../assets/images/world_map.png')}
          style={styles.mapImage}
          resizeMode="stretch"
          imageStyle={{ opacity: 0.8 }}
        >
          {/* Global Markers */}
          {data.map((country) => {
            const coords = getCoordinates(country.iso);
            if (!coords) return null;
            
            const size = Math.max(8, Math.min(14, (country.count / maxCount) * 14));
            const isSelected = selectedCountry?.iso === country.iso;
            
            return (
              <TouchableOpacity 
                key={`marker-${country.iso}`} 
                style={[
                  styles.markerContainer, 
                  { left: coords.x, top: coords.y, zIndex: isSelected ? 100 : 1 }
                ]}
                onPress={() => handleMarkerPress(country)}
                activeOpacity={0.7}
              >
                <View style={[styles.pulse, { width: size * 3, height: size * 3, borderRadius: size * 1.5 }]} />
                <View style={[
                  styles.marker, 
                  { width: size, height: size, borderRadius: size / 2 },
                  isSelected && { borderColor: '#fff', borderWidth: 2 }
                ]} />
                <View style={[styles.markerCore, { width: size / 2, height: size / 2, borderRadius: size / 4 }]} />
              </TouchableOpacity>
            );
          })}

          {/* Tactical Tooltip Overlay */}
          {selectedCountry && (
            <View style={styles.tooltipContainer}>
              <View style={styles.tooltip}>
                <View style={styles.tooltipHeader}>
                  <Text style={styles.tooltipCountry}>{selectedCountry.name}</Text>
                  <TouchableOpacity onPress={() => setSelectedCountry(null)}>
                    <X size={14} color={Theme.colors.textMuted} />
                  </TouchableOpacity>
                </View>
                <View style={styles.tooltipBody}>
                  <Text style={styles.tooltipLabel}>Assets Discovered</Text>
                  <Text style={styles.tooltipCount}>{selectedCountry.count}</Text>
                </View>
                <TouchableOpacity 
                  style={styles.viewAssetsBtn}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push({
                      pathname: '/feeds/assets',
                      params: { country: selectedCountry.name }
                    } as any);
                    setSelectedCountry(null);
                  }}
                >
                  <Text style={styles.viewAssetsText}>VIEW ASSETS</Text>
                </TouchableOpacity>
                <View style={styles.tooltipTail} />
              </View>
            </View>
          )}
        </ImageBackground>
      </View>

      <View style={styles.statsContainer}>
        {top5.map((item, index) => (
          <TouchableOpacity 
            key={item.iso} 
            style={[styles.countryRow, selectedCountry?.iso === item.iso && styles.activeCountryRow]}
            onPress={() => handleMarkerPress(item)}
          >
            <View style={styles.countryInfo}>
              <Text style={styles.countryName}>{item.name}</Text>
              <Text style={styles.isoCode}>{item.iso}</Text>
            </View>
            <View style={styles.barContainer}>
              <View 
                style={[
                  styles.bar, 
                  { width: `${(item.count / maxCount) * 100}%`, backgroundColor: Theme.colors.primary }
                ]} 
              />
            </View>
            <Text style={styles.countText}>{item.count}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Theme.colors.surface,
    borderRadius: 24,
    padding: Theme.spacing.lg,
    marginBottom: Theme.spacing.lg,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
    backgroundColor: 'transparent',
  },
  title: {
    fontSize: 16,
    fontWeight: '900',
    color: '#00f3ff', // Cyan to match web branding
    fontFamily: 'Orbitron',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  mapContainer: {
    height: MAP_HEIGHT,
    backgroundColor: 'rgba(5, 5, 20, 0.4)',
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    overflow: 'hidden',
    position: 'relative',
  },
  mapImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dotGrid: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-around',
    padding: 10,
    opacity: 0.1,
    backgroundColor: 'transparent',
  },
  dotRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'transparent',
  },
  gridDot: {
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: Theme.colors.primary,
  },
  markerContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  marker: {
    backgroundColor: '#F97316', // Burnt Orange
    borderWidth: 1,
    borderColor: '#fff',
    shadowColor: '#F97316',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 10,
    zIndex: 2,
  },
  markerCore: {
    position: 'absolute',
    backgroundColor: '#00f3ff', // Bright Cyan Core
    zIndex: 3,
    shadowColor: '#00f3ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 5,
  },
  pulse: {
    position: 'absolute',
    backgroundColor: '#F97316',
    opacity: 0.2,
    zIndex: 1,
  },
  mapOverlay: {
    position: 'absolute',
    bottom: 10,
    right: 12,
    backgroundColor: 'transparent',
  },
  placeholderText: {
    color: Theme.colors.textMuted,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
    opacity: 0.5,
  },
  statsContainer: {
    backgroundColor: 'transparent',
    gap: 12,
  },
  countryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    gap: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  activeCountryRow: {
    backgroundColor: Theme.colors.primary + '11',
    borderColor: Theme.colors.primary + '33',
    borderWidth: 1,
  },
  countryInfo: {
    width: 80,
    backgroundColor: 'transparent',
  },
  countryName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: Theme.colors.text,
  },
  isoCode: {
    fontSize: 10,
    color: Theme.colors.textMuted,
  },
  barContainer: {
    flex: 1,
    height: 4,
    backgroundColor: Theme.colors.border + '44',
    borderRadius: 2,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    borderRadius: 2,
  },
  countText: {
    width: 30,
    fontSize: 12,
    fontWeight: '900',
    color: Theme.colors.primary,
    textAlign: 'right',
    fontFamily: 'Orbitron',
  },
  tooltipContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    zIndex: 1000,
  },
  tooltip: {
    backgroundColor: Theme.colors.surface,
    borderRadius: 12,
    padding: 12,
    width: 160,
    borderWidth: 1,
    borderColor: Theme.colors.primary,
    shadowColor: Theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  tooltipHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    backgroundColor: 'transparent',
  },
  tooltipCountry: {
    fontSize: 12,
    fontWeight: '900',
    color: Theme.colors.primary,
    fontFamily: 'Orbitron',
    textTransform: 'uppercase',
  },
  tooltipBody: {
    backgroundColor: 'transparent',
  },
  tooltipLabel: {
    fontSize: 10,
    color: Theme.colors.textMuted,
    marginBottom: 2,
  },
  tooltipCount: {
    fontSize: 18,
    fontWeight: '900',
    color: Theme.colors.text,
    fontFamily: 'Orbitron',
  },
  tooltipTail: {
    position: 'absolute',
    bottom: -6,
    left: '50%',
    marginLeft: -6,
    width: 12,
    height: 12,
    backgroundColor: Theme.colors.surface,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: Theme.colors.primary,
    transform: [{ rotate: '45deg' }],
  },
  viewAssetsBtn: {
    backgroundColor: Theme.colors.primary + '22',
    paddingVertical: 6,
    borderRadius: 6,
    marginTop: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Theme.colors.primary + '44',
  },
  viewAssetsText: {
    color: Theme.colors.primary,
    fontSize: 10,
    fontWeight: '900',
    fontFamily: 'Orbitron',
  },
  emptyText: {
    color: Theme.colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 10,
  }
});

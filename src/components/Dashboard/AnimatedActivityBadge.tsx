import React, { useEffect, useRef } from 'react';
import { StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { Activity } from 'lucide-react-native';
import { Theme } from '../../constants/Theme';

interface AnimatedActivityBadgeProps {
  /**
   * Callback function executed when the user taps on the badge.
   * Typically redirects the user to the active scans/history tab.
   */
  onPress: () => void;
}

/**
 * AnimatedActivityBadge component renders a pulsing Activity/Radar icon.
 * This indicates to the user that a background scan is currently running in the active project.
 */
export default function AnimatedActivityBadge({ onPress }: AnimatedActivityBadgeProps) {
  // AnimValue starting at 0.4 representing the low opacity/scale point in the pulse cycle
  const pulseAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    // Continuous looping animation alternating between 0.4 and 1.0
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.0,
          duration: 1000,
          useNativeDriver: true, // Uses native driver for hardware-accelerated 60fps execution
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.4,
          duration: 1000,
          useNativeDriver: true, // Uses native driver for hardware-accelerated 60fps execution
        }),
      ])
    );
    animation.start();

    // Cleanup animation on component unmount to prevent resource and memory leaks
    return () => animation.stop();
  }, [pulseAnim]);

  // Interpolation styles for smooth scale and opacity animations based on the animated value
  const animatedStyle = {
    opacity: pulseAnim,
    transform: [
      {
        scale: pulseAnim.interpolate({
          inputRange: [0.4, 1.0],
          outputRange: [0.95, 1.15],
        }),
      },
    ],
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.6}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <Animated.View style={animatedStyle}>
        <Activity size={22} color={Theme.colors.success} />
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginRight: 14,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
  },
});

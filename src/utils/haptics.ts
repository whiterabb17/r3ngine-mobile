import * as Haptics from 'expo-haptics';

/**
 * Standardized haptic feedback patterns for the r3ngine mobile application.
 * Use these to ensure a consistent tactile experience across all tactical screens.
 */
export const TacticalHaptics = {
  /**
   * Used for initiating a major action, like launching a scan or saving a note.
   */
  trigger: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),

  /**
   * Used for light interactions like toggling a switch or selecting a tab.
   */
  soft: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),

  /**
   * Used for heavy interactions or deep-linking jumps.
   */
  impact: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy),

  /**
   * Notification of a successful async operation.
   */
  success: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),

  /**
   * Notification of a critical finding or validation error.
   */
  error: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),

  /**
   * Notification of a warning state or "interesting" finding.
   */
  warning: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning),
};

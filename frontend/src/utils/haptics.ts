/**
 * Haptic Vibration Utility for Mobile Web
 */
export const triggerHaptic = (type: 'light' | 'medium' | 'success' | 'warning' = 'light') => {
  if (typeof window === 'undefined' || !navigator.vibrate) return;

  try {
    switch (type) {
      case 'light':
        navigator.vibrate(10);
        break;
      case 'medium':
        navigator.vibrate(20);
        break;
      case 'success':
        navigator.vibrate([15, 50, 20]);
        break;
      case 'warning':
        navigator.vibrate([30, 60, 30]);
        break;
      default:
        navigator.vibrate(15);
    }
  } catch (e) {
    // Graceful fallback on devices that don't allow vibration
  }
};

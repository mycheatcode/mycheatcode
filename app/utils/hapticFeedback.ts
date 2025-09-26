// Haptic feedback utility for mobile devices
export function triggerHapticFeedback(type: 'light' | 'medium' | 'heavy' = 'light'): void {
  // Check if device supports haptic feedback
  if (typeof window !== 'undefined' && 'navigator' in window) {
    // For modern browsers with vibration API
    if ('vibrate' in navigator) {
      switch (type) {
        case 'light':
          navigator.vibrate(10); // Very short vibration
          break;
        case 'medium':
          navigator.vibrate(50); // Medium vibration
          break;
        case 'heavy':
          navigator.vibrate([100, 50, 100]); // Pattern for heavy feedback
          break;
      }
    }

    // For iOS Safari with experimental haptic feedback
    // @ts-ignore - This is an experimental API
    if (typeof window.DeviceMotionEvent !== 'undefined' && typeof window.DeviceMotionEvent.requestPermission === 'function') {
      try {
        // @ts-ignore - Experimental API
        if (navigator.vibrate) {
          navigator.vibrate(type === 'light' ? 10 : type === 'medium' ? 50 : 100);
        }
      } catch (error) {
        // Silently fail if not supported
        console.log('Haptic feedback not supported');
      }
    }
  }
}

// Specific feedback functions for different engagement events
export function triggerSuccessFeedback(): void {
  triggerHapticFeedback('light');
}

export function triggerLevelUpFeedback(): void {
  triggerHapticFeedback('medium');
}

export function triggerAchievementFeedback(): void {
  triggerHapticFeedback('heavy');
}

export function triggerWarningFeedback(): void {
  triggerHapticFeedback('light');
}
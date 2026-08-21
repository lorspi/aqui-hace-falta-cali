/**
 * Helper utility for tracking custom events in Microsoft Clarity
 */

declare global {
  interface Window {
    clarity?: (action: string, key: string, value?: any) => void;
  }
}

export function trackClarityEvent(eventName: string, data?: Record<string, any>) {
  try {
    if (typeof window !== 'undefined' && typeof window.clarity === 'function') {
      window.clarity('event', eventName);
      if (data) {
        Object.entries(data).forEach(([key, val]) => {
          if (val !== undefined && val !== null) {
            window.clarity!('set', `${eventName}_${key}`, String(val));
          }
        });
      }
      console.log(`[Analytics] Tracked Clarity Event: ${eventName}`, data);
    }
  } catch (err) {
    console.warn('[Analytics] Clarity track error:', err);
  }
}

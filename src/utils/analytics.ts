/**
 * Helper utility for tracking custom events in Microsoft Clarity and Google Analytics (GA4)
 */

declare global {
  interface Window {
    clarity?: (action: string, key: string, value?: any) => void;
    gtag?: (command: string, action: string, params?: Record<string, any>) => void;
  }
}

export function trackClarityEvent(eventName: string, data?: Record<string, any>) {
  try {
    // 1. Microsoft Clarity
    if (typeof window !== 'undefined' && typeof window.clarity === 'function') {
      window.clarity('event', eventName);
      if (data) {
        Object.entries(data).forEach(([key, val]) => {
          if (val !== undefined && val !== null) {
            window.clarity!('set', `${eventName}_${key}`, String(val));
          }
        });
      }
    }

    // 2. Google Analytics (GA4)
    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
      window.gtag('event', eventName, data);
    }

    console.log(`[Analytics] Tracked Event: ${eventName}`, data);
  } catch (err) {
    console.warn('[Analytics] Track error:', err);
  }
}


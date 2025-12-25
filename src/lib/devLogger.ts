/**
 * Dev-only logger for verifying persistence and export operations.
 * Only logs when NODE_ENV !== 'production' or ?dev=1 is in URL.
 */

const isDev = (): boolean => {
  if (typeof window === 'undefined') return false;
  if (import.meta.env.MODE !== 'production') return true;
  return new URLSearchParams(window.location.search).get('dev') === '1';
};

export const devLog = {
  resultsSaved: (calculator: string, key: string) => {
    if (!isDev()) return;
    console.log(
      `%c[${calculator}] ✅ Results SAVED to localStorage`,
      'color: #22c55e; font-weight: bold',
      `\n  Key: ${key}\n  Timestamp: ${new Date().toISOString()}`
    );
  },

  resultsLoaded: (calculator: string, key: string) => {
    if (!isDev()) return;
    console.log(
      `%c[${calculator}] 📂 Results LOADED from localStorage`,
      'color: #3b82f6; font-weight: bold',
      `\n  Key: ${key}\n  Timestamp: ${new Date().toISOString()}`
    );
  },

  exportClicked: (calculator: string, format: 'pdf' | 'csv' | 'excel') => {
    if (!isDev()) return;
    console.log(
      `%c[${calculator}] 📥 Export ${format.toUpperCase()} clicked`,
      'color: #f59e0b; font-weight: bold',
      `\n  Timestamp: ${new Date().toISOString()}`
    );
  },

  storageKeys: () => {
    if (!isDev()) return;
    const keys = [
      'dealcalc:underwrite:state',
      'dealcalc:underwrite:results',
      'dealcalc:brrrr:state', 
      'dealcalc:brrrr:results',
      'dealcalc:syndication:state',
      'dealcalc:syndication:results',
    ];
    
    console.log('%c[DevLogger] Storage Status:', 'color: #8b5cf6; font-weight: bold');
    keys.forEach(key => {
      const value = localStorage.getItem(key);
      const status = value ? '✅ Present' : '❌ Empty';
      const size = value ? `(${(value.length / 1024).toFixed(1)} KB)` : '';
      console.log(`  ${key}: ${status} ${size}`);
    });
  },
};

// Expose to window for manual console testing
if (typeof window !== 'undefined') {
  (window as any).__devLog = devLog;
}

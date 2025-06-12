'use client';

import { useEffect } from 'react';

export default function AuthWrapper({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Get stored auth credentials and add to all fetch requests
    const authString = localStorage.getItem('adminAuth');
    
    if (authString) {
      // Override fetch to include authorization header
      const originalFetch = window.fetch;
      window.fetch = function(input: RequestInfo | URL, init?: RequestInit) {
        const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
        
        // Add auth header for admin and API requests
        if (url.includes('/admin') || url.includes('/api')) {
          init = init || {};
          init.headers = {
            ...init.headers,
            'Authorization': `Basic ${authString}`,
          };
        }
        
        return originalFetch(input, init);
      };
    }
    
    return () => {
      // Cleanup: restore original fetch (though this rarely happens)
      if (window.fetch !== fetch) {
        window.fetch = fetch;
      }
    };
  }, []);

  return <>{children}</>;
} 
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

interface UsePageLoadingOptions {
  initialLoading?: boolean;
  loadingDelay?: number;
  minLoadingTime?: number;
}

export function usePageLoading(options: UsePageLoadingOptions = {}) {
  const { initialLoading = false, loadingDelay = 200, minLoadingTime = 300 } = options;
  const [isLoading, setIsLoading] = useState(initialLoading);
  const pathname = usePathname();

  // Simulate page loading with minimum time
  useEffect(() => {
    if (initialLoading) {
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, Math.max(loadingDelay, minLoadingTime));

      return () => clearTimeout(timer);
    }
  }, [initialLoading, loadingDelay, minLoadingTime]);

  // Reset loading when pathname changes (but don't auto-start loading)
  useEffect(() => {
    // Don't automatically start loading on pathname change
    // Let each page control its own loading state
  }, [pathname]);

  const startLoading = () => setIsLoading(true);
  const stopLoading = () => setIsLoading(false);

  return {
    isLoading,
    startLoading,
    stopLoading,
    setIsLoading
  };
}

// Hook for data loading with better UX
export function useDataLoading() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const withLoading = async <T>(asyncFn: () => Promise<T>): Promise<T | null> => {
    setIsLoading(true);
    setError(null);
    
    const startTime = Date.now();
    
    try {
      const result = await asyncFn();
      
      // Ensure minimum loading time for better UX (avoid flash)
      const elapsedTime = Date.now() - startTime;
      const minLoadingTime = 300; // 300ms minimum
      
      if (elapsedTime < minLoadingTime) {
        await new Promise(resolve => setTimeout(resolve, minLoadingTime - elapsedTime));
      }
      
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    error,
    withLoading,
    setError,
    clearError: () => setError(null)
  };
} 
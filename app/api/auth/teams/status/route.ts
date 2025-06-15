import { getAuthStatus, getValidAuthToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Add timeout to prevent Vercel timeout
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Status check timeout')), 25000); // 25 second timeout
    });
    
    const statusPromise = (async () => {
      console.log('🔍 Checking auth status with auto-refresh...');
      
      // First get current status
      const initialStatus = await getAuthStatus();
      console.log('Initial auth status:', {
        isAuthenticated: initialStatus.isAuthenticated,
        timeUntilExpiry: initialStatus.timeUntilExpiry,
        error: initialStatus.error
      });
      
      // If we have tokens but they're expired/expiring, try to get valid token (triggers refresh)
      if (initialStatus.isAuthenticated || initialStatus.error?.includes('expired')) {
        console.log('🔄 Attempting to get valid token (may trigger refresh)...');
        const validToken = await getValidAuthToken();
        
        if (validToken) {
          // Get updated status after potential refresh
          const updatedStatus = await getAuthStatus();
          console.log('Updated auth status after refresh attempt:', {
            isAuthenticated: updatedStatus.isAuthenticated,
            timeUntilExpiry: updatedStatus.timeUntilExpiry,
            wasRefreshed: initialStatus.expiresAt !== updatedStatus.expiresAt
          });
          
          return updatedStatus;
        }
      }
      
      return initialStatus;
    })();
    
    const authStatus = await Promise.race([statusPromise, timeoutPromise]) as Awaited<ReturnType<typeof getAuthStatus>>;
    
    return Response.json({
      success: true,
      ...authStatus,
      // Add mock user info if authenticated but no specific user info
      userInfo: authStatus.isAuthenticated ? {
        displayName: 'Teams User',
        email: 'authenticated@teams.microsoft.com',
        id: 'authenticated-user'
      } : undefined
    });
  } catch (error) {
    console.error('Failed to check Teams auth status:', error);
    
    return Response.json({
      success: false,
      isAuthenticated: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
} 
import { getValidAuthToken, getAuthStatus } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    console.log('🔄 Force refresh token requested...');
    
    // Get current auth status
    const beforeStatus = await getAuthStatus();
    console.log('Auth status before refresh:', beforeStatus);
    
    // Force get token (this will trigger refresh if needed)
    const token = await getValidAuthToken();
    
    if (!token) {
      return Response.json({
        success: false,
        error: 'No token available or refresh failed',
        beforeStatus
      }, { status: 401 });
    }
    
    // Get updated auth status
    const afterStatus = await getAuthStatus();
    console.log('Auth status after refresh:', afterStatus);
    
    const wasRefreshed = beforeStatus.expiresAt !== afterStatus.expiresAt;
    
    return Response.json({
      success: true,
      message: wasRefreshed ? 'Token was refreshed' : 'Token was already valid',
      tokenRefreshed: wasRefreshed,
      authStatus: {
        before: beforeStatus,
        after: afterStatus
      }
    });
    
  } catch (error) {
    console.error('❌ Force refresh failed:', error);
    
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 
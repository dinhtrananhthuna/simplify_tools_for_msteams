import { getAuthStatus, getValidAuthToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log('🔍 Debug: Testing token expiry scenarios...');
    
    // Get current auth status
    const authStatus = await getAuthStatus();
    console.log('Current auth status:', authStatus);
    
    // Test getting valid token (should trigger refresh if needed)
    console.log('📋 Testing getValidAuthToken()...');
    const token = await getValidAuthToken();
    
    // Get updated status after potential refresh
    const updatedAuthStatus = await getAuthStatus();
    
    return Response.json({
      success: true,
      debug: {
        message: 'Token expiry logic test completed',
        beforeRefresh: {
          isAuthenticated: authStatus.isAuthenticated,
          expiresAt: authStatus.expiresAt,
          timeUntilExpiry: authStatus.timeUntilExpiry,
          status: authStatus.error || 'OK'
        },
        afterRefresh: {
          isAuthenticated: updatedAuthStatus.isAuthenticated,
          expiresAt: updatedAuthStatus.expiresAt,
          timeUntilExpiry: updatedAuthStatus.timeUntilExpiry,
          status: updatedAuthStatus.error || 'OK'
        },
        tokenObtained: !!token,
        wasRefreshed: authStatus.expiresAt !== updatedAuthStatus.expiresAt,
        refreshLogic: {
          explanation: 'Token is refreshed if timeUntilExpiry <= 300000ms (5 minutes)',
          cases: {
            'Expired 2 hours ago': '-7200000ms <= 300000ms = TRUE → Refresh',
            'Expired 1 minute ago': '-60000ms <= 300000ms = TRUE → Refresh', 
            'Expires in 2 minutes': '120000ms <= 300000ms = TRUE → Refresh',
            'Expires in 10 minutes': '600000ms <= 300000ms = FALSE → Use current'
          }
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Debug test failed:', error);
    
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      debug: {
        message: 'Debug test failed, but this helps us see the error handling'
      }
    });
  }
} 
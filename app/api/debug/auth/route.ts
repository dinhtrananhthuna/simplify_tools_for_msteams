import { getValidAuthToken, getAuthStatus } from '@/lib/auth';
import { getGraphClient } from '@/lib/teams';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log('🔍 Debug: Testing Teams authentication with new refresh mechanism...');
    
    // Timeout ngắn hơn cho debug
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Debug timeout')), 15000); // 15 giây
    });
    
    const debugPromise = (async () => {
      console.log('1. Getting auth status from database...');
      const authStatus = await getAuthStatus();
      console.log('Auth status:', authStatus);
      
      console.log('2. Getting token with auto-refresh...');
      const tokenData = await getValidAuthToken();
      
      if (!tokenData) {
        return {
          step: 'token_check',
          success: false,
          error: 'No token found or refresh failed',
          authStatus
        };
      }
      
      console.log('3. Token obtained, testing Graph API...');
      
      // Tạo Graph client
      const client = await getGraphClient();
      
      console.log('4. Making simple Graph API call...');
      
      // Test với API call đơn giản nhất
      const me = await client.api('/me').get();
      
      console.log('5. Getting updated auth status...');
      const updatedAuthStatus = await getAuthStatus();
      
      return {
        step: 'complete',
        success: true,
        userInfo: {
          displayName: me.displayName,
          mail: me.mail,
          id: me.id
        },
        authStatus: {
          before: authStatus,
          after: updatedAuthStatus
        },
        tokenRefreshed: authStatus.expiresAt !== updatedAuthStatus.expiresAt
      };
    })();
    
    const result = await Promise.race([debugPromise, timeoutPromise]);
    
    return Response.json({
      success: true,
      debug: result
    });
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
    
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      step: 'failed'
    }, { status: 500 });
  }
} 
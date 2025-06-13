import { getValidAuthToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log('🔍 Simple Debug: Testing with raw fetch...');
    
    // Timeout ngắn
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Simple debug timeout')), 8000); // 8 giây
    });
    
    const debugPromise = (async () => {
      console.log('1. Getting token from database...');
      const tokenData = await getValidAuthToken();
      
      if (!tokenData) {
        return {
          step: 'token_check',
          success: false,
          error: 'No token found in database'
        };
      }
      
      console.log('2. Testing simple Graph API call with fetch...');
      
      // Sử dụng fetch thuần thay vì Graph SDK
      const response = await fetch('https://graph.microsoft.com/v1.0/me', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${tokenData}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Graph API error: ${response.status} ${response.statusText}`);
      }
      
      const me = await response.json();
      
      return {
        step: 'complete',
        success: true,
        userInfo: {
          displayName: me.displayName,
          mail: me.mail || me.userPrincipalName,
          id: me.id
        },
        method: 'raw_fetch'
      };
    })();
    
    const result = await Promise.race([debugPromise, timeoutPromise]);
    
    return Response.json({
      success: true,
      debug: result
    });
    
  } catch (error) {
    console.error('❌ Simple Debug failed:', error);
    
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      step: 'failed',
      method: 'raw_fetch'
    }, { status: 500 });
  }
} 
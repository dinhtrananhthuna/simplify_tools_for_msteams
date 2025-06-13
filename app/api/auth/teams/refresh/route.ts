import { getAuthStatus, getRefreshToken, saveAuthToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Direct refresh token function (copy từ auth.ts để sử dụng trực tiếp)
async function refreshAccessTokenDirect(refreshToken: string): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
}> {
  console.log('🔧 Force refresh: Setting up refresh token request...');
  
  const TEAMS_CONFIG = {
    clientId: process.env.TEAMS_CLIENT_ID!,
    clientSecret: process.env.TEAMS_CLIENT_SECRET!,
    tenantId: process.env.TEAMS_TENANT_ID!,
  };

  console.log('🔧 Force refresh: Config check:', {
    hasClientId: !!TEAMS_CONFIG.clientId,
    hasClientSecret: !!TEAMS_CONFIG.clientSecret,
    hasTenantId: !!TEAMS_CONFIG.tenantId,
    refreshTokenLength: refreshToken?.length || 0
  });

  const requestBody = new URLSearchParams({
    client_id: TEAMS_CONFIG.clientId,
    client_secret: TEAMS_CONFIG.clientSecret,
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
  });

  console.log('🌐 Force refresh: Making refresh token request to Azure AD...');

  const response = await fetch(`https://login.microsoftonline.com/${TEAMS_CONFIG.tenantId}/oauth2/v2.0/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: requestBody,
  });

  console.log('📡 Force refresh: Response status:', response.status, response.statusText);

  if (!response.ok) {
    const error = await response.text();
    console.error('❌ Force refresh: API error:', error);
    throw new Error(`Force refresh failed: ${error}`);
  }

  const result = await response.json();
  console.log('✅ Force refresh: API success, got new tokens');
  return result;
}

export async function POST() {
  try {
    console.log('🔄 TRUE FORCE REFRESH requested - will refresh regardless of expiry time...');
    
    // Get current auth status
    const beforeStatus = await getAuthStatus();
    console.log('Auth status before force refresh:', beforeStatus);
    
    if (!beforeStatus.isAuthenticated) {
      return Response.json({
        success: false,
        error: 'No authentication found - please login first',
        beforeStatus
      }, { status: 401 });
    }
    
    // Get refresh token directly
    console.log('🔓 Getting refresh token for force refresh...');
    const refreshToken = await getRefreshToken();
    
    console.log('🔓 Refresh token debug:', {
      hasRefreshToken: !!refreshToken,
      refreshTokenLength: refreshToken?.length || 0,
      refreshTokenPreview: refreshToken ? `${refreshToken.substring(0, 20)}...` : 'NULL'
    });
    
    if (!refreshToken) {
      console.error('❌ No refresh token available - debugging...');
      
      // Debug database directly
      const { executeQuerySingle } = await import('@/lib/db');
      const directQuery = await executeQuerySingle<any>(
        'SELECT refresh_token, created_at, expires_at FROM auth_tokens WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
        ['admin']
      );
      
      console.log('🔍 Direct database query result:', {
        found: !!directQuery,
        hasRefreshToken: !!directQuery?.refresh_token,
        refreshTokenLength: directQuery?.refresh_token?.length || 0,
        createdAt: directQuery?.created_at,
        expiresAt: directQuery?.expires_at
      });
      
      return Response.json({
        success: false,
        error: 'No refresh token available',
        debug: {
          beforeStatus,
          directDatabaseQuery: directQuery ? {
            hasRefreshToken: !!directQuery.refresh_token,
            refreshTokenLength: directQuery.refresh_token?.length || 0,
            createdAt: directQuery.created_at,
            expiresAt: directQuery.expires_at
          } : null
        }
      }, { status: 401 });
    }
    
    console.log('🌐 Calling Azure AD to force refresh token...');
    
    // Force refresh the token regardless of expiry time
    const newTokens = await refreshAccessTokenDirect(refreshToken);
    
    console.log('✅ Force refresh successful, saving new tokens...');
    
    // Save new tokens to database
    await saveAuthToken(
      newTokens.access_token,
      newTokens.refresh_token,
      newTokens.expires_in,
      beforeStatus.scope || 'default'
    );
    
    console.log('💾 New tokens saved to database');
    
    // Get updated auth status
    const afterStatus = await getAuthStatus();
    console.log('Auth status after force refresh:', afterStatus);
    
    const wasRefreshed = beforeStatus.expiresAt !== afterStatus.expiresAt;
    
    return Response.json({
      success: true,
      message: 'Token was force refreshed successfully',
      tokenRefreshed: wasRefreshed,
      forceRefresh: true,
      authStatus: {
        before: beforeStatus,
        after: afterStatus
      },
      newTokenInfo: {
        expiresIn: newTokens.expires_in,
        newExpiresAt: afterStatus.expiresAt
      }
    });
    
  } catch (error) {
    console.error('❌ Force refresh failed:', error);
    
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      forceRefresh: true
    }, { status: 500 });
  }
} 
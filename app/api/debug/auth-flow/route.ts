import { NextRequest } from 'next/server';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();
    
    if (!code) {
      return Response.json({ error: 'Code is required' }, { status: 400 });
    }

    const TEAMS_CONFIG = {
      clientId: process.env.TEAMS_CLIENT_ID!,
      clientSecret: process.env.TEAMS_CLIENT_SECRET!,
      tenantId: process.env.TEAMS_TENANT_ID!,
      redirectUri: `${process.env.NEXTAUTH_URL}/api/auth/teams/callback`,
    };

    console.log('🔄 Debug auth flow - Starting token exchange...');
    console.log('📝 Code length:', code?.length || 0);
    
    const response = await fetch(`https://login.microsoftonline.com/${TEAMS_CONFIG.tenantId}/oauth2/v2.0/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: TEAMS_CONFIG.clientId,
        client_secret: TEAMS_CONFIG.clientSecret,
        code,
        redirect_uri: TEAMS_CONFIG.redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    console.log('📡 Response status:', response.status, response.statusText);

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Token exchange failed:', error);
      return Response.json({ 
        error: 'Token exchange failed', 
        details: error,
        status: response.status 
      }, { status: 400 });
    }

    const result = await response.json();
    
    // Log detailed response but mask sensitive data
    const debugResult = {
      hasAccessToken: !!result.access_token,
      hasRefreshToken: !!result.refresh_token,
      accessTokenLength: result.access_token?.length || 0,
      refreshTokenLength: result.refresh_token?.length || 0,
      accessTokenType: typeof result.access_token,
      refreshTokenType: typeof result.refresh_token,
      expiresIn: result.expires_in,
      scope: result.scope,
      tokenType: result.token_type,
      rawKeys: Object.keys(result),
      accessTokenPreview: result.access_token ? result.access_token.substring(0, 20) + '...' : null,
      refreshTokenPreview: result.refresh_token ? result.refresh_token.substring(0, 20) + '...' : null,
    };

    console.log('✅ Debug response received:', debugResult);

    return Response.json({
      success: true,
      debug: debugResult,
      message: 'Token exchange successful'
    });

  } catch (error) {
    console.error('Debug auth flow failed:', error);
    return Response.json({ 
      error: 'Debug auth flow failed', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
} 
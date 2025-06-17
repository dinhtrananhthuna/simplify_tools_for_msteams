import { NextRequest } from 'next/server';
import { handleExternalTenantAuth, exchangeCodeForTokens, extractTenantFromToken, isExternalUser } from '@/lib/teams';
import { saveAuthToken } from '@/lib/auth';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');
    const state = searchParams.get('state'); // Can contain tenant info for external auth
    
    console.log('🔄 Teams OAuth callback triggered');
    console.log('📝 Received parameters:', {
      hasCode: !!code,
      hasError: !!error,
      errorDescription,
      state
    });

    if (error) {
      console.error('❌ OAuth error:', error, errorDescription);
      return Response.redirect(`${process.env.NEXTAUTH_URL}/admin/auth?error=${encodeURIComponent(error)}`);
    }

    if (!code) {
      console.error('❌ No authorization code received');
      return Response.redirect(`${process.env.NEXTAUTH_URL}/admin/auth?error=no_code`);
    }

    try {
      // Parse state for external tenant info if provided
      let externalTenantId: string | undefined;
      if (state) {
        try {
          const stateData = JSON.parse(decodeURIComponent(state));
          externalTenantId = stateData.tenantId;
          console.log('🏢 External tenant from state:', externalTenantId);
        } catch (parseError) {
          console.log('⚠️ Could not parse state data, proceeding with standard auth');
        }
      }

      let tokenResponse;
      
      if (externalTenantId) {
        // Handle external tenant authentication
        console.log('🌐 Processing external tenant authentication');
        tokenResponse = await handleExternalTenantAuth(code, externalTenantId);
      } else {
        // Handle standard authentication (with potential multi-tenant support)
        console.log('🔒 Processing standard authentication');
        tokenResponse = await exchangeCodeForTokens(code);
      }

      console.log('✅ Token exchange successful');

      // Extract tenant info from the received token
      const userTenantId = extractTenantFromToken(tokenResponse.access_token);
      const isExternal = isExternalUser(tokenResponse.access_token);
      
      console.log('👤 User authentication info:', {
        userTenant: userTenantId,
        isExternal,
        tokenTenant: tokenResponse.tenant_id
      });

      // Save tokens to database
      await saveAuthToken(
        tokenResponse.access_token,
        tokenResponse.refresh_token,
        tokenResponse.expires_in,
        tokenResponse.scope || 'default'
      );

      console.log('💾 Tokens saved to database successfully');
      
      // Redirect with success message and user type info
      const redirectParams = new URLSearchParams({
        success: 'true',
        userType: isExternal ? 'external' : 'internal'
      });
      
      if (userTenantId) {
        redirectParams.set('tenantId', userTenantId);
      }

      return Response.redirect(`${process.env.NEXTAUTH_URL}/admin/auth?${redirectParams.toString()}`);

    } catch (tokenError) {
      console.error('❌ Token exchange failed:', tokenError);
      
      let errorMessage = 'token_exchange_failed';
      
      if (tokenError instanceof Error) {
        if (tokenError.message.includes('External tenant authentication failed')) {
          errorMessage = 'external_tenant_auth_failed';
        } else if (tokenError.message.includes('AADSTS50020')) {
          errorMessage = 'external_user_not_found';
        } else if (tokenError.message.includes('AADSTS65001')) {
          errorMessage = 'consent_required';
        }
      }
      
      return Response.redirect(`${process.env.NEXTAUTH_URL}/admin/auth?error=${errorMessage}`);
    }

  } catch (error) {
    console.error('❌ Callback processing failed:', error);
    return Response.redirect(`${process.env.NEXTAUTH_URL}/admin/auth?error=callback_failed`);
  }
} 
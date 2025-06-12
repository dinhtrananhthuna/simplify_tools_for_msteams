import { NextRequest } from 'next/server';
import { exchangeCodeForTokens } from '@/lib/teams';
import { saveAuthToken } from '@/lib/auth';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  console.log('🔗 Teams OAuth callback called');
  
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    
    console.log('📊 OAuth callback params:', { 
      hasCode: !!code, 
      hasError: !!error,
      error: error 
    });
    
    // Handle OAuth errors
    if (error) {
      console.error('❌ OAuth error received:', error);
      return Response.redirect(`${request.nextUrl.origin}/admin/auth?error=${encodeURIComponent(error)}`);
    }
    
    // Handle missing code
    if (!code) {
      console.error('❌ No authorization code received');
      return Response.redirect(`${request.nextUrl.origin}/admin/auth?error=missing_code`);
    }
    
    console.log('✅ Authorization code received, exchanging for tokens...');
    
    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code);
    console.log('🎯 Token exchange successful');
    
    // Save tokens to database (encrypted)
    await saveAuthToken(
      tokens.access_token,
      tokens.refresh_token,
      tokens.expires_in,
      tokens.scope
    );
    console.log('💾 Tokens saved to database');
    
    // Redirect to success page
    console.log('🎉 Redirecting to auth page with success');
    return Response.redirect(`${request.nextUrl.origin}/admin/auth?success=true`);
    
  } catch (error) {
    console.error('Teams OAuth callback failed:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return Response.redirect(
      `${request.nextUrl.origin}/admin/auth?error=${encodeURIComponent(errorMessage)}`
    );
  }
} 
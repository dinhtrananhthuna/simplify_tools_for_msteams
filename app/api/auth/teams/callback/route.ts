import { NextRequest } from 'next/server';
import { exchangeCodeForTokens } from '@/lib/teams';
import { saveAuthToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    
    // Handle OAuth errors
    if (error) {
      console.error('OAuth error:', error);
      return Response.redirect(`${request.nextUrl.origin}/admin/auth?error=${encodeURIComponent(error)}`);
    }
    
    // Handle missing code
    if (!code) {
      return Response.redirect(`${request.nextUrl.origin}/admin/auth?error=missing_code`);
    }
    
    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code);
    
    // Save tokens to database (encrypted)
    await saveAuthToken(
      tokens.access_token,
      tokens.refresh_token,
      tokens.expires_in,
      tokens.scope
    );
    
    // Redirect to success page
    return Response.redirect(`${request.nextUrl.origin}/admin/auth?success=true`);
    
  } catch (error) {
    console.error('Teams OAuth callback failed:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return Response.redirect(
      `${request.nextUrl.origin}/admin/auth?error=${encodeURIComponent(errorMessage)}`
    );
  }
} 
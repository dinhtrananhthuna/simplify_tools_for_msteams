import { executeQuerySingle } from '@/lib/db';
import { decryptToken } from '@/lib/auth';
import { AuthToken } from '../../../../types';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log('🔍 Debug: Checking tokens in database...');
    
    const query = `
      SELECT access_token, refresh_token, expires_at, scope, created_at, updated_at
      FROM auth_tokens 
      WHERE user_id = $1 
      ORDER BY created_at DESC 
      LIMIT 1
    `;

    const result = await executeQuerySingle<AuthToken>(query, ['admin']);
    
    if (!result) {
      return Response.json({
        success: false,
        error: 'No tokens found in database'
      });
    }

    // Try to decrypt tokens
    let accessTokenDecrypted = null;
    let refreshTokenDecrypted = null;
    let accessTokenError = null;
    let refreshTokenError = null;

    try {
      accessTokenDecrypted = decryptToken(result.access_token);
    } catch (error) {
      accessTokenError = error instanceof Error ? error.message : 'Unknown error';
    }

    try {
      refreshTokenDecrypted = decryptToken(result.refresh_token);
    } catch (error) {
      refreshTokenError = error instanceof Error ? error.message : 'Unknown error';
    }

    const now = new Date();
    const expiresAt = new Date(result.expires_at);
    const isExpired = expiresAt < now;
    const timeUntilExpiry = expiresAt.getTime() - now.getTime();

    return Response.json({
      success: true,
      tokenInfo: {
        expiresAt: result.expires_at,
        isExpired,
        timeUntilExpiryMinutes: Math.round(timeUntilExpiry / 1000 / 60),
        scope: result.scope,
        createdAt: result.created_at,
        updatedAt: result.updated_at,
        encryptedTokens: {
          accessTokenLength: result.access_token?.length || 0,
          refreshTokenLength: result.refresh_token?.length || 0,
        },
        decryptedTokens: {
          accessToken: {
            success: !!accessTokenDecrypted,
            length: accessTokenDecrypted?.length || 0,
            error: accessTokenError,
            preview: accessTokenDecrypted ? `${accessTokenDecrypted.substring(0, 20)}...` : null
          },
          refreshToken: {
            success: !!refreshTokenDecrypted,
            length: refreshTokenDecrypted?.length || 0,
            error: refreshTokenError,
            preview: refreshTokenDecrypted ? `${refreshTokenDecrypted.substring(0, 20)}...` : null
          }
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Debug tokens failed:', error);
    
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 
import CryptoJS from 'crypto-js';
import { AuthToken } from '../types';
import { executeQuery, executeQuerySingle } from './db';

// Basic Authentication for admin routes
export function validateBasicAuth(request: Request): boolean {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader?.startsWith('Basic ')) {
    return false;
  }
  
  try {
    const credentials = Buffer.from(authHeader.slice(6), 'base64').toString();
    const [username, password] = credentials.split(':');
    
    return username === process.env.ADMIN_USER && 
           password === process.env.ADMIN_PASS;
  } catch {
    return false;
  }
}

// Create basic auth response
export function createAuthResponse(): Response {
  return new Response('Authentication required', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Admin Area"',
      'Content-Type': 'text/plain',
    },
  });
}

// Token encryption/decryption utilities
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-key-change-in-production';

export function encryptToken(token: string): string {
  return CryptoJS.AES.encrypt(token, ENCRYPTION_KEY).toString();
}

export function decryptToken(encryptedToken: string): string {
  const bytes = CryptoJS.AES.decrypt(encryptedToken, ENCRYPTION_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
}

// Database operations for auth tokens
export async function saveAuthToken(
  accessToken: string,
  refreshToken: string,
  expiresIn: number,
  scope: string
): Promise<void> {
  console.log('💾 saveAuthToken: Starting to save tokens...');
  
  // Validate inputs with detailed logging
  console.log('🔍 saveAuthToken: Input validation:', {
    hasAccessToken: !!accessToken,
    hasRefreshToken: !!refreshToken,
    accessTokenLength: accessToken?.length || 0,
    refreshTokenLength: refreshToken?.length || 0,
    accessTokenType: typeof accessToken,
    refreshTokenType: typeof refreshToken,
    expiresIn,
    scope
  });
  
  if (!accessToken || typeof accessToken !== 'string' || accessToken.trim().length === 0) {
    console.error('❌ saveAuthToken: Invalid access token');
    throw new Error('Valid access token is required');
  }
  
  if (!refreshToken || typeof refreshToken !== 'string' || refreshToken.trim().length === 0) {
    console.error('❌ saveAuthToken: Invalid refresh token');
    throw new Error('Valid refresh token is required');
  }
  
  console.log('✅ saveAuthToken: Input validation passed');
  
  // Test encryption before saving
  try {
    const testEncrypt = encryptToken(refreshToken);
    const testDecrypt = decryptToken(testEncrypt);
    if (testDecrypt !== refreshToken) {
      throw new Error('Encryption test failed for refresh token');
    }
    console.log('✅ saveAuthToken: Encryption test passed');
  } catch (error) {
    console.error('❌ saveAuthToken: Encryption test failed:', error);
    throw new Error(`Cannot encrypt refresh token: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
  
  const encryptedAccessToken = encryptToken(accessToken);
  const encryptedRefreshToken = encryptToken(refreshToken);
  const expiresAt = new Date(Date.now() + expiresIn * 1000);

  console.log('🔐 saveAuthToken: Tokens encrypted:', {
    encryptedAccessTokenLength: encryptedAccessToken.length,
    encryptedRefreshTokenLength: encryptedRefreshToken.length,
    expiresAt: expiresAt.toISOString()
  });

  const query = `
    INSERT INTO auth_tokens (user_id, access_token, refresh_token, expires_at, scope)
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (user_id) DO UPDATE SET 
      access_token = EXCLUDED.access_token,
      refresh_token = EXCLUDED.refresh_token,
      expires_at = EXCLUDED.expires_at,
      scope = EXCLUDED.scope,
      updated_at = CURRENT_TIMESTAMP
  `;

  await executeQuery(query, [
    'admin',
    encryptedAccessToken,
    encryptedRefreshToken,
    expiresAt,
    scope
  ]);
  
  console.log('✅ saveAuthToken: Tokens saved to database successfully');
}

export async function getValidAuthToken(): Promise<string | null> {
  try {
    console.log('🔍 Getting valid auth token...');
    
    // Get latest token from database
    const query = `
      SELECT access_token, refresh_token, expires_at, scope, created_at
      FROM auth_tokens 
      WHERE user_id = $1 
      ORDER BY created_at DESC 
      LIMIT 1
    `;

    const result = await executeQuerySingle<AuthToken>(query, ['admin']);
    
    if (!result) {
      console.log('❌ No token found in database');
      return null;
    }

    console.log('📊 Token info:', {
      hasAccessToken: !!result.access_token,
      hasRefreshToken: !!result.refresh_token,
      expiresAt: result.expires_at,
      createdAt: result.created_at,
      scope: result.scope
    });

    // Calculate time until expiry
    const now = new Date();
    const expiresAt = new Date(result.expires_at);
    const timeUntilExpiry = expiresAt.getTime() - now.getTime();
    const fiveMinutes = 5 * 60 * 1000; // 5 minutes in milliseconds

    console.log('⏰ Token timing:', {
      now: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      timeUntilExpiry: Math.round(timeUntilExpiry / 1000) + ' seconds',
      timeUntilExpiryMs: timeUntilExpiry,
      fiveMinutesMs: fiveMinutes,
      shouldRefresh: timeUntilExpiry <= fiveMinutes,
      tokenStatus: timeUntilExpiry <= 0 ? 'EXPIRED' : timeUntilExpiry <= fiveMinutes ? 'EXPIRES_SOON' : 'VALID'
    });

    // If token is expired or expires within 5 minutes, try to refresh
    if (timeUntilExpiry <= fiveMinutes) {
      console.log('🔄 Token expired or expires soon, attempting refresh...');
      
      try {
        console.log('🔓 Decrypting refresh token...');
        const refreshToken = decryptToken(result.refresh_token);
        
        if (!refreshToken || refreshToken.length === 0) {
          console.error('❌ Refresh token is empty after decryption');
          return null;
        }
        
        console.log('🌐 Calling refresh token API...');
        const tokens = await refreshAccessTokenDirect(refreshToken);
        
        if (!tokens.access_token || !tokens.refresh_token) {
          console.error('❌ Invalid tokens received from refresh API');
          return null;
        }

        console.log('✅ New tokens received:', {
          hasAccessToken: !!tokens.access_token,
          hasRefreshToken: !!tokens.refresh_token,
          expiresIn: tokens.expires_in
        });
        
        // Save new tokens
        await saveAuthToken(
          tokens.access_token,
          tokens.refresh_token,
          tokens.expires_in,
          result.scope // Keep existing scope
        );
        
        console.log('💾 New tokens saved to database');
        
        // Return the fresh access token directly (it's not encrypted yet)
        // IMPORTANT: Return raw token after refresh, don't try to decrypt it
        console.log('✅ Token refresh completed successfully');
        return tokens.access_token;
      } catch (refreshError) {
        console.error('❌ Token refresh failed:', refreshError);
        
        // If refresh failed due to invalid/expired refresh token, clear tokens
        if (refreshError instanceof Error && 
            (refreshError.message.includes('invalid_grant') || 
             refreshError.message.includes('invalid_token'))) {
          console.log('🗑️ Clearing invalid tokens...');
          await clearAuthTokens();
        }
        
        return null;
      }
    }

    // Token is still valid, decrypt and return
    console.log('🔓 Decrypting valid access token...');
    console.log('🔍 Access token preview (first 20 chars):', result.access_token?.substring(0, 20) + '...');
    
    try {
      const token = decryptToken(result.access_token);
      if (!token) {
        console.error('❌ Failed to decrypt access token - empty result');
        return null;
      }
      
      console.log('✅ Using existing valid token (decrypted length:', token.length, ')');
      return token;
    } catch (decryptError) {
      console.error('❌ Failed to decrypt access token:', decryptError);
      console.error('🔍 Token appears to be corrupt or encrypted with different key');
      
      // If decryption fails, token might be:
      // 1. Raw JWT token saved after refresh
      // 2. Encrypted with old/different encryption key
      // 3. Corrupted data
      
      try {
        console.log('🔄 Attempting to handle corrupt token...');
        
        // Test if this is a valid JWT token (starts with 'eyJ')
        if (result.access_token.startsWith('eyJ')) {
          console.log('📝 Detected raw JWT token, re-encrypting...');
          
          // Re-encrypt and save the token properly
          const encryptedToken = encryptToken(result.access_token);
          await executeQuery(
            'UPDATE auth_tokens SET access_token = $1 WHERE user_id = $2',
            [encryptedToken, 'admin']
          );
          
          console.log('✅ Token re-encrypted and saved');
          return result.access_token; // Return the raw token this time
        }
        
        // If it's encrypted but can't decrypt (old key or corrupt), clear tokens
        if (result.access_token.startsWith('U2FsdGVkX1/')) {
          console.log('🧹 Detected encrypted token with incompatible key/format, clearing...');
          await clearAuthTokens();
          console.log('✅ Cleared corrupt tokens, user needs to re-authenticate');
          return null;
        }
        
        console.log('❓ Unknown token format, clearing for safety...');
        await clearAuthTokens();
        return null;
        
      } catch (fixError) {
        console.error('❌ Failed to fix corrupt token:', fixError);
        
        // As last resort, clear all tokens to force re-authentication
        try {
          await clearAuthTokens();
          console.log('🧹 Cleared all tokens due to unfixable corruption');
        } catch (clearError) {
          console.error('❌ Failed to clear tokens:', clearError);
        }
        
        return null;
      }
    }
  } catch (dbError) {
    console.error('❌ Database error in getValidAuthToken:', dbError);
    return null;
  }
}

// Direct refresh token function (doesn't depend on other auth functions)
async function refreshAccessTokenDirect(refreshToken: string): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
}> {
  console.log('🔧 Setting up refresh token request...');
  
  const TEAMS_CONFIG = {
    clientId: process.env.TEAMS_CLIENT_ID!,
    clientSecret: process.env.TEAMS_CLIENT_SECRET!,
    tenantId: process.env.TEAMS_TENANT_ID!,
  };

  console.log('🔧 Config check:', {
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

  console.log('🌐 Making refresh token request to Azure AD...');
  console.log('📝 Request body params:', Array.from(requestBody.keys()));

  const response = await fetch(`https://login.microsoftonline.com/${TEAMS_CONFIG.tenantId}/oauth2/v2.0/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: requestBody,
  });

  console.log('📡 Response status:', response.status, response.statusText);

  if (!response.ok) {
    const error = await response.text();
    console.error('❌ Refresh token API error:', error);
    throw new Error(`Token refresh failed: ${error}`);
  }

  const result = await response.json();
  console.log('✅ Refresh token API success, got new tokens');
  return result;
}

export async function getRefreshToken(): Promise<string | null> {
  console.log('🔍 getRefreshToken: Starting to get refresh token...');
  
  const query = `
    SELECT refresh_token 
    FROM auth_tokens 
    WHERE user_id = $1 
    ORDER BY created_at DESC 
    LIMIT 1
  `;

  const result = await executeQuerySingle<AuthToken>(query, ['admin']);
  
  console.log('🔍 getRefreshToken: Database query result:', {
    found: !!result,
    hasRefreshToken: !!result?.refresh_token,
    refreshTokenLength: result?.refresh_token?.length || 0
  });
  
  if (!result) {
    console.log('❌ getRefreshToken: No result from database');
    return null;
  }

  try {
    console.log('🔓 getRefreshToken: Attempting to decrypt refresh token...');
    const decrypted = decryptToken(result.refresh_token);
    console.log('✅ getRefreshToken: Decrypt successful, length:', decrypted?.length || 0);
    return decrypted;
  } catch (error) {
    console.error('❌ getRefreshToken: Failed to decrypt refresh token:', error);
    console.error('❌ getRefreshToken: Encrypted token info:', {
      length: result.refresh_token?.length || 0,
      preview: result.refresh_token ? result.refresh_token.substring(0, 50) + '...' : 'NULL'
    });
    return null;
  }
}

export async function clearAuthTokens(): Promise<void> {
  await executeQuery('DELETE FROM auth_tokens WHERE user_id = $1', ['admin']);
}

// Check if user has valid authentication
export async function hasValidAuth(): Promise<boolean> {
  const token = await getValidAuthToken();
  return !!token;
}

export interface AuthStatus {
  isAuthenticated: boolean;
  expiresAt?: string;
  timeUntilExpiry?: number;
  scope?: string;
  lastRefreshed?: string;
  error?: string;
}

export async function getAuthStatus(): Promise<AuthStatus> {
  try {
    console.log('🔍 Getting auth status...');
    
    const query = `
      SELECT access_token, refresh_token, expires_at, scope, created_at
      FROM auth_tokens 
      WHERE user_id = $1 
      ORDER BY created_at DESC 
      LIMIT 1
    `;

    const result = await executeQuerySingle<AuthToken>(query, ['admin']);
    
    if (!result) {
      console.log('❌ No token found in database');
      return {
        isAuthenticated: false,
        error: 'No authentication token found'
      };
    }

    // Calculate time until expiry
    const now = new Date();
    const expiresAt = new Date(result.expires_at);
    const timeUntilExpiry = expiresAt.getTime() - now.getTime();
    const fiveMinutes = 5 * 60 * 1000;

    // Check if token is valid
    const isValid = timeUntilExpiry > 0;
    const needsRefresh = timeUntilExpiry <= fiveMinutes;

    console.log('📊 Auth status:', {
      isValid,
      needsRefresh,
      expiresAt: expiresAt.toISOString(),
      timeUntilExpiry: Math.round(timeUntilExpiry / 1000) + ' seconds',
      scope: result.scope,
      lastRefreshed: new Date(result.created_at).toISOString()
    });

    return {
      isAuthenticated: isValid,
      expiresAt: expiresAt.toISOString(),
      timeUntilExpiry: Math.round(timeUntilExpiry / 1000),
      scope: result.scope,
      lastRefreshed: new Date(result.created_at).toISOString(),
      error: !isValid ? 'Token has expired' : needsRefresh ? 'Token needs refresh' : undefined
    };
  } catch (error) {
    console.error('❌ Failed to get auth status:', error);
    return {
      isAuthenticated: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
} 
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
  const encryptedAccessToken = encryptToken(accessToken);
  const encryptedRefreshToken = encryptToken(refreshToken);
  const expiresAt = new Date(Date.now() + expiresIn * 1000);

  const query = `
    INSERT INTO auth_tokens (user_id, access_token, refresh_token, expires_at, scope)
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (user_id) 
    DO UPDATE SET 
      access_token = EXCLUDED.access_token,
      refresh_token = EXCLUDED.refresh_token,
      expires_at = EXCLUDED.expires_at,
      scope = EXCLUDED.scope,
      updated_at = NOW()
  `;

  await executeQuery(query, [
    'admin',
    encryptedAccessToken,
    encryptedRefreshToken,
    expiresAt,
    scope
  ]);
}

export async function getValidAuthToken(): Promise<string | null> {
  console.log('🔍 Checking for valid auth token...');
  
  try {
    const query = `
      SELECT access_token, refresh_token, expires_at 
      FROM auth_tokens 
      WHERE user_id = $1
      ORDER BY created_at DESC 
      LIMIT 1
    `;

    console.log('📊 Executing database query for user: admin');
    const result = await executeQuerySingle<AuthToken>(query, ['admin']);
    console.log('📊 Database query result:', result ? 'Found token' : 'No token found');
    
    if (!result) {
      console.log('❌ No token found in database');
      return null;
    }

    const now = new Date();
    const expiresAt = new Date(result.expires_at);
    const timeUntilExpiry = expiresAt.getTime() - now.getTime();
    const fiveMinutes = 5 * 60 * 1000; // 5 minutes in milliseconds

    console.log(`⏰ Token expires at: ${expiresAt.toISOString()}`);
    console.log(`⏰ Time until expiry: ${Math.round(timeUntilExpiry / 1000 / 60)} minutes`);

    // If token is expired or expires within 5 minutes, try to refresh
    if (timeUntilExpiry <= fiveMinutes) {
      console.log('🔄 Token expired or expires soon, attempting refresh...');
      
      try {
        console.log('🔓 Decrypting refresh token...');
        const refreshToken = decryptToken(result.refresh_token);
        console.log('🔓 Refresh token decrypted, length:', refreshToken?.length || 0);
        
        if (!refreshToken || refreshToken.length === 0) {
          console.error('❌ Refresh token is empty after decryption');
          return null;
        }
        
        console.log('🌐 Calling refresh token API...');
        const tokens = await refreshAccessTokenDirect(refreshToken);
        
        // Save new tokens
        await saveAuthToken(
          tokens.access_token,
          tokens.refresh_token,
          tokens.expires_in,
          result.scope // Keep existing scope
        );
        
        console.log('✅ Token refreshed successfully');
        return tokens.access_token;
      } catch (refreshError) {
        console.error('❌ Token refresh failed:', refreshError);
        return null;
      }
    }

    // Token is still valid, decrypt and return
    console.log('🔓 Attempting to decrypt token...');
    try {
      const token = decryptToken(result.access_token);
      console.log('✅ Token successfully decrypted, length:', token?.length || 0);
      return token;
    } catch (decryptError) {
      console.error('❌ Failed to decrypt access token:', decryptError);
      return null;
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
  const query = `
    SELECT refresh_token 
    FROM auth_tokens 
    WHERE user_id = $1 
    ORDER BY created_at DESC 
    LIMIT 1
  `;

  const result = await executeQuerySingle<AuthToken>(query, ['admin']);
  
  if (!result) {
    return null;
  }

  try {
    return decryptToken(result.refresh_token);
  } catch (error) {
    console.error('Failed to decrypt refresh token:', error);
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

// Get auth status for UI
export async function getAuthStatus(): Promise<{
  isAuthenticated: boolean;
  expiresAt?: Date;
  scope?: string;
}> {
  const query = `
    SELECT expires_at, scope 
    FROM auth_tokens 
    WHERE user_id = $1 
    ORDER BY created_at DESC 
    LIMIT 1
  `;

  const result = await executeQuerySingle<AuthToken>(query, ['admin']);
  
  if (!result) {
    return { isAuthenticated: false };
  }

  const isValid = new Date(result.expires_at) > new Date();
  
  return {
    isAuthenticated: isValid,
    expiresAt: result.expires_at,
    scope: result.scope,
  };
} 
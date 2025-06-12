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
  const query = `
    SELECT access_token, refresh_token, expires_at 
    FROM auth_tokens 
    WHERE user_id = $1 AND expires_at > NOW()
    ORDER BY created_at DESC 
    LIMIT 1
  `;

  const result = await executeQuerySingle<AuthToken>(query, ['admin']);
  
  if (!result) {
    return null;
  }

  try {
    return decryptToken(result.access_token);
  } catch (error) {
    console.error('Failed to decrypt access token:', error);
    return null;
  }
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
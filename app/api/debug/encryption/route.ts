import { executeQuerySingle } from '@/lib/db';
import { encryptToken, decryptToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log('🔍 Debug: Testing encryption/decryption...');
    
    // Test encryption/decryption with a sample token
    const testToken = 'test-refresh-token-12345';
    console.log('🧪 Testing with sample token:', testToken);
    
    try {
      const encrypted = encryptToken(testToken);
      console.log('✅ Encryption successful, encrypted length:', encrypted.length);
      
      const decrypted = decryptToken(encrypted);
      console.log('✅ Decryption successful, decrypted:', decrypted);
      
      const encryptionTest = {
        original: testToken,
        encrypted: encrypted.substring(0, 50) + '...',
        decrypted: decrypted,
        match: testToken === decrypted
      };
      
      console.log('🧪 Encryption test result:', encryptionTest);
    } catch (encError) {
      console.error('❌ Encryption/decryption test failed:', encError);
    }
    
    // Check actual database token
    console.log('🔍 Checking actual database token...');
    const tokens = await executeQuerySingle<any>(
      'SELECT refresh_token, access_token, created_at, expires_at FROM auth_tokens WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
      ['admin']
    );
    
    if (!tokens) {
      return Response.json({
        success: false,
        error: 'No tokens found in database',
        encryptionTest: {
          testPassed: testToken === decryptToken(encryptToken(testToken))
        }
      });
    }
    
    // Try to decrypt actual tokens
    let refreshTokenDecrypt = null;
    let refreshTokenError = null;
    let accessTokenDecrypt = null;
    let accessTokenError = null;
    
    try {
      refreshTokenDecrypt = decryptToken(tokens.refresh_token);
      console.log('✅ Database refresh token decrypt successful');
    } catch (error) {
      refreshTokenError = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Database refresh token decrypt failed:', error);
    }
    
    try {
      accessTokenDecrypt = decryptToken(tokens.access_token);
      console.log('✅ Database access token decrypt successful');
    } catch (error) {
      accessTokenError = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Database access token decrypt failed:', error);
    }
    
    return Response.json({
      success: true,
      debug: {
        encryptionTest: {
          testPassed: testToken === decryptToken(encryptToken(testToken)),
          original: testToken,
          encryptedLength: encryptToken(testToken).length
        },
        databaseTokens: {
          found: true,
          createdAt: tokens.created_at,
          expiresAt: tokens.expires_at,
          refreshToken: {
            encryptedLength: tokens.refresh_token?.length || 0,
            decryptSuccess: !!refreshTokenDecrypt,
            decryptedLength: refreshTokenDecrypt?.length || 0,
            error: refreshTokenError,
            preview: refreshTokenDecrypt ? refreshTokenDecrypt.substring(0, 20) + '...' : null
          },
          accessToken: {
            encryptedLength: tokens.access_token?.length || 0,
            decryptSuccess: !!accessTokenDecrypt,
            decryptedLength: accessTokenDecrypt?.length || 0,
            error: accessTokenError,
            preview: accessTokenDecrypt ? accessTokenDecrypt.substring(0, 20) + '...' : null
          }
        },
        environment: {
          hasEncryptionKey: !!process.env.ENCRYPTION_KEY,
          encryptionKeyLength: process.env.ENCRYPTION_KEY?.length || 0
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Debug encryption test failed:', error);
    
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 
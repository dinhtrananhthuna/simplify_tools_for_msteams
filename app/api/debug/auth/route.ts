export const dynamic = 'force-dynamic';

import { getValidAuthToken, getAuthStatus } from '@/lib/auth';
import { executeQuerySingle } from '@/lib/db';

export async function GET() {
  try {
    console.log('🔧 DEBUG: Starting auth debug check...');
    
    // Check if we have any tokens in database
    const allTokensQuery = `
      SELECT user_id, expires_at, scope, created_at, updated_at
      FROM auth_tokens 
      ORDER BY created_at DESC
    `;
    
    const allTokens = await executeQuerySingle(allTokensQuery, []);
    console.log('📊 DEBUG: All tokens in DB:', allTokens);
    
    // Check specific admin token
    const adminTokenQuery = `
      SELECT user_id, expires_at, scope, created_at, updated_at
      FROM auth_tokens 
      WHERE user_id = $1
      ORDER BY created_at DESC 
      LIMIT 1
    `;
    
    const adminToken = await executeQuerySingle(adminTokenQuery, ['admin']);
    console.log('👤 DEBUG: Admin token:', adminToken);
    
    // Test getValidAuthToken function
    const validToken = await getValidAuthToken();
    console.log('🎯 DEBUG: getValidAuthToken result:', validToken ? 'Token found' : 'No token');
    
    // Test getAuthStatus function
    const authStatus = await getAuthStatus();
    console.log('📋 DEBUG: Auth status:', authStatus);
    
    return Response.json({
      debug: {
        allTokens,
        adminToken,
        hasValidToken: !!validToken,
        authStatus,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ DEBUG: Error in auth debug:', error);
    return Response.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 
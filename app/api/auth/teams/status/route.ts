import { checkTeamsAuthStatus } from '../../../../../lib/teams';

export async function GET() {
  try {
    const authStatus = await checkTeamsAuthStatus();
    
    return Response.json({
      success: true,
      ...authStatus,
    });
  } catch (error) {
    console.error('Failed to check Teams auth status:', error);
    
    return Response.json({
      success: false,
      isAuthenticated: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
} 
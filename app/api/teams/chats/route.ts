import { getSimpleChats } from '@/lib/teams-simple';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    console.log('🔍 API: Starting Teams chats request (simple fetch)...');
    
    // Get query params
    const url = new URL(request.url);
    const limitParam = url.searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam) : 5;
    
    // Add timeout to prevent Vercel timeout
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Chats API timeout')), 15000); // 15 second timeout
    });
    
    const chatsPromise = getSimpleChats(limit);
    
    const chats = await Promise.race([chatsPromise, timeoutPromise]);
    
    console.log('✅ API: Successfully retrieved chats (simple fetch)');
    return Response.json({
      success: true,
      chats,
      count: chats.length,
      method: 'simple_fetch',
      limit
    });
  } catch (error) {
    console.error('❌ API: Failed to get Teams chats:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch Teams chats';
    
    return Response.json({
      success: false,
      error: errorMessage,
      chats: [],
      count: 0,
      method: 'simple_fetch'
    }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    console.log('🗑️ API: Cache clearing not needed with simple fetch...');
    
    return Response.json({
      success: true,
      message: 'No cache to clear - using direct fetch',
    });
  } catch (error) {
    console.error('❌ API: Failed to clear cache:', error);
    
    return Response.json({
      success: false,
      error: 'Failed to clear cache',
    }, { status: 500 });
  }
} 
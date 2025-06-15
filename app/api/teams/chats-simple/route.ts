import { getSimpleChats } from '@/lib/teams';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    console.log('🔍 Simple API: Starting Teams chats request...');
    
    // Get query params
    const url = new URL(request.url);
    const limitParam = url.searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam) : 3;
    
    // Timeout ngắn
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Simple chats API timeout')), 10000); // 10 giây
    });
    
    const chatsPromise = getSimpleChats(limit);
    
    const chats = await Promise.race([chatsPromise, timeoutPromise]);
    
    console.log('✅ Simple API: Successfully retrieved chats');
    return Response.json({
      success: true,
      chats,
      count: chats.length,
      method: 'simple_fetch',
      limit
    });
  } catch (error) {
    console.error('❌ Simple API: Failed to get Teams chats:', error);
    
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
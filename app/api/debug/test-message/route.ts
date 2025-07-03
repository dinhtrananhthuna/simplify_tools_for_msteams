import { NextRequest } from 'next/server';
import { TeamsClient } from '@/lib/teams';

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 [DEBUG] Test Message Endpoint Started');
    
    const body = await request.json();
    const { 
      chatId = '19:281501b700be4da1b8dc8a900428860e@thread.v2', 
      message = '🧪 Test message from debug endpoint', 
      targetType = 'auto' 
    } = body;
    
    console.log('📋 [DEBUG] Request params:', {
      chatId,
      message,
      targetType,
      timestamp: new Date().toISOString()
    });
    
    // Tạo Teams client
    console.log('🔗 [DEBUG] Creating Teams client...');
    const client = await TeamsClient.create();
    console.log('✅ [DEBUG] Teams client created successfully');
    
    const results: any[] = [];
    let successfulResult: any = null;
    
    // Test 1: Auto-detect (không set type)
    if (targetType === 'auto' || targetType === 'all') {
      console.log('\n' + '='.repeat(60));
      console.log('🔄 [DEBUG] Test 1: Auto-detection (no type specified)');
      console.log('='.repeat(60));
      
      try {
        const target1 = { id: chatId };
        console.log('📤 [DEBUG] Sending with auto-detection...', target1);
        
        const result1 = await client.sendMessage(target1, message, 'text');
        
        console.log('✅ [DEBUG] AUTO-DETECTION SUCCESS!');
        console.log('📝 [DEBUG] Message ID:', result1);
        
        results.push({
          test: 'auto-detection',
          success: true,
          messageId: result1,
          target: target1
        });
        
        successfulResult = { test: 'auto-detection', messageId: result1 };
        
      } catch (error1: any) {
        console.log('❌ [DEBUG] Auto-detection failed:', error1.message);
        
        results.push({
          test: 'auto-detection',
          success: false,
          error: error1.message,
          target: { id: chatId }
        });
      }
    }
    
    // Test 2: As group chat
    if ((targetType === 'group' || targetType === 'all') && !successfulResult) {
      console.log('\n' + '='.repeat(60));
      console.log('🔄 [DEBUG] Test 2: As GROUP CHAT');
      console.log('='.repeat(60));
      
      try {
        const target2 = { id: chatId, type: 'group' as const };
        console.log('📤 [DEBUG] Sending as group chat...', target2);
        
        const result2 = await client.sendMessage(target2, message, 'text');
        
        console.log('✅ [DEBUG] GROUP CHAT SUCCESS!');
        console.log('📝 [DEBUG] Message ID:', result2);
        
        results.push({
          test: 'group-chat',
          success: true,
          messageId: result2,
          target: target2
        });
        
        successfulResult = { test: 'group-chat', messageId: result2 };
        
      } catch (error2: any) {
        console.log('❌ [DEBUG] Group chat failed:', error2.message);
        
        results.push({
          test: 'group-chat',
          success: false,
          error: error2.message,
          target: { id: chatId, type: 'group' }
        });
        
        if (error2.message.includes('Invalid ThreadId')) {
          console.log('🔍 [DEBUG] Invalid ThreadId confirmed - likely a channel');
        }
      }
    }
    
    // Test 3: As 1-on-1 chat
    if ((targetType === 'oneOnOne' || targetType === 'all') && !successfulResult) {
      console.log('\n' + '='.repeat(60));
      console.log('🔄 [DEBUG] Test 3: As ONE-ON-ONE CHAT');
      console.log('='.repeat(60));
      
      try {
        const target3 = { id: chatId, type: 'oneOnOne' as const };
        console.log('📤 [DEBUG] Sending as one-on-one chat...', target3);
        
        const result3 = await client.sendMessage(target3, message, 'text');
        
        console.log('✅ [DEBUG] ONE-ON-ONE SUCCESS!');
        console.log('📝 [DEBUG] Message ID:', result3);
        
        results.push({
          test: 'one-on-one',
          success: true,
          messageId: result3,
          target: target3
        });
        
        successfulResult = { test: 'one-on-one', messageId: result3 };
        
      } catch (error3: any) {
        console.log('❌ [DEBUG] One-on-one failed:', error3.message);
        
        results.push({
          test: 'one-on-one',
          success: false,
          error: error3.message,
          target: { id: chatId, type: 'oneOnOne' }
        });
      }
    }
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 [DEBUG] SUMMARY');
    console.log('='.repeat(60));
    
    const successfulTests = results.filter(r => r.success);
    const failedTests = results.filter(r => !r.success);
    
    console.log(`✅ [DEBUG] Successful tests: ${successfulTests.length}`);
    console.log(`❌ [DEBUG] Failed tests: ${failedTests.length}`);
    
    if (successfulResult) {
      console.log(`🎉 [DEBUG] Overall SUCCESS with ${successfulResult.test}`);
      console.log(`📝 [DEBUG] Final Message ID: ${successfulResult.messageId}`);
    } else {
      console.log('💥 [DEBUG] All tests FAILED');
    }
    
    return Response.json({
      success: !!successfulResult,
      message: successfulResult ? 
        `Message sent successfully via ${successfulResult.test}` : 
        'All send attempts failed',
      chatId,
      targetType,
      results,
      successfulResult,
      timestamp: new Date().toISOString(),
      logs: 'Check server console for detailed logs'
    });
    
  } catch (error: any) {
    console.error('💥 [DEBUG] Endpoint failed:', error);
    
    return Response.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
      logs: 'Check server console for detailed error logs'
    }, { status: 500 });
  }
}

export async function GET() {
  return Response.json({
    success: true,
    message: 'Test Message Debug Endpoint',
    usage: {
      method: 'POST',
      parameters: {
        chatId: 'string (optional, defaults to problematic ID)',
        message: 'string (optional, defaults to test message)',
        targetType: 'auto | group | oneOnOne | all (optional, defaults to auto)'
      },
      examples: [
        {
          description: 'Test with auto-detection',
          body: {
            chatId: '19:281501b700be4da1b8dc8a900428860e@thread.v2',
            message: 'Hello from test endpoint',
            targetType: 'auto'
          }
        },
        {
          description: 'Test all methods',
          body: {
            chatId: '19:281501b700be4da1b8dc8a900428860e@thread.v2',
            message: 'Test all sending methods',
            targetType: 'all'
          }
        }
      ]
    },
    timestamp: new Date().toISOString()
  });
} 
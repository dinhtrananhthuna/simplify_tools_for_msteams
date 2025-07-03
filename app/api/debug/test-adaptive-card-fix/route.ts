import { NextRequest, NextResponse } from 'next/server';
import { TeamsClient } from '@/lib/teams';

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 [TEST-ADAPTIVE-CARD-FIX] Starting Adaptive Card fix test...');
    
    const { searchParams } = new URL(request.url);
    const testCase = searchParams.get('test') || 'attachment-id-fix';
    
    console.log(`🎯 [TEST] Running test case: ${testCase}`);
    
    const client = await TeamsClient.create();
    
    // Test chat ID (hardcoded for testing)
    const testChatId = '19:77341ae6-2549-4e20-a271-ba0949a62e3f_9530c1db-3eba-4ed1-90c8-4c1d60d13954@unq.gbl.spaces';
    
    let testCard;
    let testDescription;
    
    switch (testCase) {
      case 'attachment-id-fix':
        testDescription = 'Testing Adaptive Card with attachment ID fix';
        testCard = {
          type: 'AdaptiveCard',
          version: '1.4',
          body: [
            {
              type: 'TextBlock',
              text: '🔧 Attachment ID Fix Test',
              weight: 'Bolder',
              size: 'Medium',
              color: 'Good'
            },
            {
              type: 'TextBlock',
              text: 'This card should now send successfully with unique attachment ID.',
              wrap: true
            },
            {
              type: 'FactSet',
              facts: [
                {
                  title: 'Test Case:',
                  value: 'attachment-id-fix'
                },
                {
                  title: 'Timestamp:',
                  value: new Date().toISOString()
                }
              ]
            }
          ]
        };
        break;
        
      case 'simple-card':
        testDescription = 'Testing simple Adaptive Card';
        testCard = {
          type: 'AdaptiveCard',
          version: '1.4',
          body: [
            {
              type: 'TextBlock',
              text: '✅ Simple Test Card',
              weight: 'Bolder'
            }
          ]
        };
        break;
        
      default:
        return NextResponse.json({ 
          error: 'Invalid test case',
          availableTests: ['attachment-id-fix', 'simple-card']
        }, { status: 400 });
    }
    
    console.log(`📝 [TEST] Test description: ${testDescription}`);
    console.log(`🎴 [TEST] Sending Adaptive Card...`);
    
    const result = await client.sendMessage(
      { id: testChatId, type: 'oneOnOne' },
      testCard,
      'adaptiveCard'
    );
    
    console.log(`✅ [TEST] Message sent successfully with ID: ${result}`);
    
    return NextResponse.json({
      success: true,
      testCase,
      description: testDescription,
      messageId: result,
      card: testCard,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ [TEST-ADAPTIVE-CARD-FIX] Test failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('🧪 [TEST-ADAPTIVE-CARD-FIX] POST test with custom card...');
    
    const { chatId, card, testName } = body;
    
    if (!chatId || !card) {
      return NextResponse.json({ 
        error: 'chatId and card are required' 
      }, { status: 400 });
    }
    
    const client = await TeamsClient.create();
    
    console.log(`📝 [TEST] Custom test: ${testName || 'unnamed'}`);
    console.log(`🎴 [TEST] Sending custom Adaptive Card...`);
    
    const result = await client.sendMessage(
      { id: chatId, type: 'oneOnOne' },
      card,
      'adaptiveCard'
    );
    
    console.log(`✅ [TEST] Custom card sent successfully with ID: ${result}`);
    
    return NextResponse.json({
      success: true,
      testName: testName || 'custom',
      messageId: result,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ [TEST-ADAPTIVE-CARD-FIX] POST test failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 
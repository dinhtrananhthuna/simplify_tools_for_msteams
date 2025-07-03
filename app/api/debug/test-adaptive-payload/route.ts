import { NextRequest } from 'next/server';
import { formatPullRequestMessage } from '@/lib/teams';

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 [ADAPTIVE-PAYLOAD] Testing Adaptive Card payload structure...');

    // Sample PR data
    const prData = {
      title: "Test Adaptive Card Fix",
      author: "Test User",
      repository: "test-repo",
      sourceBranch: "feature/test",
      targetBranch: "main",
      url: "https://dev.azure.com/test/test-repo/_git/pullrequests/123",
      description: "Testing the fixed Adaptive Card payload formatting",
      mentions: [],
    };

    console.log('📋 [ADAPTIVE-PAYLOAD] PR Data:', JSON.stringify(prData, null, 2));

    // Generate Adaptive Card
    const adaptiveCardMessage = formatPullRequestMessage(prData);
    console.log('🎴 [ADAPTIVE-PAYLOAD] Adaptive Card message:', JSON.stringify(adaptiveCardMessage, null, 2));

    // Test the payload structure
    const hasContentType = adaptiveCardMessage.hasOwnProperty('contentType');
    const hasContent = adaptiveCardMessage.hasOwnProperty('content');
    const contentIsObject = typeof adaptiveCardMessage.content === 'object';
    const contentHasType = adaptiveCardMessage.content?.type === 'AdaptiveCard';

    console.log('🔍 [ADAPTIVE-PAYLOAD] Structure analysis:', {
      hasContentType,
      hasContent,
      contentIsObject,
      contentHasType,
      contentTypeValue: adaptiveCardMessage.contentType,
      contentKeys: adaptiveCardMessage.content ? Object.keys(adaptiveCardMessage.content) : 'none'
    });

    // Test extraction logic (what TeamsClient should do)
    let cardContent;
    if (adaptiveCardMessage && typeof adaptiveCardMessage === 'object') {
      if (adaptiveCardMessage.contentType && adaptiveCardMessage.content) {
        cardContent = adaptiveCardMessage.content;
        console.log('✅ [ADAPTIVE-PAYLOAD] Would extract content from structure');
      } else if (adaptiveCardMessage.type === 'AdaptiveCard') {
        cardContent = adaptiveCardMessage;
        console.log('✅ [ADAPTIVE-PAYLOAD] Would use entire message as card');
      } else {
        cardContent = adaptiveCardMessage;
        console.log('⚠️ [ADAPTIVE-PAYLOAD] Would fallback to entire message');
      }
    } else {
      cardContent = adaptiveCardMessage;
      console.log('⚠️ [ADAPTIVE-PAYLOAD] Non-object message, using as-is');
    }

    console.log('🎯 [ADAPTIVE-PAYLOAD] Final card content keys:', 
      cardContent && typeof cardContent === 'object' ? Object.keys(cardContent) : 'not an object');

    return Response.json({
      success: true,
      message: 'Adaptive Card payload test completed',
      analysis: {
        hasContentType,
        hasContent,
        contentIsObject,
        contentHasType,
        contentTypeValue: adaptiveCardMessage.contentType,
        extractedContentKeys: cardContent && typeof cardContent === 'object' ? Object.keys(cardContent) : 'not an object'
      },
      originalMessage: adaptiveCardMessage,
      extractedContent: cardContent,
    });

  } catch (error) {
    console.error('❌ [ADAPTIVE-PAYLOAD] Test failed:', error);
    return Response.json(
      { success: false, error: 'Adaptive Card payload test failed' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return Response.json({
    success: true,
    message: 'Adaptive Card payload test endpoint',
    usage: 'POST to test payload structure',
  });
} 
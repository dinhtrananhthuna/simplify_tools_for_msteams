import { NextRequest } from 'next/server';
import { sendSimpleMessage } from '@/lib/teams';

export async function POST(request: NextRequest) {
  try {
    const { chatId, cardType = 'simple' } = await request.json();
    
    if (!chatId) {
      return Response.json(
        { success: false, error: 'chatId is required' },
        { status: 400 }
      );
    }
    
    // Create simple test Adaptive Card
    let testCard;
    
    if (cardType === 'simple') {
      testCard = {
        contentType: "application/vnd.microsoft.card.adaptive",
        content: {
          type: "AdaptiveCard",
          version: "1.3",
          body: [
            {
              type: "TextBlock",
              text: "🧪 Test Adaptive Card",
              size: "Large",
              weight: "Bolder",
              color: "Accent"
            },
            {
              type: "TextBlock",
              text: "This is a simple test card to verify Adaptive Card functionality.",
              wrap: true,
              spacing: "Medium"
            },
            {
              type: "FactSet",
              facts: [
                {
                  title: "Status",
                  value: "✅ Working"
                },
                {
                  title: "Timestamp",
                  value: new Date().toLocaleString('vi-VN')
                }
              ]
            }
          ],
          actions: [
            {
              type: "Action.OpenUrl",
              title: "View Documentation",
              url: "https://adaptivecards.io/"
            }
          ]
        }
      };
    } else if (cardType === 'pr') {
      // Test PR-style card
      testCard = {
        contentType: "application/vnd.microsoft.card.adaptive",
        content: {
          type: "AdaptiveCard",
          version: "1.3",
          body: [
            {
              type: "TextBlock",
              text: "🔄 Test Pull Request",
              weight: "Bolder",
              size: "Medium",
              color: "Accent"
            },
            {
              type: "TextBlock",
              text: "Test PR: Add new feature",
              weight: "Bolder",
              size: "Large",
              wrap: true
            },
            {
              type: "FactSet",
              facts: [
                {
                  title: "Author",
                  value: "Test User"
                },
                {
                  title: "Branch",
                  value: "feature/test → main"
                }
              ]
            },
            {
              type: "TextBlock",
              text: "Please review this test pull request.",
              wrap: true,
              spacing: "Medium",
              isSubtle: true
            }
          ],
          actions: [
            {
              type: "Action.OpenUrl",
              title: "View Pull Request",
              url: "https://github.com"
            }
          ]
        }
      };
    }
    
    console.log('🧪 Testing Adaptive Card:', JSON.stringify(testCard, null, 2));
    
    // Send the test card
    const messageId = await sendSimpleMessage(chatId, testCard, 'adaptiveCard');
    
    return Response.json({
      success: true,
      message: 'Test Adaptive Card sent successfully',
      messageId,
      cardType,
      payload: testCard
    });
    
  } catch (error) {
    console.error('❌ Test Adaptive Card failed:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return Response.json(
      { 
        success: false, 
        error: errorMessage,
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return Response.json({
    success: true,
    message: 'Test Adaptive Card API endpoint',
    usage: {
      method: 'POST',
      body: {
        chatId: 'required - Teams chat ID',
        cardType: 'optional - "simple" or "pr" (default: simple)'
      }
    }
  });
} 
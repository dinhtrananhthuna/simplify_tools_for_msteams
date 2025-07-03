import { NextRequest } from 'next/server';
import { sendTeamsMessage, formatPullRequestMessage } from '@/lib/teams';

export async function POST(request: NextRequest) {
  try {
    const { chatId, testType = 'full' } = await request.json();
    
    if (!chatId) {
      return Response.json(
        { success: false, error: 'chatId is required' },
        { status: 400 }
      );
    }
    
    console.log('🧪 [PR-WEBHOOK-TEST] Testing PR webhook with Adaptive Card...');
    console.log('📋 [PR-WEBHOOK-TEST] Chat ID:', chatId);
    console.log('🔧 [PR-WEBHOOK-TEST] Test type:', testType);
    
    // Create sample PR data similar to Azure DevOps webhook
    let prData;
    
    if (testType === 'simple') {
      prData = {
        title: "Simple Test PR",
        author: "Test User",
        repository: "test-repo",
        sourceBranch: "feature/test",
        targetBranch: "main",
        url: "https://dev.azure.com/test/test-repo/pullrequests/123",
        description: "Simple test of Adaptive Card webhook notification",
        mentions: []
      };
    } else if (testType === 'with-mentions') {
      prData = {
        title: "🔥 Critical Bug Fix - Authentication Issue",
        author: "Security Team",
        repository: "core-authentication-service",
        sourceBranch: "hotfix/critical-auth-bug",
        targetBranch: "main",
        url: "https://dev.azure.com/company/core-auth/pullrequests/789",
        description: "**URGENT:** This PR fixes a critical authentication bug that affects user login.\n\n**Impact:**\n- Users unable to login in certain scenarios\n- Session timeout issues\n- Security vulnerability patched\n\n**Testing:**\n- ✅ Unit tests passed\n- ✅ Integration tests passed\n- ✅ Security scan completed",
        mentions: ["john.doe@company.com", "security@company.com"]
      };
    } else {
      // Default to 'full' test case
      prData = {
        title: "🚀 Add new webhook notification system with Adaptive Cards",
        author: "DevOps Engineer",
        repository: "simplify-tools-for-teams",
        sourceBranch: "feature/adaptive-card-webhook",
        targetBranch: "main",
        url: "https://dev.azure.com/company/simplify-tools-for-teams/pullrequests/456",
        description: "This PR implements Adaptive Card notifications for Azure DevOps webhooks.\n\n**Key changes:**\n- Updated webhook handler to send Adaptive Cards first\n- Added fallback to HTML messages\n- Improved error handling and logging\n- Enhanced user experience with rich card format\n\n![Preview](https://via.placeholder.com/400x200/0078d4/ffffff?text=Adaptive+Card+Preview)",
        mentions: []
      };
    }
    
    console.log('📋 [PR-WEBHOOK-TEST] PR Data:', JSON.stringify(prData, null, 2));
    
    // Generate Adaptive Card using the same function as webhook
    const adaptiveCardMessage = formatPullRequestMessage(prData);
    console.log('🎴 [PR-WEBHOOK-TEST] Adaptive Card generated');
    
    // Send to Teams
    const target = { id: chatId };
    const messageId = await sendTeamsMessage(target, adaptiveCardMessage, 'adaptiveCard');
    
    console.log('✅ [PR-WEBHOOK-TEST] Test successful, message ID:', messageId);
    
    return Response.json({
      success: true,
      message: `PR webhook test with Adaptive Card sent successfully (${testType})`,
      messageId,
      testType,
      prData,
      adaptiveCardPreview: adaptiveCardMessage
    });
    
  } catch (error: any) {
    console.error('❌ [PR-WEBHOOK-TEST] Test failed:', error.message);
    
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  return Response.json({
    success: true,
    message: 'PR Webhook Test API with Adaptive Cards',
    usage: {
      method: 'POST',
      body: {
        chatId: 'required - Teams chat ID',
        testType: 'optional - "simple", "full", or "with-mentions" (default: full)'
      }
    },
    examples: [
      {
        testType: 'simple',
        description: 'Basic PR notification test'
      },
      {
        testType: 'full',
        description: 'Full PR with description and images'
      },
      {
        testType: 'with-mentions',
        description: 'PR with mentions and urgent formatting'
      }
    ]
  });
} 
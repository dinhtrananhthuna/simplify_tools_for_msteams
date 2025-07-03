import { NextRequest } from 'next/server';
import { sendTeamsMessage, formatPullRequestMessage, formatPullRequestMessageHTML } from '@/lib/teams';

// Mock PR data để test
const mockPRData = {
  eventType: 'git.pullrequest.created',
  resource: {
    title: '🧪 Test PR from webhook debug endpoint',
    createdBy: {
      displayName: 'Test User',
      name: 'testuser'
    },
    repository: {
      name: 'test-repo'
    },
    sourceRefName: 'refs/heads/feature-branch',
    targetRefName: 'refs/heads/main',
    description: 'This is a test PR to debug webhook functionality',
    _links: {
      web: {
        href: 'https://dev.azure.com/test-org/test-project/_git/test-repo/pullrequest/123'
      }
    }
  }
};

interface PRNotifierConfig {
  azureDevOpsUrl: string;
  targetChatId?: string;
  targetChat?: {
    id: string;
    type?: string;
    teamId?: string;
    displayName?: string;
  };
  enableMentions: boolean;
  mentionUsers: string[];
}

async function getPRNotifierConfig(): Promise<PRNotifierConfig | null> {
  try {
    console.log('📋 [WEBHOOK-DEBUG] Getting PR Notifier config...');
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/tools/pr-notifier`);
    
    if (!response.ok) {
      console.log('❌ [WEBHOOK-DEBUG] Failed to fetch config:', response.status);
      return null;
    }
    
    const data = await response.json();
    console.log('📊 [WEBHOOK-DEBUG] Config response:', JSON.stringify(data, null, 2));
    
    if (!data.tool || !data.tool.is_active) {
      console.log('⚠️ [WEBHOOK-DEBUG] PR Notifier is not active');
      return null;
    }
    
    let config = data.tool.config;
    if (typeof config === 'string') {
      try {
        config = JSON.parse(config);
      } catch (e) {
        console.error('❌ [WEBHOOK-DEBUG] Failed to parse config JSON:', e);
        return null;
      }
    }
    
    console.log('✅ [WEBHOOK-DEBUG] Parsed config:', JSON.stringify(config, null, 2));
    return config;
    
  } catch (error) {
    console.error('❌ [WEBHOOK-DEBUG] Error getting config:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 [WEBHOOK-DEBUG] Webhook Debug Endpoint Started');
    console.log('⏰ [WEBHOOK-DEBUG] Timestamp:', new Date().toISOString());
    
    const body = await request.json().catch(() => ({}));
    const { 
      useMockData = true,
      testAdaptiveCard = true,
      testHtmlFallback = true
    } = body;
    
    console.log('📋 [WEBHOOK-DEBUG] Request params:', {
      useMockData,
      testAdaptiveCard, 
      testHtmlFallback,
      timestamp: new Date().toISOString()
    });
    
    // Step 1: Get PR Notifier config (same as real webhook)
    console.log('\n' + '='.repeat(60));
    console.log('📋 [WEBHOOK-DEBUG] Step 1: Getting PR Notifier Config');
    console.log('='.repeat(60));
    
    const config = await getPRNotifierConfig();
    if (!config || (!config.targetChat && !config.targetChatId)) {
      console.log('❌ [WEBHOOK-DEBUG] No valid config found');
      return Response.json({
        success: false,
        error: 'PR Notifier not configured or no target chat set',
        step: 'config'
      }, { status: 404 });
    }
    
    // Step 2: Determine target (same as real webhook)
    console.log('\n' + '='.repeat(60));
    console.log('🎯 [WEBHOOK-DEBUG] Step 2: Determining Target Chat');
    console.log('='.repeat(60));
    
    let teamsTarget: any;
    if (config.targetChat) {
      teamsTarget = config.targetChat;
      console.log('✅ [WEBHOOK-DEBUG] Using new config format:', JSON.stringify(teamsTarget, null, 2));
    } else if (config.targetChatId) {
      teamsTarget = { id: config.targetChatId, type: 'group' };
      console.log('⚠️ [WEBHOOK-DEBUG] Using backward compatibility mode:', JSON.stringify(teamsTarget, null, 2));
    } else {
      console.log('❌ [WEBHOOK-DEBUG] No target chat configured');
      return Response.json({
        success: false,
        error: 'No target chat configured',
        step: 'target'
      }, { status: 400 });
    }
    
    // Step 3: Prepare PR data (mock or from request)
    console.log('\n' + '='.repeat(60));
    console.log('📝 [WEBHOOK-DEBUG] Step 3: Preparing PR Data');
    console.log('='.repeat(60));
    
    const webhookData = useMockData ? mockPRData : body.webhookData || mockPRData;
    const { resource } = webhookData;
    
    const prData = {
      title: resource?.title || 'Test PR',
      author: resource?.createdBy?.displayName || resource?.createdBy?.name || 'Test Author',
      repository: resource?.repository?.name || 'test-repository',
      sourceBranch: resource?.sourceRefName?.replace('refs/heads/', '') || 'feature',
      targetBranch: resource?.targetRefName?.replace('refs/heads/', '') || 'main',
      url: resource?._links?.web?.href || resource?.url || '#',
      description: resource?.description?.trim() || 'Test PR description',
      mentions: config.enableMentions ? config.mentionUsers : [],
    };
    
    console.log('📊 [WEBHOOK-DEBUG] PR Data prepared:', JSON.stringify(prData, null, 2));
    
    const results: any[] = [];
    let successfulResult: any = null;
    
    // Step 4: Test Adaptive Card (if enabled)
    if (testAdaptiveCard) {
      console.log('\n' + '='.repeat(60));
      console.log('🎴 [WEBHOOK-DEBUG] Step 4A: Testing Adaptive Card');
      console.log('='.repeat(60));
      
      try {
        console.log('📤 [WEBHOOK-DEBUG] Attempting to send Adaptive Card...');
        const adaptiveCardMessage = formatPullRequestMessage(prData);
        console.log('📋 [WEBHOOK-DEBUG] Adaptive Card generated, size:', JSON.stringify(adaptiveCardMessage).length, 'chars');
        
        const result = await sendTeamsMessage(teamsTarget, adaptiveCardMessage, 'adaptiveCard');
        
        console.log('✅ [WEBHOOK-DEBUG] ADAPTIVE CARD SUCCESS!');
        console.log('📝 [WEBHOOK-DEBUG] Message ID:', result);
        
        results.push({
          test: 'adaptive-card',
          success: true,
          messageId: result,
          messageType: 'Adaptive Card'
        });
        
        successfulResult = { test: 'adaptive-card', messageId: result, messageType: 'Adaptive Card' };
        
      } catch (error: any) {
        console.log('❌ [WEBHOOK-DEBUG] Adaptive Card failed:', error.message);
        
        results.push({
          test: 'adaptive-card',
          success: false,
          error: error.message
        });
      }
    }
    
    // Step 5: Test HTML Fallback (if enabled and adaptive card failed)
    if (testHtmlFallback && !successfulResult) {
      console.log('\n' + '='.repeat(60));
      console.log('🌐 [WEBHOOK-DEBUG] Step 4B: Testing HTML Fallback');
      console.log('='.repeat(60));
      
      try {
        console.log('📤 [WEBHOOK-DEBUG] Attempting to send HTML fallback...');
        const htmlMessage = formatPullRequestMessageHTML(prData);
        console.log('📋 [WEBHOOK-DEBUG] HTML message generated, size:', htmlMessage.length, 'chars');
        
        const result = await sendTeamsMessage(teamsTarget, htmlMessage, 'html');
        
        console.log('✅ [WEBHOOK-DEBUG] HTML FALLBACK SUCCESS!');
        console.log('📝 [WEBHOOK-DEBUG] Message ID:', result);
        
        results.push({
          test: 'html-fallback',
          success: true,
          messageId: result,
          messageType: 'HTML'
        });
        
        successfulResult = { test: 'html-fallback', messageId: result, messageType: 'HTML' };
        
      } catch (error: any) {
        console.log('❌ [WEBHOOK-DEBUG] HTML fallback failed:', error.message);
        
        results.push({
          test: 'html-fallback', 
          success: false,
          error: error.message
        });
      }
    }
    
    // Step 6: Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 [WEBHOOK-DEBUG] FINAL SUMMARY');
    console.log('='.repeat(60));
    
    if (successfulResult) {
      console.log(`🎉 [WEBHOOK-DEBUG] Overall SUCCESS with ${successfulResult.test}`);
      console.log(`📝 [WEBHOOK-DEBUG] Final Message ID: ${successfulResult.messageId}`);
      console.log(`🎴 [WEBHOOK-DEBUG] Message Type: ${successfulResult.messageType}`);
    } else {
      console.log('💥 [WEBHOOK-DEBUG] All tests FAILED');
    }
    
    return Response.json({
      success: !!successfulResult,
      message: successfulResult ? 
        `Webhook simulation successful via ${successfulResult.test}` : 
        'All webhook simulation attempts failed',
      results,
      successfulResult,
      config: {
        target: teamsTarget,
        prData,
        enableMentions: config.enableMentions,
        mentionUsers: config.mentionUsers
      },
      timestamp: new Date().toISOString(),
      logs: 'Check server console for detailed webhook simulation logs'
    });
    
  } catch (error: any) {
    console.error('💥 [WEBHOOK-DEBUG] Webhook debug failed:', error);
    
    return Response.json({
      success: false,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      logs: 'Check server console for detailed error logs'
    }, { status: 500 });
  }
}

export async function GET() {
  return Response.json({
    success: true,
    message: 'Webhook Debug Endpoint',
    description: 'Simulates the entire webhook flow to debug PR notification issues',
    usage: {
      method: 'POST',
      parameters: {
        useMockData: 'boolean (optional, defaults to true) - Use mock PR data',
        testAdaptiveCard: 'boolean (optional, defaults to true) - Test adaptive card sending',
        testHtmlFallback: 'boolean (optional, defaults to true) - Test HTML fallback',
        webhookData: 'object (optional) - Custom webhook data if useMockData is false'
      },
      examples: [
        {
          description: 'Test with mock data (default)',
          body: {}
        },
        {
          description: 'Test only HTML fallback',
          body: {
            testAdaptiveCard: false,
            testHtmlFallback: true
          }
        }
      ]
    },
    timestamp: new Date().toISOString()
  });
} 
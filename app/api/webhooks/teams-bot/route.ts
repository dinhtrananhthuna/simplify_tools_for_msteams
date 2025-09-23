import { NextRequest } from 'next/server';
import { BotFrameworkAdapter, CardFactory, TurnContext } from 'botbuilder';
import { executeQuery } from '@/lib/db';
import { extractTenantFromToken, isExternalUser } from '@/lib/teams';

// Initialize Bot Framework Adapter
const adapter = new BotFrameworkAdapter({
  appId: process.env.MICROSOFT_APP_ID || '',
  appPassword: process.env.MICROSOFT_APP_PASSWORD || ''
});

// Helper functions for severity handling
function getSeverityPrefix(severity: string): string {
  switch (severity?.toLowerCase()) {
    case 'critical':
      return '🔴 Critical';
    case 'high':
      return '🟠 High';
    case 'medium':
      return '🟡 Medium';
    case 'low':
      return '🟢 Low';
    default:
      return '🐞';
  }
}

function getSeverityColor(severity: string): string {
  switch (severity?.toLowerCase()) {
    case 'critical':
      return 'Attention';
    case 'high':
      return 'Warning';
    case 'medium':
      return 'Accent';
    case 'low':
      return 'Good';
    default:
      return 'Default';
  }
}

// Helper function to format bug report for copying
function formatBugReportForCopy(data: any, userContext?: any): string {
  const submitterInfo = userContext?.isExternal ? 
    `${userContext.userDisplayName} (${userContext.userType === 'guest' ? 'Guest' : 'External'} User)` :
    `${userContext?.userDisplayName || 'Unknown User'}`;

  const steps = data.steps || 'No steps provided';
  let formattedSteps = steps;
  
  if (steps !== 'No steps provided') {
    const stepLines = steps.split('\n')
      .map((line: string) => line.trim())
      .filter((line: string) => line.length > 0);
    
    if (stepLines.length > 1) {
      formattedSteps = stepLines.map((step: string, index: number) => 
        `${index + 1}. ${step}`
      ).join('\n');
    }
  }

  return `**Bug Report**

**Title:** ${data.title || 'No title'}
**Severity:** ${data.severity || 'Medium'}
**Environment:** ${data.environment || 'Not specified'}
**Reporter:** ${submitterInfo}

**Description:**
${data.description || 'No description provided'}

**Expected Result:**
${data.expected || 'No expected result provided'}

**Steps to Reproduce:**
${formattedSteps}

---
Reported via Teams Quickbug Extension`;
}

// Enhanced user authentication and tenant detection
async function getUserContext(context: TurnContext): Promise<{
  userId: string;
  userDisplayName: string;
  tenantId?: string;
  isExternal: boolean;
  userType: 'internal' | 'external' | 'guest' | 'anonymous';
}> {
  const activity = context.activity;
  const from = activity.from;
  
  // Extract user information from the activity
  const userId = from?.id || 'unknown';
  const userDisplayName = from?.name || 'Unknown User';
  
  // Try to get tenant information from the conversation or channel data
  let tenantId: string | undefined;
  let isExternal = false;
  let userType: 'internal' | 'external' | 'guest' | 'anonymous' = 'internal';
  
  try {
    // Check if we can extract tenant from conversation
    if (activity.conversation?.tenantId) {
      tenantId = activity.conversation.tenantId;
    }
    
    // Check channel data for additional tenant info
    if (activity.channelData?.tenant?.id) {
      tenantId = activity.channelData.tenant.id;
    }
    
    // Determine user type based on tenant information
    const homeTenantId = process.env.TEAMS_TENANT_ID;
    
    if (tenantId && homeTenantId) {
      isExternal = tenantId !== homeTenantId;
      
      if (isExternal) {
        // Check if it's a guest user (check aadObjectId pattern or other indicators)
        if (activity.from?.aadObjectId && activity.from.aadObjectId.includes('#EXT#')) {
          userType = 'guest';
        } else {
          userType = 'external';
        }
      } else {
        userType = 'internal';
      }
    } else {
      // If we can't determine tenant, consider it anonymous
      userType = 'anonymous';
    }
    
    console.log('👤 User context detected:', {
      userId,
      userDisplayName,
      tenantId,
      isExternal,
      userType,
      homeTenant: homeTenantId
    });
    
  } catch (error) {
    console.warn('⚠️ Could not extract complete user context:', error);
  }
  
  return {
    userId,
    userDisplayName,
    tenantId,
    isExternal,
    userType
  };
}

// Log webhook event to database with enhanced user tracking
async function logWebhookEvent(
  eventType: string,
  payload: any,
  status: 'success' | 'failed',
  error?: string,
  userContext?: any
) {
  try {
    await executeQuery(`
      INSERT INTO webhook_logs 
      (tool_id, webhook_source, event_type, payload, status, teams_message_id, error_message, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        'quickbug',
        'teams-bot',
        eventType,
        JSON.stringify(payload),
        status,
        null,
        error || null,
        new Date()
      ]
    );
  } catch (logError) {
    console.error('Failed to log webhook event:', logError);
  }
}

// Helper function to create bug report form card with user context
function getBugReportAdaptiveCard(userContext?: any) {
  const card = {
    type: 'AdaptiveCard',
    body: [
      { 
        type: 'TextBlock', 
        text: 'Quick Bug Report', 
        weight: 'Bolder', 
        size: 'Medium' 
      },
      // Add user type indicator for external users
      ...(userContext?.isExternal ? [{
        type: 'TextBlock',
        text: userContext.userType === 'guest' ? 
          '👥 Submitting as Guest User' : 
          '🌐 Submitting as External User',
        color: 'Accent',
        size: 'Small',
        spacing: 'Small'
      }] : []),
      { 
        type: 'Input.Text', 
        id: 'title', 
        placeholder: 'Bug name', 
        label: 'Bug name', 
        isRequired: true 
      },
      {
        type: 'Input.ChoiceSet',
        id: 'severity',
        label: 'Severity',
        isRequired: true,
        style: 'compact',
        choices: [
          { title: 'Critical', value: 'Critical' },
          { title: 'High', value: 'High' },
          { title: 'Medium', value: 'Medium' },
          { title: 'Low', value: 'Low' }
        ]
      },
      { 
        type: 'Input.Text', 
        id: 'description', 
        placeholder: 'Bug information', 
        label: 'Bug information', 
        isMultiline: true, 
        isRequired: true 
      },
      { 
        type: 'Input.Text', 
        id: 'expected', 
        placeholder: 'Expected result', 
        label: 'Expected result', 
        isMultiline: true, 
        isRequired: true 
      },
      { 
        type: 'Input.Text', 
        id: 'environment', 
        placeholder: 'Production, Staging, Dev, ...', 
        label: 'Test environment' 
      },
      { 
        type: 'Input.Text', 
        id: 'steps', 
        placeholder: 'Steps to reproduce, one step per line', 
        label: 'Steps to reproduce', 
        isMultiline: true, 
        isRequired: true 
      },
      { 
        type: 'TextBlock', 
        text: '💡 If you have images, please copy & paste them directly into the bug report template before clicking Submit.', 
        wrap: true, 
        color: 'Accent', 
        spacing: 'Medium', 
        isSubtle: true 
      }
    ],
    actions: [
      {
        type: 'Action.Submit',
        title: 'Submit bug report',
        data: { 
          msteams: { type: 'task/submit' },
          // Include user context in submission data
          _userContext: userContext || {}
        }
      }
    ],
    $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
    version: '1.4'
  };
  
  return card;
}

// Enhanced bug report rendering with user attribution
function renderBugReportAdaptiveCard(data: any): any {
  const userContext = data._userContext || {};
  
  // Add user attribution to the bug report
  const submitterInfo = `Submitted by: ${userContext.userDisplayName}`;
  return {
    type: 'AdaptiveCard',
    body: [
      { 
        type: 'TextBlock', 
        text: `${getSeverityPrefix(data.severity)} - Bug Report`,
        weight: 'Bolder', 
        size: 'Large',
        color: getSeverityColor(data.severity),
        horizontalAlignment: 'Center'
      },
      {
        type: 'FactSet',
        facts: [
          { title: '📝 Title', value: data.title || 'No title' },
          { title: '🔥 Severity', value: data.severity || 'Medium' },
          { title: '🌍 Environment', value: data.environment || 'Not specified' },
          { title: '👤 Reporter', value: submitterInfo }
        ]
      },
      { 
        type: 'TextBlock', 
        text: '**Description:**', 
        weight: 'Bolder',
        spacing: 'Medium'
      },
      { 
        type: 'TextBlock', 
        text: data.description || 'No description provided',
        wrap: true
      },
      { 
        type: 'TextBlock', 
        text: '**Expected Result:**', 
        weight: 'Bolder',
        spacing: 'Medium'
      },
      { 
        type: 'TextBlock', 
        text: data.expected || 'No expected result provided',
        wrap: true
      },
      { 
        type: 'TextBlock', 
        text: '**Steps to Reproduce:**', 
        weight: 'Bolder',
        spacing: 'Medium'
      },
      ...((() => {
        const steps = data.steps || 'No steps provided';
        if (steps === 'No steps provided') {
          return [{ 
            type: 'TextBlock', 
            text: steps,
            wrap: true
          }];
        }
        
        // Split steps by lines and format them as numbered steps
        const stepLines = steps.split('\n')
          .map((line: string) => line.trim())
          .filter((line: string) => line.length > 0);
        
        if (stepLines.length <= 1) {
          // If only one line or no clear separation, show as is
          return [{ 
            type: 'TextBlock', 
            text: steps,
            wrap: true,
            spacing: 'Small'
          }];
        }
        
        // Format as numbered steps
        return stepLines.map((step: string, index: number) => ({
          type: 'TextBlock',
          text: `**Step ${index + 1}:** ${step}`,
          wrap: true,
          spacing: 'Small'
        }));
      })()),
      // Add tenant info for external users
      // ...(userContext.isExternal ? [{
      //   type: 'TextBlock',
      //   text: `🏢 User Tenant: ${userContext.tenantId || 'Unknown'}`,
      //   size: 'Small',
      //   color: 'Accent',
      //   spacing: 'Medium'
      // }] : [])
    ],
    actions: [
      {
        type: 'Action.OpenUrl',
        title: 'Copy Bug Info',
        url: `data:text/plain;charset=utf-8,${encodeURIComponent(formatBugReportForCopy(data, userContext))}`
      }
    ],
    $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
    version: '1.4'
  };
}

// Bot activity handler with enhanced user context
async function handleBotActivity(context: TurnContext) {
  console.log('[DEBUG] Activity type:', context.activity.type);
  
  // Get user context information
  const userContext = await getUserContext(context);
  
  if (context.activity.type === 'invoke') {
    const invokeName = context.activity.name;
    console.log('[DEBUG] Invoke name:', invokeName);
    console.log('[DEBUG] User context:', userContext);
    
    try {
      if (invokeName === 'composeExtension/query') {
        const card = getBugReportAdaptiveCard(userContext);
        const response = {
          composeExtension: {
            type: 'result',
            attachmentLayout: 'list',
            attachments: [CardFactory.adaptiveCard(card)]
          }
        };
        console.log('[DEBUG] Sending Adaptive Card response for query with user context');
        
        await context.sendActivity({
          type: 'invokeResponse',
          value: {
            status: 200,
            body: response
          }
        });

        // Log successful query with user context
        await logWebhookEvent('composeExtension/query', {
          invokeName,
          from: context.activity.from,
          conversation: context.activity.conversation
        }, 'success', undefined, userContext);
        
      } else if (invokeName === 'composeExtension/fetchTask') {
        const card = getBugReportAdaptiveCard(userContext);
        
        await context.sendActivity({
          type: 'invokeResponse',
          value: {
            status: 200,
            body: {
              task: {
                type: 'continue',
                value: {
                  card: CardFactory.adaptiveCard(card),
                  height: 'medium',
                  width: 'medium',
                  title: 'Quick Bug Report'
                }
              }
            }
          }
        });

        // Log successful fetchTask with user context
        await logWebhookEvent('composeExtension/fetchTask', {
          invokeName,
          from: context.activity.from,
          conversation: context.activity.conversation
        }, 'success', undefined, userContext);
        
      } else if (invokeName === 'composeExtension/submitAction') {
        const data = context.activity.value && context.activity.value.data 
          ? context.activity.value.data 
          : context.activity.value;
        
        console.log('[DEBUG] SubmitAction data:', JSON.stringify(data, null, 2));
        
        // Merge user context into the submission data
        const enhancedData = {
          ...data,
          _userContext: userContext
        };
        
        const card = renderBugReportAdaptiveCard(enhancedData);
        
        await context.sendActivity({
          type: 'invokeResponse',
          value: {
            status: 200,
            body: {
              composeExtension: {
                type: 'result',
                attachmentLayout: 'list',
                attachments: [
                  CardFactory.adaptiveCard(card)
                ]
              }
            }
          }
        });

        // Log successful submitAction with bug report data and user context
        await logWebhookEvent('composeExtension/submitAction', {
          invokeName,
          bugData: enhancedData,
          from: context.activity.from,
          conversation: context.activity.conversation
        }, 'success', undefined, userContext);
        
      } else {
        console.log('[DEBUG] Unhandled invoke, returning status 200');
        await context.sendActivity({
          type: 'invokeResponse',
          value: { status: 200 }
        });

        // Log unhandled invoke with user context
        await logWebhookEvent('unknown_invoke', {
          invokeName,
          from: context.activity.from,
          conversation: context.activity.conversation
        }, 'success', undefined, userContext);
      }
    } catch (error) {
      console.error('[ERROR] Bot activity handling failed:', error);
      
      // Log error with user context
      await logWebhookEvent(invokeName || 'unknown', {
        from: context.activity.from,
        conversation: context.activity.conversation,
        error: error instanceof Error ? error.message : 'Unknown error'
      }, 'failed', error instanceof Error ? error.message : 'Unknown error', userContext);
      
      // Send error response
      await context.sendActivity({
        type: 'invokeResponse',
        value: { 
          status: 500,
          body: {
            error: 'Internal server error'
          }
        }
      });
    }
  } else if (context.activity.type === 'message') {
    console.log('[DEBUG] Received regular message');
    await context.sendActivity('Bot has received your message!');
    
    // Log message activity
    await logWebhookEvent('message', {
      text: context.activity.text,
      from: context.activity.from,
      conversation: context.activity.conversation
    }, 'success');
  } else {
    console.log('[DEBUG] Unknown activity type:', context.activity.type);
    
    // Log unknown activity
    await logWebhookEvent('unknown_activity', {
      activityType: context.activity.type,
      from: context.activity.from,
      conversation: context.activity.conversation
    }, 'success');
  }
}

// Main POST handler
export async function POST(request: NextRequest) {
  console.log('---\n[DEBUG] Received request at /api/webhooks/teams-bot:', new Date().toISOString());
  
  try {
    // Convert NextRequest to Express-like req/res objects for Bot Framework
    const body = await request.json();
    const headers = Object.fromEntries(request.headers.entries());
    
    console.log('[DEBUG] Headers:', headers);
    console.log('[DEBUG] Body:', JSON.stringify(body, null, 2));
    
    // Create mock Express req/res objects
    const req = {
      body,
      headers,
      method: 'POST'
    };
    
    let responseStatus = 200;
    let responseBody: any = {};
    
    const res = {
      status: (code: number) => {
        responseStatus = code;
        return res;
      },
      json: (data: any) => {
        responseBody = data;
        return res;
      },
      send: (data: any) => {
        responseBody = data;
        return res;
      },
      end: () => {}
    };
    
    // Process activity with Bot Framework
    await adapter.processActivity(req as any, res as any, async (context: TurnContext) => {
      await handleBotActivity(context);
    });
    
    return new Response(JSON.stringify(responseBody), {
      status: responseStatus,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
  } catch (error) {
    console.error('[ERROR] Bot webhook error:', error);
    return new Response(JSON.stringify({ 
      error: 'Bot processing failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}

// Handle other methods
export async function GET() {
  return new Response(JSON.stringify({ 
    message: 'Teams Bot webhook endpoint is running',
    timestamp: new Date().toISOString()
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  });
} 
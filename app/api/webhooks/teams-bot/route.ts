import { NextRequest } from 'next/server';
import { BotFrameworkAdapter, CardFactory, TurnContext } from 'botbuilder';
import { executeQuery } from '@/lib/db';

// Initialize Bot Framework Adapter
const adapter = new BotFrameworkAdapter({
  appId: process.env.MICROSOFT_APP_ID || '',
  appPassword: process.env.MICROSOFT_APP_PASSWORD || ''
});

// Log webhook event to database
async function logWebhookEvent(
  eventType: string,
  payload: any,
  status: 'success' | 'failed',
  error?: string
) {
  try {
    await executeQuery(
      `INSERT INTO webhook_logs (tool_id, webhook_source, event_type, payload, status, error_message, processed_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        'quickbug',
        'teams-bot',
        eventType,
        JSON.stringify(payload),
        status,
        error || null,
        new Date(),
      ]
    );
  } catch (logError) {
    console.error('Failed to log webhook event:', logError);
  }
}

// Helper function to create bug report form card
function getBugReportAdaptiveCard() {
  return {
    type: 'AdaptiveCard',
    body: [
      { 
        type: 'TextBlock', 
        text: 'Quick Bug Report', 
        weight: 'Bolder', 
        size: 'Medium' 
      },
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
        data: { msteams: { type: 'task/submit' } }
      }
    ],
    $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
    version: '1.4'
  };
}

// Helper function to render bug report result card
function renderBugReportAdaptiveCard(data: any) {
  // Process steps into numbered list
  let stepsFormatted: any[] = [];
  if (data.steps) {
    const lines = data.steps.split(/\r?\n/).filter((line: string) => line.trim() !== '');
    stepsFormatted = lines.map((line: string, idx: number) => ({
      type: 'TextBlock',
      text: `**Step ${idx + 1}:** ${line.replace(/^[-*\d.\s]+/, '').trim()}`,
      wrap: true,
      spacing: 'None'
    }));
  }

  // Add icon for severity level
  let severityIcon = '';
  switch ((data.severity || '').toLowerCase()) {
    case 'critical':
      severityIcon = '🛑';
      break;
    case 'high':
      severityIcon = '🔴';
      break;
    case 'medium':
      severityIcon = '🟠';
      break;
    case 'low':
      severityIcon = '🟢';
      break;
    default:
      severityIcon = '';
  }

  return {
    type: 'AdaptiveCard',
    $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
    version: '1.4',
    body: [
      { 
        type: 'TextBlock', 
        text: '🐞 New Bug Report', 
        weight: 'Bolder', 
        size: 'Large', 
        color: 'Attention', 
        horizontalAlignment: 'Center' 
      },
      { 
        type: 'FactSet', 
        facts: [
          { title: 'Bug name:', value: data.title || '', spacing: 'Medium' },
          { title: 'Severity:', value: `${severityIcon} ${data.severity || ''}`.trim(), spacing: 'Medium' },
          { title: 'Bug information:', value: data.description || '', spacing: 'Medium' },
          { title: 'Expected result:', value: data.expected || '', spacing: 'Medium' },
          { title: 'Test environment:', value: data.environment || '', spacing: 'Medium' }
        ]
      },
      { 
        type: 'TextBlock', 
        text: '**Steps to reproduce:**', 
        weight: 'Bolder', 
        wrap: true, 
        spacing: 'Medium' 
      },
      ...stepsFormatted
    ]
  };
}

// Bot activity handler
async function handleBotActivity(context: TurnContext) {
  console.log('[DEBUG] Activity type:', context.activity.type);
  
  if (context.activity.type === 'invoke') {
    const invokeName = context.activity.name;
    console.log('[DEBUG] Invoke name:', invokeName);
    
    try {
      if (invokeName === 'composeExtension/query') {
        const card = getBugReportAdaptiveCard();
        const response = {
          composeExtension: {
            type: 'result',
            attachmentLayout: 'list',
            attachments: [CardFactory.adaptiveCard(card)]
          }
        };
        console.log('[DEBUG] Sending Adaptive Card response for query');
        
        await context.sendActivity({
          type: 'invokeResponse',
          value: {
            status: 200,
            body: response
          }
        });

        // Log successful query
        await logWebhookEvent('composeExtension/query', {
          invokeName,
          from: context.activity.from,
          conversation: context.activity.conversation
        }, 'success');
        
      } else if (invokeName === 'composeExtension/fetchTask') {
        const card = getBugReportAdaptiveCard();
        
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

        // Log successful fetchTask
        await logWebhookEvent('composeExtension/fetchTask', {
          invokeName,
          from: context.activity.from,
          conversation: context.activity.conversation
        }, 'success');
        
      } else if (invokeName === 'composeExtension/submitAction') {
        const data = context.activity.value && context.activity.value.data 
          ? context.activity.value.data 
          : context.activity.value;
        
        console.log('[DEBUG] SubmitAction data:', JSON.stringify(data, null, 2));
        
        const card = renderBugReportAdaptiveCard(data);
        
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

        // Log successful submitAction with bug report data
        await logWebhookEvent('composeExtension/submitAction', {
          invokeName,
          bugData: data,
          from: context.activity.from,
          conversation: context.activity.conversation
        }, 'success');
        
      } else {
        console.log('[DEBUG] Unhandled invoke, returning status 200');
        await context.sendActivity({
          type: 'invokeResponse',
          value: { status: 200 }
        });

        // Log unhandled invoke
        await logWebhookEvent('unknown_invoke', {
          invokeName,
          from: context.activity.from,
          conversation: context.activity.conversation
        }, 'success');
      }
    } catch (error) {
      console.error('[ERROR] Bot activity handler error:', error);
      
      // Log error
      await logWebhookEvent(invokeName || 'unknown', {
        invokeName,
        from: context.activity.from,
        conversation: context.activity.conversation,
        error: error instanceof Error ? error.message : 'Unknown error'
      }, 'failed', error instanceof Error ? error.message : 'Unknown error');

      throw error; // Re-throw to handle by main error handler
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
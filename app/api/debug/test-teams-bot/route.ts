import { NextRequest } from 'next/server';

// Test data cho Teams Message Extension
const testQueryActivity = {
  type: 'invoke',
  name: 'composeExtension/query',
  id: 'test-query-' + Date.now(),
  timestamp: new Date().toISOString(),
  from: {
    id: 'test-user',
    name: 'Test User'
  },
  recipient: {
    id: 'test-bot',
    name: 'Test Bot'
  },
  conversation: {
    id: 'test-conversation'
  },
  channelId: 'msteams',
  value: {
    commandId: 'quickbug',
    commandContext: 'compose'
  }
};

const testSubmitActivity = {
  type: 'invoke',
  name: 'composeExtension/submitAction',
  id: 'test-submit-' + Date.now(),
  timestamp: new Date().toISOString(),
  from: {
    id: 'test-user',
    name: 'Test User'
  },
  recipient: {
    id: 'test-bot',
    name: 'Test Bot'
  },
  conversation: {
    id: 'test-conversation'
  },
  channelId: 'msteams',
  value: {
    data: {
      title: 'Test Bug Report',
      severity: 'High',
      description: 'This is a test bug description',
      expected: 'Expected behavior goes here',
      environment: 'Production',
      steps: 'Step 1: Open application\nStep 2: Click button\nStep 3: See error'
    }
  }
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const testType = searchParams.get('type') || 'query';
  
  try {
    const testActivity = testType === 'submit' ? testSubmitActivity : testQueryActivity;
    
    console.log('🧪 Testing Teams Bot with activity:', testType);
    
    // Call our bot webhook endpoint
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/webhooks/teams-bot`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer fake-token-for-testing',
      },
      body: JSON.stringify(testActivity),
    });
    
    const result = await response.text();
    
    return new Response(JSON.stringify({
      success: true,
      testType,
      status: response.status,
      statusText: response.statusText,
      response: result,
      testActivity
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
  } catch (error) {
    console.error('❌ Test Teams Bot error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      testType
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('🧪 Testing Teams Bot with custom activity');
    
    // Call our bot webhook endpoint with custom data
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/webhooks/teams-bot`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer fake-token-for-testing',
      },
      body: JSON.stringify(body),
    });
    
    const result = await response.text();
    
    return new Response(JSON.stringify({
      success: true,
      status: response.status,
      statusText: response.statusText,
      response: result,
      testActivity: body
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
  } catch (error) {
    console.error('❌ Test Teams Bot error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
} 
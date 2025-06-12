import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Get all headers
    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      headers[key] = value;
    });

    // Get raw body
    const body = await request.text();
    let parsedBody: any;
    
    try {
      parsedBody = JSON.parse(body);
    } catch {
      parsedBody = body;
    }

    // Create debug info
    const debugInfo = {
      timestamp: new Date().toISOString(),
      headers,
      bodyRaw: body,
      bodyParsed: parsedBody,
      url: request.url,
      method: request.method,
    };

    // Log to console
    console.log('🔍 DEBUG WEBHOOK RECEIVED:');
    console.log('Headers:', JSON.stringify(headers, null, 2));
    console.log('Body:', JSON.stringify(parsedBody, null, 2));

    return Response.json({
      success: true,
      message: 'Webhook payload logged successfully',
      debug: debugInfo,
    });

  } catch (error) {
    console.error('Debug webhook error:', error);
    
    return Response.json({
      success: false,
      error: 'Failed to process debug webhook',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

// Health check
export async function GET() {
  return Response.json({
    success: true,
    message: 'Debug webhook endpoint is ready',
    timestamp: new Date().toISOString(),
  });
} 
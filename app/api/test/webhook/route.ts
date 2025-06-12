import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Sample Azure DevOps webhook payload based on the real data you provided
    const testPayload = {
      "subscriptionId": "a87a9f31-64d5-4c98-9b40-44eca413afc7",
      "notificationId": 43,
      "id": "2ab4e3d3-b7a6-425e-92b1-5a9982c1269e",
      "eventType": "git.pullrequest.created",
      "publisherId": "tfs",
      "message": null,
      "detailedMessage": null,
      "resource": {
        "repository": {
          "id": "4bc14d40-c903-45e2-872e-0462c7748079",
          "name": "Fabrikam",
          "url": "https://fabrikam.visualstudio.com/DefaultCollection/_apis/git/repositories/4bc14d40-c903-45e2-872e-0462c7748079",
          "project": {
            "id": "6ce954b1-ce1f-45d1-b94d-e6bf2464ba2c",
            "name": "Fabrikam",
            "url": "https://fabrikam.visualstudio.com/DefaultCollection/_apis/projects/6ce954b1-ce1f-45d1-b94d-e6bf2464ba2c",
            "state": "wellFormed",
            "visibility": "unchanged",
            "lastUpdateTime": "0001-01-01T00:00:00"
          },
          "defaultBranch": "refs/heads/master",
          "remoteUrl": "https://fabrikam.visualstudio.com/DefaultCollection/_git/Fabrikam"
        },
        "pullRequestId": 1,
        "status": "active",
        "createdBy": {
          "displayName": "Jamal Hartnett",
          "url": "https://fabrikam.vssps.visualstudio.com/_apis/Identities/54d125f7-69f7-4191-904f-c5b96b6261c8",
          "id": "54d125f7-69f7-4191-904f-c5b96b6261c8",
          "uniqueName": "fabrikamfiber4@hotmail.com",
          "imageUrl": "https://fabrikam.visualstudio.com/DefaultCollection/_api/_common/identityImage?id=54d125f7-69f7-4191-904f-c5b96b6261c8"
        },
        "creationDate": "2014-06-17T16:55:46.589889Z",
        "title": "my first pull request",
        "description": " - test2\r\n",
        "sourceRefName": "refs/heads/mytopic",
        "targetRefName": "refs/heads/master",
        "mergeStatus": "succeeded",
        "mergeId": "a10bb228-6ba6-4362-abd7-49ea21333dbd",
        "_links": {
          "web": {
            "href": "https://fabrikam.visualstudio.com/DefaultCollection/_git/Fabrikam/pullrequest/1#view=discussion"
          },
          "statuses": {
            "href": "https://fabrikam.visualstudio.com/DefaultCollection/_apis/git/repositories/4bc14d40-c903-45e2-872e-0462c7748079/pullRequests/1/statuses"
          }
        }
      },
      "resourceVersion": "1.0",
      "resourceContainers": {
        "collection": {
          "id": "c12d0eb8-e382-443b-9f9c-c52cba5014c2"
        },
        "account": {
          "id": "f844ec47-a9db-4511-8281-8b63f4eaf94e"
        },
        "project": {
          "id": "be9b3917-87e6-42a4-a549-2bc06a7a878f"
        }
      },
      "createdDate": "2025-06-12T17:46:42.6094597Z"
    };

    console.log('🧪 Test webhook: Sending test payload to webhook endpoint...');

    // Send to the actual webhook endpoint
    const webhookUrl = new URL('/api/webhooks/azure-devops', request.url).toString();
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Azure DevOps Test',
      },
      body: JSON.stringify(testPayload),
    });

    const result = await response.json();

    return Response.json({
      success: true,
      message: 'Test webhook sent successfully',
      webhookResponse: {
        status: response.status,
        statusText: response.statusText,
        data: result,
      },
      testPayload: {
        eventType: testPayload.eventType,
        prTitle: testPayload.resource.title,
        author: testPayload.resource.createdBy.displayName,
        repository: testPayload.resource.repository.name,
      },
    });

  } catch (error) {
    console.error('❌ Test webhook failed:', error);
    
    return Response.json({
      success: false,
      error: 'Test webhook failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

export async function GET() {
  return Response.json({
    success: true,
    message: 'Webhook test endpoint ready',
    description: 'POST to this endpoint to test Azure DevOps webhook processing',
    testUrl: '/api/test/webhook',
  });
} 
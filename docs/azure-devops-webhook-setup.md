# Azure DevOps Webhook Setup Guide

## 🚀 Quick Setup

### 1. Configure Environment Variables

Add to your `.env.local` file:

```env
# Azure DevOps Webhook Configuration
AZURE_DEVOPS_SKIP_SIGNATURE="true"
```

### 2. Azure DevOps Service Hook Configuration

1. Go to your Azure DevOps project
2. Navigate to **Project Settings** → **Service hooks**
3. Click **+ Create subscription**
4. Select **Web Hooks** as the service
5. Configure the trigger:
   - **Event**: Pull request created (or other PR events)
   - **Repository**: Select your repository
6. Configure the action:
   - **URL**: `https://your-domain.vercel.app/api/webhooks/azure-devops`
   - **Resource details to send**: All
   - **Messages to send**: All
   - **Detailed messages to send**: All

### 3. Teams Integration

Make sure you have:
1. Teams authentication configured in the admin panel
2. PR Notifier tool configured with target chat
3. Target chat selected and tool activated

## 🧪 Testing

### Test Webhook Locally
```bash
# Test with sample payload
curl -X POST http://localhost:3000/api/test/webhook
```

### Test on Vercel
```bash
curl -X POST https://your-domain.vercel.app/api/test/webhook
```

### View Webhook Logs
```bash
curl https://your-domain.vercel.app/api/admin/webhook-logs?limit=10
```

## 🔧 Troubleshooting

### Common Issues

1. **Invalid webhook signature**
   - Solution: Ensure `AZURE_DEVOPS_SKIP_SIGNATURE="true"` is set
   - Azure DevOps doesn't send standard webhook signatures

2. **Teams message not sent**
   - Check Teams authentication status
   - Verify target chat is selected
   - Check webhook logs for detailed errors

3. **Webhook returns 401/403**
   - Verify environment variables are set correctly
   - Check Vercel deployment environment variables

### Webhook Validation Logic

Our webhook endpoint validates Azure DevOps requests by:

1. **Skip signature check** (recommended): Set `AZURE_DEVOPS_SKIP_SIGNATURE=true`
2. **User-Agent validation**: Check for Azure DevOps or VSTS in User-Agent
3. **Content-Type validation**: Ensure application/json
4. **Development fallback**: Allow all webhooks in development mode

## 📋 Sample Payload

Azure DevOps sends payloads in this format:

```json
{
  "subscriptionId": "...",
  "eventType": "git.pullrequest.created",
  "resource": {
    "repository": {
      "name": "MyRepo"
    },
    "title": "My Pull Request",
    "createdBy": {
      "displayName": "John Doe"
    },
    "sourceRefName": "refs/heads/feature-branch",
    "targetRefName": "refs/heads/main",
    "_links": {
      "web": {
        "href": "https://dev.azure.com/org/project/_git/repo/pullrequest/123"
      }
    }
  }
}
```

## 🎯 Expected Results

When configured correctly:

1. **Azure DevOps**: Create a pull request
2. **Webhook**: Receives event and processes
3. **Teams**: Receives beautiful Adaptive Card notification
4. **Fallback**: If Adaptive Card fails, sends HTML message

## 📊 Monitoring

- **Webhook logs**: `/api/admin/webhook-logs`
- **Teams auth status**: Check in admin panel
- **Tool configuration**: Verify in admin panel

## 🔐 Security Notes

- Azure DevOps webhooks don't use standard HMAC signatures
- We validate requests by checking User-Agent and Content-Type
- In production, consider restricting by IP ranges if needed
- Always use HTTPS endpoints for webhooks 
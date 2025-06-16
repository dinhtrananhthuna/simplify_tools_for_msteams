# Teams Bot Setup Guide

## Overview
Hướng dẫn setup Teams Message Extension Bot sử dụng Bot Framework SDK cho tính năng Quick Bug Reporting.

## Architecture
```
Teams App -> Azure Bot -> Webhook Endpoint -> Bot Framework -> Adaptive Cards
```

## Prerequisites
1. Azure Subscription
2. Teams Developer Account
3. Bot Framework SDK đã được cài đặt

## Setup Steps

### 1. Azure Bot Registration

1. Truy cập [Azure Portal](https://portal.azure.com)
2. Tạo **Azure Bot** resource:
   - Resource Name: `quickbug-teams-bot`
   - Bot Handle: `quickbug-teams-bot` (unique globally)
   - Subscription: Chọn subscription của bạn
   - Resource Group: Tạo mới hoặc sử dụng existing
   - Pricing Tier: **Free F0**
   - App Type: **User-Assigned Managed Identity**

3. Sau khi tạo xong, vào **Configuration** tab:
   - **Messaging endpoint**: `https://your-domain.com/api/webhooks/teams-bot`
   - **Microsoft App ID**: Copy lại (đây là `MICROSOFT_APP_ID`)

4. Vào **Manage** -> **Client secrets**:
   - Tạo new client secret
   - Copy **Value** (đây là `MICROSOFT_APP_PASSWORD`)

### 2. Environment Variables

Thêm vào file `.env` hoặc `.env.local`:

```env
# Teams Bot Framework
MICROSOFT_APP_ID="your-bot-app-id-from-azure"
MICROSOFT_APP_PASSWORD="your-bot-app-password-from-azure"
```

### 3. Teams App Manifest

Tạo `manifest.json` cho Teams app:

```json
{
  "$schema": "https://developer.microsoft.com/en-us/json-schemas/teams/v1.16/MicrosoftTeams.schema.json",
  "manifestVersion": "1.16",
  "version": "1.0.0",
  "id": "your-bot-app-id-from-azure",
  "developer": {
    "name": "Your Company",
    "websiteUrl": "https://your-website.com",
    "privacyUrl": "https://your-website.com/privacy",
    "termsOfUseUrl": "https://your-website.com/terms"
  },
  "icons": {
    "color": "color.png",
    "outline": "outline.png"
  },
  "name": {
    "short": "Quick Bug Reporter",
    "full": "Quick Bug Reporter for Teams"
  },
  "description": {
    "short": "Quickly report bugs using Adaptive Cards",
    "full": "A Teams Message Extension for quick bug reporting with structured forms"
  },
  "accentColor": "#FFFFFF",
  "bots": [
    {
      "botId": "your-bot-app-id-from-azure",
      "scopes": [
        "personal",
        "team",
        "groupchat"
      ],
      "supportsFiles": false,
      "isNotificationOnly": false
    }
  ],
  "composeExtensions": [
    {
      "botId": "your-bot-app-id-from-azure",
      "commands": [
        {
          "id": "quickbug",
          "title": "Báo cáo bug",
          "description": "Tạo báo cáo bug nhanh",
          "type": "action",
          "context": ["compose"]
        }
      ]
    }
  ],
  "permissions": [
    "identity",
    "messageTeamMembers"
  ],
  "validDomains": [
    "your-domain.com"
  ]
}
```

### 4. Deploy & Test

1. **Deploy ứng dụng** lên server có HTTPS
2. **Update Messaging Endpoint** trong Azure Bot configuration
3. **Sideload Teams App**:
   - Zip manifest.json + icons
   - Upload vào Teams
4. **Test Message Extension**:
   - Vào Teams chat
   - Click ... trong compose box
   - Chọn "Quick Bug Reporter"
   - Fill form và submit

## API Endpoints

### Main Webhook
- **URL**: `/api/webhooks/teams-bot`
- **Method**: POST
- **Purpose**: Handle Teams bot activities

### Debug Endpoints
- **URL**: `/api/debug/test-teams-bot?type=query`
- **Purpose**: Test composeExtension/query
- **URL**: `/api/debug/test-teams-bot?type=submit`
- **Purpose**: Test composeExtension/submitAction

## Message Extension Flow

1. **User clicks extension** → `composeExtension/query`
2. **Bot returns form** → Adaptive Card với input fields
3. **User submits form** → `composeExtension/submitAction`
4. **Bot returns result** → Formatted bug report card
5. **User sends card** → Card appears in chat

## Troubleshooting

### Common Issues

1. **401 Unauthorized**
   - Check `MICROSOFT_APP_ID` và `MICROSOFT_APP_PASSWORD`
   - Verify Bot registration settings

2. **404 Not Found**
   - Check messaging endpoint URL
   - Ensure webhook endpoint is deployed and accessible

3. **Extension không hiển thị**
   - Check Teams app manifest
   - Verify `composeExtensions` configuration
   - Re-sideload app

4. **Form không submit được**
   - Check `composeExtension/submitAction` handler
   - Verify Adaptive Card schema

### Debug Commands

```bash
# Test query endpoint
curl -X GET "https://your-domain.com/api/debug/test-teams-bot?type=query"

# Test submit endpoint
curl -X GET "https://your-domain.com/api/debug/test-teams-bot?type=submit"

# Check bot endpoint
curl -X GET "https://your-domain.com/api/webhooks/teams-bot"
```

### Log Analysis

Check application logs for:
- `[DEBUG] Activity type: invoke`
- `[DEBUG] Invoke name: composeExtension/query`
- `[DEBUG] Invoke name: composeExtension/submitAction`

## Security Notes

1. **Bot Credentials**: Giữ `MICROSOFT_APP_PASSWORD` an toàn
2. **HTTPS Required**: Teams chỉ call HTTPS endpoints
3. **Signature Validation**: Bot Framework tự động validate signatures
4. **Scoped Access**: Bot chỉ access conversations nó được add vào

## Next Steps

Sau khi bot hoạt động:
1. Implement database storage cho bug reports
2. Add notification tới team channels
3. Integrate với bug tracking systems
4. Add authentication/authorization
5. Implement admin dashboard 
# Hướng dẫn cấu hình Teams App cho External Users

## Tổng quan
Hướng dẫn này giải thích cách cấu hình Teams app Quickbug để hỗ trợ external users từ các tổ chức khác.

## Các loại External Access

### 1. Guest Access
- External users được invite làm guest vào org của bạn
- Có full access như internal users
- Cần admin approval cho mỗi guest

### 2. Multi-tenant Access
- External users sử dụng app từ org của họ
- Không cần guest account
- App phải support multi-tenant authentication

## Cấu hình Multi-tenant App

### Bước 1: Cập nhật Azure App Registration

1. Truy cập [Azure Portal](https://portal.azure.com)
2. Vào **App registrations** → chọn app của bạn
3. Vào **Authentication** tab
4. Thay đổi **Supported account types**:
   ```
   From: "Accounts in this organizational directory only (Single tenant)"
   To: "Accounts in any organizational directory (Any Azure AD tenant - Multitenant)"
   ```

### Bước 2: Cập nhật Teams App Manifest

```json
{
  "$schema": "https://developer.microsoft.com/en-us/json-schemas/teams/v1.16/MicrosoftTeams.schema.json",
  "manifestVersion": "1.16",
  "version": "1.0.1",
  "id": "your-bot-app-id-from-azure",
  "developer": {
    "name": "Your Company",
    "websiteUrl": "https://your-domain.com",
    "privacyUrl": "https://your-domain.com/privacy",
    "termsOfUseUrl": "https://your-domain.com/terms"
  },
  "name": {
    "short": "Quick Bug Reporter",
    "full": "Quick Bug Reporter for Teams"
  },
  "description": {
    "short": "Quickly report bugs using Adaptive Cards",
    "full": "A Teams Message Extension for quick bug reporting with structured forms"
  },
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
    "*.teams.microsoft.com",
    "teams.microsoft.com",
    "your-domain.com"
  ],
  "webApplicationInfo": {
    "id": "your-app-id",
    "resource": "https://your-domain.com"
  }
}
```

### Bước 3: Cập nhật Authentication Code

Cần xử lý multi-tenant authentication trong code:

```typescript
// lib/teams-auth.ts
export function getTeamsAuthUrl(tenantId?: string): string {
  const params = new URLSearchParams({
    client_id: TEAMS_CONFIG.clientId,
    response_type: 'code',
    redirect_uri: TEAMS_CONFIG.redirectUri,
    scope: TEAMS_CONFIG.scopes.join(' '),
    response_mode: 'query',
    // For multi-tenant: use 'common' instead of specific tenant
    tenant: tenantId || 'common',
  });

  return `https://login.microsoftonline.com/${tenantId || 'common'}/oauth2/v2.0/authorize?${params}`;
}

// Handle external tenant authentication
export async function handleExternalTenantAuth(code: string, tenantId: string) {
  // Exchange code for tokens with specific tenant
  const response = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: TEAMS_CONFIG.clientId,
      client_secret: TEAMS_CONFIG.clientSecret,
      code,
      redirect_uri: TEAMS_CONFIG.redirectUri,
      grant_type: 'authorization_code',
    }),
  });

  return response.json();
}
```

## Distribution Options

### Option 1: Microsoft AppSource (Public Store)
- App được distribute qua official Teams App Store
- Có thể được install bởi bất kỳ org nào
- Cần Microsoft approval process

**Quy trình:**
1. Chuẩn bị app package (.zip với manifest, icons)
2. Submit lên [Partner Center](https://partner.microsoft.com/)
3. Microsoft review và approve
4. App xuất hiện trong Teams App Store

### Option 2: Sideloading (Manual Install)
- Admin của external org manually install app
- Nhanh hơn nhưng cần manual work cho mỗi org

**Quy trình:**
1. Gửi app package (.zip) cho external org admin
2. Admin upload vào Teams Admin Center
3. Enable app cho users trong org đó

### Option 3: Organization App Catalog
- Upload app vào org catalog của từng external org
- Controlled distribution

## Guest Access Configuration

Nếu muốn sử dụng Guest Access thay vì multi-tenant:

### Bước 1: Enable Guest Access
```powershell
# Microsoft 365 Admin Center
# Settings → Org settings → Microsoft 365 Groups
# ✅ Let group owners add people outside the organization to Microsoft 365 Groups as guests
# ✅ Let guest group members access group content

# Teams Admin Center  
# Users → External access → Guest access
# ✅ Allow guest access in Teams
```

### Bước 2: Invite External Users
External users sẽ được invite làm guest:
1. Admin invite external user email
2. User nhận email invitation
3. User accept invitation → tạo guest account
4. User có thể sử dụng Teams app như internal user

## Security Considerations

### 1. Conditional Access Policies
```json
{
  "displayName": "External Users - Quickbug App Access",
  "state": "enabled",
  "conditions": {
    "users": {
      "includeUsers": ["GuestsOrExternalUsers"]
    },
    "applications": {
      "includeApplications": ["your-app-id"]
    }
  },
  "grantControls": {
    "operator": "AND",
    "builtInControls": ["mfa", "compliantDevice"]
  }
}
```

### 2. Data Protection
- Xác định data nào có thể share với external users
- Implement access controls trong app code
- Log external user activities

### 3. Tenant Restrictions
```json
{
  "allowedTenants": [
    "partner-org-1.onmicrosoft.com",
    "partner-org-2.onmicrosoft.com"
  ],
  "blockedTenants": [
    "competitor.onmicrosoft.com"
  ]
}
```

## Testing với External Users

### Bước 1: Setup Test Tenant
1. Tạo Microsoft 365 Developer tenant
2. Tạo test users trong tenant đó
3. Configure cross-tenant access

### Bước 2: Test Scenarios
1. **Guest access**: Invite external user làm guest
2. **External access**: External user join từ org của họ
3. **Anonymous access**: User không có Microsoft account

### Bước 3: Verify Functionality
- External user có thể access Quickbug extension không?
- Form submission hoạt động đúng không?
- Adaptive Card được render correctly không?

## Troubleshooting

### Common Issues

1. **External user không thấy app**
   - Check app distribution settings
   - Verify tenant allows external apps
   - Check user permissions

2. **Authentication failures**
   - Verify multi-tenant app registration
   - Check redirect URIs
   - Validate tenant trust relationship

3. **Permission denied errors**
   - Check Microsoft Graph API permissions
   - Verify consent has been granted
   - Check conditional access policies

### Debug Commands

```bash
# Test external authentication
curl -X GET "https://your-domain.com/api/auth/teams/status?tenant=external-tenant-id"

# Test external webhook
curl -X POST "https://your-domain.com/api/webhooks/teams-bot" \
  -H "Authorization: Bearer external-user-token"
```

## Compliance và Legal

### Data Residency
- Xác định data được store ở đâu
- Comply với external org's data policies
- Implement data retention policies

### Privacy
- Update privacy policy để cover external users
- Explain data collection và usage
- Provide opt-out mechanisms

### Terms of Service
- External users phải agree với ToS
- Clear usage guidelines
- Support contact information

## Next Steps

1. **Phase 1**: Configure multi-tenant app registration
2. **Phase 2**: Test với partner organizations
3. **Phase 3**: Submit to Microsoft AppSource (optional)
4. **Phase 4**: Monitor usage và gather feedback
5. **Phase 5**: Scale to more external organizations 
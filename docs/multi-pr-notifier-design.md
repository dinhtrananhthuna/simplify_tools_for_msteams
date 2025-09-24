# Multi PR-Notifier Configuration Design

## Overview
Upgrade from single PR-Notifier configuration to support multiple Azure DevOps organizations and Teams chat destinations.

## Current State
- Single configuration stored in `tools` table with `id='pr-notifier'`
- Config stored as JSONB: `{ azureDevOpsUrl, targetChat, enableMentions, mentionUsers }`
- Webhook handler processes all Azure DevOps events with single config

## New Design

### Database Schema Changes

#### New Table: `pr_configurations`
```sql
CREATE TABLE pr_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,                    -- User-friendly name: "My Team - Project X"
  azure_devops_org_url TEXT NOT NULL,   -- https://dev.azure.com/myorg
  azure_devops_project TEXT,            -- Optional: specific project filter
  target_chat_id TEXT NOT NULL,         -- Teams chat/channel ID
  target_chat_name TEXT,                -- Display name for UI
  target_chat_type TEXT,                -- 'group', 'channel', 'oneOnOne'
  target_team_id TEXT,                  -- For channels: parent team ID
  enable_mentions BOOLEAN DEFAULT FALSE,
  mention_users TEXT[],                 -- Array of usernames to mention
  webhook_secret TEXT,                  -- Optional: specific webhook secret
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Ensure unique org + project combination
  CONSTRAINT unique_org_project UNIQUE (azure_devops_org_url, azure_devops_project)
);
```

#### Indexes for Performance
```sql
CREATE INDEX idx_pr_configs_active ON pr_configurations(is_active);
CREATE INDEX idx_pr_configs_org_url ON pr_configurations(azure_devops_org_url);
CREATE INDEX idx_pr_configs_created ON pr_configurations(created_at DESC);
```

### Webhook Routing Strategy

1. **URL-based routing**: `/api/webhooks/azure-devops/:configId`
2. **Org-based detection**: Parse webhook payload to identify source org
3. **Fallback to default**: Use first active config if no match

### API Endpoints

#### PR Configurations Management
- `GET /api/pr-configurations` - List all configurations
- `POST /api/pr-configurations` - Create new configuration
- `GET /api/pr-configurations/:id` - Get specific configuration
- `PUT /api/pr-configurations/:id` - Update configuration
- `DELETE /api/pr-configurations/:id` - Delete configuration

#### Webhook Endpoints
- `POST /api/webhooks/azure-devops` - Legacy endpoint (routes to first active config)
- `POST /api/webhooks/azure-devops/:configId` - Specific configuration endpoint

### Migration Strategy

1. **Data Migration**: Convert existing single config to first record in new table
2. **API Compatibility**: Maintain backward compatibility with existing tools table
3. **Progressive Enhancement**: Old webhook URLs continue working

### Frontend Changes

#### New PR-Notifier Management Page
- List all configurations with status indicators
- Add/Edit/Delete configurations
- Test webhook functionality per configuration
- Copy webhook URLs for each configuration

#### Configuration Form
- Name/Description
- Azure DevOps organization URL
- Project filter (optional)
- Teams chat/channel selection
- Mention settings
- Test functionality

### Benefits

1. **Multi-tenant Support**: Different teams can have separate configurations
2. **Organization Isolation**: Each Azure DevOps org can have dedicated settings
3. **Flexible Routing**: Webhooks can target different Teams channels
4. **Better Management**: Easy to enable/disable specific configurations
5. **Scalability**: No limit on number of configurations

### Implementation Phases

1. **Phase 1**: Database schema + migration
2. **Phase 2**: Backend API endpoints
3. **Phase 3**: Webhook routing logic
4. **Phase 4**: Frontend UI
5. **Phase 5**: Testing + Documentation
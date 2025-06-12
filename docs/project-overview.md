# MS Teams Tools Suite - Project Overview

## 🎯 Project Vision

Một bộ công cụ tự động hóa cho Microsoft Teams, được thiết kế như một hub chứa nhiều tools khác nhau. Tool đầu tiên là **Pull Request Notifier** - tự động thông báo team về pull requests từ Azure DevOps.

## 🏗️ Architecture Overview

### Serverless Architecture (Vercel Compatible)
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Azure DevOps  │───▶│   Next.js API   │───▶│  MS Teams Chat  │
│    Webhooks     │    │   (Serverless)   │    │   (Graph API)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   Neon Database │
                       │  (Config+Tokens) │
                       └─────────────────┘
```

## 🛠️ Tech Stack

### Frontend & Backend
- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + shadcn/ui
- **Authentication:** Basic Auth (Environment Variables)

### Database & Storage
- **Primary DB:** Neon PostgreSQL (Free Tier - 3GB)
- **Caching:** Vercel Edge Config (8KB limit)
- **File Storage:** Not needed initially

### Deployment & Hosting
- **Platform:** Vercel (Free Tier)
- **Domain:** Vercel subdomain
- **Environment:** Serverless functions

### External Services
- **MS Teams:** Microsoft Graph API
- **Azure DevOps:** Webhook integration
- **Monitoring:** Vercel Analytics (Free)

## 💾 Database Schema

### Core Tables

#### 1. `auth_tokens` - MS Teams Authentication
```sql
CREATE TABLE auth_tokens (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL DEFAULT 'admin', -- Single user system
  access_token TEXT NOT NULL,           -- Encrypted
  refresh_token TEXT NOT NULL,          -- Encrypted  
  expires_at TIMESTAMP NOT NULL,
  scope TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### 2. `tools` - Tool Configurations
```sql
CREATE TABLE tools (
  id TEXT PRIMARY KEY,                  -- 'pr-notifier', 'meeting-scheduler'
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,               -- 'automation', 'productivity'
  config JSONB NOT NULL,                -- Tool-specific settings
  is_active BOOLEAN DEFAULT false,
  permissions_granted JSONB,            -- MS Teams permissions status
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### 3. `webhook_logs` - Activity Tracking
```sql
CREATE TABLE webhook_logs (
  id SERIAL PRIMARY KEY,
  tool_id TEXT REFERENCES tools(id),
  webhook_source TEXT NOT NULL,         -- 'azure-devops', 'github'
  event_type TEXT NOT NULL,             -- 'pull_request.created'
  payload JSONB,                        -- Original webhook data
  processed_at TIMESTAMP,
  status TEXT NOT NULL DEFAULT 'pending', -- 'success', 'failed', 'pending'
  error_message TEXT,
  teams_message_id TEXT,                -- For tracking sent messages
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### 4. `tool_settings` - Global Settings
```sql
CREATE TABLE tool_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Indexes for Performance
```sql
-- Performance indexes
CREATE INDEX idx_auth_tokens_user_id ON auth_tokens(user_id);
CREATE INDEX idx_auth_tokens_expires ON auth_tokens(expires_at);
CREATE INDEX idx_tools_active ON tools(is_active);
CREATE INDEX idx_tools_category ON tools(category);
CREATE INDEX idx_webhook_logs_tool_status ON webhook_logs(tool_id, status);
CREATE INDEX idx_webhook_logs_created ON webhook_logs(created_at DESC);
```

## 🔐 Security & Authentication

### Basic Authentication Strategy
- **Single User System:** Environment-based credentials
- **Admin Routes:** Protected with Basic Auth middleware
- **API Security:** Webhook signature validation
- **Token Encryption:** Database tokens encrypted at rest

### Environment Variables
```bash
# Authentication
ADMIN_USER=your_username
ADMIN_PASS=your_secure_password

# Database
DATABASE_URL=postgresql://...
ENCRYPTION_KEY=your_32_char_encryption_key

# MS Teams Integration
TEAMS_CLIENT_ID=your_teams_app_id
TEAMS_CLIENT_SECRET=your_teams_secret
TEAMS_TENANT_ID=your_tenant_id

# Webhook Security
WEBHOOK_SECRET=random_secret_for_validation

# Deployment
VERCEL_URL=your-app.vercel.app
```

## 🚀 Deployment Strategy

### Vercel Free Tier Limits
- **Bandwidth:** 100GB/month
- **Function Execution:** 100GB-hrs/month
- **Function Timeout:** 10 seconds
- **Edge Config:** 8KB storage

### Database Optimization (Neon Free)
- **Storage:** 3GB limit
- **Compute:** 20 hours/month
- **Connection Pooling:** Max 1 connection per function
- **Query Optimization:** Minimal queries, efficient indexes

## 🔧 Development Workflow

### Local Development
```bash
# Setup
npm install
npm run db:setup
npm run dev

# Database migrations
npm run db:migrate
npm run db:seed
```

### Deployment Pipeline
```bash
# Automatic deployment via Vercel
git push origin main → Vercel deploys → Environment variables auto-applied
```

## 📊 Tool Architecture

### Base Tool Interface
```typescript
interface Tool {
  id: string;
  name: string;
  description: string;
  category: 'automation' | 'productivity' | 'integration';
  permissions: string[];           // MS Teams permissions needed
  configSchema: ZodSchema;         // Validation schema
  webhookEndpoint?: string;        // Optional webhook URL
  setupComponent: React.Component; // UI setup component
}
```

### Tool Registry System
- **Centralized Registration:** Single source of truth
- **Dynamic Loading:** Tools loaded based on configuration
- **Modular Design:** Easy to add/remove tools

## 🎯 Phase 1 Implementation

### MVP Features
1. **Basic Dashboard:** Tool overview and status
2. **MS Teams OAuth:** Authentication flow
3. **Pull Request Notifier:** Azure DevOps integration
4. **Admin Panel:** Tool configuration interface

### Success Metrics
- ✅ Successful OAuth with MS Teams
- ✅ Receive and process Azure DevOps webhooks
- ✅ Send formatted messages to Teams chat
- ✅ Zero-downtime on Vercel free tier

## 🔮 Future Expansions

### Additional Tools (Phase 2+)
1. **Meeting Scheduler** - Auto-create meetings from calendar
2. **Status Sync** - Sync status across platforms  
3. **File Organizer** - Auto-organize shared files
4. **Analytics Dashboard** - Team productivity insights
5. **Standup Bot** - Daily standup automation

### Scaling Considerations
- **Database Migration:** Move to paid Neon tier if needed
- **Caching Layer:** Implement Redis if free limits exceeded
- **Multi-tenant:** Support multiple users/teams
- **Custom Domain:** Professional appearance

---

**Last Updated:** [Current Date]  
**Version:** 1.0.0  
**Status:** Planning Phase 
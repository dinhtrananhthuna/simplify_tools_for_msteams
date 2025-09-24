# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

This is a Next.js 14-based MS Teams automation tools suite that integrates with Azure DevOps and Microsoft Graph API. The project uses serverless architecture on Vercel with a PostgreSQL database backend (Neon Database). The primary tool is a multi-configuration Pull Request Notifier that supports multiple Azure DevOps organizations and Teams chat destinations.

## Essential Development Commands

### Environment Setup
```bash
# Install dependencies
npm install

# Setup environment variables (copy from env.example)
cp env.example .env.local

# Setup database tables and triggers
npm run db:setup

# Type check without emitting files
npm run type-check
```

### Development Workflow
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run ESLint
npm run lint
```

### Database Operations
```bash
# Setup fresh database (creates tables, indexes, triggers)
npm run db:setup

# Run database migrations
npm run db:migrate

# Seed database with initial data
npm run db:seed

# Remove specific data (bug reports)
npm run db:remove-bug-reports

# Add user context to webhook logs
npm run db:add-user-context

# Migrate to multi-PR-configurations (one-time setup)
npm run db:migrate-multi-pr
```

### Testing & Debug Scripts
```bash
# Debug scripts (in scripts/ directory)
tsx scripts/test-real-message.ts
tsx scripts/validate-chat-id.ts
tsx scripts/debug-pr-config.ts
```

## Architecture Overview

### Technology Stack
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript with strict mode
- **Database**: PostgreSQL (Neon Database) with connection pooling
- **Styling**: Tailwind CSS + shadcn/ui components
- **Authentication**: Basic Auth + Microsoft OAuth2 (MSAL)
- **Deployment**: Vercel serverless functions
- **External APIs**: Microsoft Graph API, Azure DevOps webhooks

### Key Architectural Patterns

#### Serverless-First Design
- Connection pooling with single connection limit for serverless environment
- Stateless API routes optimized for Vercel functions
- Environment-based configuration with encrypted token storage
- Graceful degradation and error handling for external service failures

#### Database Layer (`lib/db.ts`)
- Singleton connection pool pattern for serverless environments
- Transaction support with automatic rollback
- Query helpers: `executeQuery`, `executeQuerySingle`, `executeTransaction`
- Built for PostgreSQL with proper SSL support for Neon Database

#### Authentication System (`lib/auth.ts`)
- Multi-layer auth: Basic Auth for admin routes + OAuth2 for Teams integration
- Token encryption/decryption using AES encryption
- Automatic token refresh with 5-minute expiry buffer
- Sophisticated error handling for token corruption and expiry scenarios

#### Teams Integration (`lib/teams.ts`)
- Multi-tenant OAuth support (can handle external tenant users)
- Direct Graph API client with automatic authentication
- Adaptive Card support for rich message formatting
- Auto-detection of channel vs chat message targets
- Comprehensive error handling for Graph API edge cases

#### Tool Registry System
- Modular tool architecture with `ToolDefinition` interface
- Zod-based configuration validation
- Dynamic loading and registration of tools
- Extensible design for adding new automation tools

### Directory Structure Conventions
- `app/` - Next.js App Router with route groups
- `app/(admin)/` - Protected admin interface routes
- `app/admin/pr-configurations/` - Multi-configuration PR-Notifier management
- `app/api/` - API endpoints organized by feature
- `components/ui/` - shadcn/ui components
- `components/layout/` - Reusable layout components
- `lib/` - Core business logic and utilities
- `scripts/` - Database setup and maintenance scripts
- `types/` - Centralized TypeScript type definitions

## Development Guidelines

### Next.js Best Practices (from .cursor/rules)
- Use Server Components by default, mark client components with 'use client'
- Place route-specific components in `app/` directory
- Use path aliases (`@/components/*`, `@/lib/*`, etc.) instead of relative imports
- Implement proper loading and error boundaries
- Use Zod for form validation with server-side validation

### Code Organization Patterns
- Centralize types in `types/index.ts` with Zod schemas
- Use consistent error handling with try-catch and detailed logging
- Implement proper cleanup in serverless functions (database connections)
- Follow the existing authentication middleware pattern for protected routes

### Database Patterns
- Use transactions for multi-table operations
- Implement proper indexing (check existing indexes in `setup-db.ts`)
- Use JSONB for flexible configuration storage (PostgreSQL native)
- Include `user_context` in webhook logs for debugging
- Use PostgreSQL numbered parameters ($1, $2, etc.) in queries

### Teams Integration Patterns
- Always handle both chat and channel message scenarios
- Use Adaptive Cards for rich formatting, HTML as fallback
- Implement proper mention support with `<at>` tags
- Include error retry logic for Graph API calls

### Security Considerations
- All admin routes use Basic Authentication
- Tokens are encrypted at rest in database
- Webhook endpoints validate signatures
- Security headers applied via middleware
- Environment variables for all sensitive configuration

## Key Files & Their Purposes

### Core Libraries
- `lib/auth.ts` - Authentication, token management, encryption
- `lib/db.ts` - Database connection, query helpers, transactions
- `lib/teams.ts` - Microsoft Graph API integration, message sending
- `lib/utils.ts` - Utility functions, class merging (cn)

### Type Definitions
- `types/index.ts` - All TypeScript interfaces, Zod schemas, API types

### Configuration Files
- `next.config.js` - Security headers, serverless optimization, redirects
- `middleware.ts` - Security headers for admin and API routes
- `tsconfig.json` - Path aliases, strict TypeScript configuration

### Database Schema
- Core tables: `auth_tokens`, `tools`, `webhook_logs`, `tool_settings`, `pr_configurations`
- Multi-configuration support: `pr_configurations` table for multiple Azure DevOps orgs
- Proper indexing for performance in serverless environment
- Automatic `updated_at` triggers
- Foreign key constraints with cascade deletes
- UUID-based primary keys for configurations

## Environment Variables

### Required for Development
```bash
# Database
DATABASE_URL=postgresql://user:password@host:5432/database?sslmode=require

# Admin Authentication
ADMIN_USER=your_admin_username
ADMIN_PASS=your_secure_password

# Encryption
ENCRYPTION_KEY=your_32_character_encryption_key

# Microsoft Teams Integration
TEAMS_CLIENT_ID=your_teams_app_client_id
TEAMS_CLIENT_SECRET=your_teams_app_secret
TEAMS_TENANT_ID=your_tenant_id

# Webhook Security
WEBHOOK_SECRET=random_secret_for_validation

# App Configuration
NEXTAUTH_URL=https://your-app.vercel.app
VERCEL_URL=your-app.vercel.app
```

## API Endpoints

### PR Configurations Management
- `GET /api/pr-configurations` - List all PR configurations
- `POST /api/pr-configurations` - Create new configuration
- `GET /api/pr-configurations/:id` - Get specific configuration
- `PUT /api/pr-configurations/:id` - Update configuration
- `DELETE /api/pr-configurations/:id` - Delete configuration

### Webhook Endpoints
- `POST /api/webhooks/azure-devops` - Legacy endpoint (routes to first active config)
- `POST /api/webhooks/azure-devops/:configId` - Specific configuration endpoint
- `GET /api/webhooks/azure-devops/:configId` - Get webhook info for configuration

## Common Development Tasks

### Adding New Tools
1. Define tool in `types/index.ts` with proper TypeScript interface
2. Create configuration schema using Zod
3. Add setup component in `components/tools/`
4. Register tool in tool registry system
5. Create API endpoints in `app/api/tools/[toolname]/`
6. Add webhook handler if needed

### Database Migrations
1. Create migration script in `scripts/`
2. Follow existing patterns in `migrate-*.ts` files
3. Use transactions for data consistency
4. Update table schemas if needed
5. Test locally before production deployment

### Testing Teams Integration
1. Use debug endpoints in `app/api/debug/`
2. Test with real Teams data using `scripts/test-real-message.ts`
3. Validate chat IDs with `scripts/validate-chat-id.ts`
4. Check webhook processing with debug logs

### Vercel Deployment
- Environment variables are automatically applied from dashboard
- Database connections are pooled for serverless environment
- Function timeout is 10 seconds (Vercel free tier limit)
- Use `output: 'standalone'` for optimal performance

## Troubleshooting Common Issues

### Database Connection Issues
- Check `DATABASE_URL` environment variable is properly set
- Verify connection limits (max 1 for serverless)
- Test connection with `npm run db:setup`

### Teams Authentication Issues
- Verify redirect URI matches exactly in Azure App Registration
- Check tenant ID configuration for multi-tenant vs single-tenant
- Use debug endpoints to validate token state

### Webhook Processing Issues
- Validate webhook secret configuration
- Check webhook logs table for error messages
- Use `scripts/debug-pr-config.ts` to test PR processing
- Verify Teams permissions for target chat/channel

### Token Management Issues
- Check encryption key consistency between environments
- Monitor token expiry and refresh logic
- Clear corrupt tokens with debug endpoints if needed
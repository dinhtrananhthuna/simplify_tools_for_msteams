import React from 'react';
import { z } from 'zod';

// ============ Database Types ============

export interface AuthToken {
  id: number;
  user_id: string;
  access_token: string;  // Will be encrypted
  refresh_token: string; // Will be encrypted
  expires_at: Date;
  scope: string;
  created_at: Date;
  updated_at: Date;
}

export interface Tool {
  id: string;
  name: string;
  description?: string;
  category: 'automation' | 'productivity' | 'integration';
  config: Record<string, any>;
  is_active: boolean;
  permissions_granted?: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

// This will be replaced by Zod-inferred type
// export interface WebhookLog {
//   id: number;
//   tool_id: string;
//   webhook_source: string;
//   event_type: string;
//   payload?: Record<string, any>;
//   processed_at?: Date;
//   status: 'success' | 'failed';
//   error_message?: string;
//   teams_message_id?: string;
//   created_at: Date;
// }

export interface ToolSetting {
  key: string;
  value: Record<string, any>;
  description?: string;
  updated_at: Date;
}

// ============ Tool Registry Types ============

export interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'automation' | 'productivity' | 'integration';
  permissions: string[];
  configSchema: z.ZodSchema;
  webhookEndpoint?: string;
  setupComponent: React.ComponentType<{ tool?: Tool }>;
}

export interface ToolConfig {
  [key: string]: any;
}

// ============ MS Teams Types ============

export interface TeamsChat {
  id: string;
  displayName: string;
  chatType: 'oneOnOne' | 'group' | 'meeting';
  members?: TeamsChatMember[];
}

export interface TeamsChatMember {
  id: string;
  displayName: string;
  email?: string;
  roles: string[];
}

export interface TeamsMessage {
  id: string;
  body: {
    content: string;
    contentType: 'text' | 'html';
  };
  from: {
    user: {
      id: string;
      displayName: string;
    };
  };
  createdDateTime: string;
  chatId: string;
}

// ============ Azure DevOps Types ============

export interface AzureDevOpsPullRequest {
  pullRequestId: number;
  title: string;
  description: string;
  status: string;
  createdBy: {
    displayName: string;
    uniqueName: string;
    imageUrl?: string;
  };
  repository: {
    id: string;
    name: string;
    webUrl: string;
  };
  sourceRefName: string;
  targetRefName: string;
  url: string;
  creationDate: string;
  reviewers?: Array<{
    displayName: string;
    vote: number;
    isRequired: boolean;
  }>;
}

export interface AzureDevOpsWebhook {
  eventType: string;
  publisherId: string;
  resource: {
    pullRequestId: number;
    status: string;
    title: string;
    description: string;
    sourceRefName: string;
    targetRefName: string;
    repository: {
      id: string;
      name: string;
      webUrl: string;
    };
    createdBy: {
      displayName: string;
      uniqueName: string;
    };
    url: string;
    creationDate: string;
  };
  resourceVersion: string;
  resourceContainers: Record<string, any>;
  createdDate: string;
}

// ============ API Response Types ============

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// ============ Custom Tool & Message Types ============

export interface TeamsMessageTarget {
  id: string;
  displayName?: string;
  type?: 'group' | 'oneOnOne' | 'channel';
  teamId?: string;
}

export interface PRNotifierConfig {
  azureDevOpsUrl: string;
  enableMentions: boolean;
  mentionUsers: string[];
  targetChat?: TeamsMessageTarget;
  targetChatId?: string; // For backward compatibility
}

// New multi-configuration types
export interface PRConfiguration {
  id: string;
  name: string;
  azure_devops_org_url: string;
  azure_devops_project?: string;
  target_chat_id: string;
  target_chat_name?: string;
  target_chat_type?: string;
  target_team_id?: string;
  enable_mentions: boolean;
  mention_users: string[];
  webhook_secret?: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface PRConfigurationInput {
  name: string;
  azure_devops_org_url: string;
  azure_devops_project?: string;
  target_chat_id: string;
  target_chat_name?: string;
  target_chat_type?: string;
  target_team_id?: string;
  enable_mentions?: boolean;
  mention_users?: string[];
  webhook_secret?: string;
  is_active?: boolean;
}

// ============ Validation Schemas ============

export const WebhookLogSchema = z.object({
  id: z.number(),
  tool_id: z.string(),
  webhook_source: z.string(),
  event_type: z.string(),
  payload: z.record(z.string(), z.any()).optional(),
  processed_at: z.date().optional(),
  status: z.enum(['success', 'failed']),
  teams_message_id: z.string().optional(),
  error_message: z.string().optional(),
  created_at: z.date(),
});

export type WebhookLog = z.infer<typeof WebhookLogSchema>;

export const ToolConfigSchema = z.object({
  created_at: z.date(),
});

export const PRNotifierConfigSchema = z.object({
  azureDevOpsUrl: z.string().url().default(''),
  enableMentions: z.boolean().default(false),
  mentionUsers: z.array(z.string()).default([]),
});

// Multi-configuration validation schemas
export const PRConfigurationInputSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  azure_devops_org_url: z.string().url('Invalid Azure DevOps URL'),
  azure_devops_project: z.string().optional(),
  target_chat_id: z.string().min(1, 'Target chat is required'),
  target_chat_name: z.string().optional(),
  target_chat_type: z.enum(['group', 'channel', 'oneOnOne']).optional().default('group'),
  target_team_id: z.string().optional(),
  enable_mentions: z.boolean().default(false),
  mention_users: z.array(z.string()).default([]),
  webhook_secret: z.string().optional(),
  is_active: z.boolean().default(true),
});

export const PRConfigurationUpdateSchema = PRConfigurationInputSchema.partial().extend({
  id: z.string().uuid(),
});

export const PRConfigurationSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  azure_devops_org_url: z.string().url(),
  azure_devops_project: z.string().nullable(),
  target_chat_id: z.string(),
  target_chat_name: z.string().nullable(),
  target_chat_type: z.string(),
  target_team_id: z.string().nullable(),
  enable_mentions: z.boolean(),
  mention_users: z.array(z.string()),
  webhook_secret: z.string().nullable(),
  is_active: z.boolean(),
  created_at: z.date(),
  updated_at: z.date(),
});

export const WebhookPayloadSchema = z.object({
  eventType: z.string(),
  publisherId: z.string(),
  resource: z.object({
    pullRequestId: z.number(),
    title: z.string(),
    status: z.string(),
    repository: z.object({
      name: z.string(),
      webUrl: z.string(),
    }),
    createdBy: z.object({
      displayName: z.string(),
      uniqueName: z.string(),
    }),
    url: z.string(),
  }),
});

// ============ Utility Types ============

export type ToolStatus = 'active' | 'inactive' | 'setup_needed' | 'error';

export interface ToolStats {
  id: string;
  name: string;
  status: ToolStatus;
  lastActivity?: Date;
  totalEvents: number;
  successRate: number;
  errorCount: number;
}

export interface DashboardStats {
  totalTools: number;
  activeTools: number;
  totalWebhooks: number;
  todayWebhooks: number;
  successRate: number;
  recentLogs: WebhookLog[];
}

// ============ Environment Types ============

export interface AppConfig {
  database: {
    url: string;
    maxConnections: number;
  };
  auth: {
    adminUser: string;
    adminPass: string;
    encryptionKey: string;
  };
  teams: {
    clientId: string;
    clientSecret: string;
    tenantId: string;
  };
  webhook: {
    secret: string;
  };
  app: {
    baseUrl: string;
    environment: 'development' | 'production';
  };
} 
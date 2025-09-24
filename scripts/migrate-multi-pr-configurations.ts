#!/usr/bin/env tsx

import { config } from 'dotenv';
import { Pool } from 'pg';
import { resolve } from 'path';

// Load environment variables from .env files
config({ path: resolve(process.cwd(), '.env.local') });
config({ path: resolve(process.cwd(), '.env') });

const DB_URL = process.env.DATABASE_URL;

if (!DB_URL) {
  console.error('❌ DATABASE_URL environment variable is required');
  console.error('📝 Please create .env.local file with DATABASE_URL=your_neon_connection_string');
  process.exit(1);
}

console.log('🔗 Connecting to database...');

const pool = new Pool({
  connectionString: DB_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

const migrateMultiPRConfigurations = async () => {
  console.log('🚀 Starting migration to multi PR-Notifier configurations...');

  try {
    // 1. Enable uuid-ossp extension
    console.log('📋 Enabling uuid-ossp extension...');
    await pool.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    
    // 2. Create pr_configurations table
    console.log('📋 Creating pr_configurations table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS pr_configurations (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name TEXT NOT NULL,
        azure_devops_org_url TEXT NOT NULL,
        azure_devops_project TEXT,
        target_chat_id TEXT NOT NULL,
        target_chat_name TEXT,
        target_chat_type TEXT DEFAULT 'group',
        target_team_id TEXT,
        enable_mentions BOOLEAN DEFAULT FALSE,
        mention_users TEXT[] DEFAULT ARRAY[]::TEXT[],
        webhook_secret TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        
        -- Ensure unique org + project combination (handled at application level)
        UNIQUE (azure_devops_org_url, azure_devops_project)
      );
    `);
    console.log('✅ pr_configurations table created');

    // 3. Create indexes for performance
    console.log('📊 Creating indexes...');
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_pr_configs_active ON pr_configurations(is_active);
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_pr_configs_org_url ON pr_configurations(azure_devops_org_url);
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_pr_configs_created ON pr_configurations(created_at DESC);
    `);
    console.log('✅ Indexes created');

    // 4. Create updated_at trigger for pr_configurations
    await pool.query(`
      DROP TRIGGER IF EXISTS update_pr_configurations_updated_at ON pr_configurations;
      CREATE TRIGGER update_pr_configurations_updated_at
        BEFORE UPDATE ON pr_configurations
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `);
    console.log('✅ Updated_at trigger created');

    // 5. Check if there's existing PR-Notifier configuration to migrate
    console.log('🔍 Checking for existing PR-Notifier configuration...');
    const existingConfig = await pool.query(`
      SELECT config, is_active FROM tools WHERE id = 'pr-notifier'
    `);

    if (existingConfig.rows.length > 0) {
      console.log('📦 Found existing PR-Notifier configuration, migrating...');
      
      const tool = existingConfig.rows[0];
      let config;
      
      try {
        // Parse the existing config
        config = typeof tool.config === 'string' ? JSON.parse(tool.config) : tool.config;
        
        // Only migrate if we have essential data
        if (config.azureDevOpsUrl && (config.targetChat?.id || config.targetChatId)) {
          const targetChatId = config.targetChat?.id || config.targetChatId;
          const targetChatName = config.targetChat?.displayName || 'Migrated Chat';
          const targetChatType = config.targetChat?.type || 'group';
          const targetTeamId = config.targetChat?.teamId || null;
          
          // Extract org name from URL for default name
          const orgMatch = config.azureDevOpsUrl.match(/dev\.azure\.com\/([^\/]+)/);
          const orgName = orgMatch ? orgMatch[1] : 'Azure DevOps';
          
          await pool.query(`
            INSERT INTO pr_configurations (
              name, 
              azure_devops_org_url, 
              target_chat_id, 
              target_chat_name, 
              target_chat_type,
              target_team_id,
              enable_mentions, 
              mention_users, 
              is_active
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          `, [
            `${orgName} - Migrated Configuration`,
            config.azureDevOpsUrl,
            targetChatId,
            targetChatName,
            targetChatType,
            targetTeamId,
            config.enableMentions || false,
            config.mentionUsers || [],
            tool.is_active || true
          ]);
          
          console.log('✅ Successfully migrated existing configuration');
          console.log(`   - Organization: ${config.azureDevOpsUrl}`);
          console.log(`   - Target Chat: ${targetChatName} (${targetChatId})`);
          console.log(`   - Mentions: ${config.enableMentions ? 'Enabled' : 'Disabled'}`);
          
        } else {
          console.log('⚠️ Existing config is incomplete, skipping migration');
          console.log('   - Azure DevOps URL:', config.azureDevOpsUrl ? 'Present' : 'Missing');
          console.log('   - Target Chat:', (config.targetChat?.id || config.targetChatId) ? 'Present' : 'Missing');
        }
        
      } catch (parseError) {
        console.error('❌ Failed to parse existing config:', parseError);
        console.log('Raw config:', tool.config);
      }
    } else {
      console.log('ℹ️ No existing PR-Notifier configuration found to migrate');
    }

    // 6. Update webhook_logs table to support configuration reference
    console.log('📋 Adding config_id column to webhook_logs...');
    
    // Check if config_id column already exists
    const columnExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'webhook_logs' 
        AND column_name = 'config_id'
      );
    `);

    if (!columnExists.rows[0].exists) {
      await pool.query(`
        ALTER TABLE webhook_logs 
        ADD COLUMN config_id UUID REFERENCES pr_configurations(id) ON DELETE SET NULL;
      `);
      console.log('✅ Added config_id column to webhook_logs');
      
      // Create index for the new column
      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_webhook_logs_config_id ON webhook_logs(config_id);
      `);
      console.log('✅ Created index on config_id');
    } else {
      console.log('ℹ️ config_id column already exists in webhook_logs');
    }

    // 7. Check current data
    const configCount = await pool.query(`SELECT COUNT(*) as count FROM pr_configurations`);
    console.log(`📊 Total PR configurations: ${configCount.rows[0].count}`);

    console.log('🎉 Migration completed successfully!');
    console.log('📋 Summary:');
    console.log('   - ✅ Created pr_configurations table with indexes');
    console.log('   - ✅ Added updated_at trigger');
    console.log('   - ✅ Migrated existing configuration (if any)');
    console.log('   - ✅ Enhanced webhook_logs with config_id reference');
    console.log('   - ✅ Multi PR-Notifier support is now ready');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
};

const main = async () => {
  try {
    await migrateMultiPRConfigurations();
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

// Run if called directly
if (require.main === module) {
  main();
}

export { migrateMultiPRConfigurations };
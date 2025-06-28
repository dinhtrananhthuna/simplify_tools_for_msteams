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

const migrateAddUserContext = async () => {
  console.log('🚀 Starting migration to add user_context column...');

  try {
    // 1. Check if webhook_logs table exists
    const tableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'webhook_logs'
      );
    `);

    if (!tableExists.rows[0].exists) {
      console.log('❌ webhook_logs table does not exist. Please run setup-db.ts first.');
      process.exit(1);
    }

    // 2. Check if user_context column already exists
    const columnExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'webhook_logs' 
        AND column_name = 'user_context'
      );
    `);

    if (columnExists.rows[0].exists) {
      console.log('ℹ️ user_context column already exists in webhook_logs table');
      console.log('✅ Migration not needed');
      return;
    }

    // 3. Add user_context column
    await pool.query(`
      ALTER TABLE webhook_logs 
      ADD COLUMN user_context JSONB;
    `);
    console.log('✅ Added user_context column to webhook_logs table');

    // 4. Create index for user_context column for better performance
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_webhook_logs_user_context 
      ON webhook_logs USING GIN (user_context);
    `);
    console.log('✅ Created GIN index on user_context column');

    // 5. Check current data in webhook_logs
    const recordCount = await pool.query(`SELECT COUNT(*) as count FROM webhook_logs`);
    console.log(`📊 Found ${recordCount.rows[0].count} existing webhook log records`);

    if (recordCount.rows[0].count > 0) {
      console.log('ℹ️ Existing records will have NULL user_context (this is expected)');
    }

    console.log('🎉 Migration completed successfully!');
    console.log('📋 Summary:');
    console.log('   - ✅ Added user_context JSONB column to webhook_logs');
    console.log('   - ✅ Created GIN index for better JSON query performance');
    console.log('   - ✅ Teams Bot webhook logging will now work correctly');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
};

const main = async () => {
  try {
    await migrateAddUserContext();
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

// Run if called directly
if (require.main === module) {
  main();
}

export { migrateAddUserContext }; 
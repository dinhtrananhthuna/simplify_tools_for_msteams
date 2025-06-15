#!/usr/bin/env tsx

import { Pool } from 'pg';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

const migrateBugReportsRemoval = async () => {
  console.log('🧹 Starting migration to remove bug reports functionality...');

  try {
    // 1. Check existing bug reports data
    const bugReportsExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'bug_reports'
      );
    `);

    if (bugReportsExists.rows[0].exists) {
      const bugCount = await pool.query(`SELECT COUNT(*) as count FROM bug_reports`);
      console.log(`📊 Found ${bugCount.rows[0].count} bug reports in database`);
      
      // Drop bug_reports table and all dependencies
      await pool.query(`DROP TABLE IF EXISTS bug_reports CASCADE`);
      console.log('✅ Dropped bug_reports table');
    } else {
      console.log('ℹ️ bug_reports table does not exist');
    }

    // 2. Remove quickbug tool from tools table
    const toolResult = await pool.query(`
      DELETE FROM tools WHERE id = 'quickbug' RETURNING id, name
    `);
    
    if (toolResult.rowCount && toolResult.rowCount > 0) {
      console.log(`✅ Removed quickbug tool: ${toolResult.rows[0].name}`);
    } else {
      console.log('ℹ️ Quickbug tool not found in tools table');
    }

    // 3. Remove quickbug-related webhook logs
    const logResult = await pool.query(`
      DELETE FROM webhook_logs WHERE tool_id = 'quickbug' RETURNING id
    `);
    console.log(`✅ Removed ${logResult.rowCount || 0} quickbug webhook logs`);

    // 4. Remove quickbug settings (if exists)
    const settingsResult = await pool.query(`
      DELETE FROM tool_settings WHERE key LIKE 'quickbug%' RETURNING key
    `);
    console.log(`✅ Removed ${settingsResult.rowCount || 0} quickbug settings`);

    // 5. Check for any remaining references
    const remainingRefs = await pool.query(`
      SELECT table_name, column_name 
      FROM information_schema.columns 
      WHERE column_name LIKE '%bug%' OR column_name LIKE '%quickbug%'
    `);

    if (remainingRefs.rowCount && remainingRefs.rowCount > 0) {
      console.log('⚠️ Found potential remaining references:');
      remainingRefs.rows.forEach(row => {
        console.log(`   - ${row.table_name}.${row.column_name}`);
      });
    }

    console.log('🎉 Migration completed successfully!');
    console.log('📋 Summary:');
    console.log('   - ✅ Dropped bug_reports table');
    console.log(`   - ✅ Removed quickbug tool from tools table`);
    console.log(`   - ✅ Cleaned ${logResult.rowCount || 0} webhook logs`);
    console.log(`   - ✅ Cleaned ${settingsResult.rowCount || 0} settings`);
    console.log('   - ✅ Bug reports functionality completely removed');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
};

// Run migration
migrateBugReportsRemoval().catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
}); 
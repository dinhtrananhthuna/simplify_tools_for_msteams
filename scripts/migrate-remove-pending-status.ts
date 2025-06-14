#!/usr/bin/env tsx

import { Pool } from 'pg';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

const migratePendingStatus = async () => {
  console.log('🔄 Starting migration to remove pending status...');

  try {
    // Check current pending records
    const pendingCount = await pool.query(`
      SELECT COUNT(*) as count FROM webhook_logs WHERE status = 'pending'
    `);
    
    console.log(`📊 Found ${pendingCount.rows[0].count} pending webhook records`);

    if (parseInt(pendingCount.rows[0].count) > 0) {
      // Delete pending records (they are incomplete anyway)
      const deleteResult = await pool.query(`
        DELETE FROM webhook_logs WHERE status = 'pending'
      `);
      
      console.log(`🗑️ Deleted ${deleteResult.rowCount} pending records`);
    }

    // Update database schema to remove pending from CHECK constraint
    await pool.query(`
      ALTER TABLE webhook_logs 
      DROP CONSTRAINT IF EXISTS webhook_logs_status_check
    `);

    await pool.query(`
      ALTER TABLE webhook_logs 
      ADD CONSTRAINT webhook_logs_status_check 
      CHECK (status IN ('success', 'failed'))
    `);

    // Remove default value for status column
    await pool.query(`
      ALTER TABLE webhook_logs 
      ALTER COLUMN status DROP DEFAULT
    `);

    console.log('✅ Migration completed successfully!');
    console.log('📋 Summary:');
    console.log('   - Removed all pending webhook records');
    console.log('   - Updated status constraint to only allow success/failed');
    console.log('   - Removed default value for status column');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
};

// Run migration
migratePendingStatus().catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
}); 
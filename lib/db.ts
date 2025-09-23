import { Pool, PoolClient } from 'pg';

// Singleton pattern for serverless environment
let pool: Pool | null = null;

export function getDb(): Pool {
  if (!pool) {
    // Use DATABASE_URL for PostgreSQL connection (Neon compatible)
    const connectionString = process.env.DATABASE_URL;
    
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is required for PostgreSQL connection');
    }
    
    pool = new Pool({
      connectionString,
      max: 1, // Minimal connections for serverless
      connectionTimeoutMillis: 30000,
      idleTimeoutMillis: 30000,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    });

    // Handle pool connection
    pool.on('connect', (client) => {
      console.log('PostgreSQL connection established');
    });
    
    pool.on('error', (err) => {
      console.error('PostgreSQL pool error:', err);
    });
  }

  return pool;
}

// Cleanup function for graceful shutdown
export async function closeDb(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

// Test database connection
export async function testConnection(): Promise<boolean> {
  try {
    const db = getDb();
    const result = await db.query('SELECT NOW() as current_time');
    return result.rows && result.rows.length > 0;
  } catch (error) {
    console.error('PostgreSQL connection test failed:', error);
    return false;
  }
}

// Execute query with error handling
export async function executeQuery<T = any>(
  query: string,
  params: any[] = []
): Promise<T[]> {
  const db = getDb();
  
  try {
    const result = await db.query(query, params);
    return result.rows as T[];
  } catch (error) {
    console.error('PostgreSQL query execution failed:', { query, params, error });
    throw new Error(`Database query failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Get single row
export async function executeQuerySingle<T = any>(
  query: string,
  params: any[] = []
): Promise<T | null> {
  const results = await executeQuery<T>(query, params);
  return results[0] || null;
}

// Execute transaction
export async function executeTransaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const db = getDb();
  const client = await db.connect();

  try {
    await client.query('BEGIN');
    
    const result = await callback(client);
    
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

import { Pool, Client } from 'pg';

// Singleton pattern cho serverless environment
let pool: Pool | null = null;

export function getDb(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 1, // Minimal connections cho free tier
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    });

    // Handle pool errors
    pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
      pool = null; // Reset pool on error
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
    const result = await db.query('SELECT NOW()');
    return !!result.rows[0];
  } catch (error) {
    console.error('Database connection test failed:', error);
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
    return result.rows;
  } catch (error) {
    console.error('Query execution failed:', { query, params, error });
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
  callback: (client: Client) => Promise<T>
): Promise<T> {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  try {
    await client.connect();
    await client.query('BEGIN');
    
    const result = await callback(client);
    
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    await client.end();
  }
} 
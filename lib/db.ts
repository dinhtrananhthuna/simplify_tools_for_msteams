import mysql from 'mysql2/promise';

// Singleton pattern cho serverless environment
let pool: mysql.Pool | null = null;

export function getDb(): mysql.Pool {
  if (!pool) {
    // Use object config for MariaDB connection
    pool = mysql.createPool({
      host: process.env.MYSQL_HOST || '103.9.76.10',
      port: parseInt(process.env.MYSQL_PORT || '3306'),
      user: process.env.MYSQL_USER || 'oyhumgag_sa',
      password: process.env.MYSQL_PASSWORD || 'a%PnNf}(%QB_o+*R',
      database: process.env.MYSQL_DATABASE || 'oyhumgag_mstoolsuite',
      charset: 'utf8mb4',
      connectionLimit: 1, // Minimal connections cho serverless
      connectTimeout: 30000
    });

    // Handle pool connection
    pool.on('connection', (connection) => {
      console.log('MariaDB connection established as id ' + connection.threadId);
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
    const [rows] = await db.execute('SELECT NOW() as current_time');
    return Array.isArray(rows) && rows.length > 0;
  } catch (error) {
    console.error('MariaDB connection test failed:', error);
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
    const [rows] = await db.execute(query, params);
    return rows as T[];
  } catch (error) {
    console.error('MariaDB query execution failed:', { query, params, error });
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
  callback: (connection: mysql.PoolConnection) => Promise<T>
): Promise<T> {
  const db = getDb();
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();
    
    const result = await callback(connection);
    
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
} 
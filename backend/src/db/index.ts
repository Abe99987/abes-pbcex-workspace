import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';
import { logInfo, logError, logWarn } from '@/utils/logger';

/**
 * Database connection pool and query helpers
 */

class DatabaseManager {
  private static instance: DatabaseManager;
  private pool: Pool | null = null;
  private isEnabled = false;

  private constructor() {
    this.initialize();
  }

  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  private initialize() {
    const databaseUrl = process.env.DATABASE_URL || process.env.DIRECT_URL;

    if (!databaseUrl || databaseUrl.includes('[YOUR-PASSWORD]')) {
      logWarn('Database not configured, using in-memory storage');
      return;
    }

    try {
      this.pool = new Pool({
        connectionString: databaseUrl,
        ssl: {
          rejectUnauthorized: false,
        },
        max: 20, // Maximum number of clients in the pool
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      });

      this.pool.on('error', err => {
        logError('Database pool error', err);
      });

      this.isEnabled = true;
      logInfo('Database pool initialized');
    } catch (error) {
      logError('Failed to initialize database', error as Error);
    }
  }

  public async query<T extends QueryResultRow = any>(
    text: string,
    params?: unknown[]
  ): Promise<QueryResult<T>> {
    if (!this.isEnabled || !this.pool) {
      throw new Error('Database not available');
    }

    try {
      const start = Date.now();
      const result = await this.pool.query<T>(text, params);
      const duration = Date.now() - start;

      if (duration > 1000) {
        logWarn(`Slow query (${duration}ms): ${text.substring(0, 100)}...`);
      }

      return result;
    } catch (error) {
      logError(
        `Database query failed: ${text.substring(0, 100)}...`,
        error as Error
      );
      throw error;
    }
  }

  public async getClient(): Promise<PoolClient> {
    if (!this.isEnabled || !this.pool) {
      throw new Error('Database not available');
    }
    return this.pool.connect();
  }

  public async transaction<T>(
    callback: (client: PoolClient) => Promise<T>
  ): Promise<T> {
    const client = await this.getClient();

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

  public isConnected(): boolean {
    return this.isEnabled;
  }

  public async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
      this.isEnabled = false;
      logInfo('Database pool closed');
    }
  }

  public async healthCheck(): Promise<{
    status: 'ok' | 'disabled' | 'error';
    details?: string;
  }> {
    if (!this.isEnabled) {
      return { status: 'disabled', details: 'Database not configured' };
    }

    try {
      await this.query('SELECT 1');
      return { status: 'ok' };
    } catch (error) {
      return {
        status: 'error',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

// Export singleton instance
export const db = DatabaseManager.getInstance();

// Helper functions for common operations
export async function findOne<T extends QueryResultRow>(
  table: string,
  conditions: Record<string, unknown>
): Promise<T | null> {
  const whereClause = Object.keys(conditions)
    .map((key, index) => `${key} = $${index + 1}`)
    .join(' AND ');

  const values = Object.values(conditions);
  const query = `SELECT * FROM ${table} WHERE ${whereClause} LIMIT 1`;

  const result = await db.query<T>(query, values);
  return result.rows[0] || null;
}

export async function findMany<T extends QueryResultRow>(
  table: string,
  conditions: Record<string, unknown> = {},
  options: {
    orderBy?: string;
    limit?: number;
    offset?: number;
  } = {}
): Promise<T[]> {
  let query = `SELECT * FROM ${table}`;
  const values: unknown[] = [];

  if (Object.keys(conditions).length > 0) {
    const whereClause = Object.keys(conditions)
      .map((key, index) => `${key} = $${index + 1}`)
      .join(' AND ');
    query += ` WHERE ${whereClause}`;
    values.push(...Object.values(conditions));
  }

  if (options.orderBy) {
    query += ` ORDER BY ${options.orderBy}`;
  }

  if (options.limit) {
    query += ` LIMIT $${values.length + 1}`;
    values.push(options.limit);
  }

  if (options.offset) {
    query += ` OFFSET $${values.length + 1}`;
    values.push(options.offset);
  }

  const result = await db.query<T>(query, values);
  return result.rows;
}

export async function insertOne<T extends QueryResultRow>(
  table: string,
  data: Record<string, unknown>
): Promise<T> {
  const columns = Object.keys(data).join(', ');
  const placeholders = Object.keys(data)
    .map((_, index) => `$${index + 1}`)
    .join(', ');
  const values = Object.values(data);

  const query = `
    INSERT INTO ${table} (${columns}) 
    VALUES (${placeholders}) 
    RETURNING *
  `;

  const result = await db.query<T>(query, values);
  if (!result.rows[0]) {
    throw new Error(`Failed to insert into ${table}`);
  }
  return result.rows[0];
}

export async function updateOne<T extends QueryResultRow>(
  table: string,
  conditions: Record<string, unknown>,
  updates: Record<string, unknown>
): Promise<T | null> {
  const setClause = Object.keys(updates)
    .map((key, index) => `${key} = $${index + 1}`)
    .join(', ');

  const whereClause = Object.keys(conditions)
    .map((key, index) => `${key} = $${Object.keys(updates).length + index + 1}`)
    .join(' AND ');

  const values = [...Object.values(updates), ...Object.values(conditions)];

  const query = `
    UPDATE ${table} 
    SET ${setClause}, updated_at = NOW()
    WHERE ${whereClause}
    RETURNING *
  `;

  const result = await db.query<T>(query, values);
  return result.rows[0] || null;
}

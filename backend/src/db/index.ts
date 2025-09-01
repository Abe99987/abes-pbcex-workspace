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

  private getSSLConfig() {
    const databaseSSL = process.env.DATABASE_SSL === 'true';
    const databaseSSLRejectUnauthorized =
      process.env.DATABASE_SSL_REJECT_UNAUTHORIZED === 'true';
    const isProduction = process.env.NODE_ENV === 'production';

    // Default behavior: SSL disabled in dev/test unless explicitly enabled
    if (!databaseSSL) {
      return false;
    }

    // Production: default to secure SSL unless explicitly disabled
    if (isProduction) {
      return {
        rejectUnauthorized: databaseSSLRejectUnauthorized !== false,
      };
    }

    // Development: allow insecure SSL for local development
    return {
      rejectUnauthorized: databaseSSLRejectUnauthorized || false,
    };
  }

  private initialize() {
    const databaseUrl = process.env.DATABASE_URL || process.env.DIRECT_URL;

    if (!databaseUrl || databaseUrl.includes('[YOUR-PASSWORD]')) {
      logWarn('Database not configured, using in-memory storage');
      return;
    }

    try {
      // Configure SSL based on environment
      const sslConfig = this.getSSLConfig();

      this.pool = new Pool({
        connectionString: databaseUrl,
        ssl: sslConfig,
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

// Identifier sanitization to prevent SQL injection
const safe = (id: string): string => {
  if (!/^[a-z_][a-z0-9_]*$/i.test(id)) {
    throw new Error(`Invalid identifier: ${id}`);
  }
  return id;
};

const safeOrderBy = (orderBy: string): string => {
  const [col, dir] = String(orderBy).split(/\s+/);
  const safeCol = safe(col);
  const safeDir = /^(ASC|DESC)$/i.test(dir || '') ? dir.toUpperCase() : 'ASC';
  return `${safeCol} ${safeDir}`;
};

// Helper functions for common operations
export async function findOne<T extends QueryResultRow>(
  table: string,
  conditions: Record<string, unknown>
): Promise<T | null> {
  const safeTable = safe(table);
  const whereClause = Object.keys(conditions)
    .map((key, index) => `${safe(key)} = $${index + 1}`)
    .join(' AND ');

  const values = Object.values(conditions);
  const query = `SELECT * FROM ${safeTable} WHERE ${whereClause} LIMIT 1`;

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
  const safeTable = safe(table);
  let query = `SELECT * FROM ${safeTable}`;
  const values: unknown[] = [];

  if (Object.keys(conditions).length > 0) {
    const whereClause = Object.keys(conditions)
      .map((key, index) => `${safe(key)} = $${index + 1}`)
      .join(' AND ');
    query += ` WHERE ${whereClause}`;
    values.push(...Object.values(conditions));
  }

  if (options.orderBy) {
    query += ` ORDER BY ${safeOrderBy(options.orderBy)}`;
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
  const safeTable = safe(table);
  const columns = Object.keys(data).map(safe).join(', ');
  const placeholders = Object.keys(data)
    .map((_, index) => `$${index + 1}`)
    .join(', ');
  const values = Object.values(data);

  const query = `
    INSERT INTO ${safeTable} (${columns}) 
    VALUES (${placeholders}) 
    RETURNING *
  `;

  const result = await db.query<T>(query, values);
  if (!result.rows[0]) {
    throw new Error(`Failed to insert into ${safeTable}`);
  }
  return result.rows[0];
}

export async function updateOne<T extends QueryResultRow>(
  table: string,
  conditions: Record<string, unknown>,
  updates: Record<string, unknown>
): Promise<T | null> {
  const safeTable = safe(table);
  const setClause = Object.keys(updates)
    .map((key, index) => `${safe(key)} = $${index + 1}`)
    .join(', ');

  const whereClause = Object.keys(conditions)
    .map(
      (key, index) =>
        `${safe(key)} = $${Object.keys(updates).length + index + 1}`
    )
    .join(' AND ');

  const values = [...Object.values(updates), ...Object.values(conditions)];

  const query = `
    UPDATE ${safeTable} 
    SET ${setClause}, updated_at = NOW()
    WHERE ${whereClause}
    RETURNING *
  `;

  const result = await db.query<T>(query, values);
  return result.rows[0] || null;
}

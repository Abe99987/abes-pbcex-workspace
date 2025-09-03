import { db } from './index';
import fs from 'fs';
import path from 'path';
import { logInfo, logError } from '@/utils/logger';

/**
 * Admin Terminal Database Migration Runner
 * Handles admin-specific table creation and RLS policies
 */
export class AdminMigrationRunner {
  private static async runMigration(filePath: string): Promise<boolean> {
    try {
      const sql = fs.readFileSync(filePath, 'utf8');
      await db.query(sql);
      logInfo(`Migration completed: ${path.basename(filePath)}`);
      return true;
    } catch (error) {
      logError(`Migration failed: ${path.basename(filePath)}`, error as Error);
      return false;
    }
  }

  static async runAdminMigrations(): Promise<boolean> {
    try {
      const migrationsDir = path.join(__dirname, 'migrations');
      const adminMigrationFile = path.join(migrationsDir, '005_admin_terminal_tables.sql');
      
      if (!fs.existsSync(adminMigrationFile)) {
        logError('Admin migration file not found');
        return false;
      }

      logInfo('Running admin terminal migrations...');
      const success = await this.runMigration(adminMigrationFile);
      
      if (success) {
        logInfo('✅ Admin terminal migrations completed successfully');
      }
      
      return success;
    } catch (error) {
      logError('Admin migration runner failed', error as Error);
      return false;
    }
  }

  static async verifyAdminTables(): Promise<boolean> {
    try {
      const tables = [
        'admin_audit_log',
        'admin_approval_requests', 
        'admin_sessions',
        'admin_config'
      ];

      for (const table of tables) {
        const result = await db.query(
          `SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = $1)`,
          [table]
        );
        
        if (!result.rows[0]?.exists) {
          logError(`Admin table missing: ${table}`);
          return false;
        }
      }

      logInfo('✅ All admin tables verified');
      return true;
    } catch (error) {
      logError('Admin table verification failed', error as Error);
      return false;
    }
  }
}

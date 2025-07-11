import { Pool, PoolClient } from 'pg';

/**
 * Database connection class
 */
class Database {
  private pool: Pool;
  private static instance: Database;

  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });

    // Test database connection
    this.pool.query('SELECT NOW()', (err, res) => {
      if (err) {
        console.error('Error connecting to the database:', err);
      } else {
        console.log('Database connected:', res.rows[0].now);
      }
    });
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  /**
   * Execute a query with parameters
   */
  public async query(text: string, params?: any[]): Promise<any> {
    try {
      const result = await this.pool.query(text, params);
      return result;
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }
  }

  /**
   * Get a client from the pool
   */
  public async getClient(): Promise<PoolClient> {
    const client = await this.pool.connect();
    return client;
  }
}

// Export singleton instance
export const db = Database.getInstance();
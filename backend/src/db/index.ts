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
    // Parse the connection string to ensure password is a string
    const connectionString = process.env.DATABASE_URL;
    let config: any = {};

    if (connectionString) {
      try {
        const url = new URL(connectionString);
        const userPass = url.username && url.password ? `${url.username}:${url.password}` : '';

        config = {
          user: url.username,
          password: url.password ? String(url.password) : '', // Ensure password is a string
          host: url.hostname,
          port: url.port ? parseInt(url.port, 10) : 5432,
          database: url.pathname.split('/')[1],
          ssl: url.searchParams.get('sslmode') === 'require' ? true : false
        };
      } catch (error) {
        console.error('Error parsing DATABASE_URL:', error);
        // Fallback to using connectionString directly
        config = { connectionString };
      }
    } else {
      console.error('DATABASE_URL environment variable is not set');
    }

    this.pool = new Pool(config);

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

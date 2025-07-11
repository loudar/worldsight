import pg from 'pg';
import {PointData} from './models/types';

/**
 * Database connection and operations class
 */
export class Database {
    private pool: pg.Pool;

    /**
     * Create a new Database instance
     * @param connectionString PostgreSQL connection string
     */
    constructor(connectionString: string) {
        this.pool = new pg.Pool({
            connectionString,
        });
    }

    /**
     * Connect to the database
     */
    async connect(): Promise<void> {
        try {
            await this.pool.connect();
            console.log('Connected to the database successfully');
        } catch (error) {
            console.error('Error connecting to the database:', error);
            throw error;
        }
    }

    /**
     * Close the database connection
     */
    async close(): Promise<void> {
        await this.pool.end();
        console.log('Database connection closed');
    }

    async locationExists(name: string) {
        const client = await this.pool.connect();

        try {
            const result = await client.query(
                'SELECT id FROM climate_data WHERE location_name = $1',
                [name]
            );

            return result.rows.length > 0;
        } catch (error) {
            await client.query('ROLLBACK');
            console.error(`Error inserting/updating climate data for ${pointData.name}:`, error);
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Insert or update climate data in the database
     * @param pointData The point data to insert or update
     */
    async insertOrUpdateClimateData(pointData: PointData): Promise<void> {
        const client = await this.pool.connect();

        try {
            await client.query('BEGIN');

            // Check if the city already exists
            const checkResult = await client.query(
                'SELECT id FROM climate_data WHERE location_name = $1',
                [pointData.name]
            );

            if (checkResult.rows.length > 0) {
                // Update existing record
                await client.query(
                    `
                        UPDATE climate_data
                        SET location        = ST_GeographyFromText($1),
                            temperature     = $2,
                            precipitation   = $3,
                            climate_type    = $4,
                            additional_data = $5,
                            updated_at      = CURRENT_TIMESTAMP
                        WHERE id = $6
                    `,
                    [
                        `POINT(${pointData.lon} ${pointData.lat})`,
                        pointData.temperature,
                        pointData.precipitation,
                        pointData.climate_type,
                        JSON.stringify(pointData.additional_data),
                        checkResult.rows[0].id
                    ]
                );
                console.log(`Updated climate data for ${pointData.name}`);
            } else {
                // Insert new record
                await client.query(
                    `
                        INSERT INTO climate_data (location_name, location, temperature, precipitation,
                                                  climate_type, additional_data)
                        VALUES ($1, ST_GeographyFromText($2), $3, $4, $5, $6)
                    `,
                    [
                        pointData.name,
                        `POINT(${pointData.lon} ${pointData.lat})`,
                        pointData.temperature,
                        pointData.precipitation,
                        pointData.climate_type,
                        JSON.stringify(pointData.additional_data)
                    ]
                );
                console.log(`Inserted climate data for ${pointData.name}`);
            }

            await client.query('COMMIT');
        } catch (error) {
            await client.query('ROLLBACK');
            console.error(`Error inserting/updating climate data for ${pointData.name}:`, error);
            throw error;
        } finally {
            client.release();
        }
    }
}
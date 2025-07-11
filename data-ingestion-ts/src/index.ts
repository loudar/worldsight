import {config} from 'dotenv';
import {Database} from './database';
import {ClimateService} from './climateService';
import {generateEarthGrid, generateReducedGrid} from './gridGenerator';
import {GridPoint, PointData} from './models/types';

// Load environment variables
config();

// Database connection parameters
const DB_URL = process.env.DATABASE_URL;

if (!DB_URL) {
    console.error('DATABASE_URL environment variable is not set');
    process.exit(1);
}

// Generate a grid of points covering the Earth with 5km precision
// For testing, we use a reduced grid with a maximum of 1000 points
// In production, you would use the full grid with generateEarthGrid(5)
//const GRID_POINTS = generateReducedGrid(5, 1000);
const GRID_POINTS = generateEarthGrid(5);

async function addDataForPoint(climateService: ClimateService, point: GridPoint, db: Database) {
    const climateData = await climateService.fetchNasaData(point.lat, point.lon);

    if (climateData) {
        const climateType = climateService.determineClimateType(
            climateData.temperature,
            climateData.precipitation
        );

        const additionalData = await climateService.fetchAdditionalData(point);

        const pointData: PointData = {
            name: point.name,
            lat: point.lat,
            lon: point.lon,
            temperature: climateData.temperature,
            precipitation: climateData.precipitation,
            climate_type: climateType,
            additional_data: additionalData
        };

        await db.insertOrUpdateClimateData(pointData);
    } else {
        console.warn(`No climate data available for ${point.name}`);
    }
}

/**
 * Main function to ingest climate data
 */
async function main() {
    console.log('Starting climate data ingestion');
    console.log(`Processing ${GRID_POINTS.length} grid points with 5km precision`);

    const db = new Database(DB_URL!);
    const climateService = new ClimateService();

    try {
        await db.connect();

        for (let i = 0; i < GRID_POINTS.length; i++){
            const point = GRID_POINTS[i];
            console.log(`\t${i + 1}\t/\t${GRID_POINTS.length}\tProcessing data for ${point.name}`);

            if (await db.locationExists(point.name)) {
                continue;
            }
            await addDataForPoint(climateService, point, db);
        }

        await db.close();
        console.log('Climate data ingestion completed successfully');
    } catch (error) {
        console.error('Error in climate data ingestion:', error);
        process.exit(1);
    }
}

// Run once immediately
main();

// Then run periodically (e.g., once a day)
//setInterval(main, 24 * 60 * 60 * 1000);
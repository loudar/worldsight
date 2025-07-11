import { config } from 'dotenv';
import { Database } from './database';
import { ClimateService } from './climateService';
import { generateReducedGrid } from './gridGenerator';
import { PointData } from './models/types';

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
const GRID_POINTS = generateReducedGrid(5, 1000);

/**
 * Main function to ingest climate data
 */
async function main() {
  console.log('Starting climate data ingestion');
  console.log(`Processing ${GRID_POINTS.length} grid points with 5km precision`);

  const db = new Database(DB_URL);
  const climateService = new ClimateService();

  try {
    await db.connect();

    for (const point of GRID_POINTS) {
      console.log(`Processing data for ${point.name}`);

      // Fetch climate data from NASA
      const climateData = await climateService.fetchNasaData(point.lat, point.lon);

      if (climateData) {
        // Determine climate type
        const climateType = climateService.determineClimateType(
          climateData.temperature,
          climateData.precipitation
        );

        // Fetch additional data
        const additionalData = await climateService.fetchAdditionalData(point);

        // Prepare point data for database
        const pointData: PointData = {
          name: point.name,
          lat: point.lat,
          lon: point.lon,
          temperature: climateData.temperature,
          precipitation: climateData.precipitation,
          climate_type: climateType,
          additional_data: additionalData
        };

        // Insert or update in database
        await db.insertOrUpdateClimateData(pointData);
      } else {
        console.warn(`No climate data available for ${point.name}`);
      }
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
setInterval(main, 24 * 60 * 60 * 1000);
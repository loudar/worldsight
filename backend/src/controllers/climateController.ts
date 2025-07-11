import { Request, Response } from 'express';
import { db } from '../db';
import { ClimateData, LocationDetails } from '../types';

// Constants for pagination and grid filtering
const DEFAULT_PAGE_SIZE = 100;
const MAX_PAGE_SIZE = 1000;

/**
 * Climate data controller class
 */
export class ClimateController {
  /**
   * Get climate data with pagination and optional filtering
   */
  public static async getAllClimateData(req: Request, res: Response): Promise<void> {
    try {
      // Parse pagination parameters
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = Math.min(
        parseInt(req.query.pageSize as string) || DEFAULT_PAGE_SIZE,
        MAX_PAGE_SIZE
      );
      const offset = (page - 1) * pageSize;

      // Parse filtering parameters
      const minLat = parseFloat(req.query.minLat as string);
      const maxLat = parseFloat(req.query.maxLat as string);
      const minLon = parseFloat(req.query.minLon as string);
      const maxLon = parseFloat(req.query.maxLon as string);

      // Build the WHERE clause for filtering
      let whereClause = '';
      const params: any[] = [];

      if (!isNaN(minLat) && !isNaN(maxLat) && !isNaN(minLon) && !isNaN(maxLon)) {
        // Create a bounding box for filtering
        whereClause = `
          WHERE ST_Intersects(
            location,
            ST_MakeEnvelope($1, $2, $3, $4, 4326)::geography
          )
        `;
        params.push(minLon, minLat, maxLon, maxLat);
      }

      // Count total matching records
      const countResult = await db.query(`
        SELECT COUNT(*) as total
        FROM climate_data
        ${whereClause}
      `, params);

      const total = parseInt(countResult.rows[0].total);
      const totalPages = Math.ceil(total / pageSize);

      // Add pagination parameters
      params.push(pageSize, offset);

      // Query to get climate data from the database with pagination and filtering
      const result = await db.query(`
        SELECT 
          id, 
          location_name, 
          ST_AsGeoJSON(location)::json as geometry, 
          temperature, 
          precipitation, 
          climate_type
        FROM climate_data
        ${whereClause}
        ORDER BY id
        LIMIT $${params.length - 1} OFFSET $${params.length}
      `, params);

      // Return data with pagination metadata
      res.json({
        data: result.rows as ClimateData[],
        pagination: {
          page,
          pageSize,
          totalPages,
          total
        }
      });
    } catch (error) {
      console.error('Error fetching climate data:', error);
      res.status(500).json({ error: 'Failed to fetch climate data' });
    }
  }

  /**
   * Get location details by ID
   */
  public static async getLocationById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Query to get location details
      const result = await db.query(`
        SELECT 
          id, 
          location_name, 
          ST_AsGeoJSON(location)::json as geometry, 
          temperature, 
          precipitation, 
          climate_type,
          additional_data
        FROM climate_data
        WHERE id = $1
      `, [id]);

      if (result.rows.length === 0) {
        res.status(404).json({ error: 'Location not found' });
        return;
      }

      res.json(result.rows[0] as LocationDetails);
    } catch (error) {
      console.error('Error fetching location details:', error);
      res.status(500).json({ error: 'Failed to fetch location details' });
    }
  }

  /**
   * Get climate data for a specific point (nearest to the given coordinates)
   */
  public static async getClimateDataByCoordinates(req: Request, res: Response): Promise<void> {
    try {
      const lat = parseFloat(req.query.lat as string);
      const lon = parseFloat(req.query.lon as string);

      if (isNaN(lat) || isNaN(lon)) {
        res.status(400).json({ error: 'Invalid coordinates. Please provide valid lat and lon parameters.' });
        return;
      }

      // Query to get the nearest climate data point
      const result = await db.query(`
        SELECT 
          id, 
          location_name, 
          ST_AsGeoJSON(location)::json as geometry, 
          temperature, 
          precipitation, 
          climate_type,
          additional_data,
          ST_Distance(
            location, 
            ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
          ) as distance
        FROM climate_data
        ORDER BY distance
        LIMIT 1
      `, [lon, lat]);

      if (result.rows.length === 0) {
        res.status(404).json({ error: 'No climate data found near the specified coordinates.' });
        return;
      }

      res.json(result.rows[0] as LocationDetails);
    } catch (error) {
      console.error('Error fetching climate data by coordinates:', error);
      res.status(500).json({ error: 'Failed to fetch climate data by coordinates' });
    }
  }
}

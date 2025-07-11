import { Request, Response } from 'express';
import { db } from '../db';
import { ClimateData, LocationDetails } from '../types';

/**
 * Climate data controller class
 */
export class ClimateController {
  /**
   * Get all climate data
   */
  public static async getAllClimateData(req: Request, res: Response): Promise<void> {
    try {
      // Query to get climate data from the database
      const result = await db.query(`
        SELECT 
          id, 
          location_name, 
          ST_AsGeoJSON(location)::json as geometry, 
          temperature, 
          precipitation, 
          climate_type
        FROM climate_data
      `);
      
      res.json(result.rows as ClimateData[]);
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
}
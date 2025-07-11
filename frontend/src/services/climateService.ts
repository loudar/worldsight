import axios from 'axios';
import { ClimateData, LocationDetails } from '../types';

/**
 * Climate data service class
 */
export class ClimateService {
  private static apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  /**
   * Get all climate data
   */
  public static async getClimateData(): Promise<ClimateData[]> {
    try {
      const response = await axios.get(`${this.apiUrl}/climate-data`);
      return response.data;
    } catch (error) {
      console.error('Error fetching climate data:', error);
      throw error;
    }
  }

  /**
   * Get location details by ID
   */
  public static async getLocationById(id: number): Promise<LocationDetails> {
    try {
      const response = await axios.get(`${this.apiUrl}/locations/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching location details:', error);
      throw error;
    }
  }
}
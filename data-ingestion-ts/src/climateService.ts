import axios from 'axios';
import { ClimateData, NasaApiResponse, AdditionalData, GridPoint } from './models/types';

/**
 * Service for fetching and processing climate data
 */
export class ClimateService {
  /**
   * Fetch climate data from NASA's POWER API
   * @param lat Latitude
   * @param lon Longitude
   * @returns Climate data or null if fetching fails
   */
  async fetchNasaData(lat: number, lon: number): Promise<ClimateData | null> {
    try {
      const url = `https://power.larc.nasa.gov/api/temporal/daily/point?parameters=T2M,PRECTOTCORR,RH2M&community=RE&longitude=${lon}&latitude=${lat}&start=20200101&end=20201231&format=JSON`;
      const response = await axios.get<NasaApiResponse>(url);
      
      // Extract average temperature and precipitation
      if (response.data.properties && response.data.properties.parameter) {
        const params = response.data.properties.parameter;
        const tempData = params.T2M || {};
        const precipData = params.PRECTOTCORR || {};
        
        // Calculate averages
        const tempValues = Object.values(tempData).filter(v => typeof v === 'number') as number[];
        const precipValues = Object.values(precipData).filter(v => typeof v === 'number') as number[];
        
        const avgTemp = tempValues.length > 0 ? tempValues.reduce((a, b) => a + b, 0) / tempValues.length : null;
        const avgPrecip = precipValues.length > 0 ? precipValues.reduce((a, b) => a + b, 0) * 365 : null; // Annual precipitation
        
        return {
          temperature: avgTemp,
          precipitation: avgPrecip
        };
      }
      return null;
    } catch (error) {
      console.error(`Error fetching NASA data for coordinates (${lat}, ${lon}):`, error);
      return null;
    }
  }
  
  /**
   * Determine the climate type based on temperature and precipitation
   * @param temp Temperature in Celsius
   * @param precip Precipitation in mm
   * @returns Climate type string
   */
  determineClimateType(temp: number | null, precip: number | null): string {
    if (temp === null || precip === null) {
      return "Unknown";
    }
    
    if (temp > 18) {
      if (precip < 500) {
        return "Hot desert";
      } else if (precip < 1000) {
        return "Tropical savanna";
      } else {
        return "Tropical rainforest";
      }
    } else if (temp > 10) {
      if (precip < 500) {
        return "Semi-arid";
      } else if (precip < 1000) {
        return "Mediterranean";
      } else {
        return "Humid subtropical";
      }
    } else {
      if (precip < 500) {
        return "Cold desert";
      } else if (precip < 1000) {
        return "Continental";
      } else {
        return "Oceanic";
      }
    }
  }
  
  /**
   * Fetch additional data about a location
   * @param point Grid point
   * @returns Additional data
   */
  async fetchAdditionalData(point: GridPoint): Promise<AdditionalData> {
    try {
      // In the original Python code, this was a placeholder
      // In a real implementation, this would fetch data from an API
      return {
        population: 0,
        elevation: 0
      };
    } catch (error) {
      console.error(`Error fetching additional data for ${point.name}:`, error);
      return {
        population: 0,
        elevation: 0
      };
    }
  }
}
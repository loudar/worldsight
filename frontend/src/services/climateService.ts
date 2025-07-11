import axios from 'axios';
import {ClimateData, LocationDetails, PaginatedResponse} from '../types';

/**
 * Climate data service class
 */
export class ClimateService {
    private static apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

    /**
     * Get climate data with pagination and optional filtering
     */
    public static async getClimateData(
        page: number = 1,
        pageSize: number = 100,
        bounds?: { minLat: number; maxLat: number; minLon: number; maxLon: number }
    ): Promise<ClimateData[] | null> {
        try {
            let url = `${this.apiUrl}/climate-data?page=${page}&pageSize=${pageSize}`;

            // Add bounding box parameters if provided
            if (bounds) {
                url += `&minLat=${bounds.minLat}&maxLat=${bounds.maxLat}&minLon=${bounds.minLon}&maxLon=${bounds.maxLon}`;
            }

            const response = await axios.get(url);
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

    /**
     * Get climate data for specific coordinates
     */
    public static async getClimateDataByCoordinates(lat: number, lon: number): Promise<LocationDetails> {
        try {
            const response = await axios.get(`${this.apiUrl}/climate-data/coordinates?lat=${lat}&lon=${lon}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching climate data by coordinates:', error);
            throw error;
        }
    }
}

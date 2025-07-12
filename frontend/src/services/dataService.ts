import axios from 'axios';
import {LocationResponse} from "../types/responses";

/**
 * Climate data service class
 */
export class DataService {
    private static apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

    /**
     * Get climate data for specific coordinates
     */
    public static async getDataByLatLon(lat: number, lon: number): Promise<LocationResponse> {
        try {
            const response = await axios.get(`${this.apiUrl}/data?lat=${lat}&lon=${lon}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching climate data by coordinates:', error);
            throw error;
        }
    }
}

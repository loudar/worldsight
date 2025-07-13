import axios from 'axios';

export class WeatherService {
    private readonly apiKey: string;
    private readonly baseUrl = "https://api.openweathermap.org/";

    /**
     * Constructor
     * @param apiKey - OpenWeatherMap API key
     */
    constructor(apiKey: string = process.env.WEATHER_API_KEY || '') {
        this.apiKey = apiKey;
        if (!this.apiKey) {
            console.warn('NewsService initialized without API key. Set WEATHER_API_KEY environment variable.');
        }
    }

    /**
     * Get news articles about a location
     * @returns Promise with news articles
     */
    async getWeather(lat: number, lon: number): Promise<null> {
        if (!this.apiKey) {
            console.warn('No OpenWeatherMap key provided. Returning empty response.');
            return null;
        }

        try {
            const response = await axios.get(`${this.baseUrl}data/3.0/onecall/day_summary`, {
                params: {
                    lat,
                    lon,
                    appid: this.apiKey,
                },
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.data) {
                return response.data;
            }

            return null;
        } catch (error) {
            console.error(`Failed to fetch weather for ${lat} / ${lon}:`, error);
            return null;
        }
    }
}


import {Request, Response} from 'express';
import {OSMGeocoder, OSMReverseGeocodeResponse} from "../OSMGeocoder";
import {LocationResponse} from "../types/responses";
import {WikipediaService} from "../services/WikipediaService";
import {NewsService} from "../services/NewsService";
import {WeatherService} from "../services/WeatherService";

function getSearchName(geocode: OSMReverseGeocodeResponse) {
    return `${geocode.address.city}, ${geocode.address.country}`;
}

const geocoder = new OSMGeocoder();
const newsService = new NewsService();
const weatherService = new WeatherService();

export class DataController {
    public static async getDataByLatLon(req: Request, res: Response) {
        const lat = parseFloat(req.query.lat as string);
        const lon = parseFloat(req.query.lon as string);

        if (isNaN(lat) || isNaN(lon)) {
            res.status(400).json({error: 'Invalid coordinates. Please provide valid lat and lon parameters.'});
            return;
        }

        try {
            const geocode = await geocoder.reverseGeocode({lat, lon});
            if (!geocode || !geocode.address) {
                res.status(400).json({error: 'Invalid coordinates. Please provide valid coordinates.'});
                return;
            }

            const locationName = getSearchName(geocode);

            const tasks: Promise<any>[] = [
                newsService.getNewsByLocation(locationName),
                WikipediaService.getEventsByLocation(lat, lon),
                weatherService.getWeather(lat, lon),
            ];

            const values = await Promise.all(tasks);

            const response: LocationResponse = {
                location: {
                    name: geocode.display_name,
                    coordinates: {
                        lat: geocode.lat,
                        lon: geocode.lon
                    },
                    address: geocode.address
                },
                news: values[0] || [],
                historicData: values[1] || null,
                weather: values[2] || null
            };

            res.json(response);
        } catch (error) {
            console.error('Error fetching location data:', error);
            res.status(500).json({
                error: 'Failed to fetch location data',
                message: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
}

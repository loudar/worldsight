import {Request, Response} from 'express';
import {OSMGeocoder, OSMReverseGeocodeResponse} from "../OSMGeocoder";
import {LocationResponse} from "../types/responses";
import {WikipediaService} from "../services/WikipediaService";
import {HistoricData} from "../types/HistoricData";
import {NewsArticle} from "../types/NewsArticle";

function getSearchName(geocode: OSMReverseGeocodeResponse) {
    return `${geocode.address.city}, ${geocode.address.country}`;
}

export class DataController {
    public static async getDataByLatLon(req: Request, res: Response) {
        const lat = parseFloat(req.query.lat as string);
        const lon = parseFloat(req.query.lon as string);

        if (isNaN(lat) || isNaN(lon)) {
            res.status(400).json({error: 'Invalid coordinates. Please provide valid lat and lon parameters.'});
            return;
        }

        try {
            // Get location information
            const geocoder = new OSMGeocoder();
            const geocode = await geocoder.reverseGeocode({lat, lon});
            if (!geocode || !geocode.address) {
                res.status(400).json({error: 'Invalid coordinates. Please provide valid coordinates.'});
                return;
            }

            const locationName = getSearchName(geocode);
/*
            const newsService = new NewsService();
            const news = await newsService.getNewsByLocation(locationName);*/
            const news: NewsArticle[] = [];

            const events = await WikipediaService.getEventsByLocation(lat, lon);
            console.log(events);
            const historicData = events.map(e => {
                return <HistoricData>{
                    title: e.title,
                    extract: e.type,
                    url: `https://en.wikipedia.org/?curid=${e.pageid}`
                }
            });

            const response: LocationResponse = {
                location: {
                    name: geocode.display_name,
                    coordinates: {
                        lat: geocode.lat,
                        lon: geocode.lon
                    },
                    address: geocode.address
                },
                news: news || [],
                historicData: historicData || null
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

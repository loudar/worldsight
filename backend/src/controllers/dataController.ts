import {Request, Response} from 'express';
import {db} from '../db';
import {ClimateData, LocationDetails} from '../types';
import {OSMGeocoder} from "../OSMGeocoder";

/**
 * Climate data controller class
 */
export class DataController {
    public static async getDataByLatLon(req: Request, res: Response) {
        const lat = parseFloat(req.query.lat as string);
        const lon = parseFloat(req.query.lon as string);

        if (isNaN(lat) || isNaN(lon)) {
            res.status(400).json({error: 'Invalid coordinates. Please provide valid lat and lon parameters.'});
            return;
        }

        const geocoder = new OSMGeocoder();
        const geocode = await geocoder.reverseGeocode({lat, lon});
        if (!geocode) {
            res.status(400).json({error: 'Invalid coordinates. Please provide valid coordinates.'});
        }

        console.log(geocode.display_name);
    }
}

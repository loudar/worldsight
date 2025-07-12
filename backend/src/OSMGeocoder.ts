export interface OSMReverseGeocodeResponse {
    place_id: number;
    licence: string;
    osm_type: string;
    osm_id: number;
    lat: string;
    lon: string;
    display_name: string;
    address: {
        house_number?: string;
        road?: string;
        suburb?: string;
        city?: string;
        town?: string;
        village?: string;
        county?: string;
        state?: string;
        country?: string;
        postcode?: string;
        country_code?: string;
    };
    boundingbox: string[];
}

export interface ReverseGeocodeParams {
    lat: number;
    lon: number;
    zoom?: number; // Detail level (0-18, default 18)
    format?: 'json' | 'xml'; // Default 'json'
    addressdetails?: 0 | 1; // Include address breakdown (default 1)
    extratags?: 0 | 1; // Include extra tags (default 0)
    namedetails?: 0 | 1; // Include name details (default 0)
}

export class OSMGeocoder {
    private readonly baseUrl = 'https://nominatim.openstreetmap.org/reverse';
    private readonly userAgent = 'Worldsight/1.0';

    /**
     * Reverse geocode coordinates to get the closest city/village name
     * @param params - Geocoding parameters
     * @returns Promise with location data
     */
    async reverseGeocode(params: ReverseGeocodeParams): Promise<OSMReverseGeocodeResponse> {
        const {
            lat,
            lon,
            zoom = 18,
            format = 'json',
            addressdetails = 1,
            extratags = 0,
            namedetails = 0
        } = params;

        const url = new URL(this.baseUrl);
        url.searchParams.append('lat', lat.toString());
        url.searchParams.append('lon', lon.toString());
        url.searchParams.append('zoom', zoom.toString());
        url.searchParams.append('format', format);
        url.searchParams.append('addressdetails', addressdetails.toString());
        url.searchParams.append('extratags', extratags.toString());
        url.searchParams.append('namedetails', namedetails.toString());

        try {
            const response = await fetch(url.toString(), {
                headers: {
                    'User-Agent': this.userAgent,
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (!data || Object.keys(data).length === 0) {
                throw new Error('No results found for the given coordinates');
            }

            return data;
        } catch (error) {
            throw new Error(`Reverse geocoding failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Get the closest city/village name from coordinates
     * @param lat - Latitude
     * @param lon - Longitude
     * @returns Promise with the closest settlement name
     */
    async getClosestCity(lat: number, lon: number): Promise<string> {
        try {
            const result = await this.reverseGeocode({lat, lon});

            // Try to extract the most relevant settlement name
            const address = result.address;
            return address.city ||
                address.town ||
                address.village ||
                address.suburb ||
                'Unknown location';
        } catch (error) {
            throw new Error(`Failed to get closest city: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Rate limiting helper - add delay between requests
     * OSM Nominatim has a usage policy of max 1 request per second
     */
    private async delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Batch reverse geocode multiple coordinates with rate limiting
     * @param coordinates - Array of {lat, lon} objects
     * @returns Promise with array of results
     */
    async batchReverseGeocode(coordinates: Array<{ lat: number, lon: number }>): Promise<string[]> {
        const results: string[] = [];

        for (const coord of coordinates) {
            try {
                const city = await this.getClosestCity(coord.lat, coord.lon);
                results.push(city);

                // Rate limiting: wait 1 second between requests
                if (coordinates.indexOf(coord) < coordinates.length - 1) {
                    await this.delay(1000);
                }
            } catch (error) {
                console.error(`Failed to geocode ${coord.lat}, ${coord.lon}:`, error);
                results.push('Unknown location');
            }
        }

        return results;
    }
}

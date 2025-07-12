import wiki from "wikipedia";
export class WikipediaService {
    static async getEventsByLocation(latitude: number, longitude: number) {
        return wiki.geoSearch(latitude, longitude);
    }
}
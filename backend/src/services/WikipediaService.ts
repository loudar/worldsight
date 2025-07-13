import wiki from "wikipedia";
import {HistoricData} from "../types/HistoricData";

export class WikipediaService {
    static async getEventsByLocation(latitude: number, longitude: number) {
        const search = await wiki.geoSearch(latitude, longitude, {
            radius: 10000
        });

        return search.map(e => {
            return <HistoricData>{
                title: e.title,
                extract: e.type,
                url: `https://en.wikipedia.org/?curid=${e.pageid}`
            }
        });
    }
}

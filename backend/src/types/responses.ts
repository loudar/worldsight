import {HistoricData} from "./HistoricData";
import {NewsArticle} from "./NewsArticle";

export interface LocationResponse {
    location: {
        name: string;
        coordinates: {
            lat: string;
            lon: string;
        };
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
    };
    news: NewsArticle[];
    historicData: HistoricData[] | null;
}
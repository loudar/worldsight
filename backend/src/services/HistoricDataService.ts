import axios from 'axios';
import {HistoricData} from "../types/HistoricData";

export class HistoricDataService {
    private readonly baseUrl = 'https://en.wikipedia.org/api/rest_v1/page/summary/';
    private readonly searchUrl = 'https://en.wikipedia.org/w/api.php';

    /**
     * Get historic data about a location
     * @param location - Location name to search for
     * @returns Promise with historic data
     */
    async getHistoricData(location: string): Promise<HistoricData | null> {
        try {
            // First, search for the location to get the exact page title
            const searchResponse = await axios.get(this.searchUrl, {
                params: {
                    action: 'query',
                    list: 'search',
                    srsearch: `${location} history`,
                    format: 'json',
                    origin: '*'
                }
            });

            if (!searchResponse.data?.query?.search?.length) {
                // Try again with just the location name
                const fallbackResponse = await axios.get(this.searchUrl, {
                    params: {
                        action: 'query',
                        list: 'search',
                        srsearch: location,
                        format: 'json',
                        origin: '*'
                    }
                });

                if (!fallbackResponse.data?.query?.search?.length) {
                    return null;
                }

                // Use the first result
                const pageTitle = fallbackResponse.data.query.search[0].title;
                return this.getPageSummary(pageTitle);
            }

            // Use the first result
            const pageTitle = searchResponse.data.query.search[0].title;
            return this.getPageSummary(pageTitle);
        } catch (error) {
            console.error(`Failed to fetch historic data for ${location}:`, error);
            return null;
        }
    }

    /**
     * Get page summary from Wikipedia
     * @param pageTitle - Wikipedia page title
     * @returns Promise with historic data
     */
    private async getPageSummary(pageTitle: string): Promise<HistoricData | null> {
        try {
            const response = await axios.get(`${this.baseUrl}${encodeURIComponent(pageTitle)}`, {
                params: {
                    redirect: true
                }
            });

            if (response.data) {
                return {
                    title: response.data.title,
                    extract: response.data.extract,
                    url: response.data.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(pageTitle)}`
                };
            }

            return null;
        } catch (error) {
            console.error(`Failed to fetch Wikipedia summary for ${pageTitle}:`, error);
            return null;
        }
    }
}
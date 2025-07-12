import axios from 'axios';
import {NewsArticle} from "../types/NewsArticle";

export class NewsService {
    private readonly apiKey: string;
    private readonly baseUrl = 'https://newsapi.org/v2/everything';

    /**
     * Constructor
     * @param apiKey - NewsAPI API key
     */
    constructor(apiKey: string = process.env.NEWS_API_KEY || '') {
        this.apiKey = apiKey;
        if (!this.apiKey) {
            console.warn('NewsService initialized without API key. Set NEWS_API_KEY environment variable.');
        }
    }

    /**
     * Get news articles about a location
     * @param location - Location name to search for
     * @param limit - Maximum number of articles to return
     * @returns Promise with news articles
     */
    async getNewsByLocation(location: string, limit: number = 5): Promise<NewsArticle[]> {
        if (!this.apiKey) {
            console.warn('No NewsAPI key provided. Returning empty news array.');
            return [];
        }

        try {
            const response = await axios.get(this.baseUrl, {
                params: {
                    q: location,
                    apiKey: this.apiKey,
                    language: 'en',
                    sortBy: 'publishedAt',
                    pageSize: limit
                },
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.data && response.data.articles) {
                return response.data.articles.map((article: any) => ({
                    title: article.title,
                    description: article.description,
                    url: article.url,
                    source: article.source.name,
                    publishedAt: article.publishedAt,
                    urlToImage: article.urlToImage
                }));
            }

            return [];
        } catch (error) {
            console.error(`Failed to fetch news for ${location}:`, error);
            return [];
        }
    }
}
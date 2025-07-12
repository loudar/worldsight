/**
 * Interface for news article
 */
export interface NewsArticle {
    title: string;
    description: string;
    url: string;
    source: string;
    publishedAt: string;
    urlToImage?: string;
}
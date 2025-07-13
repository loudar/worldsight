import * as THREE from 'three';
import { loadTexture } from '../textureLoader';

/**
 * Class to manage loading and caching of high-resolution texture tiles
 * for Earth visualization.
 */
export class TileTextureManager {
    // Cache of loaded textures by tile key
    private tileCache: Map<string, THREE.Texture> = new Map();
    // Tiles currently being loaded
    private loadingTiles: Set<string> = new Set();
    // Maximum number of tiles to keep in cache
    private maxCachedTiles: number = 100;
    // Base URL for NASA GIBS service
    //https://gibs.earthdata.nasa.gov/wmts/epsg4326/best/BlueMarble_NextGeneration/default/{TileMatrixSet}/{TileMatrix}/{TileRow}/{TileCol}.jpeg
    private baseUrl: string = 'https://gibs.earthdata.nasa.gov/wmts/epsg4326/best';
    // Layer to use (Blue Marble Next Generation with shaded relief and bathymetry)
    private layer: string = 'BlueMarble_NextGeneration';
    // Tile matrix set (resolution levels) - has to be 500m
    private tileMatrixSet: string = '500m';
    // Zoom level (0-8 for this layer, where 8 is highest resolution)
    private zoomLevel: number = 5;
    // Default tile format
    private format: string = 'image/jpeg';
    // Tile size in pixels
    private tileSize: number = 512;
    // Callback for when tiles are loaded
    private onTileLoaded: (() => void) | null = null;

    constructor(options?: {
        maxCachedTiles?: number;
        zoomLevel?: number;
        onTileLoaded?: () => void;
    }) {
        if (options) {
            if (options.maxCachedTiles) this.maxCachedTiles = options.maxCachedTiles;
            if (options.zoomLevel !== undefined) this.zoomLevel = options.zoomLevel;
            if (options.onTileLoaded) this.onTileLoaded = options.onTileLoaded;
        }
    }

    /**
     * Get a texture for the specified latitude and longitude
     * @param lat Latitude in degrees
     * @param lng Longitude in degrees
     * @returns Promise that resolves to a texture or null if loading failed
     */
    public async getTextureForCoordinates(lat: number, lng: number): Promise<THREE.Texture | null> {
        // Convert lat/lng to tile coordinates
        const tileCoords = this.latLngToTileCoords(lat, lng);
        // Generate a unique key for this tile
        const tileKey = `${this.zoomLevel}_${tileCoords.x}_${tileCoords.y}`;

        // Check if we already have this tile in cache
        if (this.tileCache.has(tileKey)) {
            return this.tileCache.get(tileKey) || null;
        }

        // Check if this tile is already being loaded
        if (this.loadingTiles.has(tileKey)) {
            // Wait for the tile to finish loading
            return new Promise((resolve) => {
                const checkInterval = setInterval(() => {
                    if (this.tileCache.has(tileKey)) {
                        clearInterval(checkInterval);
                        resolve(this.tileCache.get(tileKey) || null);
                    }
                }, 100);
            });
        }

        // Mark this tile as loading
        this.loadingTiles.add(tileKey);

        // Construct the URL for this tile
        const url = this.getTileUrl(tileCoords.x, tileCoords.y);

        try {
            // Load the texture
            const texture = await loadTexture(url);

            if (texture) {
                // Add to cache
                this.tileCache.set(tileKey, texture);

                // Manage cache size
                this.pruneCache();

                // Notify that a tile has been loaded
                if (this.onTileLoaded) {
                    this.onTileLoaded();
                }
            }

            // Remove from loading set
            this.loadingTiles.delete(tileKey);

            return texture;
        } catch (error) {
            console.error(`Failed to load tile: ${url}`, error);
            this.loadingTiles.delete(tileKey);
            return null;
        }
    }

    /**
     * Convert latitude and longitude to tile coordinates
     * @param lat Latitude in degrees
     * @param lng Longitude in degrees
     * @returns Tile coordinates {x, y}
     */
    private latLngToTileCoords(lat: number, lng: number): { x: number, y: number } {
        // Ensure longitude is in range [-180, 180]
        lng = ((lng + 180) % 360) - 180;

        // Ensure latitude is in range [-90, 90]
        lat = Math.max(-90, Math.min(90, lat));

        // Calculate the number of tiles at current zoom level
        const numTiles = Math.pow(2, this.zoomLevel);

        // Convert lat/lng to normalized coordinates [0, 1]
        // For EPSG:4326 (plate carrée/equirectangular projection)
        const x = (lng + 180) / 360;
        const y = (90 - lat) / 180;

        // Convert to tile coordinates
        const tileX = Math.floor(x * numTiles);
        const tileY = Math.floor(y * numTiles);

        return { x: tileX, y: tileY };
    }

    /**
     * Get the URL for a specific tile
     * @param x Tile x coordinate
     * @param y Tile y coordinate
     * @returns URL for the tile
     */
    private getTileUrl(x: number, y: number): string {
        // For NASA GIBS, we'll use their WMTS service
        // Example URL: https://gibs.earthdata.nasa.gov/wmts/epsg4326/best/BlueMarble_NextGeneration/default/2012-07-09/EPSG4326_500m/5/7/12.jpg

        // Get current date in YYYY-MM-DD format for the time parameter
        const date = new Date();
        const year = date.getUTCFullYear();
        const month = String(date.getUTCMonth() + 1).padStart(2, '0');
        const day = String(date.getUTCDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;

        return `${this.baseUrl}/${this.layer}/default/${dateStr}/${this.tileMatrixSet}/${this.zoomLevel}/${y}/${x}.${this.format.split('/')[1]}`;
    }

    /**
     * Remove least recently used tiles if cache exceeds maximum size
     */
    private pruneCache(): void {
        if (this.tileCache.size <= this.maxCachedTiles) return;

        // Get the oldest entries (first ones added)
        const tilesToRemove = Array.from(this.tileCache.keys())
            .slice(0, this.tileCache.size - this.maxCachedTiles);

        // Remove them from cache
        tilesToRemove.forEach(key => {
            const texture = this.tileCache.get(key);
            if (texture) {
                texture.dispose();
            }
            this.tileCache.delete(key);
        });
    }

    /**
     * Get the UV coordinates for a specific point within a tile
     * @param lat Latitude in degrees
     * @param lng Longitude in degrees
     * @param tileX Tile x coordinate
     * @param tileY Tile y coordinate
     * @returns UV coordinates within the tile texture
     */
    public getUVForPointInTile(lat: number, lng: number, tileX: number, tileY: number): { u: number, v: number } {
        // Ensure longitude is in range [-180, 180]
        lng = ((lng + 180) % 360) - 180;

        // Ensure latitude is in range [-90, 90]
        lat = Math.max(-90, Math.min(90, lat));

        // Calculate the number of tiles at current zoom level
        const numTiles = Math.pow(2, this.zoomLevel);

        // Convert lat/lng to normalized coordinates [0, 1]
        // For EPSG:4326 (plate carrée/equirectangular projection)
        const x = (lng + 180) / 360;
        const y = (90 - lat) / 180;

        // Calculate position within the tile [0, 1]
        const u = (x * numTiles) - tileX;
        const v = (y * numTiles) - tileY;

        return { u, v };
    }

    /**
     * Get the tile coordinates and UV coordinates for a specific lat/lng
     * @param lat Latitude in degrees
     * @param lng Longitude in degrees
     * @returns Tile coordinates and UV coordinates within the tile
     */
    public getTileInfoForLatLng(lat: number, lng: number): { 
        tileX: number, 
        tileY: number, 
        u: number, 
        v: number 
    } {
        const tileCoords = this.latLngToTileCoords(lat, lng);
        const uv = this.getUVForPointInTile(lat, lng, tileCoords.x, tileCoords.y);

        return {
            tileX: tileCoords.x,
            tileY: tileCoords.y,
            u: uv.u,
            v: uv.v
        };
    }

    /**
     * Clean up resources
     */
    public dispose(): void {
        // Dispose all textures in cache
        this.tileCache.forEach(texture => {
            texture.dispose();
        });

        // Clear the cache
        this.tileCache.clear();
        this.loadingTiles.clear();
    }
}

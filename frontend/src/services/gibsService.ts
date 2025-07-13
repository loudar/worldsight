import * as THREE from 'three';

export interface GIBSTileConfig {
    layer: string;
    format: string;
    tileMatrixSet: string;
    date?: string;
}

export interface LODLevel {
    minDistance: number;
    maxDistance: number;
    tileSize: number;
    matrixLevel: number;
    config: GIBSTileConfig;
}

export class GIBSService {
    private static readonly BASE_URL = 'https://gibs.earthdata.nasa.gov/wmts/epsg4326/best';
    private textureCache = new Map<string, THREE.Texture>();
    private loadingPromises = new Map<string, Promise<THREE.Texture>>();

    private readonly lodLevels: LODLevel[] = [
        {
            minDistance: 0,
            maxDistance: 2,
            tileSize: 256,
            matrixLevel: 5,
            config: {
                layer: 'BlueMarble_NextGeneration',
                format: 'jpg',
                tileMatrixSet: '500m'
            }
        },
        {
            minDistance: 2,
            maxDistance: 5,
            tileSize: 256,
            matrixLevel: 3,
            config: {
                layer: 'BlueMarble_NextGeneration',
                format: 'jpg',
                tileMatrixSet: '500m'
            }
        },
        {
            minDistance: 5,
            maxDistance: 20,
            tileSize: 256,
            matrixLevel: 1,
            config: {
                layer: 'BlueMarble_NextGeneration',
                format: 'jpg',
                tileMatrixSet: '500m'
            }
        }
    ];

    getCurrentLODLevel(cameraDistance: number): LODLevel {
        for (const level of this.lodLevels) {
            if (cameraDistance >= level.minDistance && cameraDistance < level.maxDistance) {
                return level;
            }
        }
        return this.lodLevels[this.lodLevels.length - 1];
    }

    private buildTileURL(config: GIBSTileConfig, z: number, x: number, y: number): string {
        const date = config.date || this.getLatestAvailableDate();
        return `${GIBSService.BASE_URL}/${config.layer}/default/${date}/${config.tileMatrixSet}/${z}/${y}/${x}.${config.format}`;
    }

    private getLatestAvailableDate(): string {
        const today = new Date();
        today.setDate(today.getDate() - 1);
        return today.toISOString().split('T')[0];
    }

    async loadGlobalTexture(lodLevel: LODLevel): Promise<THREE.Texture> {
        const cacheKey = `global_${lodLevel.config.layer}_${lodLevel.matrixLevel}`;
        
        if (this.textureCache.has(cacheKey)) {
            return this.textureCache.get(cacheKey)!;
        }

        if (this.loadingPromises.has(cacheKey)) {
            return this.loadingPromises.get(cacheKey)!;
        }

        const loadPromise = this.createGlobalTexture(lodLevel);
        this.loadingPromises.set(cacheKey, loadPromise);

        try {
            const texture = await loadPromise;
            this.textureCache.set(cacheKey, texture);
            this.loadingPromises.delete(cacheKey);
            return texture;
        } catch (error) {
            this.loadingPromises.delete(cacheKey);
            throw error;
        }
    }

    private async createGlobalTexture(lodLevel: LODLevel): Promise<THREE.Texture> {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        
        const tilesPerRow = Math.pow(2, lodLevel.matrixLevel);
        const tileSize = lodLevel.tileSize;
        
        canvas.width = tilesPerRow * tileSize;
        canvas.height = tilesPerRow * tileSize;

        const tilePromises: Promise<void>[] = [];

        for (let x = 0; x < tilesPerRow; x++) {
            for (let y = 0; y < tilesPerRow; y++) {
                const tilePromise = this.loadAndDrawTile(
                    ctx,
                    lodLevel.config,
                    lodLevel.matrixLevel,
                    x,
                    y,
                    x * tileSize,
                    y * tileSize,
                    tileSize
                );
                tilePromises.push(tilePromise);
            }
        }

        await Promise.allSettled(tilePromises);

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.flipY = false;

        return texture;
    }

    private async loadAndDrawTile(
        ctx: CanvasRenderingContext2D,
        config: GIBSTileConfig,
        z: number,
        x: number,
        y: number,
        canvasX: number,
        canvasY: number,
        size: number
    ): Promise<void> {
        return new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            
            img.onload = () => {
                ctx.drawImage(img, canvasX, canvasY, size, size);
                resolve();
            };
            
            img.onerror = () => {
                console.warn(`Failed to load tile: ${this.buildTileURL(config, z, x, y)}`);
                resolve();
            };
            
            img.src = this.buildTileURL(config, z, x, y);
        });
    }

    clearCache(): void {
        this.textureCache.forEach(texture => texture.dispose());
        this.textureCache.clear();
        this.loadingPromises.clear();
    }
}

export const gibsService = new GIBSService();
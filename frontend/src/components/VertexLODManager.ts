import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { positionToLatLng } from './PositionToLatLng';
import { loadTexture } from '../textureLoader';
import { TileTextureManager } from './TileTextureManager';

/**
 * Class to manage dynamic Level of Detail (LOD) for Earth visualization
 * Provides two resolutions:
 * 1. Base resolution for the entire Earth
 * 2. High-resolution for only the vertices in the center of the view
 */
export class VertexLODManager {
    private scene: THREE.Scene;
    private camera: THREE.PerspectiveCamera;
    private controls: OrbitControls;
    private earthMesh: THREE.Mesh;
    private highResPatches: THREE.Mesh[] = [];
    private lastCameraPosition = new THREE.Vector3();
    private lastCameraTarget = new THREE.Vector3();
    private tileTextureManager: TileTextureManager | null = null;
    private isHighResTextureLoading = false;
    private basePatchSize = 0.1; // Base size of each high-res patch
    private maxPatches = 20; // Maximum number of high-res patches
    private updateInterval = 500; // Update interval in milliseconds
    private lastUpdateTime = 0;

    constructor(
        scene: THREE.Scene,
        camera: THREE.PerspectiveCamera,
        controls: OrbitControls,
        earthMesh: THREE.Mesh
    ) {
        this.scene = scene;
        this.camera = camera;
        this.controls = controls;
        this.earthMesh = earthMesh;

        // Initialize with the camera's current position
        this.lastCameraPosition.copy(this.camera.position);
        this.lastCameraTarget.copy(this.controls.target);
    }

    /**
     * Initialize the high-resolution patches
     */
    public async initialize(): Promise<void> {
        // Initialize the tile texture manager
        await this.initializeTileTextureManager();
        if (!this.tileTextureManager) return;

        // Initial update of high-res patches
        this.updateHighResPatches();
    }

    /**
     * Update the high-resolution patches based on camera position
     */
    public update(): void {
        if (!this.tileTextureManager) return;

        // Limit update frequency for better performance
        const currentTime = Date.now();
        if (currentTime - this.lastUpdateTime < this.updateInterval) return;
        this.lastUpdateTime = currentTime;

        // Check if camera has moved significantly
        const cameraHasMoved = this.hasCameraMovedSignificantly();

        if (cameraHasMoved) {
            // Update the high-resolution patches
            // We can't await this since update is called from the animation loop
            this.updateHighResPatches().catch(error => {
                console.error('Error updating high-res patches:', error);
            });

            // Save current camera position and target
            this.lastCameraPosition.copy(this.camera.position);
            this.lastCameraTarget.copy(this.controls.target);
        }
    }

    /**
     * Initialize the tile texture manager for high-resolution textures
     */
    private async initializeTileTextureManager(): Promise<void> {
        this.isHighResTextureLoading = true;

        // Create the tile texture manager with a higher zoom level for better resolution
        this.tileTextureManager = new TileTextureManager({
            zoomLevel: 7, // Higher zoom level for better resolution
            onTileLoaded: () => {
                // Trigger an update when a new tile is loaded
                this.updateHighResPatches();
            }
        });

        this.isHighResTextureLoading = false;
    }

    /**
     * Check if the camera has moved significantly
     */
    private hasCameraMovedSignificantly(): boolean {
        const positionDelta = this.camera.position.distanceTo(this.lastCameraPosition);
        const targetDelta = this.controls.target.distanceTo(this.lastCameraTarget);

        // Consider movement significant if position or target has changed by more than 0.1 units
        return positionDelta > 0.1 || targetDelta > 0.1;
    }

    /**
     * Update the high-resolution patches
     */
    private async updateHighResPatches(): Promise<void> {
        // Remove existing patches
        this.clearHighResPatches();

        // Get vertices in view
        const visibleVertices = this.getVisibleVertices();

        // Sort vertices by distance to center of screen
        const centerVertices = this.getCenterVertices(visibleVertices);

        // Create high-res patches for center vertices
        await this.createHighResPatches(centerVertices);
    }

    /**
     * Get vertices of the Earth mesh that are currently visible
     */
    private getVisibleVertices(): THREE.Vector3[] {
        const result: THREE.Vector3[] = [];

        // Get the geometry of the Earth mesh
        const geometry = this.earthMesh.geometry as THREE.SphereGeometry;
        const positions = geometry.attributes.position;

        // Create a frustum from the camera
        const frustum = new THREE.Frustum();
        const projScreenMatrix = new THREE.Matrix4();
        projScreenMatrix.multiplyMatrices(
            this.camera.projectionMatrix, 
            this.camera.matrixWorldInverse
        );
        frustum.setFromProjectionMatrix(projScreenMatrix);

        // Check each vertex
        for (let i = 0; i < positions.count; i++) {
            const vertex = new THREE.Vector3();
            vertex.fromBufferAttribute(positions, i);

            // Apply Earth mesh's world matrix to get world position
            vertex.applyMatrix4(this.earthMesh.matrixWorld);

            // Check if vertex is in view frustum and facing camera
            if (frustum.containsPoint(vertex)) {
                // Calculate normal direction (for a sphere, it's just the normalized position)
                const normal = vertex.clone().normalize();

                // Calculate dot product with camera direction
                const camDirection = new THREE.Vector3();
                this.camera.getWorldDirection(camDirection);
                camDirection.negate(); // Camera looks down negative Z

                const dotProduct = normal.dot(camDirection);

                // If dot product is positive, the vertex is facing the camera
                if (dotProduct > 0) {
                    result.push(vertex);
                }
            }
        }

        return result;
    }

    /**
     * Get the vertices closest to the center of the view
     */
    private getCenterVertices(vertices: THREE.Vector3[]): THREE.Vector3[] {
        if (vertices.length === 0) return [];

        // Project center of screen to world space
        const centerRay = new THREE.Raycaster();
        centerRay.setFromCamera(new THREE.Vector2(0, 0), this.camera);

        const intersects = centerRay.intersectObject(this.earthMesh);
        if (intersects.length === 0) return [];

        const centerPoint = intersects[0].point;

        // Sort vertices by distance to center point
        const sortedVertices = [...vertices].sort((a, b) => {
            const distA = a.distanceTo(centerPoint);
            const distB = b.distanceTo(centerPoint);
            return distA - distB;
        });

        // Return the closest vertices (up to maxPatches)
        return sortedVertices.slice(0, this.maxPatches);
    }

    /**
     * Create high-resolution patches for the given vertices
     */
    private async createHighResPatches(vertices: THREE.Vector3[]): Promise<void> {
        if (!this.tileTextureManager) {
            return;
        }

        // Calculate patch size based on camera distance
        const distance = this.camera.position.distanceTo(this.controls.target);
        const patchSizeScale = Math.max(0.5, Math.min(2.0, distance / 3));
        const patchSize = this.basePatchSize * patchSizeScale;

        // Group vertices by tile to avoid duplicate tiles and ensure coherent image
        const tileGroups = new Map<string, {
            vertices: THREE.Vector3[],
            lat: number,
            lng: number,
            tileX: number,
            tileY: number,
            u: number,
            v: number
        }>();

        // First, group vertices by tile
        for (const vertex of vertices) {
            // Get lat/lng for this vertex
            const { lat, lng } = positionToLatLng(vertex, this.earthMesh);

            // Get tile info for this lat/lng
            const tileInfo = this.tileTextureManager.getTileInfoForLatLng(lat, lng);
            const tileKey = `${tileInfo.tileX}_${tileInfo.tileY}`;

            // Add to tile group or create new group
            if (!tileGroups.has(tileKey)) {
                tileGroups.set(tileKey, {
                    vertices: [vertex],
                    lat,
                    lng,
                    tileX: tileInfo.tileX,
                    tileY: tileInfo.tileY,
                    u: tileInfo.u,
                    v: tileInfo.v
                });
            } else {
                tileGroups.get(tileKey)!.vertices.push(vertex);
            }
        }

        // Process tile groups in batches
        const processTileGroup = async (tileKey: string, group: {
            vertices: THREE.Vector3[],
            lat: number,
            lng: number,
            tileX: number,
            tileY: number,
            u: number,
            v: number
        }) => {
            // Load the texture for this tile
            const tileTexture = await this.tileTextureManager!.getTextureForCoordinates(group.lat, group.lng);
            if (!tileTexture) return; // Skip if texture couldn't be loaded

            // For each vertex in the group, create a patch
            for (const vertex of group.vertices) {
                // Create a plane geometry for the patch with calculated size
                const geometry = new THREE.PlaneGeometry(patchSize, patchSize);

                // Position and orient the patch to be tangent to the sphere at the vertex
                const position = vertex.clone();
                const normal = position.clone().normalize();

                // Create a material with the tile texture
                const material = new THREE.MeshBasicMaterial({
                    map: tileTexture,
                    transparent: true,
                    opacity: 1.0, // Full opacity for better visibility
                    side: THREE.FrontSide,
                    depthWrite: false
                });

                // Create the patch mesh
                const patch = new THREE.Mesh(geometry, material);

                // Position the patch slightly above the Earth's surface
                // Use a smaller offset to reduce z-fighting but keep patches visible
                patch.position.copy(position.clone().multiplyScalar(1.0005));

                // Orient the patch to face outward from the Earth
                patch.lookAt(position.clone().add(normal));

                // Add the patch to the scene and track it
                this.scene.add(patch);
                this.highResPatches.push(patch);

                // Store tile info in the patch's userData for later reference
                patch.userData = { 
                    lat: group.lat, 
                    lng: group.lng, 
                    tileX: group.tileX, 
                    tileY: group.tileY 
                };

                // Get specific UV coordinates for this vertex
                const { lat, lng } = positionToLatLng(vertex, this.earthMesh);
                const vertexTileInfo = this.tileTextureManager!.getTileInfoForLatLng(lat, lng);

                // Update the UV coordinates to match the tile
                this.updatePatchUVsForTile(patch, vertexTileInfo.u, vertexTileInfo.v);
            }
        };

        // Process tile groups in batches to avoid overwhelming the system
        const tileKeys = Array.from(tileGroups.keys());
        const batchSize = 3; // Process fewer tiles at once since each tile may have multiple vertices

        for (let i = 0; i < tileKeys.length; i += batchSize) {
            const batchKeys = tileKeys.slice(i, i + batchSize);

            // Process each tile group in the batch
            await Promise.all(
                batchKeys.map(key => processTileGroup(key, tileGroups.get(key)!))
            );
        }
    }

    /**
     * Update the UV coordinates of a patch based on its position within a tile
     * @param patch The patch mesh to update
     * @param u The u coordinate within the tile (0-1)
     * @param v The v coordinate within the tile (0-1)
     */
    private updatePatchUVsForTile(patch: THREE.Mesh, u: number, v: number): void {
        // Calculate UV offset based on the patch size and camera distance
        // This ensures patches cover appropriate portions of tiles without overlapping
        const distance = this.camera.position.distanceTo(this.controls.target);
        const scaleFactor = Math.max(0.01, Math.min(0.1, distance / 30));

        // Calculate UV offsets - smaller when zoomed in, larger when zoomed out
        const uOffset = scaleFactor;
        const vOffset = scaleFactor;

        // Update the geometry's UV coordinates
        const geometry = patch.geometry as THREE.PlaneGeometry;
        const uvs = geometry.attributes.uv;

        // Set UVs for each corner of the plane to map to the correct portion of the tile
        // Bottom left
        uvs.setXY(0, u, v);
        // Bottom right
        uvs.setXY(1, u + uOffset, v);
        // Top left
        uvs.setXY(2, u, v + vOffset);
        // Top right
        uvs.setXY(3, u + uOffset, v + vOffset);

        // Mark the attribute as needing an update
        uvs.needsUpdate = true;
    }

    /**
     * Update the UV coordinates of a patch based on its position (legacy method)
     */
    private updatePatchUVs(patch: THREE.Mesh, position: THREE.Vector3): void {
        // Convert position to lat/lng
        const { lat, lng } = positionToLatLng(position, this.earthMesh);

        // If we have a tile texture manager, use the tile-based UV mapping
        if (this.tileTextureManager) {
            const tileInfo = this.tileTextureManager.getTileInfoForLatLng(lat, lng);
            this.updatePatchUVsForTile(patch, tileInfo.u, tileInfo.v);
            return;
        }

        // Fallback to global UV mapping if no tile manager is available
        // Calculate UV center based on lat/lng
        const u = (lng + 180) / 360;
        const v = (90 - lat) / 180; // Use the same formula as in TileTextureManager

        // Calculate UV offset based on camera distance
        const distance = this.camera.position.distanceTo(this.controls.target);
        const scaleFactor = Math.max(0.01, Math.min(0.1, distance / 30));

        // Calculate UV offsets - smaller when zoomed in, larger when zoomed out
        const uOffset = scaleFactor;
        const vOffset = scaleFactor;

        // Update the geometry's UV coordinates
        const geometry = patch.geometry as THREE.PlaneGeometry;
        const uvs = geometry.attributes.uv;

        // Set UVs for each corner of the plane using the same approach as updatePatchUVsForTile
        // Bottom left
        uvs.setXY(0, u, v);
        // Bottom right
        uvs.setXY(1, u + uOffset, v);
        // Top left
        uvs.setXY(2, u, v + vOffset);
        // Top right
        uvs.setXY(3, u + uOffset, v + vOffset);

        // Mark the attribute as needing an update
        uvs.needsUpdate = true;
    }

    /**
     * Remove all high-resolution patches
     */
    private clearHighResPatches(): void {
        this.highResPatches.forEach(patch => {
            this.scene.remove(patch);
            patch.geometry.dispose();
            (patch.material as THREE.Material).dispose();
        });
        this.highResPatches = [];
    }

    /**
     * Set the maximum number of high-resolution patches
     */
    public setMaxPatches(count: number): void {
        this.maxPatches = count;
        this.updateHighResPatches();
    }

    /**
     * Set the base size of each high-resolution patch
     */
    public setPatchSize(size: number): void {
        this.basePatchSize = size;
        this.updateHighResPatches();
    }

    /**
     * Clean up resources
     */
    public dispose(): void {
        this.clearHighResPatches();

        if (this.tileTextureManager) {
            this.tileTextureManager.dispose();
            this.tileTextureManager = null;
        }
    }
}

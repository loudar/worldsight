import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { positionToLatLng } from './PositionToLatLng';
import { loadTexture } from '../textureLoader';

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
    private highResTexture: THREE.Texture | null = null;
    private isHighResTextureLoading = false;
    private patchSize = 0.1; // Size of each high-res patch
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
        // Load the high-resolution texture
        this.highResTexture = await this.loadHighResTexture();
        if (!this.highResTexture) return;

        // Initial update of high-res patches
        this.updateHighResPatches();
    }

    /**
     * Update the high-resolution patches based on camera position
     */
    public update(): void {
        if (!this.highResTexture) return;

        // Limit update frequency for better performance
        const currentTime = Date.now();
        if (currentTime - this.lastUpdateTime < this.updateInterval) return;
        this.lastUpdateTime = currentTime;

        // Check if camera has moved significantly
        const cameraHasMoved = this.hasCameraMovedSignificantly();
        
        if (cameraHasMoved) {
            // Update the high-resolution patches
            this.updateHighResPatches();
            
            // Save current camera position and target
            this.lastCameraPosition.copy(this.camera.position);
            this.lastCameraTarget.copy(this.controls.target);
        }
    }

    /**
     * Load the high-resolution texture
     */
    private async loadHighResTexture(): Promise<THREE.Texture | null> {
        this.isHighResTextureLoading = true;
        // Use a higher resolution online texture
        const texture = await loadTexture('https://eoimages.gsfc.nasa.gov/images/imagerecords/74000/74218/world.200412.3x5400x2700.jpg');
        this.isHighResTextureLoading = false;
        return texture;
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
    private updateHighResPatches(): void {
        // Remove existing patches
        this.clearHighResPatches();
        
        // Get vertices in view
        const visibleVertices = this.getVisibleVertices();
        
        // Sort vertices by distance to center of screen
        const centerVertices = this.getCenterVertices(visibleVertices);
        
        // Create high-res patches for center vertices
        this.createHighResPatches(centerVertices);
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
    private createHighResPatches(vertices: THREE.Vector3[]): void {
        if (!this.highResTexture) return;
        
        vertices.forEach(vertex => {
            // Create a small plane geometry for the patch
            const geometry = new THREE.PlaneGeometry(this.patchSize, this.patchSize);
            
            // Position and orient the patch to be tangent to the sphere at the vertex
            const position = vertex.clone();
            const normal = position.clone().normalize();
            
            // Create a material with the high-res texture
            const material = new THREE.MeshBasicMaterial({
                map: this.highResTexture,
                transparent: true,
                opacity: 0.8,
                side: THREE.FrontSide,
                depthWrite: false
            });
            
            // Create the patch mesh
            const patch = new THREE.Mesh(geometry, material);
            
            // Position the patch slightly above the Earth's surface
            patch.position.copy(position.clone().multiplyScalar(1.001));
            
            // Orient the patch to face outward from the Earth
            patch.lookAt(position.clone().add(normal));
            
            // Add the patch to the scene and track it
            this.scene.add(patch);
            this.highResPatches.push(patch);
            
            // Calculate UV coordinates based on lat/lng
            this.updatePatchUVs(patch, position);
        });
    }

    /**
     * Update the UV coordinates of a patch based on its position
     */
    private updatePatchUVs(patch: THREE.Mesh, position: THREE.Vector3): void {
        // Convert position to lat/lng
        const { lat, lng } = positionToLatLng(position, this.earthMesh);
        
        // Calculate UV center based on lat/lng
        const u = (lng + 180) / 360;
        const v = 1 - (lat + 90) / 180;
        
        // Calculate UV offset for the patch size
        const uOffset = this.patchSize / (2 * Math.PI);
        const vOffset = this.patchSize / Math.PI;
        
        // Update the geometry's UV coordinates
        const geometry = patch.geometry as THREE.PlaneGeometry;
        const uvs = geometry.attributes.uv;
        
        // Set UVs for each corner of the plane
        // Bottom left
        uvs.setXY(0, u - uOffset, v + vOffset);
        // Bottom right
        uvs.setXY(1, u + uOffset, v + vOffset);
        // Top left
        uvs.setXY(2, u - uOffset, v - vOffset);
        // Top right
        uvs.setXY(3, u + uOffset, v - vOffset);
        
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
     * Set the size of each high-resolution patch
     */
    public setPatchSize(size: number): void {
        this.patchSize = size;
        this.updateHighResPatches();
    }

    /**
     * Clean up resources
     */
    public dispose(): void {
        this.clearHighResPatches();
        
        if (this.highResTexture) {
            this.highResTexture.dispose();
            this.highResTexture = null;
        }
    }
}
import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls';
import {positionToLatLng} from './PositionToLatLng';
import {loadTexture} from '../textureLoader';

/**
 * Class to manage dynamic Level of Detail (LOD) for Earth visualization
 * Provides two resolutions:
 * 1. Base resolution for the entire Earth
 * 2. High-resolution for the centered area (plus a given radius)
 */
export class DynamicLODManager {
    private scene: THREE.Scene;
    private camera: THREE.PerspectiveCamera;
    private controls: OrbitControls;
    private earthMesh: THREE.Mesh;
    private highResOverlay: THREE.Mesh | null = null;
    private lastCameraPosition = new THREE.Vector3();
    private lastCameraTarget = new THREE.Vector3();
    private highResRadius = 20; // Radius in degrees
    private highResTexture: THREE.Texture | null = null;
    private isHighResTextureLoading = false;
    private currentCenterLat = 0;
    private currentCenterLng = 0;

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
     * Initialize the high-resolution overlay
     */
    public async initialize(): Promise<void> {
        // Load the high-resolution texture
        this.highResTexture = await this.loadHighResTexture();
        if (!this.highResTexture) return;

        // Create the high-resolution overlay mesh
        this.createHighResOverlay();
    }

    /**
     * Update the high-resolution overlay based on camera position
     */
    public update(): void {
        if (!this.highResOverlay || !this.highResTexture) return;

        // Check if camera has moved significantly
        const cameraHasMoved = this.hasCameraMovedSignificantly();

        if (cameraHasMoved) {
            // Update the center point based on camera direction
            this.updateCenterPoint();

            // Update the high-resolution overlay
            this.updateHighResOverlay();

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
        // For now, we'll use the same texture as the base, but in a real implementation
        // this would load a higher resolution texture or a texture for a specific region
        const texture = await loadTexture(`${window.location.origin}/8081_earthmap10k.jpg`);
        this.isHighResTextureLoading = false;
        return texture;
    }

    /**
     * Create the high-resolution overlay mesh
     */
    private createHighResOverlay(): void {
        if (!this.highResTexture) return;

        // Create a sphere geometry for the overlay
        const geometry = new THREE.SphereGeometry(1.001, 64, 64); // Slightly larger than Earth

        // Create a shader material for the overlay
        const material = new THREE.ShaderMaterial({
            uniforms: {
                baseTexture: {value: this.highResTexture},
                centerLat: {value: this.currentCenterLat},
                centerLng: {value: this.currentCenterLng},
                radius: {value: this.highResRadius},
                opacity: {value: 1.0}
            },
            vertexShader: `
        varying vec2 vUv;
        varying vec3 vPosition;
        
        void main() {
          vUv = uv;
          vPosition = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
            fragmentShader: `
        uniform sampler2D baseTexture;
        uniform float centerLat;
        uniform float centerLng;
        uniform float radius;
        uniform float opacity;
        
        varying vec2 vUv;
        varying vec3 vPosition;
        
        void main() {
          // Convert position to lat/lng
          vec3 normalized = normalize(vPosition);
          float lat = asin(normalized.y) * 180.0 / 3.14159265359;
          float lng = atan(normalized.x, normalized.z) * 180.0 / 3.14159265359;
          
          // Calculate distance from center point
          float latDiff = lat - centerLat;
          float lngDiff = lng - centerLng;
          // Handle wrapping around the date line
          if (lngDiff > 180.0) lngDiff -= 360.0;
          if (lngDiff < -180.0) lngDiff += 360.0;
          
          float distance = sqrt(latDiff * latDiff + lngDiff * lngDiff);
          
          // Apply a smooth transition at the edge of the radius
          float alpha = 1.0 - smoothstep(radius * 0.8, radius, distance);
          
          // Sample the texture
          vec4 texColor = texture2D(baseTexture, vUv);
          
          // Apply the alpha based on distance and overall opacity
          gl_FragColor = vec4(texColor.rgb, texColor.a * alpha * opacity);
        }
      `,
            transparent: true,
            side: THREE.FrontSide,
            depthWrite: false
        });

        // Create the mesh and add it to the scene
        this.highResOverlay = new THREE.Mesh(geometry, material);
        this.scene.add(this.highResOverlay);
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
     * Update the center point based on camera direction
     */
    private updateCenterPoint(): void {
        // Create a ray from the camera position in the direction it's looking
        const direction = new THREE.Vector3();
        direction.subVectors(this.controls.target, this.camera.position).normalize();

        const raycaster = new THREE.Raycaster(this.camera.position, direction);
        const intersects = raycaster.intersectObject(this.earthMesh);

        if (intersects.length > 0) {
            // Get the intersection point
            const intersectionPoint = intersects[0].point;

            // Convert to lat/lng
            const {lat, lng} = positionToLatLng(intersectionPoint, this.earthMesh);

            // Update the center coordinates
            this.currentCenterLat = lat;
            this.currentCenterLng = lng;
        }
    }

    /**
     * Update the high-resolution overlay
     */
    private updateHighResOverlay(): void {
        if (!this.highResOverlay) return;

        // Update the shader uniforms
        const material = this.highResOverlay.material as THREE.ShaderMaterial;
        material.uniforms.centerLat.value = this.currentCenterLat;
        material.uniforms.centerLng.value = this.currentCenterLng;
    }

    /**
     * Set the radius of the high-resolution area
     */
    public setHighResRadius(radius: number): void {
        this.highResRadius = radius;

        if (this.highResOverlay) {
            const material = this.highResOverlay.material as THREE.ShaderMaterial;
            material.uniforms.radius.value = radius;
        }
    }

    /**
     * Clean up resources
     */
    public dispose(): void {
        if (this.highResOverlay) {
            this.scene.remove(this.highResOverlay);
            this.highResOverlay.geometry.dispose();
            (this.highResOverlay.material as THREE.Material).dispose();
            this.highResOverlay = null;
        }

        if (this.highResTexture) {
            this.highResTexture.dispose();
            this.highResTexture = null;
        }
    }
}
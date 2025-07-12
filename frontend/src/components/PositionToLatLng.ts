import * as THREE from "three";

/**
 * Convert 3D position to latitude and longitude
 */
export function positionToLatLng(position: THREE.Vector3): { lat: number, lng: number } {
    // Normalize the position vector to get a point on the sphere
    const normalized = position.clone().normalize();

    // Calculate latitude and longitude in radians
    // Latitude: angle from XZ plane to Y axis (-π/2 to π/2)
    // Longitude: angle around Y axis (0 to 2π)
    const lat = Math.asin(normalized.y);
    const lng = Math.atan2(normalized.x, normalized.z);

    // Convert to degrees
    return {
        lat: lat * (180 / Math.PI),
        lng: lng * (180 / Math.PI)
    };
}
import * as THREE from "three";

/**
 * Convert 3D position to latitude and longitude
 */
export function positionToLatLng(position: THREE.Vector3, sphereRadius: number = 1): { lat: number, lng: number } {
    const lat = Math.acos(position.z / sphereRadius);
    const lng = Math.atan2(position.x, position.y);

    return {
        lat: lat * (180 / Math.PI),
        lng: lng * (180 / Math.PI)
    };
}
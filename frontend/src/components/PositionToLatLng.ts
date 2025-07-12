import * as THREE from "three";

/**
 * Convert 3D position to latitude and longitude
 * 
 * This function correctly calculates latitude and longitude from a 3D position,
 * accounting for the Earth's rotation.
 * 
 * @param position The 3D position on the sphere
 * @param sphereRadius The radius of the sphere (default: 1)
 * @returns An object containing the latitude and longitude in degrees
 */
export function positionToLatLng(position: THREE.Vector3, sphereRadius: number = 1): { lat: number, lng: number } {
    // Normalize the position vector to ensure it's on the sphere surface
    const normalizedPosition = position.clone().normalize().multiplyScalar(sphereRadius);

    console.log(position, normalizedPosition);

    // Calculate latitude using arcsin(y / radius)
    // This gives latitude in the range [-90°, 90°] where:
    // - 90° is the north pole (positive y-axis)
    // - 0° is the equator
    // - -90° is the south pole (negative y-axis)
    const lat = Math.asin(normalizedPosition.y / sphereRadius) * (180 / Math.PI);

    // Calculate longitude: arctan2(x, z)
    // This gives longitude in the range [-180°, 180°] where:
    // - 0° is the prime meridian (positive z-axis)
    // - 90° is east (positive x-axis)
    // - 180°/-180° is the antimeridian (negative z-axis)
    // - -90° is west (negative x-axis)
    const lng = Math.atan2(normalizedPosition.x, normalizedPosition.z) * (180 / Math.PI);

    return { lat, lng };
}

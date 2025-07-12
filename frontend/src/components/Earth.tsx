import React, {useEffect, useRef, useState} from 'react';
import * as THREE from 'three';
import {EarthProps} from '../types';
import {loadTexture} from "../textureLoader";
import {getOrbitControls} from "./GetOrbitControls";
import {Scene} from "three";
import {DataService} from "../services/dataService";

function addLights(scene: Scene) {
    const ambientLight = new THREE.AmbientLight(0x333333);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 1);
    sunLight.position.set(5, 3, 5);
    scene.add(sunLight);
}

/**
 * Convert 3D position to latitude and longitude
 */
function positionToLatLng(position: THREE.Vector3): { lat: number, lng: number } {
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

/**
 * Earth component for 3D globe visualization
 */
const Earth: React.FC<EarthProps> = ({dataLayer, setLocationInfo, setLoading, searchRadius = 10}) => {
    const mountRef = useRef<HTMLDivElement>(null);
    const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
    const sceneRef = useRef<THREE.Scene | null>(null);
    const earthRef = useRef<THREE.Object3D | null>(null);
    const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
    const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2());

    useEffect(() => {
        if (!mountRef.current) {
            console.log("returning");
            return;
        }

        if (setLoading) {
            setLoading(true);
        }

        const scene = new THREE.Scene();
        sceneRef.current = scene;
        const renderer = new THREE.WebGLRenderer({antialias: true});

        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.z = 3;

        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        mountRef.current.appendChild(renderer.domElement);

        const controls = getOrbitControls(camera, renderer);

        const earthLOD = new THREE.LOD();
        earthRef.current = earthLOD;

        Promise.all([
            loadTexture('https://unpkg.com/three-globe@2.24.10/example/img/earth-blue-marble.jpg'),
            loadTexture('https://unpkg.com/three-globe@2.24.10/example/img/earth-topology.png'),
            loadTexture('https://unpkg.com/three-globe@2.24.10/example/img/earth-water.png')
        ]).then(([mapTexture, bumpTexture, specularTexture]) => {
            const lowResMaterial = new THREE.MeshPhongMaterial({
                map: mapTexture || undefined,
                bumpMap: bumpTexture || undefined,
                specularMap: specularTexture || undefined,
                bumpScale: 20,
                specular: new THREE.Color('grey'),
                shininess: 5
            });

            // Create different levels of detail
            // High detail (close up)
            const highDetailGeometry = new THREE.SphereGeometry(1, 128, 128);
            const highDetailEarth = new THREE.Mesh(highDetailGeometry, lowResMaterial);

            // Medium detail (medium distance)
            const mediumDetailGeometry = new THREE.SphereGeometry(1, 64, 64);
            const mediumDetailEarth = new THREE.Mesh(mediumDetailGeometry, lowResMaterial);

            // Low detail (far away)
            const lowDetailGeometry = new THREE.SphereGeometry(1, 32, 32);
            const lowDetailEarth = new THREE.Mesh(lowDetailGeometry, lowResMaterial);

            // Add levels to LOD object with distance thresholds
            earthLOD.addLevel(highDetailEarth, 0);    // Use high detail when close
            earthLOD.addLevel(mediumDetailEarth, 5);  // Use medium detail at medium distance
            earthLOD.addLevel(lowDetailEarth, 10);    // Use low detail when far away

            scene.add(earthLOD);
            addLights(scene);

            if (setLoading) {
                setLoading(false);
            }

            const animate = () => {
                requestAnimationFrame(animate);
                //earthLOD.rotation.y += 0.001;
                controls.update();
                renderer.render(scene, camera);
            };

            animate();
        });

        // Handle click events
        const handleClick = (event: MouseEvent) => {
            console.log("click");
            // Calculate mouse position in normalized device coordinates (-1 to +1)
            mouseRef.current.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouseRef.current.y = -(event.clientY / window.innerHeight) * 2 + 1;

            raycasterRef.current.setFromCamera(mouseRef.current, camera);

            if (earthRef.current) {
                const intersects = raycasterRef.current.intersectObject(earthRef.current, true);

                if (intersects.length > 0) {
                    const intersection = intersects[0];
                    const position = intersection.point;

                    const {lat, lng} = positionToLatLng(position);
                    if (setLoading) {
                        setLoading(true);
                    }

                    console.log(lat, lng);
                    DataService.getDataByLatLon(lat, lng)
                        .then(locationData => {
                            setSelectedLocation(locationData);

                            const infoText = `
                                Data: ${locationData}
                                Search Radius: ${searchRadius} km
                            `;

                            if (setLocationInfo) {
                                setLocationInfo(infoText);
                            }

                            if (setLoading) {
                                setLoading(false);
                            }
                        })
                        .catch(error => {
                            console.error("Error fetching location data:", error);
                            if (setLocationInfo) {
                                setLocationInfo(`Error loading data for coordinates: ${lat.toFixed(2)}°, ${lng.toFixed(2)}°`);
                            }
                            if (setLoading) {
                                setLoading(false);
                            }
                        });
                }
            }
        };

        const handleResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        };
        window.addEventListener('resize', handleResize);
        mountRef.current.addEventListener('click', handleClick);
        console.log("added listeners");

        return () => {
            console.log("cleanup");
            window.removeEventListener('resize', handleResize);
            if (mountRef.current) {
                mountRef.current.removeEventListener('click', handleClick);
                mountRef.current.removeChild(renderer.domElement);
            }
            renderer.dispose();
        };
    }, [dataLayer, searchRadius, setLoading, setLocationInfo]);

    return <div ref={mountRef} className="globe-container"/>;
};

export default Earth;

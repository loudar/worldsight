import React, {useEffect, useRef} from 'react';
import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls';
import {ClimateData, EarthProps} from '../types';
import {Mesh, MeshBasicMaterial, Scene, Texture} from "three";

function addHeatmap(climateData: ClimateData[], heatmapGeometry: THREE.SphereGeometry, dataLayer: string, colors: number[], heatmapMesh: Mesh | null, heatmapMaterial: MeshBasicMaterial, scene: Scene) {
    // Create a map of positions to climate data
    const dataMap = new Map();

    console.log(climateData);
    if (climateData) {
        climateData.forEach(point => {
            const lon = point.geometry.coordinates[0];
            const lat = point.geometry.coordinates[1];

            // Convert lat/lon to 3D position
            const phi = (90 - lat) * (Math.PI / 180);
            const theta = (lon + 180) * (Math.PI / 180);

            const x = -Math.sin(phi) * Math.cos(theta);
            const y = Math.cos(phi);
            const z = Math.sin(phi) * Math.sin(theta);

            // Store the climate data for this position
            dataMap.set(`${x.toFixed(2)},${y.toFixed(2)},${z.toFixed(2)}`, point);
        });
    }

    // Map vertices to colors based on nearest climate data point
    for (let i = 0; i < heatmapGeometry.attributes.position.count; i++) {
        const vertex = new THREE.Vector3();
        vertex.fromBufferAttribute(heatmapGeometry.attributes.position, i);
        vertex.normalize();

        // Find the nearest climate data point
        let nearestPoint = null;
        let minDistance = Infinity;

        if (climateData && climateData.length > 0) {
            // Try to find an exact match first
            const key = `${vertex.x.toFixed(2)},${vertex.y.toFixed(2)},${vertex.z.toFixed(2)}`;
            if (dataMap.has(key)) {
                nearestPoint = dataMap.get(key);
            } else {
                // If no exact match, use a default gradient based on latitude
                // This ensures the globe is always colored even if data is sparse
                const value = (vertex.y + 1) / 2; // 0 to 1

                if (dataLayer === 'temperature') {
                    // Blue (cold) to red (hot)
                    colors.push(1 - value, 0, value);
                } else if (dataLayer === 'precipitation') {
                    // Yellow (dry) to blue (wet)
                    colors.push(value, value, 1);
                }
                continue;
            }
        } else {
            // If no climate data, use a default gradient based on latitude
            const value = (vertex.y + 1) / 2; // 0 to 1

            if (dataLayer === 'temperature') {
                // Blue (cold) to red (hot)
                colors.push(1 - value, 0, value);
            } else if (dataLayer === 'precipitation') {
                // Yellow (dry) to blue (wet)
                colors.push(value, value, 1);
            }
            continue;
        }

        // Map the climate data to a color
        if (nearestPoint) {
            if (dataLayer === 'temperature') {
                // Map temperature to a color (blue to red)
                // Assuming temperature range from -30 to 40 degrees Celsius
                const normalizedTemp = (nearestPoint.temperature + 30) / 70;
                const clampedTemp = Math.max(0, Math.min(1, normalizedTemp));
                colors.push(clampedTemp, 0, 1 - clampedTemp);
            } else if (dataLayer === 'precipitation') {
                // Map precipitation to a color (yellow to blue)
                // Assuming precipitation range from 0 to 3000 mm
                const normalizedPrecip = nearestPoint.precipitation / 3000;
                const clampedPrecip = Math.max(0, Math.min(1, normalizedPrecip));
                colors.push(1 - clampedPrecip, 1 - clampedPrecip, 1);
            }
        }
    }

    console.log(colors);
    heatmapGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    heatmapMesh = new THREE.Mesh(heatmapGeometry, heatmapMaterial);
    scene.add(heatmapMesh);
    return heatmapMesh;
}

const textureLoader = new THREE.TextureLoader();
const loadTexture = (url: string): Promise<Texture | null> => {
    return new Promise((resolve) => {
        textureLoader.load(
            url,
            (texture) => resolve(texture),
            undefined,
            () => {
                console.error(`Failed to load texture: ${url}`);
                resolve(null);
            }
        );
    });
};

/**
 * Earth component for 3D globe visualization
 */
const Earth: React.FC<EarthProps> = ({climateData, dataLayer, onLocationSelect}) => {
    const mountRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!mountRef.current) {
            console.log("returning");
            return;
        }

        // Scene setup
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({antialias: true});

        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        mountRef.current.appendChild(renderer.domElement);

        // Camera position
        camera.position.z = 3;

        // Controls
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.minDistance = 3;
        controls.maxDistance = 10;

        const earthGeometry = new THREE.SphereGeometry(1, 64, 64);

        Promise.all([
            loadTexture('https://unpkg.com/three-globe@2.24.10/example/img/earth-blue-marble.jpg'),
            loadTexture('https://unpkg.com/three-globe@2.24.10/example/img/earth-topology.png'),
            loadTexture('https://unpkg.com/three-globe@2.24.10/example/img/earth-water.png')
        ]).then(([mapTexture, bumpTexture, specularTexture]) => {
            const earthMaterial = new THREE.MeshPhongMaterial({
                map: mapTexture || undefined,
                bumpMap: bumpTexture || undefined,
                specularMap: specularTexture || undefined,
                bumpScale: 0.05,
                specular: new THREE.Color('grey'),
                shininess: 5
            });

            const earth = new THREE.Mesh(earthGeometry, earthMaterial);
            scene.add(earth);

            // Add ambient light
            const ambientLight = new THREE.AmbientLight(0x333333);
            scene.add(ambientLight);

            // Add directional light (sun)
            const sunLight = new THREE.DirectionalLight(0xffffff, 1);
            sunLight.position.set(5, 3, 5);
            scene.add(sunLight);

            // Climate data visualization layer
            let heatmapMesh: THREE.Mesh | null = null;

            const updateHeatmap = () => {
                if (climateData && dataLayer) {
                    if (heatmapMesh) {
                        scene.remove(heatmapMesh);
                    }

                    // Create a new heatmap based on the selected data layer
                    const heatmapGeometry = new THREE.SphereGeometry(1.01, 64, 64);
                    const heatmapMaterial = new THREE.MeshBasicMaterial({
                        transparent: true,
                        opacity: 0.6,
                        vertexColors: true
                    });

                    // Apply colors based on climate data
                    const colors: number[] = [];
                    heatmapMesh = addHeatmap(climateData, heatmapGeometry, dataLayer, colors, heatmapMesh, heatmapMaterial, scene);
                }
            };

            // Update heatmap when climate data or selected layer changes
            if (climateData) {
                updateHeatmap();
            } else {
                console.log(climateData);
            }

            const animate = () => {
                requestAnimationFrame(animate);
                earth.rotation.y += 0.001;
                if (heatmapMesh) {
                    heatmapMesh.rotation.y += 0.001;
                }
                controls.update();
                renderer.render(scene, camera);
            };

            animate();
        });

        const handleResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        };

        window.addEventListener('resize', handleResize);

        // Cleanup function
        return () => {
            window.removeEventListener('resize', handleResize);
            if (mountRef.current) {
                mountRef.current.removeChild(renderer.domElement);
            }
            renderer.dispose();
        };
    }, [climateData, dataLayer]);

    return <div ref={mountRef} className="globe-container"/>;
};

export default Earth;

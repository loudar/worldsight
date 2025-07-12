import React, {useEffect, useRef, useState} from 'react';
import * as THREE from 'three';
import {Mesh, MeshBasicMaterial, Scene, SphereGeometry} from 'three';
import {EarthProps} from '../types';
import {loadTexture} from "../textureLoader";
import {getOrbitControls} from "./GetOrbitControls";
import {DataService} from "../services/dataService";
import {positionToLatLng} from "./PositionToLatLng";

const createDot = (): THREE.Mesh => {
    const size = 0.01;
    const geometry = new SphereGeometry(size, 32, 32);
    const material = new MeshBasicMaterial({color: 0xff0000});
    return new Mesh(geometry, material);
};

function addLights(scene: Scene) {
    const ambientLight = new THREE.AmbientLight(0xffffff);
    scene.add(ambientLight);

    /*const sunLight = new THREE.DirectionalLight(0xffffff, 1);
    sunLight.position.set(5, 3, 5);
    scene.add(sunLight);*/
}

/**
 * Earth component for 3D globe visualization
 */
const Earth: React.FC<EarthProps> = ({dataLayer, setLocationInfo, setLoading, searchRadius = 10}) => {
    const [selectedLocation, setSelectedLocation] = useState<string | null>(null);

    const mountRef = useRef<HTMLDivElement>(null);
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
        const dot = createDot();
        scene.add(dot);

        // Modify the handleClick function inside useEffect:
        const handleClick = (event: MouseEvent) => {
            console.log("click");
            mouseRef.current.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouseRef.current.y = -(event.clientY / window.innerHeight) * 2 + 1;

            raycasterRef.current.setFromCamera(mouseRef.current, camera);

            if (earthRef.current) {
                const intersects = raycasterRef.current.intersectObject(earthRef.current, true);

                if (intersects.length > 0) {
                    const intersection = intersects[0];
                    const position = intersection.point;

                    dot.position.copy(position);

                    const {lat, lng} = positionToLatLng(position);
                    console.log(lat, lng);
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
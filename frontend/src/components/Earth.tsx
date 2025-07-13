import React, {useEffect, useRef, useState} from 'react';
import * as THREE from 'three';
import {Mesh, MeshBasicMaterial, Scene, SphereGeometry} from 'three';
import {EarthProps} from '../types';
import {loadTexture} from "../textureLoader";
import {getOrbitControls} from "./GetOrbitControls";
import {DataService} from "../services/dataService";
import {positionToLatLng} from "./PositionToLatLng";
import {VertexLODManager} from "./VertexLODManager";

const createDot = (size: number): THREE.Mesh => {
    const geometry = new SphereGeometry(size, 32, 32);
    const material = new MeshBasicMaterial({color: 0xff0000});
    return new Mesh(geometry, material);
};

function addLights(scene: Scene) {
    const ambientLight = new THREE.AmbientLight(0xffffff);
    scene.add(ambientLight);
}

let added = false;

/**
 * Earth component for 3D globe visualization
 */
const Earth: React.FC<EarthProps> = ({setLocationInfo, setLoading}) => {
    const mountRef = useRef<HTMLDivElement>(null);
    const sceneRef = useRef<THREE.Scene | null>(null);
    const earthRef = useRef<THREE.Mesh | null>(null);
    const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
    const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2());
    const lodManagerRef = useRef<VertexLODManager | null>(null);

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

        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.01, 1000);
        camera.position.z = 3;

        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        mountRef.current.appendChild(renderer.domElement);

        const controls = getOrbitControls(camera, renderer);

        Promise.all([
            loadTexture(`${window.location.origin}/8081_earthmap10k.jpg`),
            loadTexture('https://unpkg.com/three-globe@2.24.10/example/img/earth-topology.png'),
            loadTexture('https://unpkg.com/three-globe@2.24.10/example/img/earth-water.png')
        ]).then(([mapTexture, bumpTexture, specularTexture]) => {
            const earthMaterial = new THREE.MeshPhongMaterial({
                map: mapTexture || undefined,
                bumpMap: bumpTexture || undefined,
                specularMap: specularTexture || undefined,
                bumpScale: 20,
                specular: new THREE.Color('grey'),
                shininess: 5
            });

            // Create a single Earth mesh with medium detail
            const earthGeometry = new THREE.SphereGeometry(1, 64, 64);
            const earthMesh = new THREE.Mesh(earthGeometry, earthMaterial);
            earthRef.current = earthMesh;
            scene.add(earthMesh);

            // Initialize the vertex-based LOD manager
            const lodManager = new VertexLODManager(scene, camera, controls, earthMesh);
            lodManagerRef.current = lodManager;

            // Initialize the LOD manager
            lodManager.initialize().then(() => {
                if (setLoading) {
                    setLoading(false);
                }
            });

            addLights(scene);

            const animate = () => {
                requestAnimationFrame(animate);

                if (lodManagerRef.current) {
                    lodManagerRef.current.update();
                }

                controls.update();
                renderer.render(scene, camera);
            };

            animate();
        });
        let dot = createDot(0);
        scene.add(dot);

        // Modify the handleClick function inside useEffect:
        const handleClick = (event: MouseEvent) => {
            mouseRef.current.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouseRef.current.y = -(event.clientY / window.innerHeight) * 2 + 1;

            raycasterRef.current.setFromCamera(mouseRef.current, camera);

            if (earthRef.current) {
                const intersects = raycasterRef.current.intersectObject(earthRef.current, true);

                if (intersects.length > 0) {
                    const intersection = intersects[0];
                    const position = intersection.point;

                    scene.remove(dot);
                    const newScale = 0.005 * (controls.getDistance() / 3);
                    dot = createDot(newScale);
                    dot.position.copy(position);
                    scene.add(dot);

                    const {lat, lng} = positionToLatLng(position, earthRef.current);
                    if (setLoading) {
                        setLoading(true);
                    }

                    DataService.getDataByLatLon(lat, lng)
                        .then(data => {
                            if (setLocationInfo) {
                                setLocationInfo({
                                    position: {lat, lng},
                                    data
                                });
                            }

                            if (setLoading) {
                                setLoading(false);
                            }
                        })
                        .catch(error => {
                            console.error("Error fetching location data:", error);
                            if (setLocationInfo) {
                                setLocationInfo({});
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
        if (mountRef.current && !added) {
            added = true;
            mountRef.current.addEventListener('click', handleClick);
        }

        return () => {
            console.log("cleanup");
            window.removeEventListener('resize', handleResize);

            if (lodManagerRef.current) {
                lodManagerRef.current.dispose();
                lodManagerRef.current = null;
            }

            if (mountRef.current) {
                mountRef.current.removeChild(renderer.domElement);
                mountRef.current.removeEventListener('click', handleClick);
                added = false;
            }
            renderer.dispose();
        };
    }, [setLoading, setLocationInfo]);

    return <div ref={mountRef} className="globe-container"/>;
};

export default Earth;

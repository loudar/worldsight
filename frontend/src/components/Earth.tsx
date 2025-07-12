import React, {useEffect, useRef, useState} from 'react';
import * as THREE from 'three';
import {EarthProps, LocationDetails} from '../types';
import {loadTexture} from "../textureLoader";
import {getOrbitControls} from "./GetOrbitControls";
import {Scene} from "three";

function addLights(scene: Scene) {
    const ambientLight = new THREE.AmbientLight(0x333333);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 1);
    sunLight.position.set(5, 3, 5);
    scene.add(sunLight);
}

/**
 * Earth component for 3D globe visualization
 */
const Earth: React.FC<EarthProps> = ({dataLayer, setLocationInfo, setLoading}) => {
    const mountRef = useRef<HTMLDivElement>(null);
    const [selectedLocation, setSelectedLocation] = useState<LocationDetails | null>(null);

    useEffect(() => {
        if (!mountRef.current) {
            console.log("returning");
            return;
        }

        const scene = new THREE.Scene();
        const renderer = new THREE.WebGLRenderer({antialias: true});

        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.z = 3;

        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        mountRef.current.appendChild(renderer.domElement);

        const controls = getOrbitControls(camera, renderer);
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

            addLights(scene);

            const animate = () => {
                requestAnimationFrame(animate);
                scene.rotation.y += 0.001;
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

        return () => {
            window.removeEventListener('resize', handleResize);
            if (mountRef.current) {
                mountRef.current.removeChild(renderer.domElement);
            }
            renderer.dispose();
        };
    }, [dataLayer]);

    return <div ref={mountRef} className="globe-container"/>;
};

export default Earth;

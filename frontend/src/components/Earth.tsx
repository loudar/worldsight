import React, {useEffect, useRef} from 'react';
import * as THREE from 'three';
import {Scene} from 'three';
import {EarthProps} from '../types';
import {loadTexture} from "../textureLoader";
import {getOrbitControls} from "./GetOrbitControls";
import {clickHandler, createDot} from "./ClickHandler";

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

            const earthGeometry = new THREE.SphereGeometry(1, 64, 64);
            const earthMesh = new THREE.Mesh(earthGeometry, earthMaterial);
            earthRef.current = earthMesh;
            scene.add(earthMesh);

            addLights(scene);

            const animate = () => {
                requestAnimationFrame(animate);

                controls.update();
                renderer.render(scene, camera);
            };

            animate();
        });
        let dot = createDot(0);
        scene.add(dot);

        const handleClick = clickHandler(mouseRef, raycasterRef, camera, earthRef, scene, dot, controls, setLoading, setLocationInfo);

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

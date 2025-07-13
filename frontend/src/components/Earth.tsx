import React, {useEffect, useRef} from 'react';
import * as THREE from 'three';
import {MeshBasicMaterial, Scene} from 'three';
import {EarthProps} from '../types';
import {getOrbitControls} from "./GetOrbitControls";
import {clickHandler, createDot} from "./ClickHandler";
import SlippyMapGlobe from 'three-slippy-map-globe';

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
        const renderer = new THREE.WebGLRenderer({
            antialias: true,
        });

        const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.0001, 1000);
        camera.position.z = 3;

        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        mountRef.current.appendChild(renderer.domElement);

        const controls = getOrbitControls(camera, renderer);

        const myMap = new SlippyMapGlobe(1, {
            tileUrl: (x, y, z) => `https://tile.openstreetmap.org/${z}/${x}/${y}.png`,
            maxLevel: 20
        });
        scene.add(myMap);

        const earthGeometry = new THREE.SphereGeometry(1, 256, 256);
        const earthMesh = new THREE.Mesh(earthGeometry, new MeshBasicMaterial({
            transparent: true,
            opacity: 0
        }));
        earthRef.current = earthMesh;
        scene.add(earthMesh);

        controls.addEventListener('change', () => {
            const camDistToCenter = camera.position.distanceTo({
                x: 0, y: 0, z: 0
            });
            controls.rotateSpeed = Math.pow((camDistToCenter / 3), 4);
            controls.zoomSpeed = Math.pow((camDistToCenter / 3), 3);
            console.log(controls.zoomSpeed);
            myMap.updatePov(camera);
        });
        myMap.updatePov(camera);

        addLights(scene);
        const animate = () => {
            requestAnimationFrame(animate);

            controls.update();
            renderer.render(scene, camera);
        };

        animate();
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
            mountRef.current.addEventListener('contextmenu', handleClick);
        }

        return () => {
            console.log("cleanup");
            window.removeEventListener('resize', handleResize);

            if (mountRef.current) {
                mountRef.current.removeChild(renderer.domElement);
                mountRef.current.removeEventListener('contextmenu', handleClick);
                added = false;
            }
            renderer.dispose();
        };
    }, [setLoading, setLocationInfo]);

    return <div ref={mountRef} className="globe-container"/>;
};

export default Earth;

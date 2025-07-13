import React from "react";
import {Mesh, MeshBasicMaterial, Object3D, PerspectiveCamera, Raycaster, Scene, SphereGeometry, Vector2} from "three";
import {OrbitControls} from "three/examples/jsm/controls/OrbitControls";
import {LocationInfo} from "../types";
import {positionToLatLng} from "./PositionToLatLng";
import {DataService} from "../services/dataService";
import * as THREE from "three";

export const createDot = (size: number): THREE.Mesh => {
    const geometry = new SphereGeometry(size, 16, 16);
    const material = new MeshBasicMaterial({
        color: 0xff0000,
        transparent: true,
        opacity: .5,
    });
    return new Mesh(geometry, material);
};

export function clickHandler(mouseRef: React.RefObject<Vector2>, raycasterRef: React.RefObject<Raycaster>, camera: PerspectiveCamera, earthRef: React.RefObject<Object3D | null>, scene: Scene, dot: Mesh, controls: OrbitControls, setLoading: undefined | ((value: (((prevState: boolean) => boolean) | boolean)) => void), setLocationInfo: ((value: (((prevState: LocationInfo) => LocationInfo) | LocationInfo)) => void) | undefined) {
    return (event: MouseEvent) => {
        mouseRef.current.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouseRef.current.y = -(event.clientY / window.innerHeight) * 2 + 1;

        raycasterRef.current.setFromCamera(mouseRef.current, camera);

        if (earthRef.current) {
            const intersects = raycasterRef.current.intersectObject(earthRef.current, true);

            if (intersects.length > 0) {
                const intersection = intersects[0];
                const position = intersection.point;

                scene.remove(dot);
                const newScale = .02 * Math.pow((controls.getDistance() / 3), 2.5);
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
}
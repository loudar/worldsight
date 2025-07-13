import {PerspectiveCamera, WebGLRenderer} from "three";
import {OrbitControls} from "three/examples/jsm/controls/OrbitControls";

export function getOrbitControls(camera: PerspectiveCamera, renderer: WebGLRenderer) {
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = false;
    controls.minDistance = 1.001;
    controls.maxDistance = 3;
    return controls;
}
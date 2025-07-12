import * as THREE from "three";
import {Texture} from "three";

const textureLoader = new THREE.TextureLoader();

export function loadTexture(url: string): Promise<Texture | null> {
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
}

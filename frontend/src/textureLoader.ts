import * as THREE from "three";
import {Texture} from "three";
import {text} from "node:stream/consumers";

const textureLoader = new THREE.TextureLoader();

export function loadTexture(url: string): Promise<Texture | null> {
    return new Promise((resolve) => {
        textureLoader.load(
            url,
            (texture) => {
                texture.magFilter = THREE.NearestFilter;
                resolve(texture);
            },
            undefined,
            () => {
                console.error(`Failed to load texture: ${url}`);
                resolve(null);
            }
        );
    });
}

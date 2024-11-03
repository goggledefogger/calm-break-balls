// src/components/PowerUp/PowerUp.tsx

import * as THREE from "three";
import { GAME_SETTINGS } from "../../utils/constants";

export interface PowerUp extends THREE.Mesh<THREE.SphereGeometry, THREE.MeshStandardMaterial> {
  userData: {
    type: "powerUp";
    effect: string;
  };
}

export const createPowerUp = (x: number, y: number): PowerUp => {
  const geometry = new THREE.SphereGeometry(
    GAME_SETTINGS.BLOCK_SIZE / 2,
    16,
    16
  );
  const material = new THREE.MeshStandardMaterial({ color: 0xffff00 });
  const powerUp = new THREE.Mesh(geometry, material) as unknown as PowerUp;
  powerUp.position.set(x, y, 0);
  powerUp.userData = {
    type: "powerUp",
    effect: "extraBall",
  };
  return powerUp;
};

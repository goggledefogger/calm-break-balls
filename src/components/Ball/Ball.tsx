// src/components/Ball/Ball.tsx

import * as THREE from "three";
import { GAME_SETTINGS } from "../../utils/constants";

export interface Ball extends THREE.Mesh<THREE.SphereGeometry, THREE.MeshStandardMaterial> {
  userData: {
    active: boolean;
    velocity: THREE.Vector3;
  };
}

export const createBall = (startPosition: THREE.Vector3): Ball => {
  const geometry = new THREE.SphereGeometry(GAME_SETTINGS.BALL_RADIUS, 32, 32);
  const material = new THREE.MeshStandardMaterial({ color: 0xffffff });
  const ball = new THREE.Mesh(geometry, material) as unknown as Ball;
  ball.position.copy(startPosition);
  ball.userData = {
    active: false,
    velocity: new THREE.Vector3(),
  };
  return ball;
};

// src/components/Ball/Ball.tsx

import * as THREE from "three";
import { GAME_SETTINGS } from "../../utils/constants";
import { TextureLoader } from 'three';

export interface Ball extends THREE.Mesh<THREE.SphereGeometry, THREE.MeshStandardMaterial> {
  userData: {
    active: boolean;
    velocity: THREE.Vector3;
    trail: THREE.Points;
    trailPoints: Float32Array;
    trailIndex: number;
  };
}

export const createBall = (startPosition: THREE.Vector3): Ball => {
  const geometry = new THREE.SphereGeometry(GAME_SETTINGS.BALL_RADIUS * 0.8, 32, 32);
  const material = new THREE.MeshStandardMaterial({
    color: 0xff8800,
    emissive: 0xff4400,
    emissiveIntensity: 0.5,
    roughness: 0.2,
    metalness: 0.8
  });

  const ball = new THREE.Mesh(geometry, material) as unknown as Ball;

  const glowGeometry = new THREE.SphereGeometry(GAME_SETTINGS.BALL_RADIUS * 1.2, 32, 32);
  const glowMaterial = new THREE.MeshBasicMaterial({
    color: 0xff6600,
    transparent: true,
    opacity: 0.3,
    side: THREE.BackSide
  });
  const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
  ball.add(glowMesh);

  const trailGeometry = new THREE.BufferGeometry();
  const trailMaterial = new THREE.PointsMaterial({
    color: 0xff3300,
    size: 0.1,
    transparent: true,
    opacity: 0.6
  });
  const trailPoints = new Float32Array(30 * 3); // 30 points, 3 values each
  trailGeometry.setAttribute('position', new THREE.BufferAttribute(trailPoints, 3));
  const trail = new THREE.Points(trailGeometry, trailMaterial);
  ball.add(trail);

  ball.position.copy(startPosition);
  ball.userData = {
    active: false,
    velocity: new THREE.Vector3(),
    trail: trail,
    trailPoints: trailPoints,
    trailIndex: 0
  };

  return ball;
};

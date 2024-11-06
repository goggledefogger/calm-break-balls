// src/components/Ball/Ball.tsx

import * as THREE from "three";
import { GAME_SETTINGS } from "../../utils/constants";

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
  const geometry = new THREE.SphereGeometry(GAME_SETTINGS.BALL_RADIUS, 32, 32);
  const material = new THREE.MeshStandardMaterial({
    color: 0xff8800,
    emissive: 0xff4400,
    emissiveIntensity: 0.4,
    metalness: 0.3,
    roughness: 0.4,
  });

  const ball = new THREE.Mesh(geometry, material) as unknown as Ball;

  const glowGeometry = new THREE.RingGeometry(
    GAME_SETTINGS.BALL_RADIUS * 1.2,
    GAME_SETTINGS.BALL_RADIUS * 1.4,
    32
  );
  const glowMaterial = new THREE.MeshBasicMaterial({
    color: 0xffaa00,
    transparent: true,
    opacity: 0.4,
    side: THREE.DoubleSide
  });

  const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
  ball.add(glowMesh);

  const trailGeometry = new THREE.BufferGeometry();
  const trailMaterial = new THREE.PointsMaterial({
    color: 0xff3300,
    size: 0.15,
    transparent: true,
    opacity: 0.6,
    blending: THREE.AdditiveBlending,
    map: new THREE.TextureLoader().load('/particle.png')
  });

  const trailPoints = new Float32Array(45 * 3);
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

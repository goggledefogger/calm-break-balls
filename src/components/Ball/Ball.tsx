// src/components/Ball/Ball.tsx

import * as THREE from "three";
import { GAME_SETTINGS } from "../../utils/constants";
import { sharedFireMaterial } from "./BallResources";

export interface Ball extends THREE.Mesh<THREE.SphereGeometry, THREE.MeshStandardMaterial> {
  userData: {
    active: boolean;
    velocity: THREE.Vector3;
    trail: THREE.Points;
    trailPoints: Float32Array;
    trailIndex: number;
    fireParticles: THREE.Points;
    fireParticlePositions: Float32Array;
    fireParticleVelocities: Float32Array;
    fireParticleColors: Float32Array;
  };
}

export const createBall = (startPosition: THREE.Vector3): Ball => {
  const geometry = new THREE.SphereGeometry(GAME_SETTINGS.BALL_RADIUS, 32, 32);
  const material = new THREE.MeshStandardMaterial({
    color: 0xff9933,
    emissive: 0xff5500,
    emissiveIntensity: 0.4,
    metalness: 0.35,
    roughness: 0.35,
  });

  const ball = new THREE.Mesh(geometry, material) as unknown as Ball;

  const glowGeometry = new THREE.RingGeometry(
    GAME_SETTINGS.BALL_RADIUS * 1.2,
    GAME_SETTINGS.BALL_RADIUS * 1.4,
    32
  );
  const glowMaterial = new THREE.MeshBasicMaterial({
    color: 0xffbb33,
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

  // Modify fire particles system for longer comet trail
  const particleCount = 30;
  const fireGeometry = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);
  const velocities = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);

  // Initialize particle positions, velocities, and colors
  for (let i = 0; i < particleCount * 3; i += 3) {
    positions[i] = 0;
    positions[i + 1] = 0;
    positions[i + 2] = 0;

    // Spread particles out more for longer trail
    velocities[i] = (Math.random() - 0.5) * 0.3;     // Wider spread
    velocities[i + 1] = -Math.random() * 0.5 - 0.2;  // Longer backward trail
    velocities[i + 2] = (Math.random() - 0.5) * 0.3; // More depth variation

    // Initialize with white/yellow core color
    colors[i] = 1.0;     // R
    colors[i + 1] = 1.0; // G
    colors[i + 2] = 0.7; // B
  }

  fireGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  fireGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const fireParticles = new THREE.Points(fireGeometry, sharedFireMaterial);
  ball.add(fireParticles);

  ball.position.copy(startPosition);
  ball.userData = {
    active: false,
    velocity: new THREE.Vector3(),
    trail: trail,
    trailPoints: trailPoints,
    trailIndex: 0,
    fireParticles,
    fireParticlePositions: positions,
    fireParticleVelocities: velocities,
    fireParticleColors: colors
  };

  return ball;
};

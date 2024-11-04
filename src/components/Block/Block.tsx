// src/components/Block/Block.tsx

import * as THREE from "three";
import { createTextSprite } from "../../utils/helpers";
import gsap from "gsap";
import { GAME_SETTINGS } from "../../utils/constants";

// Add type for velocity vectors
interface ParticleVelocity {
  x: number;
  y: number;
  z: number;
}

export interface Block extends THREE.Mesh<THREE.BoxGeometry, THREE.MeshStandardMaterial> {
  userData: {
    type: "block";
    health: number;
    healthText: THREE.Sprite;
    edges: THREE.LineSegments<THREE.EdgesGeometry, THREE.LineBasicMaterial>;
  };
}

export const createBlock = (x: number, y: number, turn: number): Block => {
  const geometry = new THREE.BoxGeometry(
    GAME_SETTINGS.BLOCK_SIZE,
    GAME_SETTINGS.BLOCK_SIZE,
    GAME_SETTINGS.BLOCK_SIZE
  );
  const health = Math.floor(Math.random() * 5) + 1 + Math.floor(turn / 3);
  const material = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(`hsl(${health * 30}, 85%, 60%)`),
    metalness: 0.7,
    roughness: 0.2,
    clearcoat: 0.8,
    clearcoatRoughness: 0.2,
    emissive: new THREE.Color(`hsl(${health * 30}, 85%, 30%)`),
    emissiveIntensity: 0.2
  });
  const block = new THREE.Mesh(geometry, material) as unknown as Block;
  block.position.set(x, y, 0);

  // Add beveled edges
  const edges = new THREE.EdgesGeometry(geometry);
  const edgesMaterial = new THREE.LineBasicMaterial({
    color: new THREE.Color(`hsl(${health * 30}, 85%, 70%)`),
    transparent: true,
    opacity: 0.5
  });
  const edgesMesh = new THREE.LineSegments(edges, edgesMaterial);
  block.add(edgesMesh);

  block.userData = {
    type: "block",
    health,
    healthText: createTextSprite(health.toString()),
    edges: edgesMesh
  };

  // Add health text with enhanced style
  block.userData.healthText.position.set(0, 0, 0.6);
  block.add(block.userData.healthText);

  return block;
};

export const handleBlockCollision = (
  block: Block,
  scene: THREE.Scene,
  blocksRef: React.MutableRefObject<THREE.Mesh[]>,
  setScore: React.Dispatch<React.SetStateAction<number>>
) => {
  block.userData.health--;

  // Enhanced hit animation
  gsap.to(block.scale, {
    x: 1.3,
    y: 1.3,
    z: 1.3,
    duration: 0.15,
    ease: "elastic.out(1, 0.3)",
    yoyo: true,
    repeat: 1
  });

  // Add impact particles
  const particleCount = 20;
  const particles = new THREE.Points(
    new THREE.BufferGeometry(),
    new THREE.PointsMaterial({
      color: (block.material as THREE.MeshPhysicalMaterial).color,
      size: 0.1,
      transparent: true,
      opacity: 0.8
    })
  );

  const positions = new Float32Array(particleCount * 3);
  const velocities: ParticleVelocity[] = [];

  for (let i = 0; i < particleCount; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI;
    const speed = 0.1 + Math.random() * 0.2;

    velocities.push({
      x: Math.sin(phi) * Math.cos(theta) * speed,
      y: Math.sin(phi) * Math.sin(theta) * speed,
      z: Math.cos(phi) * speed
    });

    positions[i * 3] = block.position.x;
    positions[i * 3 + 1] = block.position.y;
    positions[i * 3 + 2] = block.position.z;
  }

  particles.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  scene.add(particles);

  // Animate particles
  gsap.to(positions, {
    duration: 0.5,
    ease: "power2.out",
    onUpdate: () => {
      for (let i = 0; i < particleCount; i++) {
        positions[i * 3] += velocities[i].x;
        positions[i * 3 + 1] += velocities[i].y;
        positions[i * 3 + 2] += velocities[i].z;
        velocities[i].y -= 0.01; // gravity
      }
      particles.geometry.attributes.position.needsUpdate = true;
    },
    onComplete: () => {
      scene.remove(particles);
    }
  });

  if (block.userData.health <= 0) {
    // Remove health text
    block.remove(block.userData.healthText);
    scene.remove(block);
    const index = blocksRef.current.indexOf(block);
    if (index > -1) blocksRef.current.splice(index, 1);
    setScore((prev) => prev + 100);
  } else {
    (block.material as THREE.MeshStandardMaterial).color = new THREE.Color(
      `hsl(${block.userData.health * 30}, 70%, 50%)`
    );

    // Update health text
    block.remove(block.userData.healthText);
    block.userData.healthText = createTextSprite(
      block.userData.health.toString()
    );
    block.userData.healthText.position.set(0, 0, 0.6);
    block.add(block.userData.healthText);
  }
};

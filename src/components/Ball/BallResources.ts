import * as THREE from "three";

// Create a gradient of fire colors
const fireColors = [
  new THREE.Color(0xffff00), // Yellow
  new THREE.Color(0xff7700), // Orange
  new THREE.Color(0xff3300), // Bright red
  new THREE.Color(0xff0000), // Red
  new THREE.Color(0x330000), // Dark red/black
];

export const fireTexture = new THREE.TextureLoader().load('/fire_particle.png');
export const sharedFireMaterial = new THREE.PointsMaterial({
  size: 0.24, // 30% of original 0.8 size
  map: fireTexture,
  transparent: true,
  opacity: 0.8,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
  vertexColors: true
});

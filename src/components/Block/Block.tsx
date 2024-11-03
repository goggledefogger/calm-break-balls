// src/components/Block/Block.tsx

import * as THREE from "three";
import { createTextSprite } from "../../utils/helpers";
import gsap from "gsap";
import { GAME_SETTINGS } from "../../utils/constants";

export interface Block extends THREE.Mesh<THREE.BoxGeometry, THREE.MeshStandardMaterial> {
  userData: {
    type: "block";
    health: number;
    healthText: THREE.Sprite;
  };
}

export const createBlock = (x: number, y: number, turn: number): Block => {
  const geometry = new THREE.BoxGeometry(
    GAME_SETTINGS.BLOCK_SIZE,
    GAME_SETTINGS.BLOCK_SIZE,
    GAME_SETTINGS.BLOCK_SIZE
  );
  const health = Math.floor(Math.random() * 5) + 1 + Math.floor(turn / 3);
  const material = new THREE.MeshStandardMaterial({
    color: new THREE.Color(`hsl(${health * 30}, 70%, 50%)`),
  });
  const block = new THREE.Mesh(geometry, material) as unknown as Block;
  block.position.set(x, y, 0);
  block.userData = {
    type: "block",
    health,
    healthText: createTextSprite(health.toString()),
  };

  // Add health text
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

  // Animate block scale for visual feedback
  gsap.to(block.scale, {
    x: 1.2,
    y: 1.2,
    duration: 0.1,
    yoyo: true,
    repeat: 1,
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

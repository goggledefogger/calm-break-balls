import * as THREE from 'three';
import React from 'react';

export const screenToWorld = (
  screenX: number,
  screenY: number,
  containerRef: React.RefObject<HTMLDivElement>,
  GAME_WIDTH: number,
  GAME_HEIGHT: number
): THREE.Vector3 => {
  if (!containerRef.current) return new THREE.Vector3();

  const rect = containerRef.current.getBoundingClientRect();
  const x = ((screenX - rect.left) / rect.width) * 2 - 1;
  const y = -((screenY - rect.top) / rect.height) * 2 + 1;
  return new THREE.Vector3(x * (GAME_WIDTH / 2), y * (GAME_HEIGHT / 2), 0);
};

export const createTextSprite = (message: string): THREE.Sprite => {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Could not get 2D context');

  const fontSize = 64;
  canvas.width = 256;
  canvas.height = 256;

  context.font = `${fontSize}px Arial`;
  context.fillStyle = 'white';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(message, canvas.width / 2, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;

  const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
  const sprite = new THREE.Sprite(spriteMaterial);
  sprite.scale.set(1, 1, 1);

  return sprite;
};

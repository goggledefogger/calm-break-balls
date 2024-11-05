import * as THREE from "three";
import React from "react";

export const screenToWorld = (
  screenX: number,
  screenY: number,
  containerRef: React.RefObject<HTMLDivElement>,
  camera: THREE.Camera
): THREE.Vector3 => {
  if (!containerRef.current) return new THREE.Vector3();

  const rect = containerRef.current.getBoundingClientRect();
  const x = ((screenX - rect.left) / rect.width) * 2 - 1;
  const y = -((screenY - rect.top) / rect.height) * 2 + 1;

  const mouse = new THREE.Vector2(x, y);
  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, camera);

  const planeZ = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0); // Plane at z=0

  const point = new THREE.Vector3();
  raycaster.ray.intersectPlane(planeZ, point);

  return point;
};

export const createTextSprite = (message: string): THREE.Sprite => {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Could not get 2D context");

  const fontSize = 64;
  canvas.width = 256;
  canvas.height = 256;

  context.font = `${fontSize}px Arial`;
  context.fillStyle = "white";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(message, canvas.width / 2, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;

  const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
  const sprite = new THREE.Sprite(spriteMaterial);
  sprite.scale.set(1, 1, 1);

  return sprite;
};

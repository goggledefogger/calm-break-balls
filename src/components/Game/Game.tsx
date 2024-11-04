// src/components/Game/Game.tsx

import React, { useRef, useEffect, useCallback, useContext } from "react";
import * as THREE from "three";
import { GAME_SETTINGS } from "../../utils/constants";
import { screenToWorld } from "../../utils/helpers";
import { GameContext } from "../../context/GameContext";
import { createBall } from "../Ball/Ball";
import { createBlock, handleBlockCollision } from "../Block/Block";
import { createPowerUp } from "../PowerUp/PowerUp";
import ScoreBoard from "../ScoreBoard/ScoreBoard";
import PauseButton from "../PauseButton/PauseButton";
import GameOver from "../GameOver/GameOver";
import styles from "./Game.module.css";
import gsap from "gsap";

const Game: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene>(new THREE.Scene());
  const rendererRef = useRef<THREE.WebGLRenderer>();
  const cameraRef = useRef<THREE.PerspectiveCamera>();
  const requestRef = useRef<number>();

  const ballsRef = useRef<THREE.Mesh[]>([]);
  const blocksRef = useRef<THREE.Mesh[]>([]);
  const aimLineRef = useRef<THREE.Line>();
  const initialWorldPosRef = useRef<THREE.Vector3>(new THREE.Vector3());
  const startPositionRef = useRef<THREE.Vector3>(new THREE.Vector3());
  const returnedBallsCount = useRef<number>(0);
  const totalBallsThisTurnRef = useRef<number>(0);
  const turnInProgressRef = useRef<boolean>(false);
  const isAimingRef = useRef<boolean>(false);

  const initialCameraPositionRef = useRef<THREE.Vector3>(new THREE.Vector3());
  const initialCameraQuaternionRef = useRef(new THREE.Quaternion());
  const cameraTargetQuaternionRef = useRef(new THREE.Quaternion());
  const tempCameraRef = useRef(new THREE.PerspectiveCamera());
  const ballToFollowRef = useRef<THREE.Mesh>();

  const cameraTargetPositionRef = useRef(new THREE.Vector3());
  const cameraOrbitAngleRef = useRef(0);

  const {
    BALL_RADIUS,
    BLOCK_SIZE,
    GAME_WIDTH,
    GAME_HEIGHT,
    BALL_SPEED,
    MAX_AIM_LENGTH,
    POWER_UP_CHANCE,
  } = GAME_SETTINGS;

  const {
    score,
    setScore,
    numBalls,
    setNumBalls,
    turn,
    setTurn,
    isPaused,
    isGameOver,
    setIsGameOver,
  } = useContext(GameContext)!;

  const initGame = () => {
    const scene = sceneRef.current;
    scene.background = new THREE.Color(0x1a202c);

    // Initialize the camera
    const aspect = window.innerWidth / window.innerHeight;
    const camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
    camera.position.set(0, -GAME_HEIGHT / 2 + 5, 20);
    camera.lookAt(new THREE.Vector3(0, 0, 0));
    cameraRef.current = camera;

    // Store the initial camera position and quaternion
    initialCameraPositionRef.current.copy(camera.position);
    initialCameraQuaternionRef.current.copy(camera.quaternion);

    // Set initial camera target position and rotation
    cameraTargetPositionRef.current.copy(camera.position);
    cameraTargetQuaternionRef.current.copy(camera.quaternion);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    containerRef.current!.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Make the canvas fill its parent container
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";

    // Call handleResize to set initial size and camera frustum
    handleResize();
    containerRef.current!.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Basic lighting
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(10, 10, 5);
    scene.add(dirLight);

    // Aim line
    const aimLineMaterial = new THREE.LineBasicMaterial({ color: 0xffff00 });
    const aimLineGeometry = new THREE.BufferGeometry();
    const aimLine = new THREE.Line(aimLineGeometry, aimLineMaterial);
    scene.add(aimLine);
    aimLineRef.current = aimLine;

    startPositionRef.current = new THREE.Vector3(0, -GAME_HEIGHT / 2 + 1, 0);

    // Initial setup
    createInitialBlocks();
    createBalls();
    // Add walls to the scene
    createWalls();

    // Animation loop
    const animate = () => {
      requestRef.current = requestAnimationFrame(animate);
      if (!isPaused) {
        updateGame();
        renderer.render(scene, camera);
      }
    };
    animate();

    window.addEventListener("resize", handleResize);
  };

  useEffect(() => {
    createBalls();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [numBalls]);

  const handleResize = () => {
    if (!rendererRef.current || !containerRef.current || !cameraRef.current)
      return;

    const container = containerRef.current;
    const camera = cameraRef.current;
    const renderer = rendererRef.current;

    // Update renderer size to match the container
    const width = container.clientWidth;
    const height = container.clientHeight;
    renderer.setSize(width, height);

    // Update camera aspect ratio
    const aspect = width / height;
    camera.aspect = aspect;
    camera.updateProjectionMatrix();

    // Update start position based on new camera
    startPositionRef.current = new THREE.Vector3(0, -GAME_HEIGHT / 2 + 1, 0);
  };

  const createBalls = () => {
    while (ballsRef.current.length < numBalls) {
      const ball = createBall(startPositionRef.current);
      sceneRef.current.add(ball);
      ballsRef.current.push(ball);
    }
  };

  const createInitialBlocks = () => {
    for (let x = -4; x <= 4; x += 2) {
      for (let y = 2; y <= 4; y += 2) {
        if (Math.random() < POWER_UP_CHANCE) {
          const powerUp = createPowerUp(x, y);
          sceneRef.current.add(powerUp);
          blocksRef.current.push(powerUp);
        } else {
          const block = createBlock(x, y, turn);
          sceneRef.current.add(block);
          blocksRef.current.push(block);
        }
      }
    }
  };

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (turnInProgressRef.current) return;
      isAimingRef.current = true;
      initialWorldPosRef.current = screenToWorld(
        e.clientX,
        e.clientY,
        containerRef,
        cameraRef.current!
      );
    },
    []
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isAimingRef.current) return;

      const currentWorldPos = screenToWorld(
        e.clientX,
        e.clientY,
        containerRef,
        cameraRef.current!
      );
      const dragVector = new THREE.Vector3().subVectors(
        currentWorldPos,
        initialWorldPosRef.current
      );

      // Ensure z-component is zero
      dragVector.z = 0;

      const direction = dragVector
        .clone()
        .negate()
        .normalize()
        .multiplyScalar(MAX_AIM_LENGTH);

      // Ensure z-component is zero
      direction.z = 0;

      const positions = new Float32Array([
        startPositionRef.current.x,
        startPositionRef.current.y,
        startPositionRef.current.z,
        startPositionRef.current.x + direction.x,
        startPositionRef.current.y + direction.y,
        startPositionRef.current.z + direction.z,
      ]);

      aimLineRef.current!.geometry.setAttribute(
        "position",
        new THREE.BufferAttribute(positions, 3)
      );
    },
    [MAX_AIM_LENGTH]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isAimingRef.current || turnInProgressRef.current) return;

      isAimingRef.current = false;
      turnInProgressRef.current = true;

      // Clear aim line
      aimLineRef.current!.geometry.setAttribute(
        "position",
        new THREE.BufferAttribute(new Float32Array([]), 3)
      );

      const currentWorldPos = screenToWorld(
        e.clientX,
        e.clientY,
        containerRef,
        cameraRef.current!
      );
      const dragVector = new THREE.Vector3().subVectors(
        currentWorldPos,
        initialWorldPosRef.current
      );

      // Ensure z-component is zero
      dragVector.z = 0;

      const direction = dragVector
        .clone()
        .negate()
        .normalize()
        .multiplyScalar(BALL_SPEED);

      // Ensure z-component is zero
      direction.z = 0;

      startTurn(direction);
    },
    [BALL_SPEED]
  );

  const resetCamera = () => {
    // Set the target camera position and rotation to the initial values
    cameraTargetPositionRef.current.copy(initialCameraPositionRef.current);
    cameraTargetQuaternionRef.current.copy(initialCameraQuaternionRef.current);
  };

  const startTurn = (direction: THREE.Vector3) => {
    totalBallsThisTurnRef.current = ballsRef.current.length;
    returnedBallsCount.current = 0;

    let ballIndex = 0;

    // Randomly select a ball to follow
    const randomBallIndex = Math.floor(Math.random() * ballsRef.current.length);
    ballToFollowRef.current = ballsRef.current[randomBallIndex];

    // Set initial camera target position and rotation to current camera state
    const camera = cameraRef.current!;
    cameraTargetPositionRef.current.copy(camera.position);
    cameraTargetQuaternionRef.current.copy(camera.quaternion);

    // Compute initial orbit angle based on camera's current position relative to the ball
    const ballPosition = ballToFollowRef.current.position;
    const cameraPosition = camera.position;
    const offset = new THREE.Vector3().subVectors(cameraPosition, ballPosition);
    const angle = Math.atan2(offset.y, offset.x);
    cameraOrbitAngleRef.current = angle;

    // Reset positions of all balls to starting position
    ballsRef.current.forEach((ball) => {
      ball.position.copy(startPositionRef.current);
      ball.position.z = 0; // Ensure z is zero
    });

    const launchNext = () => {
      if (ballIndex >= totalBallsThisTurnRef.current) return;

      const ball = ballsRef.current[ballIndex];
      ball.position.copy(startPositionRef.current);
      ball.position.z = 0; // Ensure z is zero
      ball.userData.velocity = direction.clone();
      ball.userData.active = true;

      ballIndex++;
      setTimeout(launchNext, 100);
    };

    launchNext();
  };

  useEffect(() => {
    initGame();
    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(requestRef.current!);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateGame = () => {
    // Update each ball
    ballsRef.current.forEach((ball) => {
      if (!ball.userData.active) {
        // Ensure inactive balls are at the starting position
        ball.position.copy(startPositionRef.current);
        ball.position.z = 0; // Ensure z is zero
        return;
      }

      // Move ball based on velocity
      ball.position.add(ball.userData.velocity);

      // Ensure z-component remains zero
      ball.position.z = 0;

      // Check wall collisions
      if (
        ball.position.x <= -GAME_WIDTH / 2 + BALL_RADIUS ||
        ball.position.x >= GAME_WIDTH / 2 - BALL_RADIUS
      ) {
        ball.userData.velocity.x *= -1;
      }
      if (ball.position.y >= GAME_HEIGHT / 2 - BALL_RADIUS) {
        ball.userData.velocity.y *= -1;
      }

      // Ensure velocity z-component remains zero
      ball.userData.velocity.z = 0;

      // Check if ball has returned to bottom
      if (ball.position.y <= -GAME_HEIGHT / 2 + BALL_RADIUS) {
        ball.userData.active = false;
        ball.position.copy(startPositionRef.current);
        ball.position.z = 0; // Ensure z is zero
        returnedBallsCount.current++;

        // If all balls have returned, end the turn
        if (returnedBallsCount.current >= totalBallsThisTurnRef.current) {
          endTurn();
        }
      }

      // Block collisions
      blocksRef.current.forEach((block) => {
        const distance = ball.position.distanceTo(block.position);
        const collisionDistance =
          BALL_RADIUS +
          (block.userData.type === "powerUp" ? 0.5 : BLOCK_SIZE / 2);

        if (distance < collisionDistance) {
          if (block.userData.type === "powerUp") {
            sceneRef.current.remove(block);
            blocksRef.current.splice(blocksRef.current.indexOf(block), 1);
            setNumBalls((prev) => prev + 1);
            // Do NOT reflect the ball's velocity
          } else {
            handleBlockCollision(
              block as any,
              sceneRef.current,
              blocksRef,
              setScore
            );
            // Reflect ball only when hitting a block
            const normal = new THREE.Vector3()
              .subVectors(ball.position, block.position)
              .normalize();

            // Ensure normal is in x-y plane
            normal.z = 0;
            normal.normalize();

            ball.userData.velocity.reflect(normal);

            // Ensure velocity z-component remains zero after reflection
            ball.userData.velocity.z = 0;
          }
        }
      });
    });

    // Update camera to follow the ball
    const camera = cameraRef.current!;
    if (turnInProgressRef.current) {
      if (ballToFollowRef.current && ballToFollowRef.current.userData.active) {
        const ballPosition = ballToFollowRef.current.position;

        // Update camera orbit angle
        cameraOrbitAngleRef.current += 0.01; // Increase for faster rotation

        // Calculate dynamic radius for zoom effect
        const time = Date.now() * 0.001;
        const baseRadius = 10; // Base distance from the ball
        const radiusVariation = Math.sin(time * 0.5) * 3; // Adjust amplitude and frequency
        const dynamicRadius = baseRadius + radiusVariation;

        // Add some vertical movement for more dynamic effect
        const verticalOffset = Math.sin(time * 0.3) * 2;

        const angle = cameraOrbitAngleRef.current;

        const offsetX = dynamicRadius * Math.cos(angle);
        const offsetY = dynamicRadius * Math.sin(angle);
        const offsetZ = verticalOffset; // Vertical offset

        const desiredCameraPosition = new THREE.Vector3(
          ballPosition.x + offsetX,
          ballPosition.y + offsetY,
          ballPosition.z + offsetZ
        );

        // Update target camera position
        cameraTargetPositionRef.current.copy(desiredCameraPosition);

        // Compute desired rotation to look at the ball
        const tempCamera = tempCameraRef.current;
        tempCamera.position.copy(cameraTargetPositionRef.current);
        tempCamera.lookAt(ballPosition);
        cameraTargetQuaternionRef.current.copy(tempCamera.quaternion);
      } else {
        // The ball we're following is no longer active
        // Find another active ball to follow
        const activeBalls = ballsRef.current.filter(
          (ball) => ball.userData.active
        );
        if (activeBalls.length > 0) {
          // Randomly select another ball to follow
          const randomIndex = Math.floor(Math.random() * activeBalls.length);
          ballToFollowRef.current = activeBalls[randomIndex];
        } else {
          // No active balls left, reset camera
          resetCamera();
        }
      }
    }

    // Determine lerpFactor based on whether the camera is following the ball or resetting
    let lerpFactor = 0.05; // For following the ball
    if (!turnInProgressRef.current) {
      lerpFactor = 0.1; // Slightly higher for a smoother reset
    }

    // Interpolate camera position towards target
    camera.position.lerp(cameraTargetPositionRef.current, lerpFactor);

    // Interpolate camera rotation towards target
    camera.quaternion.slerp(cameraTargetQuaternionRef.current, lerpFactor);
  };

  const endTurn = () => {
    turnInProgressRef.current = false;

    // Reset camera when the turn ends
    resetCamera();

    moveBlocksDown();
    createNewRowOfBlocks();
    setTurn((prev) => prev + 1);
  };

  const moveBlocksDown = () => {
    blocksRef.current.forEach((block) => {
      block.position.y -= BLOCK_SIZE;
      if (block.position.y <= -GAME_HEIGHT / 2 + BLOCK_SIZE / 2) {
        setIsGameOver(true);
      }
    });
  };

  const createWalls = () => {
    const wallMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const wallThickness = 0.1;
    const wallDepth = 1;

    // Left wall
    const leftWallGeometry = new THREE.BoxGeometry(
      wallThickness,
      GAME_HEIGHT,
      wallDepth
    );
    const leftWall = new THREE.Mesh(leftWallGeometry, wallMaterial);
    leftWall.position.set(-GAME_WIDTH / 2 + wallThickness / 2, 0, 0);
    sceneRef.current.add(leftWall);

    // Right wall
    const rightWallGeometry = new THREE.BoxGeometry(
      wallThickness,
      GAME_HEIGHT,
      wallDepth
    );
    const rightWall = new THREE.Mesh(rightWallGeometry, wallMaterial);
    rightWall.position.set(GAME_WIDTH / 2 - wallThickness / 2, 0, 0);
    sceneRef.current.add(rightWall);

    // Top wall
    const topWallGeometry = new THREE.BoxGeometry(
      GAME_WIDTH,
      wallThickness,
      wallDepth
    );
    const topWall = new THREE.Mesh(topWallGeometry, wallMaterial);
    topWall.position.set(0, GAME_HEIGHT / 2 - wallThickness / 2, 0);
    sceneRef.current.add(topWall);
  };

  const createNewRowOfBlocks = () => {
    for (let x = -4; x <= 4; x += 2) {
      if (Math.random() < POWER_UP_CHANCE) {
        const powerUp = createPowerUp(x, GAME_HEIGHT / 2 - BLOCK_SIZE);
        sceneRef.current.add(powerUp);
        blocksRef.current.push(powerUp);
      } else {
        const block = createBlock(x, GAME_HEIGHT / 2 - BLOCK_SIZE, turn);
        sceneRef.current.add(block);
        blocksRef.current.push(block);
      }
    }
  };

  if (isGameOver) {
    return <GameOver score={score} />;
  }

  return (
    <div
      className={styles.gameContainer}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}>
      <div ref={containerRef} className={styles.canvasContainer} />
      <ScoreBoard />
      <PauseButton />
    </div>
  );
};

export default Game;

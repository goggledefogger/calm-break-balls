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
import TurboButton from "../TurboButton/TurboButton";
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
  const cameraTargetPositionRef = useRef<THREE.Vector3>(new THREE.Vector3());

  const clockRef = useRef(new THREE.Clock());

  const ballToFollowRef = useRef<THREE.Mesh | null>(null); // Properly defined

  const lastBallVelocityRef = useRef<THREE.Vector3>(new THREE.Vector3());
  const targetZoomRef = useRef<number>(25); // Default zoom distance
  const minZoomRef = useRef<number>(10); // More extreme minimum zoom (closer)
  const maxZoomRef = useRef<number>(60); // More extreme maximum zoom (further)
  const cameraRotationRef = useRef<number>(0); // Track camera rotation

  const consecutiveHitsRef = useRef<number>(0);

  const cameraRollRef = useRef<number>(0);
  const cameraPitchRef = useRef<number>(0);
  const cameraYawRef = useRef<number>(0);

  const {
    BALL_RADIUS,
    BLOCK_SIZE,
    GAME_WIDTH,
    GAME_HEIGHT,
    BALL_SPEED,
    TURBO_MULTIPLIER,
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
    isTurbo,
    setTurnInProgress,
    setIsTurbo,
  } = useContext(GameContext)!;

  const initGame = () => {
    const scene = sceneRef.current;
    scene.background = new THREE.Color(0x1a202c);

    // Initialize the camera with adjusted position
    const aspect = window.innerWidth / window.innerHeight;
    const camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
    camera.position.set(0, -GAME_HEIGHT / 2 + 8, 25); // Modified position
    camera.lookAt(new THREE.Vector3(0, 0, 0));
    cameraRef.current = camera;

    // Store the initial camera position
    initialCameraPositionRef.current.copy(camera.position);
    cameraTargetPositionRef.current.copy(camera.position);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    containerRef.current!.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Make the canvas fill its parent container
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";

    // Call handleResize to set initial size and camera frustum
    handleResize();

    // Enhanced lighting
    scene.add(new THREE.AmbientLight(0x404040, 0.8));

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(10, 10, 5);
    dirLight.castShadow = true;
    scene.add(dirLight);

    const pointLight = new THREE.PointLight(0xff6600, 0.8, 20);
    pointLight.position.set(0, 0, 5);
    scene.add(pointLight);

    // Add subtle fog for depth
    scene.fog = new THREE.Fog(0x1a202c, 15, 50);

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
      setTurnInProgress(true);
      setIsTurbo(false);

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

      // Set initial velocity based on drag direction only, not speed
      const direction = dragVector.clone().negate().normalize();
      direction.z = 0;

      // Store normalized direction as velocity
      const initialVelocity = direction.clone();

      totalBallsThisTurnRef.current = ballsRef.current.length;
      returnedBallsCount.current = 0;

      // Set up first ball to follow
      ballToFollowRef.current = ballsRef.current[0];

      let ballIndex = 0;

      const launchNext = () => {
        if (ballIndex >= totalBallsThisTurnRef.current) return;

        const ball = ballsRef.current[ballIndex];
        ball.position.copy(startPositionRef.current);
        ball.position.z = 0;
        ball.userData.velocity = initialVelocity.clone();
        ball.userData.active = true;

        ballIndex++;
        setTimeout(launchNext, 100);
      };

      launchNext();
    },
    [setTurnInProgress, setIsTurbo]
  );

  const resetCamera = () => {
    // Smoothly reset roll to 0 through the shortest path
    const currentRoll = cameraRollRef.current;
    const targetRoll = 0;

    // Calculate shortest rotation path
    let rollDiff = targetRoll - currentRoll;
    if (Math.abs(rollDiff) > Math.PI) {
      rollDiff -= Math.sign(rollDiff) * Math.PI * 2;
    }

    gsap.to(cameraRollRef, {
      current: currentRoll + rollDiff,
      duration: 1.5,
      ease: "power2.inOut"
    });

    // Reset other camera properties
    cameraPitchRef.current = 0;
    cameraYawRef.current = 0;

    // Reset the target zoom with a slight random variation
    const randomZoom = 25 + (Math.random() - 0.5) * 5;
    targetZoomRef.current = randomZoom;

    gsap.to(cameraRef.current!.position, {
      x: initialCameraPositionRef.current.x,
      y: initialCameraPositionRef.current.y,
      z: initialCameraPositionRef.current.z,
      duration: 1.5,
      ease: "power2.inOut",
      onUpdate: () => {
        // Reset camera up vector
        cameraRef.current!.up.set(0, 1, 0);

        const currentLookTarget = new THREE.Vector3();
        cameraRef.current!.getWorldDirection(currentLookTarget);
        const desiredLookTarget = new THREE.Vector3()
          .subVectors(new THREE.Vector3(0, -GAME_HEIGHT / 4, 0), cameraRef.current!.position)
          .normalize();

        currentLookTarget.lerp(desiredLookTarget, 0.015);
        cameraRef.current!.lookAt(
          cameraRef.current!.position.clone().add(currentLookTarget.multiplyScalar(10))
        );
      },
    });

    ballToFollowRef.current = null;
    lastBallVelocityRef.current.set(0, 0, 0);
  };

  const startTurn = (direction: THREE.Vector3) => {
    totalBallsThisTurnRef.current = ballsRef.current.length;
    returnedBallsCount.current = 0;
    turnInProgressRef.current = true;
    setTurnInProgress(true);

    // Randomly select a ball to follow
    const randomBallIndex = Math.floor(Math.random() * ballsRef.current.length);
    ballToFollowRef.current = ballsRef.current[randomBallIndex];

    // Reset positions of all balls to starting position
    ballsRef.current.forEach((ball) => {
      ball.position.copy(startPositionRef.current);
      ball.position.z = 0; // Ensure z is zero
    });

    let ballIndex = 0; // Add this line to declare ballIndex

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

      // Calculate current speed including turbo if active
      const currentSpeed = BALL_SPEED * (isTurbo ? TURBO_MULTIPLIER : 1);

      // Create movement vector from stored velocity direction and current speed
      const movement = ball.userData.velocity.clone().multiplyScalar(currentSpeed);
      ball.position.add(movement);

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

      // Update ball trail
      const trailPoints = ball.userData.trailPoints;
      const trailIndex = ball.userData.trailIndex;

      trailPoints[trailIndex * 3] = ball.position.x;
      trailPoints[trailIndex * 3 + 1] = ball.position.y;
      trailPoints[trailIndex * 3 + 2] = ball.position.z;

      ball.userData.trailIndex = (trailIndex + 1) % (trailPoints.length / 3);
      ball.userData.trail.geometry.attributes.position.needsUpdate = true;
    });

    // Update camera to follow the ball
    const camera = cameraRef.current!;
    if (turnInProgressRef.current) {
      if (ballToFollowRef.current && ballToFollowRef.current.userData.active) {
        const ballPosition = ballToFollowRef.current.position;
        const ballVelocity = (ballToFollowRef.current.userData as any).velocity;
        const time = clockRef.current.getElapsedTime();

        // Calculate factors that influence zoom
        const velocityChange = lastBallVelocityRef.current.distanceTo(ballVelocity);
        const distanceFromCenter = ballPosition.length();
        const heightFactor = Math.abs(ballPosition.y) / (GAME_HEIGHT / 2);

        // Update last velocity for next frame
        lastBallVelocityRef.current.copy(ballVelocity);

        // Calculate target zoom based on multiple factors with enhanced ranges
        const baseZoom = 25;
        const velocityZoom = velocityChange * 20; // More dramatic velocity zoom
        const positionZoom = distanceFromCenter * 1.2; // More dramatic position zoom
        const heightZoom = heightFactor * 12; // More dramatic height zoom

        // Add dynamic zoom effects based on game state
        const blockProximityZoom = blocksRef.current.reduce((zoom, block) => {
          const distance = ballPosition.distanceTo(block.position);
          // Zoom in more when close to blocks
          return distance < 4 ? zoom - (4 - distance) * 3 : zoom;
        }, 0);

        // Calculate new target zoom with enhanced ranges
        let newTargetZoom = baseZoom + velocityZoom + positionZoom + heightZoom + blockProximityZoom;

        // Add subtle oscillation to the camera (using the time variable declared above)
        const oscillation = Math.sin(time * 1.5) * 1;
        newTargetZoom += oscillation;

        // Clamp the zoom value between min and max
        newTargetZoom = Math.max(minZoomRef.current, Math.min(maxZoomRef.current, newTargetZoom));

        // Smoothly adjust target zoom with variable lerp factor
        const zoomDifference = Math.abs(newTargetZoom - targetZoomRef.current);
        const zoomLerpFactor = Math.min(0.02 + (zoomDifference * 0.002), 0.04);
        targetZoomRef.current += (newTargetZoom - targetZoomRef.current) * zoomLerpFactor;

        // Calculate dynamic offset based on current zoom with enhanced vertical offset
        const zoomFactor = targetZoomRef.current / baseZoom;
        const verticalOffset = -5 * Math.pow(zoomFactor, 1.1); // Slightly reduced vertical scaling

        // Calculate camera rotations based on ball movement and time
        const rollTarget = (ballVelocity.x * 0.15) + Math.sin(time * 0.8) * 0.08; // Keep roll as is
        const pitchTarget = (ballVelocity.y * 0.12) + Math.sin(time * 0.5) * 0.06; // Increased pitch sensitivity
        const yawTarget = (ballVelocity.x * 0.08) + Math.sin(time * 0.3) * 0.08; // Added velocity influence and increased yaw

        // Smoothly interpolate rotations (faster response for more dynamic movement)
        cameraRollRef.current += (rollTarget - cameraRollRef.current) * 0.02;
        cameraPitchRef.current += (pitchTarget - cameraPitchRef.current) * 0.02; // Faster pitch response
        cameraYawRef.current += (yawTarget - cameraYawRef.current) * 0.02; // Faster yaw response

        // Normalize roll angle to keep it between -PI and PI for smoother transitions
        cameraRollRef.current = ((cameraRollRef.current + Math.PI) % (Math.PI * 2)) - Math.PI;

        // Increased ranges for pitch and yaw
        cameraPitchRef.current = THREE.MathUtils.clamp(cameraPitchRef.current, -0.3, 0.3);  // Was -0.15 to 0.15
        cameraYawRef.current = THREE.MathUtils.clamp(cameraYawRef.current, -0.25, 0.25);    // Was -0.1 to 0.1

        // Calculate rotated offset with all three rotations
        const rotatedOffset = new THREE.Vector3(
          Math.sin(cameraYawRef.current) * 3,
          verticalOffset + Math.sin(cameraPitchRef.current) * 5,
          targetZoomRef.current
        );

        // Apply roll rotation matrix
        const rollMatrix = new THREE.Matrix4().makeRotationZ(cameraRollRef.current);
        rotatedOffset.applyMatrix4(rollMatrix);

        // Calculate the desired camera position relative to the ball
        const desiredCameraPosition = new THREE.Vector3().addVectors(
          ballPosition,
          rotatedOffset
        );

        // Use slower lerp factor for smoother camera movement
        cameraTargetPositionRef.current.lerp(desiredCameraPosition, 0.015);

        // Update the camera's position with the same lerp factor
        camera.position.lerp(cameraTargetPositionRef.current, 0.015);

        // Create a smoothed look-at target with rotation offsets
        const currentLookTarget = new THREE.Vector3();
        camera.getWorldDirection(currentLookTarget);
        const desiredLookTarget = new THREE.Vector3()
          .subVectors(ballPosition, camera.position)
          .normalize();

        // Add rotation-based offsets to look target
        desiredLookTarget.x += cameraYawRef.current * 0.5;
        desiredLookTarget.y += cameraPitchRef.current * 0.5;

        // Apply roll to the up vector
        const rollQuaternion = new THREE.Quaternion().setFromAxisAngle(
          new THREE.Vector3(0, 0, 1),
          cameraRollRef.current
        );
        camera.up.set(0, 1, 0).applyQuaternion(rollQuaternion);

        // Smoothly interpolate the camera's look direction
        currentLookTarget.lerp(desiredLookTarget, 0.015);
        camera.lookAt(
          camera.position.clone().add(currentLookTarget.multiplyScalar(10))
        );
      } else {
        // The ball we're following is no longer active
        // Find another active ball to follow
        const activeBalls = ballsRef.current.filter(
          (ball) => ball.userData.active
        );
        if (activeBalls.length > 0) {
          // If we already have a ball to follow, smoothly transition to the new one
          if (ballToFollowRef.current) {
            const newBall = activeBalls[Math.floor(Math.random() * activeBalls.length)];

            // Use GSAP for smooth transition between balls
            const startPos = ballToFollowRef.current.position.clone();
            const endPos = newBall.position.clone();

            gsap.to(cameraTargetPositionRef.current, {
              x: endPos.x,
              y: endPos.y,
              z: endPos.z,
              duration: 0.5,
              ease: "power2.out"
            });

            // Update the ball reference after starting the transition
            ballToFollowRef.current = newBall;
          } else {
            // If we don't have a ball to follow, just pick one
            ballToFollowRef.current = activeBalls[Math.floor(Math.random() * activeBalls.length)];
          }
        } else {
          // No active balls left, reset camera
          resetCamera();
        }
      }
    }

    // Optionally, add subtle zoom effects or slight positional shifts here
    // For example, using GSAP to animate zoom
  };

  const endTurn = () => {
    turnInProgressRef.current = false;
    setTurnInProgress(false);

    // Reset turbo state at the end of each turn
    setIsTurbo(false);

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
      <TurboButton />
    </div>
  );
};

export default Game;

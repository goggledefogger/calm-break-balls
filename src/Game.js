import React, { Component } from 'react';
import * as THREE from 'three';

class Game extends Component {
  constructor(props) {
    super(props);
    this.state = {
      turn: 0,
      maxBlockHealth: 1,
      gameName: "Calm Break Balls"
    };
    this.mount = React.createRef();
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.balls = [];
    this.blocks = [];
    this.ballsInMotion = false;
    this.ballCount = 1;
    this.mouse = new THREE.Vector2();
    this.target = new THREE.Vector2();
    this.mouseDown = false;
  }

  componentDidMount() {
    this.initThree();
    this.addEventListeners();
    this.animate();
  }

  componentWillUnmount() {
    this.removeEventListeners();
    this.stopAnimation();
    this.cleanupThreeJS();
  }

  initThree() {
    const width = this.mount.current.clientWidth;
    const height = this.mount.current.clientHeight;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87CEEB);

    this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    this.camera.position.z = 10;

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(width, height);
    this.mount.current.appendChild(this.renderer.domElement);

    this.addLights();
    this.createBall();
    this.createBlocks();
    this.createWalls();
  }

  addLights() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(0, 1, 1);
    this.scene.add(directionalLight);
  }

  createBall(position = new THREE.Vector3(0, -4, 0)) {
    const geometry = new THREE.SphereGeometry(0.2, 32, 32);
    const material = new THREE.MeshPhongMaterial({ color: 0xff0000 });
    const ball = new THREE.Mesh(geometry, material);
    ball.position.copy(position);
    ball.velocity = new THREE.Vector3(0, 0, 0);
    this.scene.add(ball);
    this.balls.push(ball);
  }

  createBlocks() {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const circleGeometry = new THREE.SphereGeometry(0.2, 16, 16);
    for (let i = 0; i < 5; i++) {
      const material = new THREE.MeshPhongMaterial({ color: 0x00ff00 });
      const block = new THREE.Mesh(geometry, material);

      block.position.set((Math.random() - 0.5) * 8, (Math.random() * 4) + 2, 0);
      block.health = Math.floor(Math.random() * this.state.maxBlockHealth) + 1;
      this.scene.add(block);
      this.blocks.push(block);

      const edgesGeometry = new THREE.EdgesGeometry(geometry);
      const edgesMaterial = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 2 });
      const wireframe = new THREE.LineSegments(edgesGeometry, edgesMaterial);
      block.add(wireframe);

      // Add text to the block
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = 128;
      canvas.height = 128;
      ctx.fillStyle = 'white';
      ctx.font = '64px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(block.health.toString(), 64, 64);
      const texture = new THREE.CanvasTexture(canvas);
      const textMaterial = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
      const textMesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), textMaterial);
      textMesh.position.set(0, 0, 0.51);
      block.add(textMesh);
      block.textMesh = textMesh;

      if (Math.random() < 0.3) {
        const circleMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff });
        const circle = new THREE.Mesh(circleGeometry, circleMaterial);
        circle.position.set(block.position.x, block.position.y + 1, 0);
        circle.isCollectible = true;
        this.scene.add(circle);
        this.blocks.push(circle);
      }
    }
  }

  createWalls() {
    const wallMaterial = new THREE.MeshPhongMaterial({ color: 0x808080, transparent: true, opacity: 0.3 });
    const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 10), wallMaterial);
    leftWall.position.set(-5.25, 0, 0);
    this.scene.add(leftWall);

    const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 10), wallMaterial);
    rightWall.position.set(5.25, 0, 0);
    this.scene.add(rightWall);

    const topWall = new THREE.Mesh(new THREE.PlaneGeometry(10.5, 0.5), wallMaterial);
    topWall.position.set(0, 5.25, 0);
    this.scene.add(topWall);
  }

  addEventListeners() {
    window.addEventListener('mousedown', this.onMouseDown);
    window.addEventListener('mousemove', this.onMouseMove);
    window.addEventListener('mouseup', this.onMouseUp);
    window.addEventListener('resize', this.onWindowResize);
  }

  removeEventListeners() {
    window.removeEventListener('mousedown', this.onMouseDown);
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('mouseup', this.onMouseUp);
    window.removeEventListener('resize', this.onWindowResize);
  }

  onMouseDown = (event) => {
    if (this.ballsInMotion) return;
    this.mouseDown = true;
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    this.target.copy(this.mouse);
  }

  onMouseMove = (event) => {
    if (this.mouseDown) {
      this.target.x = (event.clientX / window.innerWidth) * 2 - 1;
      this.target.y = -(event.clientY / window.innerHeight) * 2 + 1;
    }
  }

  onMouseUp = () => {
    if (!this.mouseDown) return;
    this.mouseDown = false;

    const direction = new THREE.Vector3(
      this.target.x - this.mouse.x,
      this.target.y - this.mouse.y,
      0
    ).normalize();

    const ballVelocity = direction.multiplyScalar(0.2);
    this.balls.forEach((ball, index) => {
      setTimeout(() => {
        ball.velocity.copy(ballVelocity);
      }, index * 100);
    });

    this.ballsInMotion = true;
  }

  onWindowResize = () => {
    const width = this.mount.current.clientWidth;
    const height = this.mount.current.clientHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  animate() {
    this.animationId = requestAnimationFrame(this.animate.bind(this));

    if (this.ballsInMotion) {
      const averagePosition = this.updateBallPositions();
      this.updateCamera(averagePosition);
    }

    this.renderer.render(this.scene, this.camera);
  }

  updateBallPositions() {
    let allBallsStopped = true;
    let averagePosition = new THREE.Vector3(0, 0, 0);

    this.balls.forEach(ball => {
      if (ball.velocity.lengthSq() > 0.0001) {
        allBallsStopped = false;
        this.moveBallAndCheckCollisions(ball);
      }
      averagePosition.add(ball.position);
    });

    averagePosition.divideScalar(this.balls.length);

    if (allBallsStopped) {
      this.ballsInMotion = false;
      this.prepareNextTurn();
    }

    return averagePosition;
  }

  moveBallAndCheckCollisions(ball) {
    const originalPosition = ball.position.clone();
    ball.position.add(ball.velocity);

    // Check wall collisions
    this.checkWallCollisions(ball);

    // Check block collisions
    this.checkBlockCollisions(ball, originalPosition);

    // Stop ball at the bottom
    if (ball.position.y <= -4) {
      ball.velocity.set(0, 0, 0);
      ball.position.y = -4;
    }
  }

  checkWallCollisions(ball) {
    if (ball.position.x > 5 || ball.position.x < -5) {
      ball.velocity.x *= -1;
      ball.position.x = Math.sign(ball.position.x) * 5;
    }
    if (ball.position.y > 5) {
      ball.velocity.y *= -1;
      ball.position.y = 5;
    }
  }

  checkBlockCollisions(ball, originalPosition) {
    const ballRadius = 0.2;
    const blockSize = 1;

    for (let i = this.blocks.length - 1; i >= 0; i--) {
      const block = this.blocks[i];
      if (this.circleRectangleCollision(ball, ballRadius, block, blockSize)) {
        if (block.isCollectible) {
          this.scene.remove(block);
          this.blocks.splice(i, 1);
          this.ballCount += 1;
        } else {
          this.resolveCollision(ball, originalPosition, block);
          block.health -= 1;
          this.updateBlockText(block);

          if (block.health <= 0) {
            this.scene.remove(block);
            this.blocks.splice(i, 1);
          }
        }
        break; // Only handle one collision per frame
      }
    }
  }

  circleRectangleCollision(circle, radius, rect, size) {
    const circleDistance = new THREE.Vector2(
      Math.abs(circle.position.x - rect.position.x),
      Math.abs(circle.position.y - rect.position.y)
    );

    if (circleDistance.x > (size / 2 + radius)) { return false; }
    if (circleDistance.y > (size / 2 + radius)) { return false; }

    if (circleDistance.x <= (size / 2)) { return true; }
    if (circleDistance.y <= (size / 2)) { return true; }

    const cornerDistance = (circleDistance.x - size / 2) ** 2 +
                           (circleDistance.y - size / 2) ** 2;

    return (cornerDistance <= (radius ** 2));
  }

  resolveCollision(ball, originalPosition, block) {
    // Calculate the collision normal
    const normal = new THREE.Vector3().subVectors(ball.position, block.position).normalize();
    
    // Move the ball out of the block
    ball.position.copy(originalPosition);
    ball.position.add(normal.clone().multiplyScalar(0.2));

    // Reflect the velocity
    const dot = ball.velocity.dot(normal);
    ball.velocity.sub(normal.multiplyScalar(2 * dot));

    // Add a small amount of randomness to prevent balls from getting stuck
    ball.velocity.add(new THREE.Vector3(
      (Math.random() - 0.5) * 0.01,
      (Math.random() - 0.5) * 0.01,
      0
    ));
  }

  updateBlockText(block) {
    const canvas = block.textMesh.material.map.image;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'white';
    ctx.font = '64px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(block.health.toString(), 64, 64);
    block.textMesh.material.map.needsUpdate = true;
  }

  updateCamera(averagePosition) {
    this.camera.position.x += (averagePosition.x - this.camera.position.x) * 0.05;
    this.camera.position.y += (averagePosition.y - this.camera.position.y) * 0.05;
    this.camera.position.z = 10 + Math.sin(Date.now() * 0.001) * 2;
    this.camera.lookAt(averagePosition);
  }

  stopAnimation() {
    cancelAnimationFrame(this.animationId);
  }

  cleanupThreeJS() {
    this.scene.remove(...this.scene.children);
    this.renderer.dispose();
    this.mount.current.removeChild(this.renderer.domElement);
  }

  prepareNextTurn() {
    this.setState(prevState => ({
      turn: prevState.turn + 1,
      maxBlockHealth: Math.min(prevState.maxBlockHealth + 1, 10)
    }));

    this.blocks.forEach(block => {
      block.position.y -= 1;
      if (block.position.y <= -5) {
        alert('Game Over!');
        window.location.reload();
      }
    });

    this.createBlocks();

    for (let i = this.balls.length; i < this.ballCount; i++) {
      this.createBall(new THREE.Vector3(0, -4, 0));
    }
  }

  render() {
    return <div ref={this.mount} style={{ width: '100%', height: '100vh' }} />;
  }
}

export default Game;
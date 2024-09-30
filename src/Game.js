import React, { Component } from 'react';
import * as THREE from 'three';

class Game extends Component {
  constructor(props) {
    super(props);
    this.state = {
      turn: 0,
      maxBlockHealth: 1
    };
  }

  componentDidMount() {
    this.initThree();
  }

  initThree() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(width, height);
    this.mount.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87CEEB);

    this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    this.camera.position.z = 10;

    const light = new THREE.AmbientLight(0xffffff, 0.7);
    this.scene.add(light);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(0, 1, 1);
    this.scene.add(directionalLight);

    this.balls = [];
    this.blocks = [];
    this.ballsInMotion = false;
    this.ballCount = 1;

    this.createBall();
    this.createBlocks();
    this.createWalls();

    this.mouseDown = false;
    this.mouse = new THREE.Vector2();
    this.target = new THREE.Vector2();

    window.addEventListener('mousedown', this.onMouseDown.bind(this), false);
    window.addEventListener('mousemove', this.onMouseMove.bind(this), false);
    window.addEventListener('mouseup', this.onMouseUp.bind(this), false);
    window.addEventListener('resize', this.onWindowResize.bind(this), false);

    this.animate();
  }

  createBall(position) {
    const geometry = new THREE.SphereGeometry(0.2, 32, 32);
    const material = new THREE.MeshPhongMaterial({ color: 0xff0000 });
    const ball = new THREE.Mesh(geometry, material);

    ball.position.set(position ? position.x : 0, position ? position.y : -4, 0);
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

  onWindowResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
  }

  onMouseDown(event) {
    if (this.ballsInMotion) return;
    this.mouseDown = true;
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
  }

  onMouseMove(event) {
    if (this.mouseDown) {
      this.target.x = (event.clientX / window.innerWidth) * 2 - 1;
      this.target.y = - (event.clientY / window.innerHeight) * 2 + 1;
    }
  }

  onMouseUp(event) {
    if (!this.mouseDown) return;
    this.mouseDown = false;

    const direction = new THREE.Vector3(
      this.target.x - this.mouse.x,
      this.target.y - this.mouse.y,
      0
    ).normalize();

    // Set the same velocity for all balls
    const ballVelocity = direction.clone().multiplyScalar(0.2);
    this.balls.forEach((ball, index) => {
      setTimeout(() => {
        ball.velocity.copy(ballVelocity);
      }, index * 100);
    });

    this.ballsInMotion = true;
  }

  animate() {
    requestAnimationFrame(this.animate.bind(this));

    if (this.ballsInMotion) {
      let allBallsStopped = true;
      let averagePosition = new THREE.Vector3(0, 0, 0);

      this.balls.forEach(ball => {
        ball.position.add(ball.velocity);

        if (ball.position.x > 5 || ball.position.x < -5) {
          ball.velocity.x *= -1;
        }
        if (ball.position.y > 5) {
          ball.velocity.y *= -1;
        }

        if (ball.position.y <= -4) {
          ball.velocity.set(0, 0, 0);
          ball.position.y = -4;
        } else {
          allBallsStopped = false;
        }

        this.blocks.forEach(block => {
          const distance = ball.position.distanceTo(block.position);
          if (distance < 0.6) {
            if (block.isCollectible) {
              this.scene.remove(block);
              this.blocks.splice(this.blocks.indexOf(block), 1);
              this.ballCount += 1;
            } else {
              block.health -= 1;
              ball.velocity.y *= -1;

              // Update block text
              const canvas = block.textMesh.material.map.image;
              const ctx = canvas.getContext('2d');
              ctx.clearRect(0, 0, canvas.width, canvas.height);
              ctx.fillStyle = 'white';
              ctx.font = '64px Arial';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText(block.health.toString(), 64, 64);
              block.textMesh.material.map.needsUpdate = true;

              if (block.health <= 0) {
                this.scene.remove(block);
                this.blocks.splice(this.blocks.indexOf(block), 1);
              }
            }
          }
        });

        averagePosition.add(ball.position);
      });

      averagePosition.divideScalar(this.balls.length);

      this.camera.position.x += (averagePosition.x - this.camera.position.x) * 0.05;
      this.camera.position.y += (averagePosition.y - this.camera.position.y) * 0.05;
      this.camera.position.z = 10 + Math.sin(Date.now() * 0.001) * 2;
      this.camera.lookAt(averagePosition);

      if (allBallsStopped) {
        this.ballsInMotion = false;
        this.prepareNextTurn();
      }
    }

    this.renderer.render(this.scene, this.camera);
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
    return <div ref={ref => (this.mount = ref)} />;
  }
}

export default Game;
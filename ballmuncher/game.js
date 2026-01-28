// ============================================
// BALLMUNCHER GAME ENGINE
// ============================================

const Game = {
    started: false,
    paused: false,
    score: 0,

    // Three.js
    scene: null,
    camera: null,
    renderer: null,

    // Physics
    world: null,
    playerBody: null,

    // Objects
    balls: [],
    ballBodies: [],

    // Controls
    keys: {},
    yaw: 0,
    pitch: 0,

    init() {
        console.log("Initializing Ballmuncher...");

        // Scene / Renderer
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x050510);
        this.scene.fog = new THREE.Fog(0x050510, 5, 50);

        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

        const canvas = document.getElementById('game-canvas');
        this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;

        // Physics
        this.world = new CANNON.World();
        this.world.gravity.set(0, -10, 0);

        this.createEnvironment();
        this.createPlayer();
        this.spawnBalls(20);
        this.setupLights();
        this.setupEvents();

        this.animate();
        console.log("Game fully initialized.");
    },

    createEnvironment() {
        // Floor
        const floorGeo = new THREE.PlaneGeometry(50, 50);
        const floorMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
        const floor = new THREE.Mesh(floorGeo, floorMat);
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        this.scene.add(floor);

        const floorShape = new CANNON.Plane();
        const floorBody = new CANNON.Body({ mass: 0 });
        floorBody.addShape(floorShape);
        floorBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
        this.world.addBody(floorBody);

        // Walls
        const colors = [0xff6b6b, 0x48dbfb, 0xfeca57, 0xff9ff3];
        for (let i = 0; i < 4; i++) {
            const wall = new THREE.Mesh(new THREE.PlaneGeometry(50, 15), new THREE.MeshStandardMaterial({ color: colors[i], side: THREE.DoubleSide }));
            const angle = (i * Math.PI) / 2;
            wall.position.set(Math.cos(angle) * 25, 7.5, Math.sin(angle) * 25);
            wall.rotation.y = -angle + Math.PI / 2;
            this.scene.add(wall);

            const wallBody = new CANNON.Body({ mass: 0 });
            wallBody.addShape(new CANNON.Plane());
            wallBody.position.copy(wall.position);
            wallBody.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), wall.rotation.y);
            this.world.addBody(wallBody);
        }
    },

    createPlayer() {
        this.playerBody = new CANNON.Body({ mass: 1, shape: new CANNON.Sphere(0.8), fixedRotation: true });
        this.playerBody.position.set(0, 2, 0);
        this.world.addBody(this.playerBody);

        // Visual pill body
        const pill = new THREE.Mesh(new THREE.CapsuleGeometry(0.3, 0.6, 4, 8), new THREE.MeshStandardMaterial({ color: 0x00ff00 }));
        pill.position.y = -1;
        this.camera.add(pill);
        this.scene.add(this.camera);

        // Hands
        const handGeo = new THREE.SphereGeometry(0.1, 8, 8);
        const handMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
        const leftHand = new THREE.Mesh(handGeo, handMat);
        leftHand.position.set(-0.4, -0.3, -0.5);
        this.camera.add(leftHand);

        const rightHand = new THREE.Mesh(handGeo, handMat);
        rightHand.position.set(0.4, -0.3, -0.5);
        this.camera.add(rightHand);
    },

    spawnBalls(count) {
        for (let i = 0; i < count; i++) {
            this.createBall();
        }
    },

    createBall() {
        const radius = 0.3 + Math.random() * 0.4;
        const color = new THREE.Color().setHSL(Math.random(), 0.7, 0.6);

        const ball = new THREE.Mesh(new THREE.SphereGeometry(radius, 16, 16), new THREE.MeshStandardMaterial({ color }));
        ball.position.set((Math.random() - 0.5) * 40, 5 + Math.random() * 10, (Math.random() - 0.5) * 40);
        ball.castShadow = true;
        this.scene.add(ball);
        this.balls.push(ball);

        const body = new CANNON.Body({ mass: 1, shape: new CANNON.Sphere(radius) });
        body.position.copy(ball.position);
        this.world.addBody(body);
        this.ballBodies.push(body);
    },

    setupLights() {
        this.scene.add(new THREE.AmbientLight(0xffffff, 0.4));
        const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(10, 20, 10);
        dirLight.castShadow = true;
        this.scene.add(dirLight);
    },

    setupEvents() {
        window.addEventListener('keydown', (e) => this.keys[e.code] = true);
        window.addEventListener('keyup', (e) => this.keys[e.code] = false);

        document.getElementById('play-btn').onclick = () => {
            document.getElementById('main-menu').classList.add('hidden');
            document.getElementById('game-container').classList.add('active');
            this.started = true;
            if (!this.renderer) this.init();
        };

        const canvas = document.getElementById('game-canvas');
        canvas.onclick = () => {
            if (this.started && !this.paused) {
                canvas.requestPointerLock();
            }
        };

        document.addEventListener('pointerlockchange', () => {
            const isLocked = document.pointerLockElement === canvas;
            document.getElementById('click-prompt').style.display = isLocked ? 'none' : 'inline';
            document.getElementById('full-controls').style.display = isLocked ? 'inline' : 'none';
        });

        document.addEventListener('mousemove', (e) => {
            if (document.pointerLockElement !== canvas) return;
            this.yaw -= e.movementX * 0.002;
            this.pitch -= e.movementY * 0.002;
            this.pitch = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, this.pitch));
            this.camera.rotation.set(this.pitch, this.yaw, 0, 'YXZ');
        });

        document.addEventListener('mousedown', () => {
            if (document.pointerLockElement !== canvas) return;
            this.munch();
        });

        document.getElementById('resume-btn').onclick = () => this.togglePause();
        document.getElementById('quit-btn').onclick = () => location.reload();

        window.onkeydown = (e) => {
            if (e.code === 'Escape' && this.started) this.togglePause();
        };
    },

    togglePause() {
        this.paused = !this.paused;
        document.getElementById('pause-menu').classList.toggle('active', this.paused);
        if (!this.paused) document.getElementById('game-canvas').requestPointerLock();
    },

    munch() {
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
        const intersects = raycaster.intersectObjects(this.balls);

        if (intersects.length > 0) {
            const ball = intersects[0].object;
            const dist = this.camera.position.distanceTo(ball.position);
            if (dist < 5) {
                this.removeBall(ball);
                this.score++;
                document.getElementById('balls-eaten').innerText = this.score;
                this.createBall();
            }
        }
    },

    removeBall(ball) {
        const idx = this.balls.indexOf(ball);
        if (idx > -1) {
            this.scene.remove(ball);
            this.world.removeBody(this.ballBodies[idx]);
            this.balls.splice(idx, 1);
            this.ballBodies.splice(idx, 1);
        }
    },

    animate() {
        requestAnimationFrame(() => this.animate());
        if (!this.started || this.paused) return;

        this.world.step(1 / 60);

        // Player movement
        const speed = 10;
        const dir = new THREE.Vector3();
        if (this.keys['KeyW']) dir.z -= 1;
        if (this.keys['KeyS']) dir.z += 1;
        if (this.keys['KeyA']) dir.x -= 1;
        if (this.keys['KeyD']) dir.x += 1;
        dir.normalize().applyQuaternion(this.camera.quaternion);

        this.playerBody.velocity.x = dir.x * speed;
        this.playerBody.velocity.z = dir.z * speed;

        this.camera.position.copy(this.playerBody.position);

        // Sync balls
        for (let i = 0; i < this.balls.length; i++) {
            this.balls[i].position.copy(this.ballBodies[i].position);
            this.balls[i].quaternion.copy(this.ballBodies[i].quaternion);
        }

        this.renderer.render(this.scene, this.camera);
    }
};

// Start setup but wait for play button for full init if needed
window.onload = () => Game.init();

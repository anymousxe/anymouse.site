/**
 * BALLMUNCHER
 * Complete 3D Game Engine
 */

const Game = {
    // State
    started: false,
    paused: false,
    score: 0,

    // Engine components
    scene: null,
    camera: null,
    renderer: null,
    world: null,

    // Entities
    playerBody: null,
    balls: [],
    ballBodies: [],

    // Control state
    keys: {},
    yaw: 0,
    pitch: 0,

    // Constants
    COLORS: [0xff6b6b, 0x48dbfb, 0xfeca57, 0xff9ff3, 0x1dd1a1, 0x54a0ff, 0x5f27cd],

    /**
     * INITIALIZE CORE ENGINE
     */
    init() {
        console.log("BALLMUNCHER: Initializing...");

        try {
            // 1. Setup Three.js Scene
            this.scene = new THREE.Scene();
            this.scene.background = new THREE.Color(0x0a0a12);
            this.scene.fog = new THREE.Fog(0x0a0a12, 10, 60);

            // 2. Setup Camera
            this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

            // 3. Setup Renderer
            const canvas = document.getElementById('game-canvas');
            if (!canvas) throw new Error("Canvas not found!");

            this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            this.renderer.shadowMap.enabled = true;

            // 4. Setup Physics
            this.world = new CANNON.World();
            this.world.gravity.set(0, -12, 0);

            // 5. Create World Components
            this.createEnvironment();
            this.createPlayer();
            this.spawnBalls(25);
            this.setupLights();

            // 6. Bind UI Events
            this.bindUI();

            // 7. Start Loop
            this.animate();

            console.log("BALLMUNCHER: Ready.");
        } catch (err) {
            console.error("BALLMUNCHER INIT FAILED:", err);
            alert("Game failed to load. Please check console.");
        }
    },

    /**
     * CREATE ROOM AND BOUNDARIES
     */
    createEnvironment() {
        // Floor
        const floorGeo = new THREE.PlaneGeometry(60, 60);
        const floorMat = new THREE.MeshStandardMaterial({ color: 0x1e1e24, roughness: 0.8 });
        const floor = new THREE.Mesh(floorGeo, floorMat);
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        this.scene.add(floor);

        const floorBody = new CANNON.Body({ mass: 0 });
        floorBody.addShape(new CANNON.Plane());
        floorBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
        this.world.addBody(floorBody);

        // Walls
        for (let i = 0; i < 4; i++) {
            const wall = new THREE.Mesh(
                new THREE.PlaneGeometry(60, 20),
                new THREE.MeshStandardMaterial({ color: this.COLORS[i % this.COLORS.length], side: THREE.DoubleSide })
            );
            const angle = (i * Math.PI) / 2;
            wall.position.set(Math.cos(angle) * 30, 10, Math.sin(angle) * 30);
            wall.rotation.y = -angle + Math.PI / 2;
            this.scene.add(wall);

            const wallBody = new CANNON.Body({ mass: 0 });
            wallBody.addShape(new CANNON.Plane());
            wallBody.position.copy(wall.position);
            wallBody.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), wall.rotation.y);
            this.world.addBody(wallBody);
        }
    },

    /**
     * CREATE PLAYER AND CAMERA ATTACHMENTS
     */
    createPlayer() {
        // Physics Body
        this.playerBody = new CANNON.Body({
            mass: 5,
            shape: new CANNON.Sphere(1),
            fixedRotation: true,
            linearDamping: 0.9
        });
        this.playerBody.position.set(0, 2, 0);
        this.world.addBody(this.playerBody);

        // Visual Pill (Hidden mostly but visible looking down)
        const pill = new THREE.Mesh(
            new THREE.CapsuleGeometry(0.35, 0.8, 4, 8),
            new THREE.MeshStandardMaterial({ color: 0x48dbfb })
        );
        pill.position.y = -1.2;
        this.camera.add(pill);
        this.scene.add(this.camera);

        // Character Hands
        const handMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
        const leftHand = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), handMat);
        leftHand.position.set(-0.45, -0.35, -0.6);
        this.camera.add(leftHand);

        const rightHand = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), handMat);
        rightHand.position.set(0.45, -0.35, -0.6);
        this.camera.add(rightHand);
    },

    /**
     * BALL SPAWNING
     */
    spawnBalls(count) {
        for (let i = 0; i < count; i++) this.createBall();
    },

    createBall() {
        const radius = 0.35 + Math.random() * 0.5;
        const color = this.COLORS[Math.floor(Math.random() * this.COLORS.length)];

        // Mesh
        const ball = new THREE.Mesh(
            new THREE.SphereGeometry(radius, 24, 24),
            new THREE.MeshStandardMaterial({ color, roughness: 0.3, metalness: 0.2 })
        );
        ball.position.set((Math.random() - 0.5) * 45, 5 + Math.random() * 10, (Math.random() - 0.5) * 45);
        ball.castShadow = true;
        this.scene.add(ball);
        this.balls.push(ball);

        // Physics
        const body = new CANNON.Body({
            mass: radius * 2,
            shape: new CANNON.Sphere(radius),
            linearDamping: 0.5,
            angularDamping: 0.5
        });
        body.position.copy(ball.position);
        body.velocity.set((Math.random() - 0.5) * 5, 2, (Math.random() - 0.5) * 5);
        this.world.addBody(body);
        this.ballBodies.push(body);
    },

    /**
     * LIGHTING
     */
    setupLights() {
        this.scene.add(new THREE.AmbientLight(0xffffff, 0.5));
        const sun = new THREE.DirectionalLight(0xffffff, 0.8);
        sun.position.set(20, 30, 20);
        sun.castShadow = true;
        this.scene.add(sun);
    },

    /**
     * UI & CONTROL MAPPING
     */
    bindUI() {
        const playBtn = document.getElementById('play-btn');
        const resumeBtn = document.getElementById('resume-btn');
        const quitBtn = document.getElementById('quit-btn');
        const canvas = document.getElementById('game-canvas');

        // KEY LISTENERS
        window.addEventListener('keydown', (e) => this.keys[e.code] = true);
        window.addEventListener('keyup', (e) => this.keys[e.code] = false);

        // PLAY BUTTON - The core trigger
        playBtn.onclick = () => {
            console.log("BALLMUNCHER: Starting Game...");
            document.getElementById('main-menu').classList.add('hidden');
            document.getElementById('game-container').classList.add('active');
            this.started = true;
            canvas.requestPointerLock();
        };

        // CANVAS CLICK - Re-lock mouse
        canvas.onclick = () => {
            if (this.started && !this.paused) canvas.requestPointerLock();
        };

        // POINTER LOCK EVENTS
        document.addEventListener('pointerlockchange', () => {
            const locked = document.pointerLockElement === canvas;
            document.getElementById('click-prompt').style.display = locked ? 'none' : 'inline';
            document.getElementById('full-controls').style.display = locked ? 'inline' : 'none';
        });

        // MOUSE MUNCHING
        document.addEventListener('mousedown', () => {
            if (document.pointerLockElement === canvas) this.munch();
        });

        // MOUSE LOOK
        document.addEventListener('mousemove', (e) => {
            if (document.pointerLockElement !== canvas) return;
            this.yaw -= e.movementX * 0.0025;
            this.pitch -= e.movementY * 0.0025;
            this.pitch = Math.max(-1.45, Math.min(1.45, this.pitch));
            this.camera.rotation.set(this.pitch, this.yaw, 0, 'YXZ');
        });

        // PAUSE LOGIC
        window.onkeydown = (e) => {
            if (e.code === 'Escape' && this.started) this.togglePause();
        };
        resumeBtn.onclick = () => this.togglePause();
        quitBtn.onclick = () => location.reload();
    },

    togglePause() {
        this.paused = !this.paused;
        document.getElementById('pause-menu').classList.toggle('active', this.paused);
        if (!this.paused) document.getElementById('game-canvas').requestPointerLock();
        else document.exitPointerLock();
    },

    /**
     * INTERACTION LOGIC
     */
    munch() {
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
        const intersects = raycaster.intersectObjects(this.balls);

        if (intersects.length > 0) {
            const ball = intersects[0].object;
            const dist = this.camera.position.distanceTo(ball.position);

            if (dist < 8) {
                this.showMunchEffect();
                this.removeBall(ball);
                this.score++;
                document.getElementById('balls-eaten').innerText = this.score;
                this.createBall();
            }
        }
    },

    showMunchEffect() {
        const emojis = ['😋', '👄', '🤤', '✨', '💨'];
        const effect = document.createElement('div');
        effect.className = 'bite-effect';
        effect.textContent = emojis[Math.floor(Math.random() * emojis.length)];
        effect.style.left = (window.innerWidth / 2 + (Math.random() - 0.5) * 100) + 'px';
        effect.style.top = (window.innerHeight / 2 + (Math.random() - 0.5) * 100) + 'px';
        document.body.appendChild(effect);
        setTimeout(() => effect.remove(), 600);
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

    /**
     * MAIN ENGINE LOOP
     */
    animate() {
        requestAnimationFrame(() => this.animate());

        // 1. Scene background loop (slowly rotate for menu if not started)
        if (!this.started || this.paused) {
            // Render at least something or just return
            if (this.renderer) this.renderer.render(this.scene, this.camera);
            return;
        }

        // 2. Physics Step
        this.world.step(1 / 60);

        // 3. Player Movement
        const speed = 12;
        const inputDir = new THREE.Vector3();
        if (this.keys['KeyW']) inputDir.z -= 1;
        if (this.keys['KeyS']) inputDir.z += 1;
        if (this.keys['KeyA']) inputDir.x -= 1;
        if (this.keys['KeyD']) inputDir.x += 1;

        if (inputDir.lengthSq() > 0) {
            inputDir.normalize();
            // Project input to world space based on camera yaw
            const moveX = (inputDir.x * Math.cos(this.yaw) + inputDir.z * Math.sin(this.yaw));
            const moveZ = (inputDir.z * Math.cos(this.yaw) - inputDir.x * Math.sin(this.yaw));
            this.playerBody.velocity.x = moveX * speed;
            this.playerBody.velocity.z = moveZ * speed;
        } else {
            this.playerBody.velocity.x *= 0.8;
            this.playerBody.velocity.z *= 0.8;
        }

        // Sync Camera
        this.camera.position.copy(this.playerBody.position);

        // 4. Sync Ball Mesh to Physics
        for (let i = 0; i < this.balls.length; i++) {
            this.balls[i].position.copy(this.ballBodies[i].position);
            this.balls[i].quaternion.copy(this.ballBodies[i].quaternion);

            // Keep in bounds
            if (this.ballBodies[i].position.y < -5) {
                this.ballBodies[i].position.set((Math.random() - 0.5) * 40, 10, (Math.random() - 0.5) * 40);
                this.ballBodies[i].velocity.set(0, 0, 0);
            }
        }

        // 5. Render
        this.renderer.render(this.scene, this.camera);
    }
};

// AUTO-START ENGINE
window.addEventListener('load', () => Game.init());

// Window resize handler
window.addEventListener('resize', () => {
    if (Game.camera && Game.renderer) {
        Game.camera.aspect = window.innerWidth / window.innerHeight;
        Game.camera.updateProjectionMatrix();
        Game.renderer.setSize(window.innerWidth, window.innerHeight);
    }
});

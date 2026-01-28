// ============================================
// BALLMUNCHER GAME
// A random game that robert told me to make
// ============================================

// Rate limiting for basic DoS protection
const RateLimiter = {
    actions: 0,
    windowStart: Date.now(),
    maxActions: 100,
    timeWindow: 10000,
    
    check() {
        const now = Date.now();
        if (now - this.windowStart > this.timeWindow) {
            this.actions = 0;
            this.windowStart = now;
        }
        this.actions++;
        return this.actions <= this.maxActions;
    }
};

// ============================================
// GAME STATE
// ============================================

const GameState = {
    started: false,
    paused: false,
    ballsEaten: 0,
    heldBall: null,
    isHolding: false,
    holdStartTime: 0,
    pointerLocked: false
};

// Movement state
const Movement = {
    forward: false,
    backward: false,
    left: false,
    right: false
};

// ============================================
// THREE.JS VARIABLES
// ============================================

let scene, camera, renderer;
let playerBody, leftHand, rightHand;
let balls = [];
let confettiMesh;

// ============================================
// CANNON.JS PHYSICS VARIABLES
// ============================================

let world;
let playerPhysicsBody;
let ballBodies = [];

// Camera rotation
let yaw = 0;
let pitch = 0;

// Colors for balls and effects
const COLORS = ['#ff6b6b', '#feca57', '#48dbfb', '#ff9ff3', '#1dd1a1', '#f368e0', '#5f27cd', '#00d2d3'];

// ============================================
// DOM ELEMENTS
// ============================================

const mainMenu = document.getElementById('main-menu');
const gameContainer = document.getElementById('game-container');
const gameCanvas = document.getElementById('game-canvas');
const pauseMenu = document.getElementById('pause-menu');
const playBtn = document.getElementById('play-btn');
const resumeBtn = document.getElementById('resume-btn');
const quitBtn = document.getElementById('quit-btn');
const ballsEatenDisplay = document.getElementById('balls-eaten');
const clickToStart = document.getElementById('click-to-start');
const controlsInfo = document.getElementById('controls-info');
const crosshair = document.getElementById('crosshair');

// ============================================
// MENU CONFETTI
// ============================================

function createMenuConfetti() {
    const confettiContainer = document.getElementById('menu-confetti');
    for (let i = 0; i < 50; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti-piece';
        confetti.style.left = Math.random() * 100 + '%';
        confetti.style.background = COLORS[Math.floor(Math.random() * COLORS.length)];
        confetti.style.animationDuration = (Math.random() * 3 + 2) + 's';
        confetti.style.animationDelay = Math.random() * 5 + 's';
        confetti.style.borderRadius = Math.random() > 0.5 ? '50%' : '0';
        confettiContainer.appendChild(confetti);
    }
}

// ============================================
// GAME INITIALIZATION
// ============================================

function initGame() {
    // Create Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a2e);
    scene.fog = new THREE.FogExp2(0x1a1a2e, 0.02);

    // Create Camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 2, 5);

    // Create Renderer
    renderer = new THREE.WebGLRenderer({ 
        canvas: gameCanvas,
        antialias: true 
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Initialize Physics
    initPhysics();

    // Create Game Objects
    createRoom();
    createPlayer();
    createBalls(30);
    createConfetti();
    createLighting();

    // Setup Controls
    setupControls();

    // Handle resize
    window.addEventListener('resize', onWindowResize);

    // Start animation loop
    animate();
}

// ============================================
// PHYSICS INITIALIZATION
// ============================================

function initPhysics() {
    world = new CANNON.World();
    world.gravity.set(0, -15, 0);
    world.broadphase = new CANNON.NaiveBroadphase();
    world.solver.iterations = 10;
}

// ============================================
// CREATE ROOM
// ============================================

function createRoom() {
    const roomSize = 40;
    const wallHeight = 15;

    // Floor
    const floorGeo = new THREE.PlaneGeometry(roomSize, roomSize);
    const floorMat = new THREE.MeshStandardMaterial({ 
        color: 0x2d2d44,
        roughness: 0.8
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // Floor physics
    const floorShape = new CANNON.Plane();
    const floorBody = new CANNON.Body({ mass: 0 });
    floorBody.addShape(floorShape);
    floorBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
    world.addBody(floorBody);

    // Walls
    const wallColors = [0xff6b6b, 0x48dbfb, 0xfeca57, 0xff9ff3];
    const wallData = [
        { pos: [0, wallHeight/2, -roomSize/2], rotY: 0 },
        { pos: [0, wallHeight/2, roomSize/2], rotY: Math.PI },
        { pos: [-roomSize/2, wallHeight/2, 0], rotY: Math.PI/2 },
        { pos: [roomSize/2, wallHeight/2, 0], rotY: -Math.PI/2 }
    ];

    wallData.forEach((data, i) => {
        const wallGeo = new THREE.PlaneGeometry(roomSize, wallHeight);
        const wallMat = new THREE.MeshStandardMaterial({ 
            color: wallColors[i],
            roughness: 0.6,
            side: THREE.DoubleSide
        });
        const wall = new THREE.Mesh(wallGeo, wallMat);
        wall.position.set(...data.pos);
        wall.rotation.y = data.rotY;
        wall.receiveShadow = true;
        scene.add(wall);

        // Wall physics
        const wallShape = new CANNON.Plane();
        const wallBody = new CANNON.Body({ mass: 0 });
        wallBody.addShape(wallShape);
        wallBody.position.set(...data.pos);
        const q = new CANNON.Quaternion();
        q.setFromEuler(0, data.rotY, 0);
        wallBody.quaternion.copy(q);
        world.addBody(wallBody);
    });

    // Ceiling
    const ceilingGeo = new THREE.PlaneGeometry(roomSize, roomSize);
    const ceilingMat = new THREE.MeshStandardMaterial({ color: 0x1a1a2e });
    const ceiling = new THREE.Mesh(ceilingGeo, ceilingMat);
    ceiling.position.y = wallHeight;
    ceiling.rotation.x = Math.PI / 2;
    scene.add(ceiling);

    // Random decorative boxes
    for (let i = 0; i < 15; i++) {
        const size = Math.random() * 2 + 0.5;
        const boxGeo = new THREE.BoxGeometry(size, size, size);
        const boxMat = new THREE.MeshStandardMaterial({ 
            color: parseInt(COLORS[Math.floor(Math.random() * COLORS.length)].replace('#', '0x')),
            roughness: 0.4,
            metalness: 0.3
        });
        const box = new THREE.Mesh(boxGeo, boxMat);
        box.position.set(
            (Math.random() - 0.5) * (roomSize - 8),
            size / 2,
            (Math.random() - 0.5) * (roomSize - 8)
        );
        box.rotation.y = Math.random() * Math.PI;
        box.castShadow = true;
        box.receiveShadow = true;
        scene.add(box);

        // Box physics
        const boxShape = new CANNON.Box(new CANNON.Vec3(size/2, size/2, size/2));
        const boxBody = new CANNON.Body({ mass: 0 });
        boxBody.addShape(boxShape);
        boxBody.position.set(box.position.x, box.position.y, box.position.z);
        world.addBody(boxBody);
    }
}

// ============================================
// CREATE PLAYER
// ============================================

function createPlayer() {
    // Player physics body
    const playerShape = new CANNON.Sphere(0.5);
    playerPhysicsBody = new CANNON.Body({ 
        mass: 80,
        fixedRotation: true,
        linearDamping: 0.9
    });
    playerPhysicsBody.addShape(playerShape);
    playerPhysicsBody.position.set(0, 2, 5);
    world.addBody(playerPhysicsBody);

    // Player visual body (attached to camera)
    const bodyGroup = new THREE.Group();

    // Pill body (visible when looking down)
    const pillGeo = new THREE.CapsuleGeometry(0.25, 0.6, 8, 16);
    const pillMat = new THREE.MeshStandardMaterial({ 
        color: 0x48dbfb,
        roughness: 0.3,
        metalness: 0.6
    });
    playerBody = new THREE.Mesh(pillGeo, pillMat);
    playerBody.position.set(0, -0.7, 0);
    playerBody.castShadow = true;
    bodyGroup.add(playerBody);

    // Ball hands
    const handGeo = new THREE.SphereGeometry(0.12, 16, 16);
    const handMat = new THREE.MeshStandardMaterial({ 
        color: 0xfeca57,
        roughness: 0.2,
        metalness: 0.7
    });

    leftHand = new THREE.Mesh(handGeo, handMat);
    leftHand.position.set(-0.35, -0.25, -0.4);
    leftHand.castShadow = true;
    bodyGroup.add(leftHand);

    rightHand = new THREE.Mesh(handGeo, handMat);
    rightHand.position.set(0.35, -0.25, -0.4);
    rightHand.castShadow = true;
    bodyGroup.add(rightHand);

    camera.add(bodyGroup);
    scene.add(camera);
}

// ============================================
// CREATE BALLS
// ============================================

function createBalls(count) {
    for (let i = 0; i < count; i++) {
        createBall();
    }
}

function createBall(position = null) {
    if (!RateLimiter.check()) return null;

    const radius = Math.random() * 0.4 + 0.25;
    const hasFace = Math.random() > 0.4;
    const colorHex = parseInt(COLORS[Math.floor(Math.random() * COLORS.length)].replace('#', '0x'));

    // Ball mesh
    const ballGeo = new THREE.SphereGeometry(radius, 24, 24);
    const ballMat = new THREE.MeshStandardMaterial({ 
        color: colorHex,
        roughness: 0.2,
        metalness: 0.4
    });
    const ball = new THREE.Mesh(ballGeo, ballMat);

    const pos = position || {
        x: (Math.random() - 0.5) * 30,
        y: Math.random() * 6 + 2,
        z: (Math.random() - 0.5) * 30
    };

    ball.position.set(pos.x, pos.y, pos.z);
    ball.castShadow = true;
    ball.receiveShadow = true;

    // Add face to some balls
    if (hasFace) {
        const faceGroup = new THREE.Group();

        // Eyes
        const eyeGeo = new THREE.SphereGeometry(radius * 0.12, 12, 12);
        const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const pupilGeo = new THREE.SphereGeometry(radius * 0.06, 12, 12);
        const pupilMat = new THREE.MeshBasicMaterial({ color: 0x000000 });

        const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
        leftEye.position.set(-radius * 0.3, radius * 0.2, radius * 0.9);
        const leftPupil = new THREE.Mesh(pupilGeo, pupilMat);
        leftPupil.position.set(-radius * 0.3, radius * 0.2, radius * 0.98);

        const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
        rightEye.position.set(radius * 0.3, radius * 0.2, radius * 0.9);
        const rightPupil = new THREE.Mesh(pupilGeo, pupilMat);
        rightPupil.position.set(radius * 0.3, radius * 0.2, radius * 0.98);

        // Happy mouth
        const mouthGeo = new THREE.TorusGeometry(radius * 0.15, radius * 0.025, 8, 16, Math.PI);
        const mouthMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
        const mouth = new THREE.Mesh(mouthGeo, mouthMat);
        mouth.position.set(0, -radius * 0.15, radius * 0.9);
        mouth.rotation.x = Math.PI;
        mouth.rotation.z = Math.PI;

        faceGroup.add(leftEye, leftPupil, rightEye, rightPupil, mouth);
        ball.add(faceGroup);
        ball.userData.face = faceGroup;
        ball.userData.hasFace = true;
        ball.userData.faceState = 'happy';
    }

    ball.userData.radius = radius;
    ball.userData.originalRadius = radius;
    ball.userData.biteCount = 0;
    ball.userData.maxBites = Math.floor(radius * 8) + 2;

    scene.add(ball);
    balls.push(ball);

    // Ball physics
    const ballShape = new CANNON.Sphere(radius);
    const ballBody = new CANNON.Body({ 
        mass: radius * 3,
        linearDamping: 0.4,
        angularDamping: 0.4
    });
    ballBody.addShape(ballShape);
    ballBody.position.set(pos.x, pos.y, pos.z);
    
    // Random velocity
    ballBody.velocity.set(
        (Math.random() - 0.5) * 4,
        Math.random() * 2,
        (Math.random() - 0.5) * 4
    );

    world.addBody(ballBody);
    ballBodies.push(ballBody);
    ball.userData.physicsBody = ballBody;
    ball.userData.physicsIndex = ballBodies.length - 1;

    return ball;
}

// ============================================
// CREATE CONFETTI
// ============================================

function createConfetti() {
    const confettiCount = 300;
    const positions = [];
    const colors = [];
    const velocities = [];

    for (let i = 0; i < confettiCount; i++) {
        positions.push(
            (Math.random() - 0.5) * 40,
            Math.random() * 15,
            (Math.random() - 0.5) * 40
        );
        
        const color = new THREE.Color(COLORS[Math.floor(Math.random() * COLORS.length)]);
        colors.push(color.r, color.g, color.b);

        velocities.push({
            x: (Math.random() - 0.5) * 0.02,
            y: -Math.random() * 0.03 - 0.01,
            z: (Math.random() - 0.5) * 0.02
        });
    }

    const confettiGeo = new THREE.BufferGeometry();
    confettiGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    confettiGeo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    const confettiMat = new THREE.PointsMaterial({
        size: 0.15,
        vertexColors: true,
        transparent: true,
        opacity: 0.9
    });

    confettiMesh = new THREE.Points(confettiGeo, confettiMat);
    confettiMesh.userData.velocities = velocities;
    scene.add(confettiMesh);
}

// ============================================
// CREATE LIGHTING
// ============================================

function createLighting() {
    // Ambient
    const ambient = new THREE.AmbientLight(0x404080, 0.6);
    scene.add(ambient);

    // Main directional light
    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(10, 20, 10);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 60;
    dirLight.shadow.camera.left = -30;
    dirLight.shadow.camera.right = 30;
    dirLight.shadow.camera.top = 30;
    dirLight.shadow.camera.bottom = -30;
    scene.add(dirLight);

    // Colored point lights
    const pointLight1 = new THREE.PointLight(0xff6b6b, 0.8, 25);
    pointLight1.position.set(-15, 10, -15);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0x48dbfb, 0.8, 25);
    pointLight2.position.set(15, 10, 15);
    scene.add(pointLight2);

    const pointLight3 = new THREE.PointLight(0xfeca57, 1, 30);
    pointLight3.position.set(0, 12, 0);
    scene.add(pointLight3);
}

// ============================================
// CONTROLS
// ============================================

function setupControls() {
    // Pointer lock on canvas click
    gameCanvas.addEventListener('click', () => {
        if (!GameState.paused && GameState.started && !GameState.pointerLocked) {
            gameCanvas.requestPointerLock();
        }
    });

    // Pointer lock change
    document.addEventListener('pointerlockchange', () => {
        GameState.pointerLocked = document.pointerLockElement === gameCanvas;
        
        if (GameState.pointerLocked) {
            clickToStart.style.display = 'none';
            controlsInfo.style.display = 'inline';
            crosshair.style.display = 'block';
        } else {
            if (GameState.started && !GameState.paused) {
                clickToStart.style.display = 'inline';
                controlsInfo.style.display = 'none';
            }
        }
    });

    // Mouse movement for looking
    document.addEventListener('mousemove', (e) => {
        if (!GameState.pointerLocked || GameState.paused) return;

        yaw -= e.movementX * 0.002;
        pitch -= e.movementY * 0.002;
        pitch = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, pitch));

        camera.rotation.order = 'YXZ';
        camera.rotation.y = yaw;
        camera.rotation.x = pitch;
    });

    // Keyboard controls
    document.addEventListener('keydown', (e) => {
        if (!GameState.started) return;

        switch (e.code) {
            case 'KeyW': Movement.forward = true; break;
            case 'KeyS': Movement.backward = true; break;
            case 'KeyA': Movement.left = true; break;
            case 'KeyD': Movement.right = true; break;
            case 'Escape': togglePause(); break;
        }
    });

    document.addEventListener('keyup', (e) => {
        switch (e.code) {
            case 'KeyW': Movement.forward = false; break;
            case 'KeyS': Movement.backward = false; break;
            case 'KeyA': Movement.left = false; break;
            case 'KeyD': Movement.right = false; break;
        }
    });

    // Mouse click for eating/grabbing
    document.addEventListener('mousedown', (e) => {
        if (!GameState.pointerLocked || GameState.paused) return;
        if (!RateLimiter.check()) return;

        GameState.isHolding = true;
        GameState.holdStartTime = Date.now();

        // Raycast to find ball
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);

        const intersects = raycaster.intersectObjects(balls.filter(b => b.visible));

        if (intersects.length > 0) {
            const hitBall = intersects[0].object;
            const distance = camera.position.distanceTo(hitBall.position);
            
            if (distance < 6) {
                GameState.heldBall = hitBall;
            }
        }
    });

    document.addEventListener('mouseup', (e) => {
        if (!GameState.pointerLocked || GameState.paused) return;

        const holdDuration = Date.now() - GameState.holdStartTime;

        if (GameState.heldBall) {
            if (holdDuration < 200) {
                // Quick click = bite
                biteBall(GameState.heldBall);
            } else {
                // Hold and release = throw
                throwBall(GameState.heldBall);
            }
            GameState.heldBall = null;
        }

        GameState.isHolding = false;
    });
}

// ============================================
// BALL INTERACTIONS
// ============================================

function biteBall(ball) {
    if (!RateLimiter.check()) return;

    ball.userData.biteCount++;

    // Visual bite effect
    showBiteEffect();

    // Shrink ball
    const shrinkFactor = 1 - (ball.userData.biteCount / ball.userData.maxBites);
    
    if (shrinkFactor <= 0.1 || ball.userData.biteCount >= ball.userData.maxBites) {
        // Ball fully eaten
        eatBall(ball);
    } else {
        ball.scale.setScalar(shrinkFactor);
        ball.userData.radius = ball.userData.originalRadius * shrinkFactor;

        // Update physics
        const body = ball.userData.physicsBody;
        if (body && body.shapes[0]) {
            body.shapes[0].radius = ball.userData.radius;
            body.updateBoundingRadius();
        }

        // Change face if has one
        if (ball.userData.hasFace && ball.userData.faceState !== 'scared') {
            changeFace(ball, 'scared');
        }

        // Add bite mark
        addBiteMark(ball);
    }
}

function showBiteEffect() {
    const emojis = ['😋', '🤤', '😈', '👄', '🦷'];
    const biteDiv = document.createElement('div');
    biteDiv.className = 'bite-effect';
    biteDiv.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    biteDiv.style.left = (window.innerWidth / 2 + (Math.random() - 0.5) * 100) + 'px';
    biteDiv.style.top = (window.innerHeight / 2 + (Math.random() - 0.5) * 100) + 'px';
    document.body.appendChild(biteDiv);
    setTimeout(() => biteDiv.remove(), 500);
}

function addBiteMark(ball) {
    const biteGeo = new THREE.SphereGeometry(ball.userData.radius * 0.25, 8, 8, 0, Math.PI);
    const biteMat = new THREE.MeshBasicMaterial({ 
        color: 0x4a2c2a,
        side: THREE.DoubleSide
    });
    const biteMark = new THREE.Mesh(biteGeo, biteMat);

    // Position based on camera direction
    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    dir.negate();
    
    biteMark.position.copy(dir.multiplyScalar(ball.userData.radius * 0.85));
    biteMark.lookAt(new THREE.Vector3(0, 0, 0));

    ball.add(biteMark);
}

function changeFace(ball, state) {
    if (!ball.userData.face) return;

    ball.userData.faceState = state;
    const face = ball.userData.face;
    const radius = ball.userData.originalRadius;

    // Find and remove old mouth
    for (let i = face.children.length - 1; i >= 0; i--) {
        const child = face.children[i];
        if (child.geometry && child.geometry.type === 'TorusGeometry') {
            face.remove(child);
            child.geometry.dispose();
            break;
        }
    }

    // Create scared mouth (O shape)
    const mouthGeo = new THREE.TorusGeometry(radius * 0.1, radius * 0.025, 8, 16);
    const mouthMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const mouth = new THREE.Mesh(mouthGeo, mouthMat);
    mouth.position.set(0, -radius * 0.15, radius * 0.9);
    mouth.rotation.x = Math.PI / 2;
    
    face.add(mouth);
}

function eatBall(ball) {
    // Remove from scene
    scene.remove(ball);

    // Remove physics body
    const body = ball.userData.physicsBody;
    const bodyIndex = ballBodies.indexOf(body);
    if (bodyIndex > -1) {
        world.removeBody(body);
        ballBodies.splice(bodyIndex, 1);
    }

    // Remove from balls array
    const ballIndex = balls.indexOf(ball);
    if (ballIndex > -1) {
        balls.splice(ballIndex, 1);
    }

    // Update score
    GameState.ballsEaten++;
    ballsEatenDisplay.textContent = GameState.ballsEaten;

    // Spawn new ball after delay
    setTimeout(() => createBall(), 800);
}

function throwBall(ball) {
    const body = ball.userData.physicsBody;
    if (!body) return;

    // Get throw direction
    const throwDir = new THREE.Vector3();
    camera.getWorldDirection(throwDir);

    const force = 35;
    body.velocity.set(
        throwDir.x * force,
        throwDir.y * force + 5,
        throwDir.z * force
    );

    // Add spin
    body.angularVelocity.set(
        (Math.random() - 0.5) * 15,
        (Math.random() - 0.5) * 15,
        (Math.random() - 0.5) * 15
    );
}

// ============================================
// ANIMATION LOOP
// ============================================

function animate() {
    requestAnimationFrame(animate);

    if (!GameState.started || GameState.paused) return;

    const delta = 1 / 60;

    // Update physics
    world.step(delta);

    // Update player movement
    if (GameState.pointerLocked) {
        const speed = 12;
        const forward = new THREE.Vector3();
        camera.getWorldDirection(forward);
        forward.y = 0;
        forward.normalize();

        const right = new THREE.Vector3();
        right.crossVectors(forward, new THREE.Vector3(0, 1, 0));

        let vx = 0, vz = 0;

        if (Movement.forward) {
            vx += forward.x * speed;
            vz += forward.z * speed;
        }
        if (Movement.backward) {
            vx -= forward.x * speed;
            vz -= forward.z * speed;
        }
        if (Movement.left) {
            vx -= right.x * speed;
            vz -= right.z * speed;
        }
        if (Movement.right) {
            vx += right.x * speed;
            vz += right.z * speed;
        }

        playerPhysicsBody.velocity.x = vx;
        playerPhysicsBody.velocity.z = vz;

        // Keep player on ground
        if (playerPhysicsBody.position.y < 1.5) {
            playerPhysicsBody.position.y = 1.5;
            playerPhysicsBody.velocity.y = 0;
        }
    }

    // Sync camera to physics
    camera.position.x = playerPhysicsBody.position.x;
    camera.position.y = playerPhysicsBody.position.y + 0.5;
    camera.position.z = playerPhysicsBody.position.z;

    // Update balls
    balls.forEach((ball, i) => {
        const body = ball.userData.physicsBody;
        if (!body) return;

        // If held, move to in front of camera
        if (ball === GameState.heldBall && GameState.isHolding) {
            const holdPos = new THREE.Vector3();
            camera.getWorldDirection(holdPos);
            holdPos.multiplyScalar(2);
            holdPos.add(camera.position);
            holdPos.y -= 0.2;

            body.position.set(holdPos.x, holdPos.y, holdPos.z);
            body.velocity.set(0, 0, 0);
        }

        // Sync visual to physics
        ball.position.copy(body.position);
        ball.quaternion.copy(body.quaternion);

        // Keep balls in bounds
        if (body.position.y < ball.userData.radius) {
            body.position.y = ball.userData.radius;
            body.velocity.y = Math.abs(body.velocity.y) * 0.6;
        }

        // Respawn if fell out
        if (body.position.y < -20 || Math.abs(body.position.x) > 25 || Math.abs(body.position.z) > 25) {
            body.position.set(
                (Math.random() - 0.5) * 20,
                Math.random() * 5 + 5,
                (Math.random() - 0.5) * 20
            );
            body.velocity.set(0, 0, 0);
        }
    });

    // Animate confetti
    if (confettiMesh) {
        const positions = confettiMesh.geometry.attributes.position.array;
        const velocities = confettiMesh.userData.velocities;

        for (let i = 0; i < positions.length / 3; i++) {
            positions[i * 3] += velocities[i].x;
            positions[i * 3 + 1] += velocities[i].y;
            positions[i * 3 + 2] += velocities[i].z;

            // Reset if below floor
            if (positions[i * 3 + 1] < 0) {
                positions[i * 3 + 1] = 15;
                positions[i * 3] = (Math.random() - 0.5) * 40;
                positions[i * 3 + 2] = (Math.random() - 0.5) * 40;
            }
        }
        confettiMesh.geometry.attributes.position.needsUpdate = true;
    }

    // Animate hands
    const time = Date.now() * 0.003;
    if (leftHand) leftHand.position.y = -0.25 + Math.sin(time) * 0.03;
    if (rightHand) rightHand.position.y = -0.25 + Math.sin(time + Math.PI) * 0.03;

    // Render
    renderer.render(scene, camera);
}

// ============================================
// GAME CONTROL FUNCTIONS
// ============================================

function startGame() {
    mainMenu.classList.add('hidden');
    gameContainer.classList.add('active');
    GameState.started = true;

    if (!scene) {
        initGame();
    }
}

function togglePause() {
    if (!GameState.started) return;

    GameState.paused = !GameState.paused;

    if (GameState.paused) {
        document.exitPointerLock();
        pauseMenu.classList.add('active');
    } else {
        pauseMenu.classList.remove('active');
    }
}

function quitToMenu() {
    GameState.paused = false;
    GameState.started = false;
    pauseMenu.classList.remove('active');
    gameContainer.classList.remove('active');
    mainMenu.classList.remove('hidden');
    document.exitPointerLock();
}

function onWindowResize() {
    if (camera && renderer) {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }
}

// ============================================
// EVENT LISTENERS
// ============================================

playBtn.addEventListener('click', startGame);
resumeBtn.addEventListener('click', () => {
    pauseMenu.classList.remove('active');
    GameState.paused = false;
});
quitBtn.addEventListener('click', quitToMenu);

// Initialize menu confetti on load
createMenuConfetti();

import * as THREE from "three"
//orbit control
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { FBXLoader } from "three/addons/loaders/FBXLoader.js";
import { Sky } from 'three/addons/objects/Sky.js';


/* ================ */

//setup Canvas Renderer
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

renderer.shadowMap.enabled = true;

//setup scene
const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0xFFB35C, 100, 900);

//setup camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0, 50);
camera.lookAt(0, 0, 0);

//setup orbit control
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 5, 0);
controls.update();

// Ambient Light
var color = 0xFFFFFF;
var intensity = 0.3;
var light = new THREE.AmbientLight(color, intensity);
scene.add(light);

// Hemisphere Light
const HemisphereLight = new THREE.HemisphereLight(0xFFFFFF, 0xFFFFFF, 1);
HemisphereLight.position.set(10, 11, 15)
scene.add(HemisphereLight);

const sky = new Sky();
sky.scale.setScalar(450000);
scene.add(sky);

const sun = new THREE.Vector3();
const effectController = {
    turbidity: 10,
    rayleigh: 2,
    mieCoefficient: 0.005,
    mieDirectionalG: 0.7,
    elevation: 2, // Low elevation for a "Golden Hour" look
    azimuth: 180,
};

const skyUniforms = sky.material.uniforms;
skyUniforms['turbidity'].value = effectController.turbidity;
skyUniforms['rayleigh'].value = effectController.rayleigh;
skyUniforms['mieCoefficient'].value = effectController.mieCoefficient;
skyUniforms['mieDirectionalG'].value = effectController.mieDirectionalG;

const phi = THREE.MathUtils.degToRad(90 - effectController.elevation);
const theta = THREE.MathUtils.degToRad(effectController.azimuth);
sun.setFromSphericalCoords(1, phi, theta);
skyUniforms['sunPosition'].value.copy(sun);


const sunLight = new THREE.DirectionalLight(0xffe9c0, 2.5);
sunLight.position.set(-90, 100, -50);
sunLight.target.position.set(30, -5, 50)
sunLight.castShadow = true;
sunLight.shadow.camera.near = 0.5;    
sunLight.shadow.camera.far = 500;
sunLight.shadow.camera.left = -50;    
sunLight.shadow.camera.right = 50;
sunLight.shadow.camera.top = 50;
sunLight.shadow.camera.bottom = -50;
sunLight.shadow.mapSize.width = 2048;
sunLight.shadow.mapSize.height = 2048;
sunLight.shadow.bias = -0.0001;
// scene.add(new THREE.CameraHelper(sunLight.shadow.camera)) 
scene.add(sunLight);
scene.add(sunLight.target)

// --- GROUND SETTINGS ---
const groundSize = 2000;
const groundGeometry = new THREE.PlaneGeometry(groundSize, groundSize);
const groundMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xFFFDD0,
    roughness: 0.8, 
    metalness: 0.2 
});

const ground = new THREE.Mesh(groundGeometry, groundMaterial);

// Rotate to make it horizontal
ground.rotation.x = -Math.PI / 2; 

ground.receiveShadow = true;

ground.position.y = 10; 

scene.add(ground);

// OPTIONAL: Add a Grid Helper to see the floor clearly
// const grid = new THREE.GridHelper(groundSize, 100, 0x000000, 0x000000);
// grid.position.y = 0.21; // Slightly above ground to avoid "z-fighting" flickering
// grid.material.opacity = 0.2;
// grid.material.transparent = true;
// scene.add(grid);

let mixer;
const clock = new THREE.Clock();

// === CAMERA TIMELINE HELPERS ===
const cameraClock = new THREE.Clock();
let cameraShotStartTime = 0;
let currentCameraIndex = 0;
let staticLookTarget = new THREE.Vector3();

function getCharacterForward() {
    if (!charObject) return new THREE.Vector3(0, 0, 1);
    return new THREE.Vector3(0, 0, 1).applyQuaternion(charObject.quaternion).normalize();
}

function snapCamera(pos, lookAt) {
    camera.position.copy(pos);
    camera.lookAt(lookAt);
    controls.target.copy(lookAt);
    controls.update();
}

const cameraTimeline = [
    // === 1️⃣ FOLLOW SHOT (The Approach) ===
    {
        duration: 9, 
        start: () => {
            if (charObject) {
                const pos = charObject.position.clone().add(new THREE.Vector3(15, 6, 0));
                camera.position.copy(pos);
            }
        },
        update: () => {
            if (!charObject) return;
            const targetPos = charObject.position.clone().add(new THREE.Vector3(5, 3, 5));
            camera.position.lerp(targetPos, 0.05);
            const lookTarget = charObject.position.clone().add(new THREE.Vector3(0, 3, 0));
            camera.lookAt(lookTarget);
            controls.target.copy(lookTarget); 
        }
    },

    // === 2️⃣ INSIDE TRAIN: STATIC (With Debug Log) ===
    {
        duration: 3,
        start: () => {
            let lookAtTarget;
            // HELPER: This prints the character's exact position to the console
            // so you can copy these values and adjust camera.position.set() below.
            if (charObject) {
                console.log("📍 Shot 2 Start - Char Pos:", charObject.position);
                lookAtTarget = charObject.position;
            }

            // Adjust these numbers based on the log output!
            // Example: If char is at (6.6, 9.5, -5), put camera at (6.6, 11, -10)
            camera.position.set(12.5, 11.5, -12); 
            
            if (charObject) {
                camera.lookAt(lookAtTarget);
                controls.target.copy(lookAtTarget);
            }
        },
        update: () => {
             // Keep looking at character head even if they move slightly
             if (charObject) {
                 const lookAtTarget = charObject.position.clone().add(new THREE.Vector3(0, 0, 0));
                 camera.lookAt(lookAtTarget);
             }
        }
    },

    // === 3️⃣ INSIDE TRAIN: DOLLY BACK ===
    {
        duration: 3,
        start: () => {
            camera.position.set(6.6, 11, -12);
        },
        update: () => {
            if (!charObject) return;
            camera.position.z -= 0.08; 
            const charHead = charObject.position.clone().add(new THREE.Vector3(0, 3.5, 0));
            camera.lookAt(charHead);
            controls.target.copy(charHead);
        }
    },

    // === 4️⃣ FINAL SHOT: FRONT FOLLOW (Moving Backward) ===
    {
        duration: 999, // Run until animation ends
        start: () => {
            // Optional: Snap to front immediately if needed
            // camera.position.set( ... )
        },
        update: () => {
            if (!charObject) return;

            // Offset: Place camera 8 units IN FRONT (X axis) and 2 units UP
            // Since character walks towards +X, we place camera at +X relative to them.
            const offset = new THREE.Vector3(-0.8, 1, 0); 
            const targetPos = charObject.position.clone().add(offset);

            // Smoothly move camera to that position (Camera backs up as char approaches)
            camera.position.lerp(targetPos, 0.1);

            // Look at Character Head
            const lookTarget = charObject.position.clone().add(new THREE.Vector3(0, 1, 0));
            camera.lookAt(lookTarget);
            controls.target.copy(lookTarget);
        }
    }
];


let currentPhase = "walk_out";
let currentPhaseIndex = 0;
let hasExitedIdle = false;
let hasExitedWalkOut = false;
let isTurning = false;
let walkStopped = false;
let turnTimer = 0;


const TURN_DURATION = 1.2;
const walkSpeed = 2.5;
const prevCharacterPos = new THREE.Vector3();

// REPLACE your existing phaseOrder with this:
const phaseOrder = [
    { id: "walk_out",   duration: 9.0 },  // First walk is long
    { id: "turn_left",  duration: 1.2 },
    { id: "walk_left",  duration: 2.0 },
    { id: "turn_right",  duration: 1.2 },
    { id: "walk_out",    duration: 1.0 },
    { id: "turn_left", duration: 1.2 },
    { id: "sit",        duration: 5.0 },
    { id: "stand",      duration: 2.0 },
    { id: "turn_left", duration: 1.2 },
    { id: "walk_in",   duration: 1.0 },  // <--- REUSING walk_out with DIFFERENT duration!
    { id: "turn_left", duration: 1.2 },
    { id: "walk_right", duration: 2.0 }
];




// === GLOBAL CONTROL FLAGS ===
let phaseStartTime = 0;
let phaseElapsed = 0;

const phases = {
    walk_out:   { action: "walk",       timeScale: 1.0, move: (char, delta) => char.position.z -= 2.5 * delta },
    turn_left:  { action: "turn_left",  timeScale: 1.0, rotate: (char, delta, duration) => char.rotation.y += (Math.PI / 2) * (delta / duration) },
    walk_left:  { action: "walk",       timeScale: 1.2, move: (char, delta) => char.position.x -= 2.5 * delta },
    turn_right: { action: "turn_right", timeScale: 1.0, rotate: (char, delta, duration) => char.rotation.y -= (Math.PI / 2) * (delta / duration) },
    walk_in:    { action: "walk",       timeScale: 0.8, move: (char, delta) => char.position.z += 2.5 * delta },
    sit:        { action: "sit",        timeScale: 0.9 },
    stand:      { action: "stand",      timeScale: 1.0 },
    walk_right: { action: "walk",       timeScale: 1.2, move: (char, delta) => char.position.x += 2.5 * delta },
};


let animationStartTime = null;
let animationPlaying = false;



// === PROMISE-BASED LOADER HELPERS ===
function loadFBX(path, file) {
    return new Promise((resolve, reject) => {
        const loader = new FBXLoader();
        loader.setPath(path);
        loader.load(file, resolve, undefined, reject);
    });
}

function loadGLTF(path, file) {
    return new Promise((resolve, reject) => {
        const loader = new GLTFLoader();
        loader.setPath(path);
        loader.load(file, resolve, undefined, reject);
    });
}

// === SCENE ASSET PROMISES ===
const loadPromises = [
    loadFBX("Jinhsi/", "Walking.fbx"),                      // Character
    loadFBX("Jinhsi/", "Left Turn 90.fbx"),
    loadFBX("Jinhsi/", "Right Turn.fbx"),  
    loadFBX("Jinhsi/", "Sit to stand.fbx"),  
    loadFBX("Jinhsi/", "Sitting.fbx"),  
    loadFBX("TrainStation/source/", "Train Station.fbx"),   // Station
    loadGLTF("Train/Body/", "scene.gltf"),                  // Train Body
    loadGLTF("Train/Head/", "scene.gltf")                   // Train Head
];

// === GLOBALS ===
let charObject = null;
let trainMixer;
let allAssetsLoaded = false;

let actions = {};       // stores all animation actions
let activeAction = null; 
function playPhaseAction(phaseName) {
    const phase = phases[phaseName];
    if (!phase || !phase.action) return;

    const clipAction = actions[phase.action];
    if (!clipAction) return;

    // === FIX 1: Remove the duration calculation. Use the manual timeScale or default to 1.
    const speed = phase.timeScale ?? 1.0;

    // --- stop old animation cleanly
    if (activeAction && activeAction !== clipAction) {
        activeAction.stop();
    }

    // --- reset and play new animation
    clipAction.reset();
    clipAction.timeScale = speed;

    // === FIX 2: Set Loop Mode based on the action type
    // If it's a walk, we want it to Repeat. 
    // If it's a Turn/Sit/Stand, we usually want it to play Once and freeze.
    if (phase.action === "walk") {
        clipAction.loop = THREE.LoopRepeat;
    } else {
        clipAction.loop = THREE.LoopOnce;
        clipAction.clampWhenFinished = true; // Freeze on last frame
    }

    clipAction.play();

    activeAction = clipAction;
}

Promise.all(loadPromises).then(([fbxChar, fbxLeftTurn, fbxRighTurn, fbxStand , fbxSit, fbxStation, gltfBody, gltfHead]) => {

    console.log("✅ All assets loaded.");

    // ===== CHARACTER =====
    fbxChar.scale.setScalar(0.004);
    fbxChar.position.set(11.5, 11.2, 10);
    fbxChar.rotation.y = Math.PI;
    scene.add(fbxChar);

    fbxChar.traverse(obj => {

        if (obj.isMesh || obj.isSkinnedMesh) {
            obj.castShadow = true;
            obj.receiveShadow = true;

            if (obj.material) {
                obj.material.needsUpdate = true;
            }
        }

        if (obj.material) {
            obj.material.shadowSide = THREE.DoubleSide;
        }

        if (obj.isLight) {
            obj.intensity = 0;
        }
    });
    charObject = fbxChar;

    // ===== TRAIN STATION =====
    fbxStation.scale.setScalar(0.01);
    fbxStation.position.set(10, 5, 20);
    scene.add(fbxStation);

    fbxStation.traverse((obj) => {
        if (obj.isMesh || obj.isSkinnedMesh) {
            obj.castShadow = true;
            obj.receiveShadow = true;
        }
    });


    // ===== TRAIN BODY =====
    const trainBody = gltfBody.scene;
    trainBody.traverse((node) => {
        if (node.isMesh) {
            node.castShadow = true;
            node.receiveShadow = true;
        }
        if (node.isLight) node.parent.remove(node);
    });
    trainBody.scale.set(0.7, 1, 0.7);
    trainBody.position.set(6.6, 9.5, -15.5);
    scene.add(trainBody);

    if (gltfBody.animations?.length) {
        trainMixer = new THREE.AnimationMixer(trainBody);
        gltfBody.animations.forEach((clip) => trainMixer.clipAction(clip).play());
    }

    // === SETUP CHARACTER ANIMATIONS ===
    mixer = new THREE.AnimationMixer(fbxChar);

    actions.walk       = mixer.clipAction(fbxChar.animations[0]);
    actions.turn_left  = mixer.clipAction(fbxLeftTurn.animations[0]);
    actions.turn_right = mixer.clipAction(fbxRighTurn.animations[0]);
    actions.sit        = mixer.clipAction(fbxSit.animations[0]);
    actions.stand      = mixer.clipAction(fbxStand.animations[0]);

    activeAction = null;



    // ===== TRAIN HEAD =====
    const trainHead = gltfHead.scene;
    trainHead.traverse((node) => {
        if (node.isMesh) {
            node.castShadow = true;
            node.receiveShadow = true;
        }
        if (node.isLight) node.parent.remove(node);
    });
    trainHead.scale.set(0.7, 1, 0.7);
    trainHead.position.set(6.6, 9, -4.5);
    scene.add(trainHead);

    allAssetsLoaded = true;
    console.log("🎬 Starting animation timeline...");
    startAnimationSequences();
});

function startPhase(stepData) {
    if (!stepData) return;

    // We look up the behavior logic using the ID
    const phaseLogic = phases[stepData.id]; 

    if (phaseLogic) {
        // Pass the ID to play the correct animation clip
        playPhaseAction(stepData.id); 
        console.log(`🎬 Phase → ${stepData.id} (Duration: ${stepData.duration}s)`);
    }
    
    // Reset timer for this specific phase
    phaseStartTime = clock.getElapsedTime();
}

// =======================
// CAMERA MOVEMENT SYSTEM
// =======================

const movement = {
    forward: false,
    backward: false,
    left: false,
    right: false,
};

const rotation = {
    left: false,
    right: false,
    up: false,
    down: false,
};

const moveSpeed = 0.8;      // camera move speed


window.addEventListener("keydown", (e) => {
    switch (e.code) {
        case "KeyW": movement.forward = true; break;
        case "KeyS": movement.backward = true; break;
        case "KeyA": movement.left = true; break;
        case "KeyD": movement.right = true; break;
    }
});

window.addEventListener("keyup", (e) => {
    switch (e.code) {
        case "KeyW": movement.forward = false; break;
        case "KeyS": movement.backward = false; break;
        case "KeyA": movement.left = false; break;
        case "KeyD": movement.right = false; break;
    }
});

function updateCameraMovement() {
    const direction = new THREE.Vector3();

    if (movement.forward) {
        camera.getWorldDirection(direction);
        camera.position.addScaledVector(direction, moveSpeed);
    }
    if (movement.backward) {
        camera.getWorldDirection(direction);
        camera.position.addScaledVector(direction, -moveSpeed);
    }
    if (movement.left) {
        camera.getWorldDirection(direction);
        direction.cross(camera.up).normalize();
        camera.position.addScaledVector(direction, -moveSpeed);
    }
    if (movement.right) {
        camera.getWorldDirection(direction);
        direction.cross(camera.up).normalize();
        camera.position.addScaledVector(direction, moveSpeed);
    }

    const front = new THREE.Vector3();
    camera.getWorldDirection(front);
    controls.target.copy(camera.position).add(front.multiplyScalar(10));
    controls.update();
}

function updateCameraTimeline() {
    // === FIX: SAFETY CHECK ===
    // If we have run out of shots, stop here to prevent the "undefined" error.
    if (currentCameraIndex >= cameraTimeline.length || !charObject) return;

    const shot = cameraTimeline[currentCameraIndex];
    const elapsed = cameraClock.getElapsedTime() - cameraShotStartTime;

    if (elapsed === 0 && shot.start) shot.start();
    if (elapsed < shot.duration && shot.update) shot.update();

    // Move to next shot
    if (elapsed >= shot.duration) {
        currentCameraIndex++;
        if (currentCameraIndex < cameraTimeline.length) {
            cameraShotStartTime = cameraClock.getElapsedTime();
            cameraTimeline[currentCameraIndex].start();
        }
    }
}

function startAnimationSequences() {
    animationPlaying = true;
    animationStartTime = clock.getElapsedTime();
    phaseStartTime = clock.getElapsedTime();

    currentPhaseIndex = 0;
    
    // Pass the whole object (e.g. { id: "walk_out", duration: 9 })
    startPhase(phaseOrder[currentPhaseIndex]); 

    cameraClock.start();
    cameraShotStartTime = cameraClock.getElapsedTime();
    currentCameraIndex = 0;
    if (cameraTimeline[0]?.start) cameraTimeline[0].start();

    animate();
}

function animate() {
    requestAnimationFrame(animate);

    if (!allAssetsLoaded || !charObject) return;

    const delta = clock.getDelta();

    if (mixer) mixer.update(delta);
    if (trainMixer) trainMixer.update(delta);

    updateCameraTimeline();

    if (animationPlaying && charObject) {
        const elapsed = clock.getElapsedTime();
        const phaseElapsed = elapsed - phaseStartTime;

        // 1. Get the current Step from the Timeline (Duration info)
        const currentStep = phaseOrder[currentPhaseIndex];
        
        // 2. Get the Logic from the Library (Movement/Rotation info)
        const currentLogic = phases[currentStep.id];

        if (currentStep && currentLogic) {
            // EXECUTE MOVEMENT
            if (currentLogic.move) {
                currentLogic.move(charObject, delta);
            }
            
            // EXECUTE ROTATION
            // Note: We pass currentStep.duration so rotation finishes exactly on time
            if (currentLogic.rotate) {
                currentLogic.rotate(charObject, delta, currentStep.duration);
            }

            // CHECK DURATION & TRANSITION
            if (phaseElapsed >= currentStep.duration) {
                currentPhaseIndex++; 

                if (currentPhaseIndex < phaseOrder.length) {
                    startPhase(phaseOrder[currentPhaseIndex]);
                } else {
                    animationPlaying = false;
                    console.log("✅ Animation sequence complete.");
                }
            }
        }
    }

    renderer.render(scene, camera);
}
// requestAnimationFrame(animate);
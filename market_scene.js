import * as THREE from "three"

//orbit control
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { FBXLoader } from "three/addons/loaders/FBXLoader.js";

/* ================ */

//setup Canvas Renderer
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

renderer.shadowMap.enabled = true;

//setup scene
const scene = new THREE.Scene();

//setup camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const cameraOffset = new THREE.Vector3();
const cameraLerpSpeed = 0.05;
camera.position.set(0, 0, 25);
camera.lookAt(0, 0, 25);

//setup orbit control
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 5, 0);
controls.update();

let isReady = false;

const loadingManager = new THREE.LoadingManager();

loadingManager.onStart = function ( url, itemsLoaded, itemsTotal ) {
	console.log( 'Started loading file: ' + url + '.\nLoaded ' + itemsLoaded + ' of ' + itemsTotal + ' files.' );
};

loadingManager.onLoad = function ( ) {
	console.log( 'Loading complete! Starting animation...' );
    document.getElementById('loading-overlay').style.display = 'none';
    isReady = true;
    // Small delay to ensure the browser has finished its first frame render
    setTimeout(() => {
        isReady = true; 
    }, 100);
};

loadingManager.onError = function ( url ) {
	console.log( 'There was an error loading ' + url );
};

// Ambient Light
var color = 0xFFFFFF;
var intensity = 0.15;
var light = new THREE.AmbientLight(color, intensity);
scene.add(light);


// Hemisphere Light
var skyColor = 0xFFFFFF;  // light blue
var groundColor = 0xB97A20;  // brownish orange
intensity = 0.6;
light = new THREE.HemisphereLight(groundColor, skyColor, intensity);
scene.add(light);

// var directionalLightHelper = new THREE.HemisphereLightHelper(light);
// scene.add(directionalLightHelper);

// Debug Shadow tool
// const floor = new THREE.Mesh(
//   new THREE.PlaneGeometry(300, 300),
//   new THREE.MeshStandardMaterial({ color: 0xFFFFFF })
// );
// floor.rotation.x = -Math.PI / 2;
// floor.position.y = 0.1;
// floor.receiveShadow = true;
// scene.add(floor);

// Spot Light
color = 0xFFFFFF;
intensity = 300;
const spotLight1 = new THREE.SpotLight(0xffffff, 300, 300, Math.PI / 3);
spotLight1.penumbra = 0.5;
spotLight1.position.set(-20, 26, 0);
spotLight1.target.position.set(-20, 0, 0);
spotLight1.shadow.camera.near = 0.5; 
spotLight1.shadow.camera.far = 500;
spotLight1.shadow.camera.fov = (spotLight1.angle * (180 / Math.PI)) * 1.5;
spotLight1.shadow.bias = -0.0001;
spotLight1.castShadow = true;
scene.add(spotLight1);
scene.add(spotLight1.target);
spotLight1.target.updateMatrixWorld()
// const shadowHelper = new THREE.CameraHelper(spotLight1.shadow.camera);
// scene.add(shadowHelper);

const spotLight2 = new THREE.SpotLight(0xffffff, 300, 300, Math.PI / 3);
spotLight2.penumbra = 0.5;
spotLight2.position.set(20, 26, 0);
spotLight2.target.position.set(20, 0, 0);
spotLight2.shadow.camera.near = 0.5; 
spotLight2.shadow.camera.far = 500;
spotLight2.shadow.camera.fov = (spotLight2.angle * (180 / Math.PI)) * 1.5;
spotLight2.shadow.bias = -0.0001; 
spotLight2.castShadow = true; 
scene.add(spotLight2);
scene.add(spotLight2.target);
// const shadowHelper2 = new THREE.CameraHelper(spotLight2.shadow.camera);
// scene.add(shadowHelper2);

const spotLight3 = new THREE.SpotLight(0xffffff, 300, 300, Math.PI / 3);
spotLight3.penumbra = 0.5;
spotLight3.position.set(0, 26, -20);
spotLight3.target.position.set(0, 0, -20);
spotLight3.shadow.camera.near = 0.5; 
spotLight3.shadow.camera.far = 500;
spotLight3.shadow.camera.fov = (spotLight1.angle * (180 / Math.PI)) * 1.5;
spotLight3.shadow.bias = -0.0001;
spotLight3.castShadow = true;
scene.add(spotLight3);
scene.add(spotLight3.target);
// const shadowHelper3 = new THREE.CameraHelper(spotLight3.shadow.camera);
// scene.add(shadowHelper3);


const spotLight4 = new THREE.SpotLight(0xffffff, 300, 300, Math.PI / 8);
spotLight4.penumbra = 0.5;
spotLight4.position.set(0, 26, 15);
spotLight4.target.position.set(0, 0, 15);
spotLight4.shadow.camera.near = 0.5; 
spotLight4.shadow.camera.far = 500;
spotLight4.shadow.camera.fov = (spotLight1.angle * (180 / Math.PI)) * 1.5;  
spotLight4.shadow.bias = -0.0001;
spotLight4.castShadow = true;
scene.add(spotLight4);
scene.add(spotLight4.target);
// const shadowHelper4 = new THREE.CameraHelper(spotLight4.shadow.camera);
// scene.add(shadowHelper4);


let mixer; // to control animations
const clock = new THREE.Clock();

const market_loader = new GLTFLoader(loadingManager).setPath( 'Market/' );
    market_loader.load( 'scene.gltf', function ( gltf ) {

        const market = gltf.scene

        market.traverse((node) => {
            if (node.isMesh) {
                const oldMat = node.material;
                
                // Replace MeshBasicMaterial with light-reactive material
                if (oldMat && oldMat.type === 'MeshBasicMaterial') {
                    const newMat = new THREE.MeshStandardMaterial({
                        map: oldMat.map || null,
                        normalMap: oldMat.normalMap || null,
                        roughness: 0.8,
                        metalness: 0.1,
                        emissiveMap: oldMat.emissiveMap || null,
                        emissive: oldMat.emissive || new THREE.Color(0x000000),
                    });
                    newMat.needsUpdate = true;
                    node.material = newMat;
                }

                node.castShadow = true;
                node.receiveShadow = true;
            }

            if (node.isLight) node.parent.remove(node);
        });

        scene.add( market );
        market.scale.set(10,10,10); //X Y Z
        animate();

    });

let actions = {}, currentAction;
let characterModel;
let isWalkingForward;
let currentPhase = "walk1a"; // New sequence: walk1a -> turnToThink -> thinking -> turnBack -> walk1b -> turnLeft -> walk2
let walkDistance = 0;
const phase1Target = 40;
const phase1aTarget = 20; // Stop halfway for thinking
const phase2Target = 17;
const walkSpeed = 4;
let thinkTime = 0; // Timer for the thinking animation

const loader = new FBXLoader(loadingManager);
loader.setPath("Jinhsi/");

loader.load("Walking.fbx", (fbx) => {
    fbx.scale.setScalar(0.025);
    fbx.position.set(0,0,20);
    fbx.rotation.y = Math.PI  + (Math.PI / 24);

    scene.add(fbx);

    fbx.traverse(obj => {

        if (obj.isMesh || obj.isSkinnedMesh) {
            obj.castShadow = true;
            obj.receiveShadow = true;

            // Ensure material supports lighting
            if (obj.material) {
                obj.material.needsUpdate = true;
            }
        }

        if (obj.material) {
            obj.material.shadowSide = THREE.DoubleSide; // Helps with thin meshes
        }

        if (obj.isLight) {
            obj.intensity = 0;
        }
    });

    mixer = new THREE.AnimationMixer(fbx);
    characterModel = fbx; // To reference the fbx outside the loader

    if (fbx.animations.length > 0) {
        const walkAction = mixer.clipAction(fbx.animations[0]);
        actions["walk"] = walkAction;
        currentAction = walkAction; // Set this so the 'turn' logic can fade it out
        walkAction.play();         // Start the bones moving!
    }
    // ----------------------------------------

    isWalkingForward = true;
    loadAnim("turnLeft", "Left Turn 90.fbx");
    loadAnim("walk", "Walking.fbx");
    loadAnim("think", "Think.fbx");
    loadAnim("idle", "Idle.fbx");
});
    
const movement = {
        forward: false,
        backward: false,
        left: false,
        right: false,
    };

const moveSpeed = 1;      // camera move speed

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

function loadAnim(name, file) {
    const animLoader = new FBXLoader(loadingManager);
    animLoader.setPath("Jinhsi/");
    animLoader.load(file, (anim) => {
        const action = mixer.clipAction(anim.animations[0]);
        actions[name] = action;
        
        // Turn animations usually only play once
        if (name === "turnLeft") {
            action.setLoop(THREE.LoopOnce);
            action.clampWhenFinished = true; // Stay at the end frame
        }
        else if (name === "idle") {
            // Ensure Idle loops forever
            action.setLoop(THREE.LoopRepeat);
            action.clampWhenFinished = false; 
        }
    });
}

// Function to apply movement every frame
function updateCameraMovement() {
    const direction = new THREE.Vector3();

    // WASD movement (world-relative)
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

let lastPhase = ""; // Track the previous phase to detect the "Cut" moment

function updateCinematicCamera(delta) {
    if (!characterModel) return;

    const charPos = characterModel.position.clone();
    const targetPosition = new THREE.Vector3();
    const lookAtPos = charPos.clone().add(new THREE.Vector3(0, 10, 0));

    // Detect if the phase JUST changed this frame
    const didPhaseChange = lastPhase !== currentPhase;

    // 1. Determine Offset based on Phase
    switch (currentPhase) {
        case "walk1a":
            cameraOffset.set(0, 15, 15); // BACK
            break;
        case "turnToThink":
        case "thinking":
            cameraOffset.set(0, 9, -10); // FRONT (Adjusted height to 7 for face)
            break;
        case "turnBack":
        case "walk1b":
            cameraOffset.set(0, 12, -15); // FRONT (Wide)
            break;
        case "turning":
        case "walk2":
            cameraOffset.set(20, 15, 0); // SIDE/BACK
            break;
        case "idle":
            cameraOffset.set(-25, 10, 25);
            break;
    }

    targetPosition.copy(charPos).add(cameraOffset);

    // 2. THE JUMP CUT LOGIC
    // If we just entered "turnToThink" or "thinking", teleport the camera instantly
    if (didPhaseChange && (currentPhase === "turnToThink" || currentPhase === "thinking")) {
        camera.position.copy(targetPosition);
        controls.target.copy(lookAtPos);
    } else {
        // Otherwise, use smooth lerping for natural following
        camera.position.lerp(targetPosition, cameraLerpSpeed);
        controls.target.lerp(lookAtPos, cameraLerpSpeed);
    }

    lastPhase = currentPhase; // Update lastPhase for the next frame
    controls.update();
}

function fadeToAction(name, duration) {
    const nextAction = actions[name];
    if (nextAction && nextAction !== currentAction) {
        const prevAction = currentAction;
        currentAction = nextAction;
        if (prevAction) prevAction.fadeOut(duration);
        currentAction.reset().fadeIn(duration).play();
    }
}

function animate() {
    const delta = clock.getDelta();
    updateCameraMovement();

    if (isReady) {
        if (mixer) mixer.update(delta);

        if (characterModel && currentAction) {
            const moveStep = walkSpeed * delta;

            // --- PHASE 1a: WALK HALFWAY ---
            if (currentPhase === "walk1a") {
                characterModel.position.z -= moveStep;
                walkDistance += moveStep;

                if (walkDistance >= phase1aTarget) {
                    currentPhase = "turnToThink";
                    // Transition to turn right a bit (procedural rotation)
                    fadeToAction("walk", 0.5); // Keep walking or switch to idle if preferred
                }
            }

            // --- PHASE: TURN RIGHT A BIT ---
            else if (currentPhase === "turnToThink") {
                const turnSpeed = 2.0;
                characterModel.rotation.y -= turnSpeed * delta; // Turn right
                
                // Turn roughly 45 degrees (PI/4)
                if (characterModel.rotation.y <= (Math.PI + Math.PI / 24) - Math.PI / 4) {
                    currentPhase = "thinking";
                    fadeToAction("think", 0.5);
                    thinkTime = 0;
                }
            }

            // --- PHASE: THINKING ---
            else if (currentPhase === "thinking") {
                thinkTime += delta;
                if (thinkTime >= 3.0) { // Think for 3 seconds
                    currentPhase = "turnBack";
                    fadeToAction("walk", 0.5);
                }
            }

            // --- PHASE: TURN BACK TO PATH ---
            else if (currentPhase === "turnBack") {
                const turnSpeed = 2.0;
                characterModel.rotation.y += turnSpeed * delta; // Turn back left
                
                // Check if returned to original rotation
                if (characterModel.rotation.y >= (Math.PI + Math.PI / 24)) {
                    characterModel.rotation.y = (Math.PI + Math.PI / 24); // Snap to perfect alignment
                    currentPhase = "walk1b";
                }
            }

            // --- PHASE 1b: FINISH THE WALK ---
            else if (currentPhase === "walk1b") {
                characterModel.position.z -= moveStep;
                walkDistance += moveStep;

                if (walkDistance >= phase1Target) {
                    currentPhase = "turning"; // Now do the 90-degree left turn
                    if (actions["turnLeft"]) {
                        const prevAction = currentAction;
                        currentAction = actions["turnLeft"];
                        prevAction.fadeOut(0.5);
                        currentAction.reset().fadeIn(0.5).play();

                        mixer.addEventListener('finished', function onTurnEnd(e) {
                            if (e.action === actions["turnLeft"]) {
                                characterModel.rotation.y += Math.PI / 2;
                                walkDistance = 0;
                                currentPhase = "walk2";
                                fadeToAction("walk", 0.5);
                                mixer.removeEventListener('finished', onTurnEnd);
                            }
                        });
                    }
                }
            }

            // --- PHASE 2: FINAL WALK ---
            else if (currentPhase === "walk2") {
                characterModel.position.x -= moveStep;
                walkDistance += moveStep;
                if (walkDistance >= phase2Target) {
                    currentPhase = "finished"; // Change state so this only triggers once
                    fadeToAction("idle", 0.5);
                }
            }

            updateCinematicCamera(delta);
        }
    }
    else {
        // Only allow manual movement if the character isn't ready/moving
        updateCameraMovement();
    }

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}
requestAnimationFrame(animate);
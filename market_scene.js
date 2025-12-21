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
camera.position.set(0, 0, 50);
camera.lookAt(0, 0, 0);


//setup orbit control
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 5, 0);
controls.update();

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

// Spot Light (keempat)
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
const shadowHelper = new THREE.CameraHelper(spotLight1.shadow.camera);
scene.add(shadowHelper);

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
const shadowHelper2 = new THREE.CameraHelper(spotLight2.shadow.camera);
scene.add(shadowHelper2);

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
const shadowHelper3 = new THREE.CameraHelper(spotLight3.shadow.camera);
scene.add(shadowHelper3);

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
const shadowHelper4 = new THREE.CameraHelper(spotLight4.shadow.camera);
scene.add(shadowHelper4);


let mixer; // to control animations
const clock = new THREE.Clock();

const market_loader = new GLTFLoader().setPath( 'Market/' );
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

const walkSpeed = 10; // movement speed (units per second)
const loader = new FBXLoader();
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

    // load extra animations (turnLeft, walk duplicate, think)
    loadAnim("turnLeft", "Left Turn 90.fbx");
    loadAnim("walk", "Walking.fbx");
    loadAnim("think", "Think.fbx"); // <-- IMPORTANT: put Think.fbx inside Jinhsi/
    
});
    
const movement = {
    forward: false,
    backward: false,
    left: false,
    right: false,
};

const moveSpeed = 0.2;      // camera move speed

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
    const animLoader = new FBXLoader();
    animLoader.setPath("Jinhsi/");
    animLoader.load(file, (anim) => {
        if (!mixer) return; // safety
        const action = mixer.clipAction(anim.animations[0]);
        actions[name] = action;
        
        // Special rules
        if (name === "turnLeft" || name === "think") {
            action.setLoop(THREE.LoopOnce);
            action.clampWhenFinished = true;
        }
    });
}

// Function to apply movement every frame (camera WASD movement)
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


// =======================
// WAYPOINT WALK SYSTEM
// =======================

// Waypoints arranged to follow the U-shaped route in your sketch.
// Tweak coordinates if needed to match your scene scale/visual.
const waypoints = [
    { position: new THREE.Vector3(0, 0, -20), stop: false },    // Start
    { position: new THREE.Vector3(-18, 0, -20), stop: false },
    { position: new THREE.Vector3(-18, 0, 20), stop: false },
    { position: new THREE.Vector3(18, 0, 20), stop: false },
    { position: new THREE.Vector3(18, 0, 10), stop: false },
    { position: new THREE.Vector3(18, 0, -20), stop: false },
    { position: new THREE.Vector3(18, 0, -10), stop: true,  wait: 4 },

    { position: new THREE.Vector3(16, 0, 10), stop: false },
    { position: new THREE.Vector3(20, 0, 10), stop: true,  wait: 999 }, //End
//  { position: new THREE.Vector3(x, x, x), stop: true,  wait: 2(second) }
];

let waypointIndex = 0;
let state = "walk"; // "walk" or "think"
let waitTimer = 0;

const dummyTarget = new THREE.Object3D(); // helper to compute target rotation

// safety: if Think.fbx not loaded yet, we'll still wait the time but skip playing anim
function playThinkAnimation() {
    if (actions["think"]) {
        if (currentAction) currentAction.fadeOut(0.3);
        currentAction = actions["think"];
        currentAction.reset().fadeIn(0.3).play();
    }
}

// =======================
// ANIMATE LOOP
// =======================
function animate() {
    const delta = clock.getDelta();
    if (mixer) mixer.update(delta);
    updateCameraMovement();

    // Waypoint movement logic
    if (characterModel && currentAction) {

        if (state === "walk") {
            const target = waypoints[Math.min(waypointIndex, waypoints.length - 1)].position;
            const direction = new THREE.Vector3().subVectors(target, characterModel.position);
            const distance = direction.length();

            if (distance < 0.3) {
                // Arrived at waypoint
                if (waypoints[waypointIndex].stop) {
                    // go to THINK state
                    state = "think";
                    waitTimer = waypoints[waypointIndex].wait || 2;

                    // Play think animation if exists
                    playThinkAnimation();
                } else {
                    // move to next waypoint immediately
                    waypointIndex++;
                    // If reached final waypoint beyond array, clamp
                    if (waypointIndex >= waypoints.length) {
                        waypointIndex = waypoints.length - 1;
                    }
                }
            } else {
                // Move towards the target
                direction.normalize();
                characterModel.position.addScaledVector(direction, walkSpeed * delta);

                // Smooth rotation to face the target
                dummyTarget.position.copy(characterModel.position);
                dummyTarget.lookAt(target);
                characterModel.quaternion.slerp(dummyTarget.quaternion, 8 * delta);
            }
        }

        else if (state === "think") {
            waitTimer -= delta;

            // ensure the character is stationary while thinking (no residual motion)
            // (If you want the bones to keep playing while think anim is on, mixers handle it)
            
            if (waitTimer <= 0) {
                // done thinking -> next waypoint
                waypointIndex++;
                if (waypointIndex >= waypoints.length) waypointIndex = waypoints.length - 1;

                // switch back to walk animation if available
                if (actions["walk"]) {
                    if (currentAction) currentAction.fadeOut(0.3);
                    currentAction = actions["walk"];
                    currentAction.reset().fadeIn(0.3).play();
                }
                state = "walk";
            }
        }

    }

    renderer.render(scene, camera);
    requestAnimationFrame(animate);

    // =======================
    // CINEMATIC PRODUCT CAMERA (ADD-ON ONLY)
    // =======================

    // Kamera mode: "normal" | "product"
    let cameraMode = "normal";
    let cameraTimer = 0;

    // Offset kamera default (bukan full follow)
    const camOffset = new THREE.Vector3(6, 12, -6);

    // Area produk yang akan ditampilkan
    const productCameraZones = [
        {
            center: new THREE.Vector3(-18,   4,    10),
            camPos: new THREE.Vector3(-20,   16,   -20),
            lookAt: new THREE.Vector3(0,   10,    0),
            radius: 5,
            duration: 2.5
        },
        {
            center: new THREE.Vector3(18,    4,   -15),
            camPos: new THREE.Vector3(18,    12,   10),
            lookAt: new THREE.Vector3(0,    6,   -18),
            radius: 5,
            duration: 5
        },
        {
            center: new THREE.Vector3(22,    4,    10),
            camPos: new THREE.Vector3(10,    12,   10),
            lookAt: new THREE.Vector3(20,    10,   10),
            radius: 5,
            duration: 999
        }
    ];

    // Inject camera logic WITHOUT touching animate()
    const _originalAnimate = animate;
    animate = function () {

        const delta = clock.getDelta();
        if (mixer) mixer.update(delta);
        updateCameraMovement();

        // ===== CAMERA WORK ADDITION =====
        if (characterModel) {

            if (cameraMode === "normal") {

                // Semi-follow (tidak nempel karakter)
                const desiredPos = characterModel.position.clone().add(camOffset);
                camera.position.lerp(desiredPos, 0.02);
                camera.lookAt(characterModel.position.x, characterModel.position.y + 3, characterModel.position.z);

                // Cek apakah masuk zona produk
                for (const zone of productCameraZones) {
                    if (characterModel.position.distanceTo(zone.center) < zone.radius) {
                        cameraMode = "product";
                        cameraTimer = zone.duration;
                        camera.position.lerp(zone.camPos, 0.3);
                        camera.lookAt(zone.lookAt);
                        break;
                    }
                }
            }

            else if (cameraMode === "product") {
                cameraTimer -= delta;
                if (cameraTimer <= 0) {
                    cameraMode = "normal";
                }
            }
        }

        // ===== ORIGINAL LOGIC =====
        if (characterModel && currentAction) {

            if (state === "walk") {
                const target = waypoints[Math.min(waypointIndex, waypoints.length - 1)].position;
                const direction = new THREE.Vector3().subVectors(target, characterModel.position);
                const distance = direction.length();

                if (distance < 0.3) {
                    if (waypoints[waypointIndex].stop) {
                        state = "think";
                        waitTimer = waypoints[waypointIndex].wait || 2;
                        playThinkAnimation();
                    } else {
                        waypointIndex = Math.min(waypointIndex + 1, waypoints.length - 1);
                    }
                } else {
                    direction.normalize();
                    characterModel.position.addScaledVector(direction, walkSpeed * delta);
                    dummyTarget.position.copy(characterModel.position);
                    dummyTarget.lookAt(target);
                    characterModel.quaternion.slerp(dummyTarget.quaternion, 8 * delta);
                }
            }

            else if (state === "think") {
                waitTimer -= delta;
                if (waitTimer <= 0) {
                    waypointIndex = Math.min(waypointIndex + 1, waypoints.length - 1);
                    if (actions["walk"]) {
                        currentAction.fadeOut(0.3);
                        currentAction = actions["walk"];
                        currentAction.reset().fadeIn(0.3).play();
                    }
                    state = "walk";
                }
            }
        }

        renderer.render(scene, camera);
        requestAnimationFrame(animate);
    };

}
requestAnimationFrame(animate);

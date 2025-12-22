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
camera.position.set(0, 10, 25);
camera.lookAt(0, 10, 20);

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
    
    // START THE FIRST ACTION HERE
    if (actions["idle"]) {
        currentAction = actions["idle"];
        currentAction.play();
    }
};

loadingManager.onError = function ( url ) {
	console.log( 'There was an error loading ' + url );
};

// Ambient Light
var color = 0xFFFFFF;
var intensity = 0.3;
var light = new THREE.AmbientLight(color, intensity);
scene.add(light);

// Hemisphere Light
const HemisphereLight = new THREE.HemisphereLight(0xFFFFFF, 0xFFFFFF, 1);
HemisphereLight.position.set(10, 11, 15)
scene.add(HemisphereLight);
// var hemisphereLightHelper = new THREE.HemisphereLightHelper(HemisphereLight);
// scene.add(hemisphereLightHelper);

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
// scene.add(sunLight.target)
// var sunLightHelper = new THREE.DirectionalLightHelper(sunLight)
// scene.add(sunLightHelper)

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

let actions = {};
let currentAction;
let currentPhase = "initialIdle";
let phaseTimer = 0;
let distanceCounter = 0;
const walkSpeed = 4.0; 
const turnSpeed = 2.0;
let characterModel;
const loader = new FBXLoader(loadingManager);
loader.setPath("Jinhsi/");
loader.load("Walking.fbx", (fbx) => {
  fbx.scale.setScalar(0.004);
  fbx.position.set(11.5,11.2,10)
  fbx.rotation.y = Math.PI  - (Math.PI / 2);
  scene.add(fbx);
  characterModel = fbx;

  fbx.traverse(obj => {

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

    mixer = new THREE.AnimationMixer(fbx);

    loadAnim("walk", "Walking.fbx");
    loadAnim("idle", "Idle.fbx");

    setTimeout(() => {
        fadeToAction("idle", 0.1);
    }, 500);
});

const loaderStation = new FBXLoader(loadingManager);
loaderStation.setPath("TrainStation/");
loaderStation.load("source/Train Station.fbx", (fbx) => {

    fbx.scale.setScalar(0.01);
    fbx.position.set(10,5,20)
    scene.add(fbx);

    fbx.traverse(obj => {
        console.log(obj)

        if (obj.isMesh || obj.isSkinnedMesh || obj.isGroup) {
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

});

let trainMixer;
const train_loader = new GLTFLoader(loadingManager).setPath('Train/');
    train_loader.load('Body/scene.gltf', function (gltf) {

        const trainBody = gltf.scene

        trainBody.traverse((node) => {
            if (node.isMesh) {
                const oldMat = node.material;

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

        scene.add(trainBody);
        trainBody.scale.set(0.7, 1, 0.7); //X Y Z
        trainBody.position.set(6.6,9.5,-15.5);

        if (gltf.animations && gltf.animations.length) {
            trainMixer = new THREE.AnimationMixer(trainBody);

            gltf.animations.forEach((clip) => {
                trainMixer.clipAction(clip).play();
            });
        }
        animate();

    });

    train_loader.load('Head/scene.gltf', function (gltf) {

        const trainHead = gltf.scene

        trainHead.traverse((node) => {
            if (node.isMesh) {
                const oldMat = node.material;

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

        scene.add(trainHead);
        trainHead.scale.set(0.7, 1, 0.7); //X Y Z
        trainHead.position.set(6.6,9,-4.5);
        animate();

    });

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

function fadeToAction(name, duration) {
    const nextAction = actions[name];
    if (nextAction && nextAction !== currentAction) {
        const prevAction = currentAction;
        currentAction = nextAction;
        if (prevAction) prevAction.fadeOut(duration);
        currentAction.reset().fadeIn(duration).play();
    }
}

function loadAnim(name, file) {
    const animLoader = new FBXLoader(loadingManager);
    animLoader.setPath("Jinhsi/");
    animLoader.load(file, (anim) => {
        if (anim.animations.length > 0) {
            const action = mixer.clipAction(anim.animations[0]);
            actions[name] = action;
            console.log(`Animation loaded: ${name}`);
        } else {
            console.error(`No animations found in file: ${file}`);
        }
    });
}

function handleCameraCinematic() {
    if (!characterModel) return;

    // Get character's current world position
    const charPos = characterModel.position.clone();
    
    // Create an offset vector (X, Y, Z)
    let relativeOffset = new THREE.Vector3();

    switch (currentPhase) {
        case "initialIdle":
        case "turnLeft1":
            // CAMERA: BACK VIEW (Offset behind her +Z)
            relativeOffset.set(0, 2, 5); 
            break;

        case "walk1":
            // CAMERA: FRONT VIEW (Offset in front of her -Z)
            relativeOffset.set(0, 2, -5);
            break;

        case "turnLeft2":
        case "walk2":
            // CAMERA: BACK VIEW (Return to back)
            relativeOffset.set(0, 2, 5);
            break;

        case "finished":
            // CAMERA: RIGHT SIDE VIEW (+X offset)
            if (phaseTimer < 1.0) {
                // Stay behind her for the first second
                relativeOffset.set(0, 2, 5);
            } else {
                // Switch to the right side after 1 second
                relativeOffset.set(4, 1.5, );
            }
            break;
            
        default:
            return; // Don't move camera if phase is unknown
    }

    // Rotate the offset so it follows the character's rotation
    relativeOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), characterModel.rotation.y);

    // Set camera position
    const targetCamPos = charPos.clone().add(relativeOffset);
    
    // Smoothly interpolate (Lerp) or snap. 
    // Since you asked for "sudden" changes for walk1 and walk2, we snap it:
    camera.position.copy(targetCamPos);

    // Always look at the character's chest area (Y + 2.5)
    controls.target.set(charPos.x, charPos.y + 2.5, charPos.z);
    controls.update();
}

function animate() {
    const delta = clock.getDelta();
    if (mixer) mixer.update(delta);
    if (trainMixer) trainMixer.update(delta);

    if (isReady && characterModel && actions["idle"] && actions["walk"]) {

        if (!currentAction) {
            currentAction = actions["idle"];
            currentAction.play();
        }

        switch (currentPhase) {
            case "initialIdle":
                phaseTimer += delta;
                if (phaseTimer >= 3.0) {
                    currentPhase = "turnLeft1";
                    fadeToAction("walk", 0.5);
                }
                break;

            case "turnLeft1":
                characterModel.rotation.y += turnSpeed * delta;
                if (characterModel.rotation.y >= Math.PI) {
                    characterModel.rotation.y = Math.PI;
                    distanceCounter = 0;
                    currentPhase = "walk1"; // Camera will "suddenly" switch to front here
                }
                break;

            case "walk1":
                const moveZ = walkSpeed * delta;
                characterModel.position.z -= moveZ;
                distanceCounter += moveZ;
                if (distanceCounter >= 25.5) {
                    currentPhase = "turnLeft2"; // Camera will "suddenly" switch to back here
                    distanceCounter = 0;
                }
                break;

            case "turnLeft2":
                characterModel.rotation.y += turnSpeed * delta;
                if (characterModel.rotation.y >= (Math.PI + Math.PI / 2)) {
                    characterModel.rotation.y = Math.PI + Math.PI / 2;
                    currentPhase = "walk2";
                }
                break;

            case "walk2":
                const moveX = walkSpeed * delta;
                characterModel.position.x -= moveX;
                distanceCounter += moveX;

                // Step down 0.5 units
                if (distanceCounter >= 4.0 && characterModel.position.y > 10.7) {
                    characterModel.position.y -= 2.5 * delta;
                    if (characterModel.position.y < 10.7) characterModel.position.y = 10.7;
                }

                if (distanceCounter >= 5.0) {
                    currentPhase = "finished"; // Camera will switch to Right Side here
                    phaseTimer = 0;
                    fadeToAction("idle", 0.5);
                }
                break;

                case "finished":
                    phaseTimer += delta; // <--- TICK TIMER HERE so the camera knows when to switch
                    break;
        }

        // Run the cinematic camera instead of keyboard controls
        handleCameraCinematic();
    }

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}
requestAnimationFrame(animate);
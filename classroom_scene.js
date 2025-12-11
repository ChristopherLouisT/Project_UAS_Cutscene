import * as THREE from "three"
import Stats from "./node_modules/stats.js/src/Stats.js"

//orbit control
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';


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
let cameraOffset = new THREE.Vector3(10, 25, 60); 
let cameraLerpSpeed = 0.1;
camera.position.set(10, 25, 60);
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


const sunLight = new THREE.DirectionalLight(0xffe9c0, 2.5);
sunLight.position.set(150, 140, 80);
sunLight.target.position.set(-90,-80,-15)
sunLight.castShadow = true;
sunLight.shadow.camera.near = 1;
sunLight.shadow.camera.far = 1000;
sunLight.shadow.camera.left = -300;
sunLight.shadow.camera.right = 300;
sunLight.shadow.camera.top = 300;
sunLight.shadow.camera.bottom = -300;
sunLight.shadow.bias = -0.09; //Buat shadownya ga terlalu kuat
scene.add(new THREE.CameraHelper(sunLight.shadow.camera)) 
scene.add(sunLight);
scene.add(sunLight.target)
var sunLightHelper = new THREE.DirectionalLightHelper(sunLight)
scene.add(sunLightHelper)

// Debug Shadow tool
// const floor = new THREE.Mesh(
//   new THREE.PlaneGeometry(500, 500),
//   new THREE.MeshStandardMaterial({ color: 0x888888 })
// );
// floor.rotation.x = -Math.PI / 2;
// floor.position.y = 0;
// floor.receiveShadow = true;
// scene.add(floor);

// Spot Light
// color = 0xFF0000;
// intensity = 30000;
// var angle = THREE.MathUtils.degToRad(35);
// light = new THREE.SpotLight(color, intensity, distance, angle);
// light.position.set(-50, 10, 0);
// light.target.position.set(10, 10, 0);
// light.castShadow = true;
// scene.add(new THREE.CameraHelper(light.shadow.camera)) 
// scene.add(light);
// scene.add(light.target);

// var spotLightHelper = new THREE.SpotLightHelper(light);
// scene.add(spotLightHelper);

let mixer; // to control animations
const clock = new THREE.Clock();

// Animation global variable
let actions = {};
let animationTimeline = [];
let timelineClock = 0;
let nextIndex = 0;

let walkSpeed = 2;       // units per second (adjust as needed)
let currentActionName = ""; 

let model;   // global character reference

const classroom_loader = new GLTFLoader().setPath( 'Classroom/' );
    classroom_loader.load( 'scene.gltf', function ( gltf ) {

        const classroom = gltf.scene

        classroom.traverse((node) => {
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

        scene.add( classroom );
        classroom.scale.set(10,10,10); //X Y Z
        animate();

    });

/* --- GLOBAL animation functions --- */
// Smooth action switching
function playAction(actionName, fade = 0.5) {
    if (!actions[actionName]) {
        console.warn(`Animation "${actionName}" not found`);
        return;
    }

    currentActionName = actionName;  

    const next = actions[actionName];

    if (mixer && mixer.currentAction !== next) {
        if (mixer.currentAction) {
            mixer.currentAction.fadeOut(fade);
        }
        next.reset().fadeIn(fade).play();
        mixer.currentAction = next;
    }
}

function loadAnim(name, file) {
        jinhsi_loader.load(file, (animFBX) => {
            const clip = animFBX.animations[0];
            const action = mixer.clipAction(clip);
            actions[name] = action;
        });
    }

//For loading fbx animations
function loadCharacterAnimations() {

    const animLoader = new FBXLoader().setPath('Jinhsi/');

    const animationFiles = [
        { file: "Left Turn 90.fbx",  name: "Left_Turn_90" },
        { file: "Right Turn.fbx",  name: "Right_Turn" },
        { file: "Sit to Stand.fbx",   name: "Sit_to_stand"  },
        { file: "Sitting.fbx",  name: "Sitting" },
        { file: "Walking.fbx",  name: "Walking" },
        { file: "Walk Left Turn.fbx",   name: "Walk_to_left"  },
        { file: "Walk Right Turn.fbx",   name: "Walk_to_right"  }
    ];

    let loadedCount = 0;

    animationFiles.forEach(anim => {

        animLoader.load(anim.file, function (fbxAnim) {

            const clip = fbxAnim.animations[0];
            clip.name = anim.name;   // rename for easy reference

            actions[anim.name] = mixer.clipAction(clip);

            loadedCount++;

            // Start animation system when all animations are ready
            if (loadedCount === animationFiles.length) {
                startAnimationTimeline();
            }
        });
    });
}

function startAnimationTimeline() {
    animationTimeline = [
        { time: 0, action: "Sitting" },
        { time: 5, action: "Sit_to_stand" },
        { time: 10, action: "Walking" },
    ];

    timelineClock = 0;
    nextIndex = 0;

    playAction(animationTimeline[0].action);
    animate();
}

function setupTimeline() {
    animationTimeline = [
        { time: 0, action: "Sitting" },
        { time: 4, action: "Sit_to_stand" },
        { time: 8, action: "Walking" },
    ];

    timelineClock = 0;
    nextIndex = 0;

    playAction(animationTimeline[0].action);
}

// const urotsuki_loader = new GLTFLoader().setPath( 'Urotsuki/' );
//     urotsuki_loader.load( 'scene.gltf', function ( gltf ) {

//         model = gltf.scene;

//         model.traverse((node) => {
//             if (node.isMesh || node.isSkinnedMesh) {
//                 node.castShadow = true;
//                 node.receiveShadow = true;

//                 // Convert MeshBasicMaterial to a shadow-supporting one
//                 if (node.material && node.material.type === 'MeshBasicMaterial') {
//                 const oldMat = node.material;
//                 node.material = new THREE.MeshStandardMaterial({
//                     map: oldMat.map || null,
//                     skinning: !!node.isSkinnedMesh,
//                     roughness: 0.6,
//                     metalness: 0.1,
//                 });
//                 node.material.needsUpdate = true;
//                 }
//             }
//         });

//         scene.add( model );
//         model.scale.set(30,30,30); //X Y Z
//         model.position.set(10,5,20) //X Y Z

//         // --- Animation setup ---
//         mixer = new THREE.AnimationMixer(model);

//         // --- Animation system with timeline ---
//         const clips = gltf.animations;

//         // Utility: get animation by name (case-insensitive)
//         function getClip(name) {
//             return THREE.AnimationClip.findByName(clips, name) || null;
//         }

//         // Store actions
//         actions = {
//             idle: mixer.clipAction(getClip('Idle')),
//             walk: mixer.clipAction(getClip('Walking')),
//             sit:  mixer.clipAction(getClip('Sitting')),
//         };

//         // Timeline (in seconds)
//         animationTimeline = [
//             { time: 0, action: "idle" },     // 0s–5s idle
//             { time: 5, action: "walk" },     // 5s–10s walk
//             { time: 10, action: "sit" },     // 10s → sit forever
//         ];

//         // Track time
//         timelineClock = 0;
//         nextIndex = 0;
//         playAction(animationTimeline[0].action); // initial state

//         animate();

//     } );

const jinhsi_loader = new FBXLoader().setPath("Jinhsi/");

jinhsi_loader.load("Sitting.fbx", function (fbx) {

    model = fbx;
    model.scale.set(0.09, 0.09, 0.09);
    model.position.set(10, 5, 20);
    scene.add(model);

    // Enable shadows
    model.traverse((node) => {
        if (node.isMesh || node.isSkinnedMesh) {
            node.castShadow = true;
            node.receiveShadow = true;
        }
    });

    // Initialize animation mixer
    mixer = new THREE.AnimationMixer(model);

    // After model is loaded → load animations
    // loadCharacterAnimations();

    loadAnim("standup", "Sit to Stand.fbx");
    loadAnim("walk", "Walking.fbx");

    setupTimeline();
});



/// FPS Monitoring
const stats = new Stats();
stats.showPanel(0); 
document.body.appendChild(stats.dom);

// let mesh = new THREE.Mesh(geometry, material);
// mesh.rotation.x = -Math.PI / 2;
// mesh.receiveShadow = true;
// scene.add(mesh);


// let radius = 7;
// let widthSegments = 12;
// let heightSegments = 8;
// geometry = new THREE.SphereGeometry(radius, widthSegments, heightSegments);
// material = new THREE.MeshPhongMaterial({ color: '#FA8' });
// mesh = new THREE.Mesh(geometry, material);
// mesh.position.set(-radius - 1, radius + 2, 0);
// mesh.castShadow = true;
// scene.add(mesh);


// size = 4;
// geometry = new THREE.BoxGeometry(size, size, size);
// material = new THREE.MeshPhongMaterial({ color: '#8AC', transparent: true, opacity: 0.5 });
// mesh = new THREE.Mesh(geometry, material);
// mesh.position.set(size + 1, size / 2, 0);
// mesh.castShadow = true;
// scene.add(mesh);

// =======================
// CAMERA MOVEMENT SYSTEM
// =======================

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
}

function animate() {
    stats.begin();
    const delta = clock.getDelta();

    if (mixer) {
        mixer.update(delta);

        // Timeline logic...
        timelineClock += delta;
        if (nextIndex < animationTimeline.length &&
            timelineClock >= animationTimeline[nextIndex].time) {
            playAction(animationTimeline[nextIndex].action);
            nextIndex++;
        }
    }

    // ---- Character Movement While Walking ----
    if (currentActionName === "walk" && model) {
        const forward = new THREE.Vector3(0, 0, 1);
        forward.applyQuaternion(model.quaternion);
        model.position.addScaledVector(forward, walkSpeed * delta);
    }

    // ---- CAMERA FOLLOW ----
    if (model) {
        const offset = cameraOffset.clone();
        offset.applyQuaternion(model.quaternion);
        const desiredPos = model.position.clone().add(offset);

        camera.position.lerp(desiredPos, cameraLerpSpeed);
        camera.lookAt(model.position);
    }

    renderer.render(scene, camera);
    stats.end();
    requestAnimationFrame(animate);
}


requestAnimationFrame(animate);
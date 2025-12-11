import * as THREE from "three"
import Stats from "./node_modules/stats.js/src/Stats.js"

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
sunLight.target.position.set(-90, -80, -15)
sunLight.castShadow = true;
sunLight.shadow.camera.near = 1;
sunLight.shadow.camera.far = 1000;
sunLight.shadow.camera.left = -300;
sunLight.shadow.camera.right = 300;
sunLight.shadow.camera.top = 300;
sunLight.shadow.camera.bottom = -300;
sunLight.shadow.bias = -0.09; 
scene.add(new THREE.CameraHelper(sunLight.shadow.camera))
scene.add(sunLight);
scene.add(sunLight.target)
var sunLightHelper = new THREE.DirectionalLightHelper(sunLight)
scene.add(sunLightHelper)


let mixer; // to control animations
const clock = new THREE.Clock();

const classroom_loader = new GLTFLoader().setPath('Classroom/');
classroom_loader.load('scene.gltf', function (gltf) {

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

    scene.add(classroom);
    classroom.scale.set(10, 10, 10); //X Y Z
    animate();

});

/* =========================================
   SETUP KARAKTER & NAVIGASI
   ========================================= */

let actions = {}, currentAction;
let animationTimeline = [];
let timelineClock = 0;
let nextIndex = 0;

// --- VARIABEL BARU UNTUK PERGERAKAN ---
let character = null; 
const charSpeed = 12; 
let waypointIndex = 0;

// Definisi 3 Titik Tujuan
const waypoints = [
    new THREE.Vector3(-10, -6, 20), // 1. Kanan
    new THREE.Vector3(-10, -9, 120),  // 2. Maju
    new THREE.Vector3(-150, -9, 135)   // 3. Kanan
];

const stats = new Stats();
stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
document.body.appendChild(stats.dom);

// Helper object untuk menghitung rotasi tanpa mengganggu mesh asli
const dummyTarget = new THREE.Object3D(); 
// --------------------------------------

const loader = new FBXLoader();
loader.setPath("Jinhsi/");

loader.load("Sitting.fbx", (fbx) => {
    fbx.scale.setScalar(0.09);
    fbx.position.set(10, -2, 20); // Posisi Awal

    //Removing light from character
    fbx.traverse(obj => {
        if (obj.isLight) obj.parent.remove(obj);

        if (obj.isMesh && obj.material) {
            obj.material.emissive = new THREE.Color(0x000000);
            obj.material.emissiveIntensity = 0;
            obj.castShadow = true;
            obj.receiveShadow = true;
        }
    });


    scene.add(fbx);

    character = fbx; 

    mixer = new THREE.AnimationMixer(fbx);

    const sit = mixer.clipAction(fbx.animations[0]);
    actions["sit"] = sit;
    currentAction = sit;
    sit.play();

    // Load animations 
    loadAnim("standup", "Sit to Stand.fbx");
    loadAnim("walk", "Walking.fbx");

    setupTimeline();
});

function loadAnim(name, file) {
    loader.load(file, (animFBX) => {
        let clip = animFBX.animations[0];
        const action = mixer.clipAction(clip);
        actions[name] = action;
    });
}

function playAction(name, fade = 0.5) { // Fade agak diperlambat biar smooth
    const nextAction = actions[name];
    if (!nextAction) {
        console.warn(`Animation "${name}" not loaded yet`);
        return;
    }

    if (currentAction !== nextAction) {
        if (currentAction) {
            currentAction.fadeOut(fade);
        }
        nextAction.reset().fadeIn(fade).play();
        currentAction = nextAction;
    }
}

function setupTimeline() {
    animationTimeline = [
        { time: 0, action: "sit" },
        { time: 3, action: "standup" }, // Durasi standup biasanya 2-3 detik
        { time: 5, action: "walk" },  // Kasih jeda sedikit biar rotasi selesai sempurna
    ];

    timelineClock = 0;
    nextIndex = 0;

    playAction(animationTimeline[0].action);
}

// --- FUNGSI UPDATE GERAK & ROTASI KARAKTER ---
function updateCharacterMove(delta) {
    if (!character) return;

    // 1. LOGIKA SAAT STAND UP (Putar badan ke arah tujuan pertama)
    //    Ini membuat karakter berputar ditempat saat berdiri agar siap berjalan
    if (actions["standup"] && currentAction === actions["standup"]) {
        const target = waypoints[0];
        
        // Gunakan dummy object untuk mencontek rotasi yang seharusnya
        dummyTarget.position.copy(character.position);
        dummyTarget.lookAt(target); 
        
        // Putar karakter secara halus (Slerp) menuju rotasi dummy
        // Angka 3.0 adalah kecepatan putar (semakin besar semakin cepat)
        character.quaternion.slerp(dummyTarget.quaternion, 3.0 * delta);
    }

    // 2. LOGIKA SAAT WALK (Jalan + Putar mengikuti jalur)
    if (actions["walk"] && currentAction === actions["walk"]) {
        if (waypointIndex < waypoints.length) {
            const target = waypoints[waypointIndex];
            const distance = character.position.distanceTo(target);

            // Jika jarak sudah dekat (< 0.5), pindah ke tujuan berikutnya
            if (distance < 0.5) {
                waypointIndex++;
            } else {
                // Hitung arah
                const direction = new THREE.Vector3().subVectors(target, character.position).normalize();
                
                // Pindahkan posisi
                character.position.add(direction.multiplyScalar(charSpeed * delta));
                
                // Rotasi badan menghadap tujuan (Smooth turn saat jalan)
                dummyTarget.position.copy(character.position);
                dummyTarget.lookAt(target);
                character.quaternion.slerp(dummyTarget.quaternion, 10.0 * delta); // Rotasi cepat saat jalan
            }
        } 
    }
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

function animate() {
    stats.begin();
    const delta = clock.getDelta();
    
    if (mixer) {
        mixer.update(delta);

        timelineClock += delta;
        if (nextIndex < animationTimeline.length &&
            timelineClock >= animationTimeline[nextIndex].time) {

            playAction(animationTimeline[nextIndex].action);
            nextIndex++;
        }
    }

    // Update logika pergerakan karakter
    updateCharacterMove(delta);

    // Update kamera user
    updateCameraMovement();

    renderer.render(scene, camera)
    stats.end();
    requestAnimationFrame(animate);
}


requestAnimationFrame(animate);
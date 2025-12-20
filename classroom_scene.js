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
var intensity = 0.3;
var light = new THREE.AmbientLight(color, intensity);
scene.add(light);

var skyColor = 0xFFFFFF;  // White
var groundColor = 0xB97A20;  // Brown Orange
intensity = 0.6;
const hemisphere = new THREE.HemisphereLight(skyColor, groundColor, intensity);
hemisphere.position.set(-25,30,60)
scene.add(hemisphere);

var hemisphereHelper = new THREE.HemisphereLightHelper(hemisphere);
scene.add(hemisphereHelper);

// --- POINT LIGHT 1 ---
const pointLight1 = new THREE.PointLight(0xFFFFFF, 750, 100000); 
pointLight1.position.set(15, 60, 160);
scene.add(pointLight1);


// --- POINT LIGHT 2 ---
const pointLight2 = new THREE.PointLight(0xFFFFFF, 750, 10000);
pointLight2.position.set(50, 60, 160);
scene.add(pointLight2);


// --- POINT LIGHT 3 ---
const pointLight3 = new THREE.PointLight(0xFFFFFF, 750, 100000); 
pointLight3.position.set(-85, 60, 160);
scene.add(pointLight3);


// --- POINT LIGHT 4 ---
const pointLight4 = new THREE.PointLight(0xFFFFFF, 750, 10000);
pointLight4.position.set(-50, 60, 160);
scene.add(pointLight4);


const sunLight = new THREE.DirectionalLight(0xffe9c0, 20);
sunLight.position.set(150, 50, 80);
sunLight.target.position.set(-90, 30, 80);
sunLight.castShadow = true;

sunLight.shadow.mapSize.width = 2048; 
sunLight.shadow.mapSize.height = 2048;
sunLight.shadow.camera.near = 1;
sunLight.shadow.camera.far = 1000;
sunLight.shadow.camera.left = -500;
sunLight.shadow.camera.right = 500;  // Changed from 2200
sunLight.shadow.camera.top = 500;
sunLight.shadow.camera.bottom = -500;

// Bias prevents "shadow acne"
sunLight.shadow.bias = -0.0005; 

scene.add(sunLight);
scene.add(sunLight.target);
var sunLightHelper = new THREE.DirectionalLightHelper(sunLight)
scene.add(sunLightHelper)


let mixer;
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
const charSpeed = 10; 
let waypointIndex = 0;

// Definisi 3 Titik Tujuan
const waypoints = [
    new THREE.Vector3(-10, -9, 20), // 1. Kanan
    new THREE.Vector3(-10, -9, 120),  // 2. Maju
    new THREE.Vector3(-150, -9, 135)   // 3. Kanan
];

// Helper object untuk menghitung rotasi tanpa mengganggu mesh asli
const dummyTarget = new THREE.Object3D(); 
// --------------------------------------

const loader = new FBXLoader();
loader.setPath("Jinhsi/");

loader.load("Sitting.fbx", (fbx) => {
    fbx.scale.setScalar(0.11);
    fbx.position.set(10, -4, 20); // Posisi Awal
    scene.add(fbx);

    character = fbx; 

    mixer = new THREE.AnimationMixer(fbx);

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
        { time: 5.5, action: "walk" },  // Kasih jeda sedikit biar rotasi selesai sempurna
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

    const front = new THREE.Vector3();
    camera.getWorldDirection(front);
    controls.target.copy(camera.position).add(front.multiplyScalar(10));
    controls.update();
}

function animate() {
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
    requestAnimationFrame(animate);
}
requestAnimationFrame(animate);
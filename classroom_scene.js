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

let actions = {};
let currentAction;
const loader = new FBXLoader();
loader.setPath("Jinhsi/");
loader.load("Sitting.fbx", (fbx) => {
  fbx.scale.setScalar(0.09);
  fbx.position.set(10,-4,20)
  scene.add(fbx);
  mixer = new THREE.AnimationMixer(fbx);
  const action = mixer.clipAction(fbx.animations[0]);
  action.play();
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

function animate() {
    const delta = clock.getDelta();
    if (mixer) mixer.update(delta);

    updateCameraMovement();

    renderer.render(scene, camera)
    requestAnimationFrame(animate);
}
requestAnimationFrame(animate);
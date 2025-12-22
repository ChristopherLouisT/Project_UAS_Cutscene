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
const loader = new FBXLoader();
loader.setPath("Jinhsi/");
loader.load("Walking.fbx", (fbx) => {
  fbx.scale.setScalar(0.004);
  fbx.position.set(11.5,11.2,-15)
  fbx.rotation.y = Math.PI  - (Math.PI / 2);
  scene.add(fbx);

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
  const action = mixer.clipAction(fbx.animations[0]);
  action.play();
});

const loaderStation = new FBXLoader();
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
const train_loader = new GLTFLoader().setPath('Train/');
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

function animate() {
    const delta = clock.getDelta();
    if (mixer) mixer.update(delta);
    if (trainMixer) trainMixer.update(delta);

    updateCameraMovement();

    renderer.render(scene, camera)
    requestAnimationFrame(animate);
}
requestAnimationFrame(animate);
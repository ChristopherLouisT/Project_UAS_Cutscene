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
scene.fog = new THREE.Fog(0xcccccc, 100, 900);

//setup camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(50, 0, 0);
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
var skyColor = 0xFFFFFF;  // light blue
var groundColor = 0xB97A20;  // brownish orange
const HemisphereLight = new THREE.HemisphereLight(0xF5F5F5, 0xF5F5F5, 1.5);
HemisphereLight.position.set(-60, -10, 0)
scene.add(HemisphereLight);
var hemisphereLightHelper = new THREE.HemisphereLightHelper(HemisphereLight);
scene.add(hemisphereLightHelper);

// Spot Light
color = 0xFFFFFF;
intensity = 100000;
var distance = 500;
var angle = THREE.MathUtils.degToRad(35);
const spotLight = new THREE.SpotLight(0xFFFFFF, 150000, 1000, Math.PI / 3);
spotLight.position.set(-120, 80, -120);
spotLight.target.position.set(-80, 0, 0);
spotLight.castShadow = true; 
spotLight.shadow.mapSize.width = 2048; // Higher res for big scenes
spotLight.shadow.mapSize.height = 2048;
spotLight.shadow.camera.near = 10; 
spotLight.shadow.camera.far = 1000;
spotLight.shadow.bias = -0.0001;
scene.add(new THREE.CameraHelper(spotLight.shadow.camera)) 
scene.add(spotLight);
scene.add(spotLight.target);

var spotLightHelper = new THREE.SpotLightHelper(spotLight);
scene.add(spotLightHelper);

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
        market.scale.set(5,5,3); //X Y Z
        market.position.set(-130,-9,-65)
        animate();

    });


// ASSET: CITY (SCENE 4 + FINAL)
const city_loader = new GLTFLoader().setPath( 'City/' );
    city_loader.load( 'scene.gltf', function ( gltf ) {

        const city = gltf.scene

        city.traverse((node) => {
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

        scene.add( city );
        city.scale.set(10,10,10); //X Y Z
        animate();

    });

let actions = {}, currentAction;
let characterModel;
let isWalkingForward;
let currentPhase = "walk1"; // Phases: walk1, turning, walk2, idle
let walkDistance = 0;
const phase1Target = 110;
const phase2Target = 30;
const walkSpeed = 5;

const loader = new FBXLoader();
loader.setPath("Jinhsi/");
loader.load("Walking.fbx", (fbx) => {
    fbx.scale.setScalar(0.02);
    fbx.position.set(-20,-10,0);
    fbx.rotation.y = Math.PI  + (Math.PI / 2);

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
    characterModel = fbx;

    if (fbx.animations.length > 0) {
        const walkAction = mixer.clipAction(fbx.animations[0]);
        actions["walk"] = walkAction;
        currentAction = walkAction; // Set this so the 'turn' logic can fade it out
        walkAction.play();         // Start the bones moving!
    }
    // ----------------------------------------

    isWalkingForward = true;
    loadAnim("turnRight", "Right Turn.fbx");
    loadAnim("walk", "Walking.fbx");
});

function animate() {
    const delta = clock.getDelta();
    if (mixer) mixer.update(delta);

    if (characterModel) {
        const moveStep = walkSpeed * delta;

        // PHASE 1: INITIAL WALK (Z-AXIS)
        if (currentPhase === "walk1") {
            characterModel.position.x -= moveStep;
            walkDistance += moveStep;

            if (walkDistance >= phase1Target) {
                currentPhase = "turning";
                if (actions["turnRight"]) {
                    const prevAction = currentAction;
                    currentAction = actions["turnRight"];
                    prevAction.fadeOut(0.5);
                    currentAction.reset().fadeIn(0.5).play();

                    // When turn ends, start Walk 2
                    mixer.addEventListener('finished', function onTurnEnd(e) {
                        if (e.action === actions["turnRight"]) {
                            characterModel.rotation.y -= Math.PI / 2; // Physical turn
                            walkDistance = 0; // Reset distance for second walk
                            currentPhase = "walk2";
                            
                            // Switch back to walk animation
                            currentAction.fadeOut(0.5);
                            currentAction = actions["walk"];
                            currentAction.reset().fadeIn(0.5).play();
                            
                            mixer.removeEventListener('finished', onTurnEnd); //Can add another animation if needed
                        }
                    });
                }
            }
        }

        // PHASE 2: SECOND WALK (X-AXIS)
        // Note: After a 90-deg left turn from -Z, the character moves toward -X
        else if (currentPhase === "walk2") {
            characterModel.position.z -= moveStep; 
            walkDistance += moveStep;

            if (walkDistance >= phase2Target) {
                currentPhase = "idle";
                currentAction.fadeOut(0.5); // Stop walking animation
                // if you have an idle animation, play it here
            }
        }
    }

    updateCameraMovement();
    
    renderer.render(scene, camera)
    requestAnimationFrame(animate);
}
requestAnimationFrame(animate);

function loadAnim(name, file) {
    const animLoader = new FBXLoader();
    animLoader.setPath("Jinhsi/");
    animLoader.load(file, (anim) => {
        const action = mixer.clipAction(anim.animations[0]);
        actions[name] = action;
        
        // Turn animations usually only play once
        if (name.toLowerCase().includes("turn")) {
            action.setLoop(THREE.LoopOnce);
            action.clampWhenFinished = true;
        }
    });
}

const movement = {
        forward: false,
        backward: false,
        left: false,
        right: false,
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
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

// var directionalLightHelper = new THREE.HemisphereLightHelper(light);
// scene.add(directionalLightHelper);


// const sunLight = new THREE.DirectionalLight(0xffe9c0, 2.5);
// sunLight.position.set(150, 140, 80);
// sunLight.target.position.set(-90,-80,-15)
// sunLight.castShadow = true;
// sunLight.shadow.camera.near = 1;
// sunLight.shadow.camera.far = 1000;
// sunLight.shadow.camera.left = -300;
// sunLight.shadow.camera.right = 300;
// sunLight.shadow.camera.top = 300;
// sunLight.shadow.camera.bottom = -300;
// sunLight.shadow.bias = -0.09; //Buat shadownya ga terlalu kuat
// scene.add(new THREE.CameraHelper(sunLight.shadow.camera)) 
// scene.add(sunLight);
// scene.add(sunLight.target)
// var sunLightHelper = new THREE.DirectionalLightHelper(sunLight)
// scene.add(sunLightHelper)

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
let currentPhase = "walk1"; // Phases: walk1, turning, walk2, idle
let walkDistance = 0;
const phase1Target = 40;
const phase2Target = 30;
const walkSpeed = 4;

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
    // ----------------------------------------

    isWalkingForward = true;
    loadAnim("turnLeft", "Left Turn 90.fbx");
    loadAnim("walk", "Walking.fbx");
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
    const animLoader = new FBXLoader();
    animLoader.setPath("Jinhsi/");
    animLoader.load(file, (anim) => {
        const action = mixer.clipAction(anim.animations[0]);
        actions[name] = action;
        
        // Turn animations usually only play once
        if (name === "turnLeft") {
            action.setLoop(THREE.LoopOnce);
            action.clampWhenFinished = true; // Stay at the end frame
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

function animate() {
    const delta = clock.getDelta();
    if (mixer) mixer.update(delta);
    updateCameraMovement();

    if (characterModel) {
        const moveStep = walkSpeed * delta;

        // PHASE 1: INITIAL WALK (Z-AXIS)
        if (currentPhase === "walk1") {
            characterModel.position.z -= moveStep;
            walkDistance += moveStep;

            if (walkDistance >= phase1Target) {
                currentPhase = "turning";
                if (actions["turnLeft"]) {
                    const prevAction = currentAction;
                    currentAction = actions["turnLeft"];
                    prevAction.fadeOut(0.5);
                    currentAction.reset().fadeIn(0.5).play();

                    // When turn ends, start Walk 2
                    mixer.addEventListener('finished', function onTurnEnd(e) {
                        if (e.action === actions["turnLeft"]) {
                            characterModel.rotation.y += Math.PI / 2; // Physical turn
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
            characterModel.position.x -= moveStep; 
            walkDistance += moveStep;

            if (walkDistance >= phase2Target) {
                currentPhase = "idle";
                currentAction.fadeOut(0.5); // Stop walking animation
                // if you have an idle animation, play it here
            }
        }
    }

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}
requestAnimationFrame(animate);
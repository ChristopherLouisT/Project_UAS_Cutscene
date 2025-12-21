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
// var hemisphereLightHelper = new THREE.HemisphereLightHelper(HemisphereLight);
// scene.add(hemisphereLightHelper);

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
// scene.add(new THREE.CameraHelper(spotLight.shadow.camera)) 
scene.add(spotLight);
scene.add(spotLight.target);

// var spotLightHelper = new THREE.SpotLightHelper(spotLight);
// scene.add(spotLightHelper);

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

//For collisions
const colliders = [];

function collectColliders(root) {
    root.traverse(obj => {
        if (!obj.isMesh) return;

        // HANYA collider yang memang obstacle
        if (!obj.name.toLowerCase().includes("wall") &&
            !obj.name.toLowerCase().includes("building") &&
            !obj.name.toLowerCase().includes("pillar")) {
            return;
        }

        const geom = obj.geometry;
        geom.computeBoundingBox();

        const box = geom.boundingBox.clone();
        box.applyMatrix4(obj.matrixWorld);

        colliders.push(box);

    });
}


const prevCharacterPos = new THREE.Vector3();
const characterBox = new THREE.Box3();
const characterSize = new THREE.Vector3(0.8, 1.8, 0.8);

function updateCharacterCollider() {
    characterBox.setFromCenterAndSize(
        characterModel.position.clone().add(new THREE.Vector3(0, 0.9, 0)),
        characterSize
    );
}

//Raycast Camera
const cameraRay = new THREE.Raycaster();

function resolveCameraCollision(target, desiredPos) {
    const dir = desiredPos.clone().sub(target);
    const dist = dir.length();

    cameraRay.set(target, dir.normalize());
    cameraRay.far = dist;

    const hits = cameraRay.intersectObjects(scene.children, true);

    if (hits.length > 0) {
        camera.position.copy(
            hits[0].point.addScaledVector(dir.normalize(), -0.3)
        );
    } else {
        camera.position.copy(desiredPos);
    }
}




//Ensuring all models are loaded before animation runs
let assetsToLoad = 3; // Market + City + Character
let assetsLoaded = 0;
let sceneReady = false;

function startScene() {
    sceneReady = true;

    // Reset clocks
    clock.start();
    cameraClock.start();

    startTime = clock.getElapsedTime();

    // Reset camera cutscene
    isCameraCutscene = true;
    cameraShotIndex = 0;
    cameraShotStartTime = cameraClock.getElapsedTime();

    // Start animation loop (SATU KALI SAJA)
    animate();
}

function onAssetLoaded() {
    assetsLoaded++;
    if (assetsLoaded === assetsToLoad) {
        startScene();
    }
}


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

        market.updateMatrixWorld(true); 
        collectColliders(market);
        onAssetLoaded();

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

        city.updateMatrixWorld(true);
        collectColliders(city);
        onAssetLoaded();

    });

let actions = {}, currentAction;
let characterModel;
let isWalkingForward;
let currentPhase = "walk_out"; // Phases: walk_out, turn, walk2, idle
let walkDistance = 0;
const phase1Target = 110;
const phase2Target = 30;
const walkSpeed = 6.15

const loader = new FBXLoader();
loader.setPath("Jinhsi/");
loader.load("Walking.fbx", (fbx) => {

    startTime = clock.getElapsedTime();
    currentPhase = "walk_out";
    fbx.scale.setScalar(0.02);
    fbx.position.set(-130, -10 ,-48 ); // depan pintu market
    fbx.rotation.y = Math.PI * 2;       // menghadap keluar

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
    onAssetLoaded();

    //Ensuring the cinematic starts after the character loaded
    controls.enabled = false;
    isCameraCutscene = true;
    cameraShotIndex = 0;
    cameraShotStartTime = cameraClock.getElapsedTime();


    if (fbx.animations.length > 0) {
        const walkAction = mixer.clipAction(fbx.animations[0]);
        actions["walk"] = walkAction;
        currentAction = walkAction; // Set this so the 'turn' logic can fade it out
        walkAction.play();         // Start the bones moving!
    }
    // ----------------------------------------

    isWalkingForward = true;
    loadAnim("turnRight", "Right Turn.fbx");
    loadAnim("turnLeft", "Left Turn 90.fbx");
    loadAnim("sit", "Sitting.fbx");
});

let startTime = 0;
let elapsedTime = 0;

const timeline = {
    walk_out: 8,   // keluar dari supermarket
    turn: 1.2,
    walk_final: 12
};


//Camera scenes configuration
let isCameraCutscene = true;
let cameraShotIndex = 0;
let cameraShotStartTime = 0;

const cameraClock = new THREE.Clock();

const staticLookTarget = new THREE.Vector3();

function getCharacterForward() {
    return new THREE.Vector3(0, 0, 1)
        .applyQuaternion(characterModel.quaternion)
        .normalize();
}

const cameraTimeline = [
    //FRONT → MOVE BACKWARD
    {
        duration: 8,

        start: () => {
            const forward = getCharacterForward();

            const pos = characterModel.position.clone()
                .add(forward.clone().multiplyScalar(10)) // ⬅ DEPAN
                .add(new THREE.Vector3(0, 5, 0));

            snapCamera(
                pos,
                characterModel.position.clone().add(new THREE.Vector3(0, 4, 0))
            );
        },

        update: () => {
            const forward = getCharacterForward();

            const desiredPos = characterModel.position.clone()
                .add(forward.clone().multiplyScalar(10))
                .add(new THREE.Vector3(0, 5, 0));

            camera.position.lerp(desiredPos, 0.08);

            camera.lookAt(
                characterModel.position.clone().add(new THREE.Vector3(0, 4, 0))
            );
        }
    },


    //SIDE STATIC
    {
        duration: 3.0,
        start: () => {
            camera.position.set(-140, 6, 15);
            staticLookTarget.set(-130, 4, 0);
            camera.lookAt(staticLookTarget);
        },
        update: () => {
            camera.lookAt(staticLookTarget);
        }
    },



    //FAST CINEMATIC APPROACH → FP (HIGHER CAMERA, STRAIGHT LOOK)
    {
        duration: 6,

        start: () => {
            camera.userData.startPos = camera.position.clone();
        },

        update: () => {
            const rawT = Math.min(
                (cameraClock.getElapsedTime() - cameraShotStartTime) / 6.0,
                1
            );

            const t = Math.min(rawT * 1.5, 1);
            const ease = t * t * (3 - 2 * t);

            // Kepala karakter
            const head = characterModel.position.clone()
                .add(new THREE.Vector3(0, 6, 0));

            // Arah wajah
            const forward = new THREE.Vector3(0, 0, 1)
                .applyQuaternion(characterModel.quaternion)
                .normalize();

            // 📌 POSISI FP (LEBIH TINGGI)
            const fpTarget = head.clone()
                .add(forward.multiplyScalar(0.8))
                .add(new THREE.Vector3(0, 0.4, 0)); // ⬆ naik dikit

            camera.position.copy(
                camera.userData.startPos.clone().lerp(fpTarget, ease)
            );

            // 🎯 LOOK TETAP LURUS (TIDAK KE ATAS)
            camera.lookAt(
                head.clone().add(forward.multiplyScalar(10))
            );
        }
    },
    // 5️⃣ SLOW TILT UP → SKY (CINEMATIC END)
    {
        duration: 4,

        start: () => {
            // simpan posisi kamera (tetap)
            camera.userData.tiltStartPos = camera.position.clone();

            // simpan arah pandang awal
            const head = characterModel.position.clone().add(new THREE.Vector3(0, 6, 0));
            const forward = new THREE.Vector3(0, 0, 1)
                .applyQuaternion(characterModel.quaternion)
                .normalize();

            camera.userData.tiltFrom = head.clone().add(forward.multiplyScalar(10));

            // target langit (tinggi + agak ke depan)
            camera.userData.tiltTo = head.clone()
                .add(forward.multiplyScalar(20))
                .add(new THREE.Vector3(0, 160, 0)); // ⬆ naik ke langit
        },

        update: () => {
            const t = Math.min(
                (cameraClock.getElapsedTime() - cameraShotStartTime) / 4,
                1
            );

            // cinematic ease
            const ease = t * t * (3 - 2 * t);

            camera.rotation.z = THREE.MathUtils.lerp(0, 0.05, ease);

            const lookTarget = camera.userData.tiltFrom
                .clone()
                .lerp(camera.userData.tiltTo, ease);

            camera.lookAt(lookTarget);
        }
    }


];

function snapCamera(position, lookTarget) {
    camera.position.copy(position);
    camera.lookAt(lookTarget);
}


function updateCameraCutscene(delta) {
    const shot = cameraTimeline[cameraShotIndex];
    if (!shot) {
        endCameraCutscene();
        return;
    }

    if (!shot._started) {
        shot._started = true;
        if (shot.start) shot.start();
    }

    shot.update?.(delta);

    if (cameraClock.getElapsedTime() - cameraShotStartTime >= shot.duration) {
        cameraShotIndex++;
        cameraShotStartTime = cameraClock.getElapsedTime();
    }
}


function endCameraCutscene() {
    isCameraCutscene = false;
    controls.enabled = true;
}

function switchToSit() {
    currentPhase = "sit";

    const prev = currentAction;
    currentAction = actions["sit"];

    prev.fadeOut(0.4);
    currentAction.reset().fadeIn(0.4).play();

    currentAction.setLoop(THREE.LoopOnce);
    currentAction.clampWhenFinished = true;

    mixer.addEventListener("finished", onSitFinished);
}

function onSitFinished(e) {
    if (e.action === actions["sit"]) {
        currentPhase = "walk_final";

        currentAction.fadeOut(0.3);
        currentAction = actions["walk"];
        currentAction.reset().fadeIn(0.3).play();

        mixer.removeEventListener("finished", onSitFinished);
    }
}

let isTurning = false;
let turnTimer = 0;
const TURN_DURATION = 1.2; // harus sama dengan animasi
function switchToTurnLeft() {

    if (isTurning) return;
    isTurning = true;

    if (!actions.turnLeft || !currentAction) return;

    currentPhase = "turn";
    turnTimer = 0;

    const prev = currentAction;
    currentAction = actions.turnLeft;

    prev.fadeOut(0.3);
    currentAction.reset().fadeIn(0.3).play();
}


function onTurnLeftFinished(e) {
    if (e.action === actions["turnLeft"]) {

        characterModel.rotation.y += Math.PI / 2;

        currentPhase = "walk_final";
        startTime = clock.getElapsedTime();

        currentAction.fadeOut(0.3);
        currentAction = actions["walk"];
        currentAction.reset().fadeIn(0.3).play();

        isTurning = false; // 🔓 BUKA KUNCI
        mixer.removeEventListener("finished", onTurnLeftFinished);
    }
}

let hasExitedWalkOut = false;

function animate() {
    if (!sceneReady) return;

    const delta = clock.getDelta();
    elapsedTime = clock.getElapsedTime() - startTime;

    if (mixer) mixer.update(delta);

    if (characterModel) {

        // 1️⃣ SIMPAN POSISI SEBELUM GERAK
        prevCharacterPos.copy(characterModel.position);

        // ================= SCENE 2 =================
        if (currentPhase === "walk_out") {
            if (!hasExitedWalkOut) {
                characterModel.position.z += walkSpeed * delta;
            }

            if (!hasExitedWalkOut &&
                elapsedTime >= timeline.walk_out &&
                animationsReady
            ) {
                hasExitedWalkOut = true;   // 🔒 KUNCI
                switchToTurnLeft();
            }
        }

        else if (currentPhase === "turn") {

            turnTimer += delta;

            if (turnTimer >= TURN_DURATION) {

                characterModel.rotation.y += Math.PI / 2;

                currentPhase = "walk_final";
                startTime = clock.getElapsedTime();

                currentAction.fadeOut(0.2);
                currentAction = actions.walk;
                currentAction.reset().fadeIn(0.2).play();

                isTurning = false;
            }
        }


        else if (currentPhase === "walk_final") {
            // jalan lurus setelah belok kiri
            characterModel.position.x += walkSpeed * delta;
        }

        // 2️⃣ UPDATE COLLIDER SETELAH GERAK
        updateCharacterCollider();

        const desiredPos = characterModel.position.clone();

        for (const box of colliders) {
            if (characterBox.intersectsBox(box)) {

                // rollback X
                characterModel.position.x = prevCharacterPos.x;
                updateCharacterCollider();

                if (!characterBox.intersectsBox(box)) break;

                // rollback Z
                characterModel.position.z = prevCharacterPos.z;
                updateCharacterCollider();

                break;
            }
        }

    }

    // CAMERA
    if (isCameraCutscene && characterModel) {
        updateCameraCutscene(delta);
    } else {
        updateCameraMovement();
    }

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}

requestAnimationFrame(animate);


let animationsReady = false;
function loadAnim(name, file) {
    const animLoader = new FBXLoader();
    animLoader.setPath("Jinhsi/");
    animLoader.load(file, (anim) => {

        const action = mixer.clipAction(anim.animations[0]);
        actions[name] = action;

        if (name.toLowerCase().includes("turn")) {
            action.setLoop(THREE.LoopOnce);
            action.clampWhenFinished = true;
        }

        // ✅ CHECK SIAP
        if (actions.turnLeft && actions.turnRight) {
            animationsReady = true;
        }
    });
}


const movement = {
        forward: false,
        backward: false,
        left: false,
        right: false,
    };
const moveSpeed = 0.4;      // camera move speed

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
     if (isCameraCutscene) return;

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
    import * as THREE from "three"
    import Stats from "./node_modules/stats.js/src/Stats.js"

    //orbit control
    import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
    import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
    import { FBXLoader } from "three/addons/loaders/FBXLoader.js";

    /* ================ */

    //setup Canvas Renderer
    const renderer = new THREE.WebGLRenderer({
    antialias: true,
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    renderer.shadowMap.enabled = true;

    //setup scene
    const scene = new THREE.Scene();

    //setup camera
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    // let cameraOffset = new THREE.Vector3(10,20,50); 
    // let cameraLookOffset = new THREE.Vector3(0,20,0);
    // let cameraLerpSpeed = 0.1;
    let GLOBAL_LOOK_TARGET = new THREE.Vector3(10, 20, 40);
    camera.position.set(10, 20, 60);
    camera.lookAt(0, 0, 0);

    const cameraShots = {
    SIT: {
        position: new THREE.Vector3(10, 20, 60),
        lookTarget: new THREE.Vector3(10, 20, 40),
    },

    STAND_LEFT_CLOSE: {
        position: new THREE.Vector3(-80, 20, 30),
        lookTarget: new THREE.Vector3(-25, 20, 30),
    },

    WALK_LEFT_FAR: {
        position: new THREE.Vector3(-90, 20, 45),
        lookTarget: new THREE.Vector3(-40, 20, 45),
    },

    WALK_TURN_LEFT: {
        position: new THREE.Vector3(-40, 20, 60),
        lookTarget: new THREE.Vector3(-40, 20, 90),
    }
};

    //Zoom setup
    const zoomSit = 80;    // far when sitting
    const zoomNormal = 10; // close when standing/walking
    let currentZoom = zoomNormal;
    const zoomSmooth = 0.01;
    const zoomSpeed = 10; // units per second (tune this)

    //Camera actions
    let lastAction = null;
    let lastWaypointIndex = -1;


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

    // var hemisphereHelper = new THREE.HemisphereLightHelper(hemisphere);
    // scene.add(hemisphereHelper);

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
    // var sunLightHelper = new THREE.DirectionalLightHelper(sunLight)
    // scene.add(sunLightHelper)


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
    const charSpeed = 12; 
    let waypointIndex = 0;

    // Definisi 3 Titik Tujuan
    const waypoints = [
        new THREE.Vector3(-10, -6, 20), // 1. Kanan
        new THREE.Vector3(-10, -9, 120),  // 2. Maju
        new THREE.Vector3(-150, -9, 135)   // 3. Kanan
    ];

    // const stats = new Stats();
    // stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
    // document.body.appendChild(stats.dom);

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
            { time: 5, action: "sit" },
            { time: 8, action: "standup" }, // Durasi standup biasanya 2-3 detik
            { time: 10, action: "walk" },  // Kasih jeda sedikit biar rotasi selesai sempurna
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

        if (movement.forward) {
            camera.getWorldDirection(direction);
            camera.position.addScaledVector(direction, moveSpeed);
            followEnabled = false; // disable follow jika user gerak manual
        }
        if (movement.backward) {
            camera.getWorldDirection(direction);
            camera.position.addScaledVector(direction, -moveSpeed);
            followEnabled = false;
        }
        if (movement.left) {
            camera.getWorldDirection(direction);
            direction.cross(camera.up).normalize();
            camera.position.addScaledVector(direction, -moveSpeed);
            followEnabled = false;
        }
        if (movement.right) {
            camera.getWorldDirection(direction);
            direction.cross(camera.up).normalize();
            camera.position.addScaledVector(direction, moveSpeed);
            followEnabled = false;
        }

        // Update orbit controls target
        // const front = new THREE.Vector3();
        // camera.getWorldDirection(front);
        // controls.target.copy(camera.position).add(front.multiplyScalar(10));
        // controls.update();

    }


    // =======================
    // CAMERA FOLLOW SYSTEM
    // =======================

    let followEnabled = false;    // kamera mengikuti karakter
    let followHeight = 20;       // ketinggian kamera relatif
    let followDistance = -40;     // jarak kamera di belakang karakter
    let followSmooth = 0.1;      // smooth lerp

    function updateCameraFollow() {
        if (!character || !followEnabled) return;

        // posisi karakter
        const charPos = character.position.clone();

        // arah depan karakter
        const forward = new THREE.Vector3(0, 0, 1);
        forward.applyQuaternion(character.quaternion);
        forward.normalize();

        // posisi ideal kamera
        const idealPos = charPos.clone()
            .add(forward.clone().multiplyScalar(-followDistance))
            .add(new THREE.Vector3(0, followHeight, 0));

        // Lerp biar halus
        camera.position.lerp(idealPos, followSmooth);

        // Kamera menghadap karakter
        const lookPos = charPos.clone().add(new THREE.Vector3(0, 10, 0));
        camera.lookAt(lookPos);
    }

    function updateCameraDirectionOnly() {
        const m = new THREE.Matrix4();
        m.lookAt(camera.position, GLOBAL_LOOK_TARGET, camera.up);

        const desiredQuat = new THREE.Quaternion().setFromRotationMatrix(m);
        camera.quaternion.slerp(desiredQuat, 0.08);
    }


    // =======================
    // CINEMATIC ORBIT-FOLLOW
    // =======================

    let orbitEnabled = true;       // kamera mengikuti karakter
    let orbitDistance = 45;        // jarak kamera dari karakter
    let orbitHeight = 18;          // ketinggian kamera
    let orbitAngle = Math.PI * 1.1 // posisi orbit awal
    let orbitSpeed = 0.6;          // kecepatan rotasi orbit
    let orbitSmooth = 0.1;         // smoothness

    function updateOrbitFollow(delta) {
        if (!character || !orbitEnabled) return;

        // Tambahkan rotasi orbit otomatis
        orbitAngle += orbitSpeed * delta;

        // Posisi karakter
        const charPos = character.position.clone();

        // Hitung posisi kamera ideal di orbit
        const idealX = charPos.x + Math.cos(orbitAngle) * orbitDistance;
        const idealZ = charPos.z + Math.sin(orbitAngle) * orbitDistance;
        const idealY = charPos.y + orbitHeight;

        const idealPos = new THREE.Vector3(idealX, idealY, idealZ);

        // LERP agar gerakan kamera halus
        camera.position.lerp(idealPos, orbitSmooth);

        // Kamera selalu menghadap karakter
        const lookAtPos = charPos.clone().add(new THREE.Vector3(0, 10, 0));
        camera.lookAt(lookAtPos);
    }

    function snapCamera(shot) {
        camera.position.copy(shot.position);
        GLOBAL_LOOK_TARGET.copy(shot.lookTarget);
        camera.lookAt(GLOBAL_LOOK_TARGET);
    }



    function snapCameraToShot(shot) {
        if (!character) return;

        const charPos = character.position.clone();

        // left direction of character
        const left = new THREE.Vector3(-1, 0, 0)
            .applyQuaternion(character.quaternion)
            .normalize();

        const forward = new THREE.Vector3(0, 0, 1)
            .applyQuaternion(character.quaternion)
            .normalize();

        const offset = new THREE.Vector3()
            .add(left.multiplyScalar(shot.offset.x))
            .add(new THREE.Vector3(0, shot.offset.y, 0))
            .add(forward.multiplyScalar(shot.offset.z));

        camera.position.copy(charPos.clone().add(offset));

        camera.lookAt(charPos.clone().add(new THREE.Vector3(0, 15, 0)));
    }


    function updateAutoZoom(delta) {
        let targetZoom = zoomNormal;
        // let targetZoom = zoomSit;

        if (currentAction === actions["sit"]) {
            targetZoom = zoomSit;
        }

        // Move zoom at CONSTANT SPEED
        if (currentZoom < targetZoom) {
            currentZoom += zoomSpeed * delta;
            //Only zoom out
            if (currentZoom > targetZoom) currentZoom = targetZoom;
        } 
        else if (currentZoom > targetZoom) {
            // currentZoom -= zoomSpeed * delta;
            currentZoom = targetZoom;
            if (currentZoom < targetZoom) currentZoom = targetZoom;
        }

        // Direction from global target to camera
        const dir = camera.position.clone()
            .sub(GLOBAL_LOOK_TARGET)
            .normalize();

        // Apply zoom
        camera.position.copy(
            GLOBAL_LOOK_TARGET.clone().add(dir.multiplyScalar(currentZoom))
        );
    }

    function updateCameraTimeline() {

        // SITTING → wide, calm
        if (currentAction === actions["sit"] && lastAction !== "sit") {
            snapCamera(cameraShots.SIT);
            lastAction = "sit";
        }

        // STANDING UP → cut to close left
        if (currentAction === actions["standup"] && lastAction !== "standup") {
            snapCamera(cameraShots.STAND_LEFT_CLOSE);
            lastAction = "standup";
        }

        // WALKING → far left tracking view
        if (currentAction === actions["walk"] && lastAction !== "walk") {
            snapCamera(cameraShots.WALK_LEFT_FAR);
            lastAction = "walk";
        }

        // TURN / DIRECTION CHANGE → cut again
        if (
            currentAction === actions["walk"] &&
            waypointIndex == 2
        ) {
            snapCamera(cameraShots.WALK_TURN_LEFT);
            lastWaypointIndex = waypointIndex;
        }
    }

    function resize() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    }

    window.addEventListener("resize", resize);
    document.addEventListener("fullscreenchange", resize);


    function animate() {
        // stats.begin();
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

        updateCameraTimeline();

        // Update kamera user
        // updateCameraMovement();

        updateCameraDirectionOnly();

        updateAutoZoom(delta);

        // Camera follow character
        // updateCameraFollow();

        // updateOrbitFollow(delta);

        renderer.render(scene, camera)
        // stats.end();
        requestAnimationFrame(animate);
    }


    requestAnimationFrame(animate);
import * as THREE from "three"

//orbit control
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

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


// ASSET: CITY (SCENE 4 + FINAL)
// const city_loader = new GLTFLoader().setPath( 'City/' );
//     city_loader.load( 'scene.gltf', function ( gltf ) {

//         const city = gltf.scene

//         city.traverse((node) => {
//             if (node.isMesh) {
//                 const oldMat = node.material;
                
//                 // Replace MeshBasicMaterial with light-reactive material
//                 if (oldMat && oldMat.type === 'MeshBasicMaterial') {
//                     const newMat = new THREE.MeshStandardMaterial({
//                         map: oldMat.map || null,
//                         normalMap: oldMat.normalMap || null,
//                         roughness: 0.8,
//                         metalness: 0.1,
//                         emissiveMap: oldMat.emissiveMap || null,
//                         emissive: oldMat.emissive || new THREE.Color(0x000000),
//                     });
//                     newMat.needsUpdate = true;
//                     node.material = newMat;
//                 }

//                 node.castShadow = true;
//                 node.receiveShadow = true;
//             }

//             if (node.isLight) node.parent.remove(node);
//         });

//         // scene.add( city );
//         // city.scale.set(10,10,10); //X Y Z
//         // animate();

//     });

    const subway_loader = new GLTFLoader().setPath( 'Subway/' );
    subway_loader.load( 'scene.gltf', function ( gltf ) {

        const subway = gltf.scene

        scene.add( subway );
        subway.scale.set(10,10,10); //X Y Z
        animate();

    });

const urotsuki_loader = new GLTFLoader().setPath( 'asset2/' );
    urotsuki_loader.load( 'scene.gltf', function ( gltf ) {

        const model = gltf.scene;

        model.traverse((node) => {
            if (node.isMesh || node.isSkinnedMesh) {
                node.castShadow = true;
                node.receiveShadow = true;

                // Convert MeshBasicMaterial to a shadow-supporting one
                if (node.material && node.material.type === 'MeshBasicMaterial') {
                const oldMat = node.material;
                node.material = new THREE.MeshStandardMaterial({
                    map: oldMat.map || null,
                    skinning: !!node.isSkinnedMesh,
                    roughness: 0.6,
                    metalness: 0.1,
                });
                node.material.needsUpdate = true;
                }
            }
        });

        scene.add( model );
        model.scale.set(10,10,10); //X Y Z
        model.position.set(30,10,10) //X Y Z
        model.rotation.y = Math.PI  + (Math.PI / 2);

        // --- Animation setup ---
        mixer = new THREE.AnimationMixer(model);

        // Play the first animation, or find one by name
        const clips = gltf.animations;

        // Find the one named "sit" (case-insensitive)
        const sitClip = THREE.AnimationClip.findByName(clips, 'Walking');

        if (sitClip) {
            const action = mixer.clipAction(sitClip);
            action.play(); // start playing the animation
        } else {
            console.warn('Sit animation not found — available clips:', clips.map(c => c.name));
        }

        animate();

    } );

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

function animate() {
    const delta = clock.getDelta();
    if (mixer) mixer.update(delta);
    renderer.render(scene, camera)
    requestAnimationFrame(animate);
}
requestAnimationFrame(animate);
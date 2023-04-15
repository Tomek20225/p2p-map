import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

// Renderer (canvas) configuration
const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.setPixelRatio( window.devicePixelRatio );
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild( renderer.domElement );

// Scene setup
const scene = new THREE.Scene();

// Map setup
const map = [
    [1],
    [1, 1, 1, 1, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 1, 1, 1, 1],
];
const mapWidth = map.reduce((acc, currentValue) => currentValue.length > acc ? currentValue.length : acc, 0);
const mapHeight = map.length;
const mapCenterPos = new THREE.Vector2((mapWidth - 1) / 2, -((mapHeight - 1) / 2));

for (let y = 0; y < mapHeight; y++) {
    let lengthHolder = 0;
    let startingX = -1;

    for (let x = 0; x < map[y].length; x++) {
        if (map[y][x] == 1) {
            lengthHolder++;
            startingX = (startingX == -1) ? x : startingX;
            if (x != map[y].length - 1) continue;
        }

        if (map[y][x] == 0 && lengthHolder == 0) continue;

        const wallGeometry = new THREE.BoxGeometry( lengthHolder, 1, 2 );
        wallGeometry.translate( lengthHolder / 2, 1 / 2, 1 / 2 );
        const wallMaterial = new THREE.MeshPhongMaterial( { color: 0x00ff00 } );
        const wall = new THREE.Mesh( wallGeometry, wallMaterial );

        wall.castShadow = false;
        wall.receiveShadow = true;

        scene.add( wall );
        wall.position.set(startingX, -y, 0);

        lengthHolder = 0;
        startingX = -1;
    }
}

// Plane setup
const planeGeometry = new THREE.PlaneGeometry(mapWidth, mapHeight);
planeGeometry.translate(mapWidth / 2, -mapHeight / 2 + 1, 0);
const planeMaterial = new THREE.MeshPhongMaterial({color: 0xffffff});
const plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.castShadow = false;
plane.receiveShadow = true;
scene.add(plane)

// Camera setup
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
camera.position.set(mapCenterPos.x, mapCenterPos.y, 10);

// Light setup
const light = new THREE.DirectionalLight(0xffffff, 1.0);
light.position.set(mapCenterPos.x, mapCenterPos.y, 90);
light.target.position.set(0, 0, 0);
light.castShadow = true;
scene.add(light);
scene.add( new THREE.CameraHelper( light.shadow.camera ) );

// Camera controls setup
// const controls = new OrbitControls(camera, renderer.domElement);


// The main loop
function animate() {
	requestAnimationFrame( animate );
    //controls.update();
	render();
}

function render() {
    renderer.render(scene, camera)
}

// Resize window when its size has changed
window.addEventListener('resize', onWindowResize, false)
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
    render()
}

animate();
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
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
];
const mapWidth = map.reduce((acc, currentValue) => currentValue.length > acc ? currentValue.length : acc, 0);
const mapHeight = map.length;
const mapCenterPos = new THREE.Vector2((mapWidth - 1) / 2, -((mapHeight - 1) / 2));

const mapWalkablePositions = map.reduce((acc, currentValue, index) => {
    let walkablePositionsInRow: THREE.Vector2[] = [];
    for (let i = 0; i < currentValue.length; i++) {
        if (currentValue[i] == 0) walkablePositionsInRow.push(new THREE.Vector2(i, -index));
    }
    return Array.prototype.concat(acc, walkablePositionsInRow);
}, [] as THREE.Vector2[]);
const getRandomWalkablePosition = () => mapWalkablePositions[(Math.floor(Math.random() * mapWalkablePositions.length))];

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

        wall.position.set(startingX, -y, 0);

        wall.castShadow = false;
        wall.receiveShadow = true;

        scene.add( wall );

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
const calculateCameraZ = () => {
    const magicNumber = 750; // calculated empirically
    const defaultZ = 5;

    const zBasedOnWidth = Math.round((mapWidth * magicNumber) / window.innerWidth) + 1;
    const zBasedOnHeight = Math.round((mapHeight * magicNumber) / window.innerHeight) + 1;

    return Math.max(zBasedOnWidth, zBasedOnHeight, defaultZ);
}
camera.position.set(mapCenterPos.x, mapCenterPos.y, calculateCameraZ());

// Light setup
const light = new THREE.DirectionalLight(0xffffff, 1.0);
light.position.set(mapCenterPos.x, mapCenterPos.y, 1000);
light.target.position.set(mapCenterPos.x, mapCenterPos.y, 0);
light.castShadow = true;
scene.add(light)
scene.add(light.target);
// scene.add( new THREE.CameraHelper( light.shadow.camera ) );

// Player setup
const playerConfig = {
    geometry: new THREE.SphereGeometry(0.35),
    material: new THREE.MeshPhongMaterial({color: 0x0000ff}),
    size: 0.35
};
const playerRandomPos = getRandomWalkablePosition();
const player = {
    id: 1,
    position: new THREE.Vector3(playerRandomPos.x, playerRandomPos.y, playerConfig.size),
    instance: new THREE.Mesh(playerConfig.geometry, playerConfig.material)
};
player.instance.position.set(player.position.x, player.position.y, player.position.z);
scene.add(player.instance);

// Camera controls setup
// const controls = new OrbitControls(camera, renderer.domElement);

// Player movement
document.addEventListener("keydown", onKeyDown);
document.addEventListener("keyup", onKeyUp);

const keyStates = {
    up: false,
    down: false,
    left: false,
    right: false
}

function onKeyDown(e: KeyboardEvent) {
    e.preventDefault();
    if (!e.key.includes("Arrow")) return;
    keyStates[e.key.replace("Arrow", "").toLowerCase()] = true;
}

function onKeyUp(e: KeyboardEvent) {
    e.preventDefault();
    if (!e.key.includes("Arrow")) return;
    keyStates[e.key.replace("Arrow", "").toLowerCase()] = false;
}

function updatePlayerPosition() {
    const speed = 0.05;

    if (keyStates.up) player.position.y += speed;
    if (keyStates.down) player.position.y -= speed;
    if (keyStates.left) player.position.x -= speed;
    if (keyStates.right) player.position.x += speed;

    player.instance.position.copy(player.position);
}


// The main loop
function animate() {
	requestAnimationFrame( animate );

    // controls.update();

    updatePlayerPosition();

    render();
}

function render() {
    renderer.render(scene, camera)
}

// Resize window when its size has changed
window.addEventListener('resize', onWindowResize, false)
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.position.setZ(calculateCameraZ());
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
    render()
}

animate();

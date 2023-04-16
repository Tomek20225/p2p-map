import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

import GameMap from "./map";
import type { Wall } from "./wall";
import { calculateCameraZ } from "./helpers";

// Global variables
let WIDTH = window.innerWidth;
let HEIGHT = window.innerHeight;

// Renderer (canvas) configuration
const renderer = new THREE.WebGLRenderer();
renderer.setSize( WIDTH, HEIGHT );
renderer.setPixelRatio( window.devicePixelRatio );
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild( renderer.domElement );

// Scene setup
const scene = new THREE.Scene();

// Map setup
const map = new GameMap();
const walls = [] as Wall[];

for (let y = 0; y < map.getHeight(); y++) {
    let lengthHolder = 0;
    let startingX = -1;

    for (let x = 0; x < map.get()[y].length; x++) {
        if (map.get()[y][x] == 1) {
            lengthHolder++;
            startingX = (startingX == -1) ? x : startingX;
            if (x != map.get()[y].length - 1) continue;
        }

        if (map.get()[y][x] == 0 && lengthHolder == 0) continue;

        const wallGeometry = new THREE.BoxGeometry( lengthHolder, 1, 2 );
        wallGeometry.translate( lengthHolder / 2, 1 / 2, 1 / 2 );
        const wallMaterial = new THREE.MeshPhongMaterial( { color: 0x00ff00 } );
        const wall = new THREE.Mesh( wallGeometry, wallMaterial );

        wall.position.set(startingX, -y, 0);

        wall.castShadow = false;
        wall.receiveShadow = true;

        scene.add( wall );
        walls.push({
            instance: wall,
            box: new THREE.Box3().setFromObject(wall)
        } as Wall);

        lengthHolder = 0;
        startingX = -1;
    }
}

// Plane setup
const planeGeometry = new THREE.PlaneGeometry(map.getWidth(), map.getHeight());
planeGeometry.translate(map.getWidth() / 2, -map.getHeight() / 2 + 1, 0);
const planeMaterial = new THREE.MeshPhongMaterial({color: 0xffffff});
const plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.castShadow = false;
plane.receiveShadow = true;
scene.add(plane)

// Camera setup
const camera = new THREE.PerspectiveCamera( 75, WIDTH / HEIGHT, 0.1, 1000 );
camera.position.set(map.getCenterPosition().x, map.getCenterPosition().y, calculateCameraZ(WIDTH, HEIGHT, map.getWidth(), map.getHeight()));

// Light setup
const light = new THREE.DirectionalLight(0xffffff, 1.0);
light.position.set(map.getCenterPosition().x, map.getCenterPosition().y, 1000);
light.target.position.set(map.getCenterPosition().x, map.getCenterPosition().y, 0);
light.castShadow = true;
scene.add(light)
scene.add(light.target);
// scene.add( new THREE.CameraHelper( light.shadow.camera ) );

// Player setup
const playerRandomPos = map.getRandomWalkablePosition();
const playerSize = 0.35;
const playerConfig = {
    geometry: new THREE.SphereGeometry(playerSize).translate(playerSize, playerSize, 0),
    material: new THREE.MeshPhongMaterial({color: 0x0000ff}),
    size: playerSize,
    speed: 0.05,
    accRate: 0.001
};
const player = {
    id: 1,
    i: new THREE.Mesh(playerConfig.geometry, playerConfig.material),
    acc: 0
};
player.i.position.set(playerRandomPos.x, playerRandomPos.y, playerConfig.size);
scene.add(player.i);

// Camera controls setup
// const controls = new OrbitControls(camera, renderer.domElement);

// Player movement
document.addEventListener("keydown", onKeyDown);
document.addEventListener("keyup", onKeyUp);
document.addEventListener("mousedown", onMouseDown);
document.addEventListener("mouseup", onMouseUp);
document.addEventListener("mousemove", onMouseMove);

const keyStates = {
    up: false,
    down: false,
    left: false,
    right: false,
    mouse: false,
    mouseDir: new THREE.Vector2()
}

function onKeyDown(e: KeyboardEvent):void {
    e.preventDefault();
    if (!e.key.includes("Arrow")) return;
    keyStates[e.key.replace("Arrow", "").toLowerCase()] = true;
}

function onKeyUp(e: KeyboardEvent): void {
    e.preventDefault();
    if (!e.key.includes("Arrow")) return;
    keyStates[e.key.replace("Arrow", "").toLowerCase()] = false;
}

function onMouseDown(e: MouseEvent): void {
    e.preventDefault();
    if (e.button != 0) return;
    keyStates.mouse = true;
}

function onMouseUp(e: MouseEvent): void {
    e.preventDefault();
    if (e.button != 0) return;

    keyStates.up = false;
    keyStates.down = false;
    keyStates.left = false;
    keyStates.right = false;
    keyStates.mouse = false;
}

function onMouseMove(e: MouseEvent): void {
    e.preventDefault();
    const mouseX = (e.clientX / WIDTH) * 2 - 1;
    const mouseY = -(e.clientY / HEIGHT) * 2 + 1;

    const playerPosition = new THREE.Vector3();
    playerPosition.copy(player.i.position);
    playerPosition.project(camera);

    const areaError = 0.025;

    if ((playerPosition.x <= mouseX + areaError && playerPosition.x >= mouseX - areaError) &&
        (playerPosition.y <= mouseY + areaError && playerPosition.y >= mouseY - areaError))
        keyStates.mouseDir.set(0, 0);
    else
        keyStates.mouseDir.set(mouseX - playerPosition.x, mouseY - playerPosition.y);
}

// Extrapolation of player position
function getPlayerFuturePosition(): THREE.Vector3 {
    const speed = playerConfig.speed + player.acc;
    const futurePlayerPos = new THREE.Vector3().copy(player.i.position);

    if (keyStates.mouse) {
        futurePlayerPos.y += keyStates.mouseDir.y * speed;
        futurePlayerPos.x += keyStates.mouseDir.x * speed;
    }
    else {
        if (keyStates.up) futurePlayerPos.y += speed;
        if (keyStates.down) futurePlayerPos.y -= speed;
        if (keyStates.left) futurePlayerPos.x -= speed;
        if (keyStates.right) futurePlayerPos.x += speed;
    }

    return futurePlayerPos;
}

// Updating player position
function updatePlayerPosition(futurePos: THREE.Vector3): void {
    player.i.position.copy(futurePos);
}

// Detecting whether the player is currently moving
// If player is colliding with a wall, then he is not moving
function playerIsMoving(isColliding: boolean): boolean {
    if (!isColliding && (keyStates.up || keyStates.down || keyStates.left || keyStates.right || keyStates.mouse))
        return true;

    return false;
}

// Updating player acceleration based on whether he is moving
function updatePlayerAcceleration(isColliding: boolean): void {
    if (isColliding) {
        player.acc = 0;
    }

    if (playerIsMoving(isColliding)) player.acc += playerConfig.accRate;
    else player.acc = Math.max(player.acc - playerConfig.accRate, 0);
}

// Collision detection
function detectCollisions(playerFuturePos: THREE.Vector3): boolean {
    const futurePlayer = new THREE.Mesh(playerConfig.geometry, playerConfig.material);
    futurePlayer.position.copy(playerFuturePos);

    const playerBox = new THREE.Box3().setFromObject(futurePlayer);

    for (const wall of walls) {
        if (wall.box.intersectsBox(playerBox)) {
            return true;
        }
    };

    return false;
}

// The main loop
function animate() {
	requestAnimationFrame( animate );

    // controls.update();

    const playerFuturePosition = getPlayerFuturePosition();
    const isColliding = detectCollisions(playerFuturePosition);
    if (!isColliding)
        updatePlayerPosition(playerFuturePosition);

    updatePlayerAcceleration(isColliding);

    render();
}

function render() {
    renderer.render(scene, camera)
}

// Resize window when its size has changed
window.addEventListener('resize', onWindowResize, false)
function onWindowResize() {
    WIDTH = window.innerWidth;
    HEIGHT = window.innerHeight;
    camera.aspect = WIDTH / HEIGHT;
    camera.position.setZ(calculateCameraZ(WIDTH, HEIGHT, map.getWidth(), map.getHeight()));
    camera.updateProjectionMatrix()
    renderer.setSize(WIDTH, HEIGHT);
    render()
}

animate();

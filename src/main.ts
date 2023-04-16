import * as THREE from 'three';
import TWEEN from '@tweenjs/tween.js';
import { io } from 'socket.io-client'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

import GameMap from "./map";
import type { Wall } from "./wall";
import { calculateCameraZ } from "./helpers";
import Player, { PlayerType } from './player';


// Global variables
export let WIDTH = window.innerWidth;
export let HEIGHT = window.innerHeight;

// Renderer (canvas) configuration
const renderer = new THREE.WebGLRenderer();
renderer.setSize( WIDTH, HEIGHT );
renderer.setPixelRatio( window.devicePixelRatio );
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild( renderer.domElement );

// Scene setup
export const scene = new THREE.Scene();

// Map setup
const map = new GameMap();
await map.init();
export const walls = [] as Wall[];

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
export const camera = new THREE.PerspectiveCamera( 75, WIDTH / HEIGHT, 0.1, 1000 );
const mapCenterPos = map.getCenterPosition();
camera.position.set(mapCenterPos.x, mapCenterPos.y, calculateCameraZ(WIDTH, HEIGHT, map.getWidth(), map.getHeight()));

// Light setup
const light = new THREE.DirectionalLight(0xffffff, 1.0);
light.position.set(mapCenterPos.x, mapCenterPos.y, 1000);
light.target.position.set(mapCenterPos.x, mapCenterPos.y, 0);
light.castShadow = true;
scene.add(light)
scene.add(light.target);
// scene.add( new THREE.CameraHelper( light.shadow.camera ) );

// Player setup
export const player = new Player(PlayerType.MAIN, map.getRandomWalkablePosition());
scene.add(player.getI());

// Socket setup
export const players: { [id: string]: Player } = {}
const socket = io(import.meta.env.VITE_SOCKET_URL)

socket.on('connect', function () {
    console.log('connected')
})

socket.on('disconnect', function (message: any) {
    console.log('disconnected: ' + message)
})

socket.on('id', (id: any) => {
    player.setId(id);

    setInterval(() => {
        socket.emit('update', {
            t: Date.now(),
            p: player.getI().position,
        })
    }, 50)
})

socket.on('clients', (clients: any) => {
    Object.keys(clients).forEach((p) => {
        if (!players[p]) {
            players[p] = new Player(PlayerType.OTHER, new THREE.Vector2(0, 0))
            players[p].setId(p);
            if (p != player.getId()) scene.add(players[p].getI())
        } else {
            if (clients[p].p) {
                new TWEEN.Tween(players[p].getI().position)
                    .to(
                        {
                            x: clients[p].p.x,
                            y: clients[p].p.y,
                            z: clients[p].p.z,
                        },
                        50
                    )
                    .start()
            }
        }
    })
})

socket.on('removeClient', (id: string) => {
    scene.remove(scene.getObjectByName(id) as THREE.Object3D)
})

// Camera controls setup
// const controls = new OrbitControls(camera, renderer.domElement);



// The main loop
function animate() {
	requestAnimationFrame( animate );

    // controls.update();

    TWEEN.update()

    if (!player.isColliding())
        player.updatePos();

    player.updateAcc();

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

import * as THREE from 'three'
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer'
import TWEEN from '@tweenjs/tween.js'
import { io } from 'socket.io-client'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'

import GameMap from './map'
import type { Wall, Clients, Scoreboard, MazeResponse, Players, PlayerDto, Score } from './types'
import { calculateCameraZ } from './helpers'
import Player, { PlayerType } from './player'


// Global variables
export let WIDTH = window.innerWidth
export let HEIGHT = window.innerHeight
export let GAME_LOADED = false

// WebGL renderer (canvas) configuration
const renderer = new THREE.WebGLRenderer()
renderer.setSize(WIDTH, HEIGHT)
renderer.setPixelRatio(window.devicePixelRatio)
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
document.body.appendChild(renderer.domElement)

// CSS text renderer configuration (for displaying scores)
const labelRenderer = new CSS2DRenderer
labelRenderer.setSize(WIDTH, HEIGHT)
labelRenderer.domElement.style.position = 'absolute'
labelRenderer.domElement.style.top = '0px'
labelRenderer.domElement.style.pointerEvents = 'none'
document.body.appendChild(labelRenderer.domElement)

// Scene setup
export const scene = new THREE.Scene()

// Camera setup
export const camera = new THREE.PerspectiveCamera(75, WIDTH / HEIGHT, 0.1, 1000)

// Map setup
let map: GameMap
export let walls = [] as Wall[]

// Player setup
export let player: Player
export const players: Players = {}

// Socket setup
const socket = io(import.meta.env.VITE_SOCKET_URL)

socket.on('connect', function () {
	console.log('connected')
})

socket.on('disconnect', function (message: any) {
	console.log('disconnected: ' + message)
})

socket.on('id', (id: string) => {
    player = new Player(PlayerType.MAIN, map.getEntrance())
	player.setId(id)

	setInterval(() => {
		socket.emit('update', {
			t: Date.now(),
			p: player.getI().position,
		})
	}, 50)
})

socket.on('map', (maze: MazeResponse) => {
    map = new GameMap(maze)
    clearScene()
    updateMap()

    GAME_LOADED = true
})

socket.on('clients', (clients: Clients) => {
	const mapEntrancePos = map.getEntrance()

    Object.keys(clients).forEach((p) => {
		if (!players[p]) {
            players[p] = {} as PlayerDto
			players[p].object = player.getId() == p ? player : new Player(PlayerType.OTHER, mapEntrancePos)
			players[p].object.setId(p)
			scene.add(players[p].object.getI())

            const scoreObj = {} as Score
            const scoreP = document.createElement('p')
            scoreObj.domElement = scoreP
            const scoreVal = 0
            scoreP.textContent = scoreVal.toString()
            scoreObj.value = scoreVal
            const scoreLabel = new CSS2DObject(scoreP)
            scoreLabel.position.set(mapEntrancePos.x, mapEntrancePos.y, 1.5)
            scoreObj.instance = scoreLabel
            players[p].score = scoreObj
            scene.add(scoreLabel)
		} else {
			if (clients[p].p && player.getId() != p) {
				new TWEEN.Tween(players[p].object.getI().position)
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

            new TWEEN.Tween(players[p].score.instance.position)
				.to(
					{
						x: clients[p].p.x,
                        y: clients[p].p.y,
						z: 1.5,
					},
					50
				)
				.start()
		}
	})

    console.log(players)
})

socket.on('removeClient', (id: string) => {
	scene.remove(scene.getObjectByName(id) as THREE.Object3D)
})

socket.on('winner', (id: string) => {
    console.log(`the winner is ${id}`)
})

socket.on('scoreboard', (sb: Scoreboard) => {

})

// Resetting the scene
function clearScene() {
    while(scene.children.length > 0){
       scene.remove(scene.children[0])
    }
}

// Displaying the map
function updateMap() {
    const mapCenterPos = map.getCenterPosition()
    walls = [] as Wall[]

    for (let y = 0; y < map.getHeight(); y++) {
        let lengthHolder = 0
        let startingX = -1

        for (let x = 0; x < map.get()[y].length; x++) {
            if (map.get()[y][x] == 1) {
                lengthHolder++
                startingX = startingX == -1 ? x : startingX
                if (x != map.get()[y].length - 1) continue
            }

            if (map.get()[y][x] == 0 && lengthHolder == 0) continue

            const wallGeometry = new THREE.BoxGeometry(lengthHolder, 1, 2)
            wallGeometry.translate(lengthHolder / 2, 1 / 2, 1 / 2)
            const wallMaterial = new THREE.MeshPhongMaterial({ color: 0x00ff00 })
            const wall = new THREE.Mesh(wallGeometry, wallMaterial)

            wall.position.set(startingX, -y, 0)

            wall.castShadow = false
            wall.receiveShadow = true

            scene.add(wall)
            walls.push({
                instance: wall,
                box: new THREE.Box3().setFromObject(wall),
            } as Wall)

            lengthHolder = 0
            startingX = -1
        }
    }

    // Exit setup
    // It's a half-transparent, non-physical wall in different color
    const exitPos = map.getExit()
    const exitGeometry = new THREE.BoxGeometry(1, 1, 2)
    exitGeometry.translate(1 / 2, 1 / 2, 1 / 2)
    const exitMaterial = new THREE.MeshPhongMaterial({
        color: 0xffff00,
        transparent: true,
        opacity: 0.5,
        shininess: 30,
        specular: 0x111111
    })
    const exitInstance = new THREE.Mesh(exitGeometry, exitMaterial)
    exitInstance.position.set(exitPos.x, exitPos.y, 0)
    exitInstance.castShadow = false
    exitInstance.receiveShadow = false
    const exit: Wall = {
        instance: exitInstance,
        box: new THREE.Box3().setFromObject(exitInstance)
    }
    scene.add(exit.instance)

    // Plane setup
    const planeGeometry = new THREE.PlaneGeometry(map.getWidth(), map.getHeight())
    planeGeometry.translate(map.getWidth() / 2, -map.getHeight() / 2 + 1, 0)
    const planeMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff })
    const plane = new THREE.Mesh(planeGeometry, planeMaterial)
    plane.castShadow = false
    plane.receiveShadow = true
    scene.add(plane)

    // Light setup
    const light = new THREE.DirectionalLight(0xffffff, 1.0)
    light.position.set(mapCenterPos.x, mapCenterPos.y, 1000)
    light.target.position.set(mapCenterPos.x, mapCenterPos.y, 0)
    light.castShadow = true
    scene.add(light)
    scene.add(light.target)
    // scene.add( new THREE.CameraHelper( light.shadow.camera ) );

    // Update camera position
    camera.position.set(
	    mapCenterPos.x,
	    mapCenterPos.y,
	    calculateCameraZ(WIDTH, HEIGHT, map.getWidth(), map.getHeight())
    )

    const mapEntrancePos = map.getEntrance()

    Object.keys(players).forEach((p) => {
        const playerInstance = players[p].object.getI()
        scene.add(playerInstance)
        playerInstance.position.set(mapEntrancePos.x, mapEntrancePos.y, playerInstance.position.z)
    })
}


// Camera controls setup
// const controls = new OrbitControls(camera, renderer.domElement);

// The main loop
function animate() {
    requestAnimationFrame(animate)

	// controls.update();

	TWEEN.update()

    if (GAME_LOADED) {
	    if (!player.isColliding()) player.updatePos()

	    player.updateAcc()
    }

	render()
}

function render() {
	renderer.render(scene, camera)
    labelRenderer.render(scene,camera)
}

// Resize window when its size has changed
window.addEventListener('resize', onWindowResize, false)
function onWindowResize() {
	WIDTH = window.innerWidth
	HEIGHT = window.innerHeight
	camera.aspect = WIDTH / HEIGHT
	camera.position.setZ(calculateCameraZ(WIDTH, HEIGHT, map.getWidth(), map.getHeight()))
	camera.updateProjectionMatrix()
	renderer.setSize(WIDTH, HEIGHT)
    labelRenderer.setSize(WIDTH, HEIGHT)
	render()
}

animate()

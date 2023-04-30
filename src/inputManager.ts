import * as THREE from 'three'

import { player, camera, WIDTH, HEIGHT, GAME_LOADED } from './main'

document.addEventListener('keydown', onKeyDown)
document.addEventListener('keyup', onKeyUp)
document.addEventListener('mousedown', onMouseDown)
document.addEventListener('mouseup', onMouseUp)
document.addEventListener('mousemove', onMouseMove)

export const KeyStates = {
	up: false,
	down: false,
	left: false,
	right: false,
	mouse: false,
	mouseDir: new THREE.Vector2(),
}

function onKeyDown(e: KeyboardEvent): void {
	e.preventDefault()
	if (!e.key.includes('Arrow')) return
	KeyStates[e.key.replace('Arrow', '').toLowerCase()] = true
}

function onKeyUp(e: KeyboardEvent): void {
	e.preventDefault()
	if (!e.key.includes('Arrow')) return
	KeyStates[e.key.replace('Arrow', '').toLowerCase()] = false
}

function onMouseDown(e: MouseEvent): void {
	e.preventDefault()
	if (e.button != 0) return
	KeyStates.mouse = true
}

function onMouseUp(e: MouseEvent): void {
	e.preventDefault()
	if (e.button != 0) return

	KeyStates.up = false
	KeyStates.down = false
	KeyStates.left = false
	KeyStates.right = false
	KeyStates.mouse = false
}

function onMouseMove(e: MouseEvent): void {
	e.preventDefault()

	if (!GAME_LOADED) return

	const mouseX = (e.clientX / WIDTH) * 2 - 1
	const mouseY = -(e.clientY / HEIGHT) * 2 + 1

	const playerPosition = new THREE.Vector3()
	playerPosition.copy(player.getI().position)
	playerPosition.project(camera)

	const areaError = 0.025

	if (
		playerPosition.x <= mouseX + areaError &&
		playerPosition.x >= mouseX - areaError &&
		playerPosition.y <= mouseY + areaError &&
		playerPosition.y >= mouseY - areaError
	)
		KeyStates.mouseDir.set(0, 0)
	else KeyStates.mouseDir.set(mouseX - playerPosition.x, mouseY - playerPosition.y)
}

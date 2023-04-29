import * as THREE from 'three'

import type { MazeResponse } from './types'

export default class GameMap {
	private map: number[][] = []
	private width: number
	private height: number
	private centerPosition: THREE.Vector2
	private walkablePositions: THREE.Vector2[]
    private entrance: THREE.Vector2
    private exit: THREE.Vector2

	public constructor(mazeResp: MazeResponse) {
        this.map = mazeResp.map
        this.width = mazeResp.width
        this.height = mazeResp.height
        this.walkablePositions = mazeResp.walkablePositions.map(pos => new THREE.Vector2(pos.x, pos.y))
        this.entrance = new THREE.Vector2(mazeResp.entrance.x, mazeResp.entrance.y)
        this.exit = new THREE.Vector2(mazeResp.exit.x, mazeResp.exit.y)

        this.centerPosition = new THREE.Vector2((this.width - 1) / 2, -((this.height - 1) / 2))
	}

	public get(): number[][] {
		return this.map
	}

	public getWidth(): number {
		return this.width
	}

	public getHeight(): number {
		return this.height
	}

	public getCenterPosition(): THREE.Vector2 {
		return this.centerPosition
	}

	public getRandomWalkablePosition(): THREE.Vector2 {
		return this.walkablePositions[Math.floor(Math.random() * this.walkablePositions.length)]
	}

    public getEntrance(): THREE.Vector2 {
        return this.entrance
    }

    public getExit(): THREE.Vector2 {
        return this.exit
    }
}

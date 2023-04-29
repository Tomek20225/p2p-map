import * as THREE from 'three'

interface MazeResponse {
    map: number[][],
    width: number,
    height: number,
    walkablePositions: {x: number, y: number}[],
    exit: {x: number, y: number}
}

export default class GameMap {
	private map: number[][] = []
	private width: number
	private height: number
	private centerPosition: THREE.Vector2
	private walkablePositions: THREE.Vector2[]
    private exit: THREE.Vector2

	public constructor() {}

	public async init() {
		const mazeResp = await fetch(import.meta.env.VITE_SOCKET_URL + '/map')
		const mazeJson = await mazeResp.json() as MazeResponse

        this.map = mazeJson.map
        this.width = mazeJson.width
        this.height = mazeJson.height
        this.walkablePositions = mazeJson.walkablePositions.map(pos => new THREE.Vector2(pos.x, pos.y))

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
}

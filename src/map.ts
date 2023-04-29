import * as THREE from 'three'

interface Vector2 {
    x: number,
    y: number
}

interface MazeResponse {
    map: number[][],
    width: number,
    height: number,
    walkablePositions: Vector2[]
    entrance: Vector2,
    exit: Vector2
}

export default class GameMap {
	private map: number[][] = []
	private width: number
	private height: number
	private centerPosition: THREE.Vector2
	private walkablePositions: THREE.Vector2[]
    private entrance: THREE.Vector2
    private exit: THREE.Vector2

	public constructor() {}

	public async init() {
		const mazeResp = await fetch(import.meta.env.VITE_SOCKET_URL + '/map')
		const mazeJson = await mazeResp.json() as MazeResponse

        this.map = mazeJson.map
        this.width = mazeJson.width
        this.height = mazeJson.height
        this.walkablePositions = mazeJson.walkablePositions.map(pos => new THREE.Vector2(pos.x, pos.y))
        this.entrance = new THREE.Vector2(mazeJson.entrance.x, mazeJson.entrance.y)
        this.exit = new THREE.Vector2(mazeJson.exit.x, mazeJson.exit.y)

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

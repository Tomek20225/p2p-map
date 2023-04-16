import * as THREE from 'three'

export default class GameMap {
	private map: number[][] = []
	private width: number
	private height: number
	private centerPosition: THREE.Vector2
	private walkablePositions: THREE.Vector2[]

	public constructor() {}

	public async init() {
		const mapResp = await fetch(import.meta.env.VITE_SOCKET_URL + '/map')
		const mapJson = await mapResp.json()
		const map = mapJson.map as number[][]
		this.map = map

		this.width = this.map.reduce(
			(acc, currentValue) => (currentValue.length > acc ? currentValue.length : acc),
			0
		)
		this.height = this.map.length
		this.centerPosition = new THREE.Vector2((this.width - 1) / 2, -((this.height - 1) / 2))

		this.walkablePositions = this.map.reduce((acc, currentValue, index) => {
			let walkablePositionsInRow: THREE.Vector2[] = []
			for (let i = 0; i < currentValue.length; i++) {
				if (currentValue[i] == 0) walkablePositionsInRow.push(new THREE.Vector2(i, -index))
			}
			return Array.prototype.concat(acc, walkablePositionsInRow)
		}, [] as THREE.Vector2[])
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

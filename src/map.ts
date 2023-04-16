import * as THREE from 'three';

export default class GameMap {
    private map: number[][] = [
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 0, 0, 1, 0, 0, 0, 0, 1],
        [1, 1, 1, 1, 1, 1, 1, 0, 1, 1],
        [1, 0, 0, 0, 0, 0, 1, 0, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ];
    private width: number;
    private height: number;
    private centerPosition: THREE.Vector2;
    private walkablePositions: THREE.Vector2[];

    public constructor() {
        this.width = this.map.reduce((acc, currentValue) => currentValue.length > acc ? currentValue.length : acc, 0);
        this.height = this.map.length;
        this.centerPosition = new THREE.Vector2((this.width - 1) / 2, -((this.height - 1) / 2));

        this.walkablePositions = this.map.reduce((acc, currentValue, index) => {
            let walkablePositionsInRow: THREE.Vector2[] = [];
            for (let i = 0; i < currentValue.length; i++) {
                if (currentValue[i] == 0) walkablePositionsInRow.push(new THREE.Vector2(i, -index));
            }
            return Array.prototype.concat(acc, walkablePositionsInRow);
        }, [] as THREE.Vector2[]);
    }

    public get(): number[][] {
        return this.map;
    }

    public getWidth(): number {
        return this.width;
    }

    public getHeight(): number {
        return this.height;
    }

    public getCenterPosition(): THREE.Vector2 {
        return this.centerPosition;
    }

    public getRandomWalkablePosition(): THREE.Vector2 {
        return this.walkablePositions[(Math.floor(Math.random() * this.walkablePositions.length))];
    }
}

import * as THREE from 'three';

import { KeyStates } from "./inputManager";

import { walls } from "./main";

const playerSize = 0.35;
export const PlayerConfig = {
    defaultGeometry: new THREE.SphereGeometry(playerSize).translate(playerSize, playerSize, 0),
    defaultMaterial: new THREE.MeshPhongMaterial({color: 0x0000ff}),
    size: playerSize,
    speed: 0.05,
    accRate: 0.001
}

export enum PlayerType {
    MAIN,
    OTHER
}

export default class Player {
    private id: number; // TODO: Change to UUID
    private instance: THREE.Mesh;
    private acceleration: number;

    public constructor(playerType: PlayerType, position: THREE.Vector2) {
        this.id = Math.round(Math.random() * 99999);
        this.acceleration = 0;

        const color = (playerType == PlayerType.MAIN) ? 0x0000ff : 0xff0000;

        const geometry = new THREE.SphereGeometry(PlayerConfig.size).translate(PlayerConfig.size, PlayerConfig.size, 0);
        const material = new THREE.MeshPhongMaterial({color});
        this.instance = new THREE.Mesh(geometry, material);

        this.instance.position.set(position.x, position.y, PlayerConfig.size);
    }

    public getId(): number {
        return this.id;
    }

    public getI(): THREE.Mesh {
        return this.instance;
    }

    public getAcc(): number {
        return this.acceleration;
    }

    public setAcc(acc: number): void {
        this.acceleration = acc;
    }

    public setPos(futurePos: THREE.Vector3): void {
        this.instance.position.copy(futurePos);
    }

    // Extrapolating player future position
    // based on current input states, acceleration and speed
    public getFuturePos(): THREE.Vector3 {
        const speed = PlayerConfig.speed + this.acceleration;
        const futurePlayerPos = new THREE.Vector3().copy(this.instance.position);

        if (KeyStates.mouse) {
            futurePlayerPos.y += KeyStates.mouseDir.y * speed;
            futurePlayerPos.x += KeyStates.mouseDir.x * speed;
        }
        else {
            if (KeyStates.up) futurePlayerPos.y += speed;
            if (KeyStates.down) futurePlayerPos.y -= speed;
            if (KeyStates.left) futurePlayerPos.x -= speed;
            if (KeyStates.right) futurePlayerPos.x += speed;
        }

        return futurePlayerPos;
    }

    // Collision detection
    public isColliding(): boolean {
        const futurePlayer = new THREE.Mesh(PlayerConfig.defaultGeometry, PlayerConfig.defaultMaterial);
        futurePlayer.position.copy(this.getFuturePos());

        const playerBox = new THREE.Box3().setFromObject(futurePlayer);

        for (const wall of walls) {
            if (wall.box.intersectsBox(playerBox)) {
                return true;
            }
        };

        return false;
    }

    // Detecting whether the player is currently moving
    // If player is colliding with a wall, then he is not moving
    public isMoving(): boolean {
        if (!this.isColliding() && (KeyStates.up || KeyStates.down || KeyStates.left || KeyStates.right || KeyStates.mouse))
            return true;

        return false;
    }

    // Updating player acceleration based on whether he is moving
    public updateAcc(): void {
        if (this.isColliding()) {
            this.acceleration = 0;
            return;
        }

        if (this.isMoving()) this.acceleration += PlayerConfig.accRate;
        else this.acceleration = Math.max(this.acceleration - PlayerConfig.accRate, 0);
    }

    public updatePos(): void {
        this.instance.position.copy(this.getFuturePos());
    }
}

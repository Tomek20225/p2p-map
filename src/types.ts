import * as THREE from 'three'
import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer'
import Player from './player'


export type Wall = {
	instance: THREE.Mesh
	box: THREE.Box3
}

export type Clients = {
    [id: string]: Client
}

export type Scoreboard = {
    [id: string]: number
}

export type Client = {
    t: number,
    p: {
        x: number,
        y: number,
        z: number
    }
}

export type Vector2 = {
    x: number,
    y: number
}

export type MazeResponse = {
    map: number[][],
    width: number,
    height: number,
    walkablePositions: Vector2[]
    entrance: Vector2,
    exit: Vector2
}

export type Players = {
    [id: string]: PlayerDto
}

export type PlayerDto = {
    object: Player,
    score: Score
}

export type Score = {
    domElement: HTMLElement,
    instance: CSS2DObject,
    value: number
}

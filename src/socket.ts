import { io } from 'socket.io-client'
import * as THREE from 'three';
import TWEEN from '@tweenjs/tween.js';

import Player, { PlayerType } from "./player";
import { player, scene } from "./main";


let myId = ''
let timestamp = 0
const clientCubes: { [id: string]: Player } = {}
const socket = io("http://localhost:3000")

socket.on('connect', function () {
    console.log('connect')
})
socket.on('disconnect', function (message: any) {
    console.log('disconnect ' + message)
})
socket.on('id', (id: any) => {
    myId = id
    setInterval(() => {
        socket.emit('update', {
            t: Date.now(),
            p: player.getI().position,
        })
    }, 50)
})
socket.on('clients', (clients: any) => {
    Object.keys(clients).forEach((p) => {
        timestamp = Date.now()
        if (!clientCubes[p]) {
            clientCubes[p] = new Player(PlayerType.OTHER, new THREE.Vector2(0, 0))
            clientCubes[p].getI().name = p
            scene.add(clientCubes[p].getI())
        } else {
            if (clients[p].p) {
                new TWEEN.Tween(clientCubes[p].getI().position)
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

export default socket;

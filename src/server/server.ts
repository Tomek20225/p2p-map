import express from 'express'
import path from 'path'
import http from 'http'
import cors from 'cors'
import { Server, Socket } from 'socket.io'

const port: number = 3000

const map: number[][] = [
	[1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
	[1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
	[1, 0, 0, 0, 1, 0, 0, 0, 0, 1],
	[1, 1, 1, 1, 1, 1, 1, 0, 1, 1],
	[1, 0, 0, 0, 0, 0, 1, 0, 0, 1],
	[1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
	[1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
]

class App {
	private server: http.Server
	private port: number

	private io: Server
	private clients: any = {}

	constructor(port: number) {
		this.port = port
		const app = express()
		// app.use(express.static(path.join(__dirname, '../client')))

		// CORS setup
		app.use(
			cors({
				origin: '*',
			})
		)

		// GET route for fetching the map
		app.get('/map', (req, res) => {
			res.send(JSON.stringify({ map }))
		})

		this.server = new http.Server(app)

		this.io = new Server(this.server, {
			cors: {
				origin: '*', // TODO: Change to proper origin
			},
		})

		this.io.on('connection', (socket: Socket) => {
			console.log(socket.constructor.name)
			this.clients[socket.id] = {}
			console.log(this.clients)
			console.log('a user connected : ' + socket.id)
			socket.emit('id', socket.id)

			socket.on('disconnect', () => {
				console.log('socket disconnected : ' + socket.id)
				if (this.clients && this.clients[socket.id]) {
					console.log('deleting ' + socket.id)
					delete this.clients[socket.id]
					this.io.emit('removeClient', socket.id)
				}
			})

			socket.on('update', (message: any) => {
				if (this.clients[socket.id]) {
					this.clients[socket.id].t = message.t //client timestamp
					this.clients[socket.id].p = message.p //position
				}
			})
		})

		setInterval(() => {
			this.io.emit('clients', this.clients)
		}, 50)
	}

	public Start() {
		this.server.listen(this.port, () => {
			console.log(`Server listening on port ${this.port}.`)
		})
	}
}

new App(port).Start()

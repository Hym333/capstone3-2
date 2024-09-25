import { Server as NetServer } from 'http'
import { NextApiResponse } from 'next'
import { Server as SocketIOServer } from 'socket.io'
import { z } from 'zod'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

let io: SocketIOServer

const roomSchema = z.object({
  roomId: z.string(),
  userId: z.string(),
})

function initSocket(httpServer: NetServer) {
  if (!io) {
    io = new SocketIOServer(httpServer, {
      path: '/api/socket',
      addTrailingSlash: false,
    })

    io.on('connection', (socket) => {
      console.log('New client connected')
      
      socket.on('join-room', (data) => {
        try {
          const { roomId, userId } = roomSchema.parse(data)
          console.log(`User ${userId} joined room ${roomId}`)
          socket.join(roomId)
          socket.to(roomId).emit('user-connected', userId)
          
          socket.on('disconnect', () => {
            console.log(`User ${userId} left room ${roomId}`)
            socket.to(roomId).emit('user-disconnected', userId)
          })
        } catch (error) {
          console.error('Invalid room data:', error)
        }
      })
    })
  }
  return io
}

function ensureSocketInitialized(res: NextApiResponse) {
  if ((res.socket as any).server.io) {
    console.log('Socket is already running')
  } else {
    console.log('Socket is initializing')
    const httpServer: NetServer = (res.socket as any).server as any
    initSocket(httpServer)
    ;(res.socket as any).server.io = io
  }
}

export async function GET(req: Request, res: NextApiResponse) {
  ensureSocketInitialized(res)
  return new Response('Socket.IO is running', { status: 200 })
}

export async function POST(req: Request, res: NextApiResponse) {
  ensureSocketInitialized(res)
  return new Response('Socket.IO is running', { status: 200 })
}
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { Server as HttpServer } from 'http';

let io: Server;

export const initSocket = (server: HttpServer) => {
  io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.headers['authorization'];
    if (!token) return next(new Error('Authentication error'));

    try {
      const decoded = jwt.verify(token.replace('Bearer ', ''), env.JWT_SECRET) as any;
      socket.data.user = decoded;
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const userId = socket.data.user.userId;
    const role = socket.data.user.role;
    
    socket.join(`room:${userId}`);
    if (role === 'ADMIN') socket.join('room:admin');

    socket.on('join:room', (room) => {
      socket.join(room);
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const emitNotification = (userId: string, data: any) => {
  if (io) io.to(`room:${userId}`).emit('notification:new', data);
};

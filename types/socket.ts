/**
 * Type declaration file for Socket.IO integration with Next.js API routes
 * @module SocketTypes
 * @group Types
 */

import { NextApiResponse } from 'next';
import { Server as NetServer } from 'http';
import { Socket as NetSocket } from 'net';
import { Server as SocketIOServer } from 'socket.io';

/**
 * Extended NextApiResponse type that includes Socket.IO server
 * 
 * This type allows access to the Socket.IO server instance through
 * the Next.js API response object, enabling real-time communication
 * within API route handlers.
 * 
 * @example
 * // In a Next.js API route handler
 * export default function handler(
 *   req: NextApiRequest,
 *   res: NextApiResponseServerIO
 * ) {
 *   // Access Socket.IO server
 *   const io = res.socket.server.io;
 *   
 *   // Emit event to all connected clients
 *   io.emit('messageUpdate', { message: 'New message received' });
 *   
 *   res.status(200).json({ success: true });
 * }
 */
export type NextApiResponseServerIO = NextApiResponse & {
  socket: NetSocket & {
    server: NetServer & {
      io: SocketIOServer;
    };
  };
}; 

require('dotenv').config();

const { createServer } = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

// Track active connections and rooms
const activeConnections = new Map();
const activeRooms = new Map();
let isServerReady = false;

// Create HTTP server
const httpServer = createServer((req, res) => {
  // Enhanced health check endpoint
  if (req.url === '/socket-health') {
    console.log('Socket health check requested, server ready:', isServerReady);
    
    const healthData = {
      status: isServerReady ? 'ok' : 'starting',
      connections: activeConnections.size,
      rooms: activeRooms.size,
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    };

    // Always return 200, but with different status in the body
    res.writeHead(200, { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    res.end(JSON.stringify(healthData));
    return;
  }

  // Handle OPTIONS request for CORS
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    res.end();
    return;
  }

  // Handle 404 for other routes
  res.writeHead(404);
  res.end();
});

// Initialize Socket.IO
const io = new Server(httpServer, {
  cors: {
    origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ["polling", "websocket"],
  path: '/socket.io',
  addTrailingSlash: false,
  pingTimeout: 60000,
  pingInterval: 25000,
  maxHttpBufferSize: 1e8 // 100MB max message size
});

// Authentication middleware
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;

    if (!token) {
      console.error('Authentication failed: Token missing');
      return next(new Error('Authentication token missing'));
    }

    // Verify the JWT token
    const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET);
    if (!decoded) {
      console.error('Authentication failed: Invalid token');
      return next(new Error('Invalid authentication token'));
    }

    // Verify user ID matches
    if (decoded.sub !== socket.handshake.auth.userId) {
      console.error('Authentication failed: User ID mismatch', {
        tokenUserId: decoded.sub,
        providedUserId: socket.handshake.auth.userId
      });
      return next(new Error('User ID mismatch'));
    }

    // Add user info to socket
    socket.user = {
      id: decoded.sub,
      email: decoded.email,
      name: decoded.name
    };

    next();
  } catch (error) {
    console.error('Socket authentication error:', {
      error: error.message,
      stack: error.stack,
      userId: socket.handshake.auth.userId,
      conversationId: socket.handshake.auth.conversationId
    });
    next(new Error('Authentication failed'));
  }
});

// Socket.IO event handlers
io.on("connection", (socket) => {   
  activeConnections.set(socket.id, {
    connectedAt: new Date(),
    rooms: new Set(),
    user: socket.user
  });
  
  socket.on("join-conversation", (conversationId) => {
    socket.join(conversationId);
    
    // Track room membership
    const userConnections = activeConnections.get(socket.id);
    if (userConnections) {
      userConnections.rooms.add(conversationId);
    }
    
    // Track room participants
    if (!activeRooms.has(conversationId)) {
      activeRooms.set(conversationId, new Set());
    }
    activeRooms.get(conversationId).add(socket.id);
  });
  
  socket.on("send-message", (data) => {
    // Add message delivery tracking
    const messageId = Date.now().toString();
    socket.to(data.conversationId).emit("new-message", {
      ...data.message,
      messageId,
      delivered: false,
      sender: socket.user
    });
    
    // Confirm delivery to sender
    socket.emit("message-delivered", { messageId });
  });

  socket.on("message-delivered", ({ messageId, conversationId }) => {
    socket.to(conversationId).emit("message-delivered", { messageId });
  });

  socket.on("messages-read", ({ conversationId }) => {
    // Emit to all participants in the conversation
    socket.to(conversationId).emit("messages-read");
  });

  socket.on("disconnect", () => {
    // Clean up connection tracking
    const userConnections = activeConnections.get(socket.id);
    if (userConnections) {
      // Remove from all rooms
      userConnections.rooms.forEach(roomId => {
        const room = activeRooms.get(roomId);
        if (room) {
          room.delete(socket.id);
          if (room.size === 0) {
            activeRooms.delete(roomId);
          }
        }
      });
      activeConnections.delete(socket.id);
    }
  });

  socket.on("error", (error) => {
    console.error('Socket error:', error);
  });
});

// Start the server
const PORT = 3001;
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`Socket.IO server running on port ${PORT}`);
  isServerReady = true;
}).on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Please ensure no other socket server is running.`);
  } else {
    console.error('Failed to start Socket.IO server:', error);
  }
  process.exit(1);
}); 

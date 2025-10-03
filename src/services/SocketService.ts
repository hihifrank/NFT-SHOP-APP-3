import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import config from '../config';
import { User, Lottery, Merchant } from '../types';

export interface SocketUser {
  id: string;
  walletAddress: string;
  socket: Socket;
  rooms: Set<string>;
}

export interface LotteryBroadcast {
  lotteryId: string;
  type: 'draw_started' | 'draw_completed' | 'winner_announced';
  data: any;
  timestamp: Date;
}

export interface PromotionBroadcast {
  merchantId: string;
  type: 'new_promotion' | 'limited_offer' | 'flash_sale';
  title: string;
  description: string;
  location?: {
    latitude: number;
    longitude: number;
    radius: number; // in meters
  };
  data: any;
  timestamp: Date;
}

export interface NotificationBroadcast {
  type: 'system' | 'merchant' | 'lottery' | 'nft';
  title: string;
  message: string;
  data?: any;
  targetUsers?: string[];
  targetLocation?: {
    latitude: number;
    longitude: number;
    radius: number;
  };
  timestamp: Date;
}

class SocketService {
  private io: SocketIOServer;
  private connectedUsers: Map<string, SocketUser> = new Map();
  private userSockets: Map<string, Set<string>> = new Map(); // userId -> socketIds

  constructor(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
        credentials: true,
      },
      transports: ['websocket', 'polling'],
    });

    this.setupMiddleware();
    this.setupEventHandlers();
  }

  private setupMiddleware(): void {
    // Authentication middleware
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
          return next(new Error('Authentication token required'));
        }

        const decoded = jwt.verify(token, config.jwtSecret) as any;
        socket.data.user = {
          id: decoded.userId,
          walletAddress: decoded.walletAddress,
        };

        next();
      } catch (error) {
        next(new Error('Invalid authentication token'));
      }
    });
  }

  private setupEventHandlers(): void {
    this.io.on('connection', (socket: Socket) => {
      this.handleConnection(socket);
    });
  }

  private handleConnection(socket: Socket): void {
    const user = socket.data.user;
    console.log(`🔌 User ${user.id} connected via Socket.io`);

    // Store user connection
    const socketUser: SocketUser = {
      id: user.id,
      walletAddress: user.walletAddress,
      socket,
      rooms: new Set(),
    };

    this.connectedUsers.set(socket.id, socketUser);

    // Track user sockets
    if (!this.userSockets.has(user.id)) {
      this.userSockets.set(user.id, new Set());
    }
    this.userSockets.get(user.id)!.add(socket.id);

    // Join user to their personal room
    socket.join(`user:${user.id}`);
    socketUser.rooms.add(`user:${user.id}`);

    // Setup event listeners
    this.setupSocketEventListeners(socket, socketUser);

    // Handle disconnection
    socket.on('disconnect', () => {
      this.handleDisconnection(socket, socketUser);
    });

    // Send welcome message
    socket.emit('connected', {
      message: 'Successfully connected to HK Retail NFT Platform',
      userId: user.id,
      timestamp: new Date(),
    });
  }

  private setupSocketEventListeners(socket: Socket, socketUser: SocketUser): void {
    // Join lottery room
    socket.on('join_lottery', (data: { lotteryId: string }) => {
      const roomName = `lottery:${data.lotteryId}`;
      socket.join(roomName);
      socketUser.rooms.add(roomName);
      
      socket.emit('joined_room', {
        room: roomName,
        message: 'Joined lottery room for real-time updates',
      });
    });

    // Leave lottery room
    socket.on('leave_lottery', (data: { lotteryId: string }) => {
      const roomName = `lottery:${data.lotteryId}`;
      socket.leave(roomName);
      socketUser.rooms.delete(roomName);
      
      socket.emit('left_room', {
        room: roomName,
        message: 'Left lottery room',
      });
    });

    // Join location-based room for nearby promotions
    socket.on('join_location', (data: { latitude: number; longitude: number; radius?: number }) => {
      const radius = data.radius || 1000; // Default 1km radius
      const roomName = `location:${data.latitude.toFixed(3)}_${data.longitude.toFixed(3)}_${radius}`;
      
      socket.join(roomName);
      socketUser.rooms.add(roomName);
      
      socket.emit('joined_room', {
        room: roomName,
        message: 'Joined location-based room for nearby promotions',
      });
    });

    // Leave location-based room
    socket.on('leave_location', (data: { latitude: number; longitude: number; radius?: number }) => {
      const radius = data.radius || 1000;
      const roomName = `location:${data.latitude.toFixed(3)}_${data.longitude.toFixed(3)}_${radius}`;
      
      socket.leave(roomName);
      socketUser.rooms.delete(roomName);
      
      socket.emit('left_room', {
        room: roomName,
        message: 'Left location-based room',
      });
    });

    // Join merchant room for specific merchant updates
    socket.on('join_merchant', (data: { merchantId: string }) => {
      const roomName = `merchant:${data.merchantId}`;
      socket.join(roomName);
      socketUser.rooms.add(roomName);
      
      socket.emit('joined_room', {
        room: roomName,
        message: 'Joined merchant room for updates',
      });
    });

    // Leave merchant room
    socket.on('leave_merchant', (data: { merchantId: string }) => {
      const roomName = `merchant:${data.merchantId}`;
      socket.leave(roomName);
      socketUser.rooms.delete(roomName);
      
      socket.emit('left_room', {
        room: roomName,
        message: 'Left merchant room',
      });
    });

    // Handle ping for connection health check
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: new Date() });
    });
  }

  private handleDisconnection(socket: Socket, socketUser: SocketUser): void {
    console.log(`🔌 User ${socketUser.id} disconnected from Socket.io`);

    // Remove from connected users
    this.connectedUsers.delete(socket.id);

    // Remove socket from user's socket set
    const userSocketSet = this.userSockets.get(socketUser.id);
    if (userSocketSet) {
      userSocketSet.delete(socket.id);
      if (userSocketSet.size === 0) {
        this.userSockets.delete(socketUser.id);
      }
    }
  }

  // Public methods for broadcasting events

  /**
   * Broadcast lottery-related events to all users in lottery room
   */
  public broadcastLotteryEvent(broadcast: LotteryBroadcast): void {
    const roomName = `lottery:${broadcast.lotteryId}`;
    
    this.io.to(roomName).emit('lottery_update', {
      lotteryId: broadcast.lotteryId,
      type: broadcast.type,
      data: broadcast.data,
      timestamp: broadcast.timestamp,
    });

    console.log(`📢 Broadcasted lottery event ${broadcast.type} to room ${roomName}`);
  }

  /**
   * Broadcast promotion to users in specific location or all users
   */
  public broadcastPromotion(broadcast: PromotionBroadcast): void {
    let targetRoom = 'all_users';

    // If location is specified, target location-based rooms
    if (broadcast.location) {
      const { latitude, longitude, radius } = broadcast.location;
      targetRoom = `location:${latitude.toFixed(3)}_${longitude.toFixed(3)}_${radius}`;
    }

    // Also broadcast to merchant-specific room
    const merchantRoom = `merchant:${broadcast.merchantId}`;

    const promotionData = {
      merchantId: broadcast.merchantId,
      type: broadcast.type,
      title: broadcast.title,
      description: broadcast.description,
      location: broadcast.location,
      data: broadcast.data,
      timestamp: broadcast.timestamp,
    };

    if (targetRoom === 'all_users') {
      this.io.emit('promotion_update', promotionData);
    } else {
      this.io.to(targetRoom).emit('promotion_update', promotionData);
    }

    this.io.to(merchantRoom).emit('promotion_update', promotionData);

    console.log(`📢 Broadcasted promotion to ${targetRoom} and ${merchantRoom}`);
  }

  /**
   * Send notification to specific users or broadcast to all
   */
  public sendNotification(notification: NotificationBroadcast): void {
    const notificationData = {
      type: notification.type,
      title: notification.title,
      message: notification.message,
      data: notification.data,
      timestamp: notification.timestamp,
    };

    if (notification.targetUsers && notification.targetUsers.length > 0) {
      // Send to specific users
      notification.targetUsers.forEach(userId => {
        this.io.to(`user:${userId}`).emit('notification', notificationData);
      });
      console.log(`📢 Sent notification to ${notification.targetUsers.length} specific users`);
    } else if (notification.targetLocation) {
      // Send to users in specific location
      const { latitude, longitude, radius } = notification.targetLocation;
      const locationRoom = `location:${latitude.toFixed(3)}_${longitude.toFixed(3)}_${radius}`;
      this.io.to(locationRoom).emit('notification', notificationData);
      console.log(`📢 Sent notification to location room ${locationRoom}`);
    } else {
      // Broadcast to all connected users
      this.io.emit('notification', notificationData);
      console.log('📢 Broadcasted notification to all users');
    }
  }

  /**
   * Send direct message to a specific user
   */
  public sendToUser(userId: string, event: string, data: any): void {
    this.io.to(`user:${userId}`).emit(event, data);
  }

  /**
   * Get connected users count
   */
  public getConnectedUsersCount(): number {
    return this.connectedUsers.size;
  }

  /**
   * Get users in a specific room
   */
  public async getUsersInRoom(roomName: string): Promise<string[]> {
    const sockets = await this.io.in(roomName).fetchSockets();
    return sockets.map(socket => socket.data.user.id);
  }

  /**
   * Check if user is connected
   */
  public isUserConnected(userId: string): boolean {
    return this.userSockets.has(userId);
  }

  /**
   * Get Socket.io server instance
   */
  public getIO(): SocketIOServer {
    return this.io;
  }

  /**
   * Broadcast system maintenance message
   */
  public broadcastSystemMessage(message: string, type: 'info' | 'warning' | 'error' = 'info'): void {
    this.io.emit('system_message', {
      type,
      message,
      timestamp: new Date(),
    });
    console.log(`📢 Broadcasted system message: ${message}`);
  }
}

export default SocketService;
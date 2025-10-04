import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { UserStatus } from '@prisma/client';

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  },
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private userSockets = new Map<string, Set<string>>(); // userId -> Set of socketIds

  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token = client.handshake.auth.token || client.handshake.headers.authorization?.split(' ')[1];
      
      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      client.userId = payload.sub;

      if (!client.userId) {
        client.disconnect();
        return;
      }

      // Track user socket
      if (!this.userSockets.has(client.userId)) {
        this.userSockets.set(client.userId, new Set());
      }
      this.userSockets.get(client.userId)?.add(client.id);

      // Update user status to online
      await this.prisma.user.update({
        where: { id: client.userId },
        data: { status: UserStatus.ONLINE },
      });

      // Get user's workspaces to join rooms
      const workspaces = await this.prisma.workspaceMember.findMany({
        where: { userId: client.userId },
        select: { workspaceId: true },
      });

      // Join workspace rooms
      workspaces.forEach((ws) => {
        client.join(`workspace:${ws.workspaceId}`);
      });

      // Get user's channels to join rooms
      const channels = await this.prisma.channelMember.findMany({
        where: { userId: client.userId },
        select: { channelId: true },
      });

      // Join channel rooms
      channels.forEach((ch) => {
        client.join(`channel:${ch.channelId}`);
      });

      // Broadcast user online status
      workspaces.forEach((ws) => {
        this.server.to(`workspace:${ws.workspaceId}`).emit('user:presence', {
          userId: client.userId,
          status: UserStatus.ONLINE,
        });
      });

      console.log(`Client connected: ${client.id} (User: ${client.userId})`);
    } catch (error) {
      console.error('Connection error:', error);
      client.disconnect();
    }
  }

  async handleDisconnect(client: AuthenticatedSocket) {
    if (!client.userId) return;

    // Remove socket from tracking
    const userSockets = this.userSockets.get(client.userId);
    if (userSockets) {
      userSockets.delete(client.id);
      
      // If user has no more active sockets, mark as offline
      if (userSockets.size === 0) {
        this.userSockets.delete(client.userId);
        
        await this.prisma.user.update({
          where: { id: client.userId },
          data: { status: UserStatus.OFFLINE },
        });

        // Get user's workspaces to broadcast offline status
        const workspaces = await this.prisma.workspaceMember.findMany({
          where: { userId: client.userId },
          select: { workspaceId: true },
        });

        workspaces.forEach((ws) => {
          this.server.to(`workspace:${ws.workspaceId}`).emit('user:presence', {
            userId: client.userId,
            status: UserStatus.OFFLINE,
          });
        });
      }
    }

    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('channel:join')
  handleJoinChannel(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { channelId: string },
  ) {
    client.join(`channel:${data.channelId}`);
    return { success: true };
  }

  @SubscribeMessage('channel:leave')
  handleLeaveChannel(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { channelId: string },
  ) {
    client.leave(`channel:${data.channelId}`);
    return { success: true };
  }

  @SubscribeMessage('typing:start')
  handleTypingStart(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { channelId: string; userName: string },
  ) {
    client.to(`channel:${data.channelId}`).emit('typing:start', {
      userId: client.userId,
      userName: data.userName,
      channelId: data.channelId,
    });
  }

  @SubscribeMessage('typing:stop')
  handleTypingStop(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { channelId: string },
  ) {
    client.to(`channel:${data.channelId}`).emit('typing:stop', {
      userId: client.userId,
      channelId: data.channelId,
    });
  }

  // Method to emit message to channel
  emitMessageToChannel(channelId: string, event: string, data: any) {
    console.log(`[Gateway] Emitting ${event} to channel:${channelId}`);
    const room = this.server.sockets.adapter.rooms.get(`channel:${channelId}`);
    console.log(`[Gateway] Room channel:${channelId} has ${room?.size || 0} members`);
    this.server.to(`channel:${channelId}`).emit(event, data);
  }

  // Method to emit to workspace
  emitToWorkspace(workspaceId: string, event: string, data: any) {
    this.server.to(`workspace:${workspaceId}`).emit(event, data);
  }

  // Method to emit to specific user
  emitToUser(userId: string, event: string, data: any) {
    const sockets = this.userSockets.get(userId);
    if (sockets) {
      sockets.forEach((socketId) => {
        this.server.to(socketId).emit(event, data);
      });
    }
  }
}

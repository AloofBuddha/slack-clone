import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventsGateway } from '../gateway/events.gateway';

@Injectable()
export class ChannelsService {
  constructor(
    private prisma: PrismaService,
    private eventsGateway: EventsGateway,
  ) {}

  async create(userId: string, data: { workspaceId: string; name: string; description?: string; isPrivate?: boolean }) {
    // Check if user is workspace member
    const member = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: data.workspaceId,
          userId,
        },
      },
    });

    if (!member) {
      throw new ForbiddenException('You are not a member of this workspace');
    }

    // Check if channel name exists in workspace
    const existing = await this.prisma.channel.findUnique({
      where: {
        workspaceId_name: {
          workspaceId: data.workspaceId,
          name: data.name,
        },
      },
    });

    if (existing) {
      throw new ConflictException('Channel name already exists');
    }

    const channel = await this.prisma.channel.create({
      data: {
        workspaceId: data.workspaceId,
        name: data.name,
        description: data.description,
        isPrivate: data.isPrivate || false,
        createdById: userId,
        members: {
          create: {
            userId,
          },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                displayName: true,
                avatarUrl: true,
                status: true,
              },
            },
          },
        },
        _count: {
          select: {
            members: true,
            messages: true,
          },
        },
      },
    });

    // Emit to workspace via WebSocket
    this.eventsGateway.emitToWorkspace(data.workspaceId, 'channel:created', channel);

    return channel;
  }

  async findWorkspaceChannels(workspaceId: string, userId: string) {
    // Get user's membership
    const member = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId,
        },
      },
    });

    if (!member) {
      throw new ForbiddenException('You are not a member of this workspace');
    }

    return this.prisma.channel.findMany({
      where: {
        workspaceId,
        OR: [
          { isPrivate: false },
          {
            isPrivate: true,
            members: {
              some: {
                userId,
              },
            },
          },
        ],
      },
      include: {
        members: {
          where: {
            userId,
          },
        },
        _count: {
          select: {
            members: true,
            messages: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  async findById(channelId: string, userId: string) {
    const channel = await this.prisma.channel.findUnique({
      where: { id: channelId },
      include: {
        workspace: true,
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                displayName: true,
                avatarUrl: true,
                status: true,
              },
            },
          },
        },
        _count: {
          select: {
            members: true,
            messages: true,
          },
        },
      },
    });

    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    // Check if user has access
    const isMember = channel.members.some((m) => m.userId === userId);
    if (channel.isPrivate && !isMember) {
      throw new ForbiddenException('You do not have access to this channel');
    }

    return channel;
  }

  async joinChannel(channelId: string, userId: string) {
    const channel = await this.prisma.channel.findUnique({
      where: { id: channelId },
      include: {
        members: {
          where: {
            userId,
          },
        },
      },
    });

    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    if (channel.isPrivate) {
      throw new ForbiddenException('Cannot join private channels');
    }

    // Check if already a member
    if (channel.members.length > 0) {
      throw new ConflictException('You are already a member');
    }

    // Check workspace membership
    const workspaceMember = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: channel.workspaceId,
          userId,
        },
      },
    });

    if (!workspaceMember) {
      throw new ForbiddenException('You are not a member of this workspace');
    }

    return this.prisma.channelMember.create({
      data: {
        channelId,
        userId,
      },
    });
  }

  async leaveChannel(channelId: string, userId: string) {
    const channel = await this.prisma.channel.findUnique({
      where: { id: channelId },
    });

    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    // Cannot leave general channel
    if (channel.name === 'general') {
      throw new ForbiddenException('Cannot leave general channel');
    }

    const member = await this.prisma.channelMember.findUnique({
      where: {
        channelId_userId: {
          channelId,
          userId,
        },
      },
    });

    if (!member) {
      throw new NotFoundException('You are not a member of this channel');
    }

    await this.prisma.channelMember.delete({
      where: {
        channelId_userId: {
          channelId,
          userId,
        },
      },
    });

    return { success: true };
  }

  async updateLastRead(channelId: string, userId: string) {
    return this.prisma.channelMember.update({
      where: {
        channelId_userId: {
          channelId,
          userId,
        },
      },
      data: {
        lastReadAt: new Date(),
      },
    });
  }
}

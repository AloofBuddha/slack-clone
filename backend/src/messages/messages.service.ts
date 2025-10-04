import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventsGateway } from '../gateway/events.gateway';

@Injectable()
export class MessagesService {
  constructor(
    private prisma: PrismaService,
    private eventsGateway: EventsGateway,
  ) {}

  async create(userId: string, data: { channelId: string; content: string; parentId?: string }) {
    // Check if user is channel member
    const member = await this.prisma.channelMember.findUnique({
      where: {
        channelId_userId: {
          channelId: data.channelId,
          userId,
        },
      },
    });

    if (!member) {
      throw new ForbiddenException('You are not a member of this channel');
    }

    const message = await this.prisma.message.create({
      data: {
        channelId: data.channelId,
        userId,
        content: data.content,
        parentId: data.parentId,
      },
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
        reactions: {
          include: {
            user: {
              select: {
                id: true,
                displayName: true,
                avatarUrl: true,
              },
            },
          },
        },
        files: true,
        _count: {
          select: {
            replies: true,
          },
        },
      },
    });

    // Emit to channel via WebSocket
    console.log(`[WebSocket] Emitting message:new to channel ${data.channelId}`, message.id);
    this.eventsGateway.emitMessageToChannel(data.channelId, 'message:new', message);

    return message;
  }

  async findChannelMessages(channelId: string, userId: string, page: number = 1, limit: number = 50) {
    // Check if user is channel member
    const member = await this.prisma.channelMember.findUnique({
      where: {
        channelId_userId: {
          channelId,
          userId,
        },
      },
    });

    if (!member) {
      throw new ForbiddenException('You are not a member of this channel');
    }

    const skip = (page - 1) * limit;

    const [messages, total] = await Promise.all([
      this.prisma.message.findMany({
        where: {
          channelId,
          parentId: null,
          deletedAt: null,
        },
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
          reactions: {
            include: {
              user: {
                select: {
                  id: true,
                  displayName: true,
                  avatarUrl: true,
                },
              },
            },
          },
          files: true,
          _count: {
            select: {
              replies: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.message.count({
        where: {
          channelId,
          parentId: null,
          deletedAt: null,
        },
      }),
    ]);

    return {
      messages: messages.reverse(),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findThreadMessages(parentId: string, userId: string) {
    const parent = await this.prisma.message.findUnique({
      where: { id: parentId },
      include: {
        channel: true,
      },
    });

    if (!parent) {
      throw new NotFoundException('Message not found');
    }

    // Check if user is channel member
    const member = await this.prisma.channelMember.findUnique({
      where: {
        channelId_userId: {
          channelId: parent.channelId,
          userId,
        },
      },
    });

    if (!member) {
      throw new ForbiddenException('You are not a member of this channel');
    }

    const messages = await this.prisma.message.findMany({
      where: {
        parentId,
        deletedAt: null,
      },
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
        reactions: {
          include: {
            user: {
              select: {
                id: true,
                displayName: true,
                avatarUrl: true,
              },
            },
          },
        },
        files: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return messages;
  }

  async update(messageId: string, userId: string, content: string) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    if (message.userId !== userId) {
      throw new ForbiddenException('You can only edit your own messages');
    }

    const updatedMessage = await this.prisma.message.update({
      where: { id: messageId },
      data: { content },
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
        reactions: {
          include: {
            user: {
              select: {
                id: true,
                displayName: true,
                avatarUrl: true,
              },
            },
          },
        },
        files: true,
        _count: {
          select: {
            replies: true,
          },
        },
      },
    });

    // Emit to channel via WebSocket
    this.eventsGateway.emitMessageToChannel(message.channelId, 'message:updated', updatedMessage);

    return updatedMessage;
  }

  async delete(messageId: string, userId: string) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    if (message.userId !== userId) {
      throw new ForbiddenException('You can only delete your own messages');
    }

    await this.prisma.message.update({
      where: { id: messageId },
      data: { deletedAt: new Date() },
    });

    // Emit to channel via WebSocket
    this.eventsGateway.emitMessageToChannel(message.channelId, 'message:deleted', {
      messageId,
      channelId: message.channelId,
    });

    return { success: true };
  }

  async addReaction(messageId: string, userId: string, emoji: string) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    // Check if user is channel member
    const member = await this.prisma.channelMember.findUnique({
      where: {
        channelId_userId: {
          channelId: message.channelId,
          userId,
        },
      },
    });

    if (!member) {
      throw new ForbiddenException('You are not a member of this channel');
    }

    // Check if reaction already exists
    const existing = await this.prisma.reaction.findUnique({
      where: {
        messageId_userId_emoji: {
          messageId,
          userId,
          emoji,
        },
      },
    });

    if (existing) {
      // Remove reaction (toggle)
      await this.prisma.reaction.delete({
        where: {
          id: existing.id,
        },
      });
      return { action: 'removed' };
    }

    const reaction = await this.prisma.reaction.create({
      data: {
        messageId,
        userId,
        emoji,
      },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });

    return { action: 'added', reaction };
  }

  async searchMessages(workspaceId: string, userId: string, query: string) {
    // Get user's channels in workspace
    const channels = await this.prisma.channel.findMany({
      where: {
        workspaceId,
        members: {
          some: {
            userId,
          },
        },
      },
      select: {
        id: true,
      },
    });

    const channelIds = channels.map((c) => c.id);

    const messages = await this.prisma.message.findMany({
      where: {
        channelId: { in: channelIds },
        content: {
          contains: query,
          mode: 'insensitive',
        },
        deletedAt: null,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        channel: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50,
    });

    return messages;
  }
}

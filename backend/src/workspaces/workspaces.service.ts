import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MemberRole } from '@prisma/client';

@Injectable()
export class WorkspacesService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, data: { name: string; description?: string }) {
    const slug = this.generateSlug(data.name);

    // Check if slug exists
    const existing = await this.prisma.workspace.findUnique({
      where: { slug },
    });

    if (existing) {
      throw new ConflictException('Workspace name already taken');
    }

    const workspace = await this.prisma.workspace.create({
      data: {
        name: data.name,
        slug,
        description: data.description,
        createdById: userId,
        members: {
          create: {
            userId,
            role: MemberRole.ADMIN,
          },
        },
        channels: {
          create: {
            name: 'general',
            description: 'General discussion',
            createdById: userId,
            members: {
              create: {
                userId,
              },
            },
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
        channels: true,
      },
    });

    return workspace;
  }

  async findUserWorkspaces(userId: string) {
    return this.prisma.workspace.findMany({
      where: {
        members: {
          some: {
            userId,
          },
        },
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
            channels: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findById(workspaceId: string, userId: string) {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
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
        channels: {
          include: {
            members: {
              where: {
                userId,
              },
            },
            _count: {
              select: {
                members: true,
              },
            },
          },
        },
      },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    // Check if user is a member
    const isMember = workspace.members.some((m) => m.userId === userId);
    if (!isMember) {
      throw new ForbiddenException('You are not a member of this workspace');
    }

    return workspace;
  }

  async inviteUser(workspaceId: string, inviterId: string, email: string) {
    // Check if inviter has permission
    const inviterMember = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId: inviterId,
        },
      },
    });

    if (!inviterMember || inviterMember.role === MemberRole.GUEST) {
      throw new ForbiddenException('You do not have permission to invite users');
    }

    // Find user by email
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if already a member
    const existingMember = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId: user.id,
        },
      },
    });

    if (existingMember) {
      throw new ConflictException('User is already a member');
    }

    // Add user to workspace
    await this.prisma.workspaceMember.create({
      data: {
        workspaceId,
        userId: user.id,
        role: MemberRole.MEMBER,
      },
    });

    // Add user to general channel
    const generalChannel = await this.prisma.channel.findFirst({
      where: {
        workspaceId,
        name: 'general',
      },
    });

    if (generalChannel) {
      await this.prisma.channelMember.create({
        data: {
          channelId: generalChannel.id,
          userId: user.id,
        },
      });
    }

    return { success: true, message: 'User invited successfully' };
  }

  async updateMemberRole(workspaceId: string, adminId: string, memberId: string, role: MemberRole) {
    // Check if admin has permission
    const admin = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId: adminId,
        },
      },
    });

    if (!admin || admin.role !== MemberRole.ADMIN) {
      throw new ForbiddenException('Only admins can change roles');
    }

    return this.prisma.workspaceMember.update({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId: memberId,
        },
      },
      data: { role },
    });
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      + '-' + Math.random().toString(36).substr(2, 6);
  }
}

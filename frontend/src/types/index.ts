export interface User {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  status: 'ONLINE' | 'AWAY' | 'OFFLINE';
  createdAt: string;
  updatedAt: string;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  description?: string;
  iconUrl?: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  members?: WorkspaceMember[];
  channels?: Channel[];
  _count?: {
    members: number;
    channels: number;
  };
}

export interface WorkspaceMember {
  id: string;
  workspaceId: string;
  userId: string;
  user?: User;
  role: 'ADMIN' | 'MEMBER' | 'GUEST';
  joinedAt: string;
}

export interface Channel {
  id: string;
  workspaceId: string;
  name: string;
  description?: string;
  isPrivate: boolean;
  createdById: string;
  createdBy?: User;
  createdAt: string;
  updatedAt: string;
  members?: ChannelMember[];
  messages?: Message[];
  _count?: {
    members: number;
    messages: number;
  };
}

export interface ChannelMember {
  id: string;
  channelId: string;
  userId: string;
  user?: User;
  lastReadAt?: string;
  joinedAt: string;
}

export interface Message {
  id: string;
  channelId: string;
  userId: string;
  user: User;
  content: string;
  parentId?: string;
  parent?: Message;
  replies?: Message[];
  reactions?: Reaction[];
  files?: File[];
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  _count?: {
    replies: number;
  };
}

export interface Reaction {
  id: string;
  messageId: string;
  userId: string;
  user: User;
  emoji: string;
  createdAt: string;
}

export interface File {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  uploadedById: string;
  uploadedBy?: User;
  messageId?: string;
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface MessageResponse {
  messages: Message[];
  total: number;
  page: number;
  totalPages: number;
}

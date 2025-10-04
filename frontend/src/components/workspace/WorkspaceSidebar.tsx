import { useState } from 'react';
import { Hash, Lock, Plus, ChevronDown, LogOut, UserPlus } from 'lucide-react';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { useChannelStore } from '../../stores/channelStore';
import { useAuthStore } from '../../stores/authStore';
import { ScrollArea } from '../ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { getInitials } from '../../lib/utils';
import CreateChannelDialog from './CreateChannelDialog';
import InviteUserDialog from './InviteUserDialog';
import WorkspaceSelector from './WorkspaceSelector';
import { cn } from '../../lib/utils';

export default function WorkspaceSidebar() {
  const { currentWorkspace } = useWorkspaceStore();
  const { channels, currentChannel, setCurrentChannel, joinChannel } = useChannelStore();
  const { user, logout } = useAuthStore();
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [showInviteUser, setShowInviteUser] = useState(false);
  const [joiningChannelId, setJoiningChannelId] = useState<string | null>(null);

  // Separate channels by membership and privacy
  const myPublicChannels = channels.filter((c) => !c.isPrivate && c.members && c.members.length > 0);
  const availablePublicChannels = channels.filter((c) => !c.isPrivate && (!c.members || c.members.length === 0));
  const privateChannels = channels.filter((c) => c.isPrivate && c.members && c.members.length > 0);

  const handleJoinChannel = async (channelId: string) => {
    setJoiningChannelId(channelId);
    try {
      await joinChannel(channelId);
    } catch (error) {
      console.error('Failed to join channel:', error);
    } finally {
      setJoiningChannelId(null);
    }
  };

  if (!currentWorkspace) return null;

  return (
    <>
      <div className="flex h-full w-64 flex-col bg-[#3f0e40] text-white">
        {/* Workspace Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#522653]">
          <WorkspaceSelector />
        </div>

        <ScrollArea className="flex-1 px-2">
          {/* Channels Section */}
          <div className="py-3">
            <div className="flex items-center justify-between px-2 mb-1">
              <button className="flex items-center text-sm text-white/70 hover:text-white">
                <ChevronDown className="mr-1 h-3 w-3" />
                <span className="font-semibold">Channels</span>
              </button>
              <button
                onClick={() => setShowCreateChannel(true)}
                className="p-1 hover:bg-white/10 rounded"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-0.5">
              {myPublicChannels.map((channel) => (
                <button
                  key={channel.id}
                  onClick={() => setCurrentChannel(channel)}
                  className={cn(
                    'flex w-full items-center px-2 py-1.5 text-sm rounded hover:bg-white/10',
                    currentChannel?.id === channel.id && 'bg-[#1164A3] hover:bg-[#1164A3]'
                  )}
                >
                  <Hash className="mr-2 h-4 w-4" />
                  <span className="truncate">{channel.name}</span>
                </button>
              ))}
              {availablePublicChannels.map((channel) => (
                <button
                  key={channel.id}
                  onClick={() => handleJoinChannel(channel.id)}
                  disabled={joiningChannelId === channel.id}
                  className="flex w-full items-center px-2 py-1.5 text-sm rounded hover:bg-white/10 text-white/60 hover:text-white"
                >
                  <Hash className="mr-2 h-4 w-4" />
                  <span className="truncate">{channel.name}</span>
                  <Plus className="ml-auto h-3 w-3" />
                </button>
              ))}
            </div>
          </div>

          {/* Private Channels */}
          {privateChannels.length > 0 && (
            <div className="py-3">
              <div className="flex items-center justify-between px-2 mb-1">
                <button className="flex items-center text-sm text-white/70 hover:text-white">
                  <ChevronDown className="mr-1 h-3 w-3" />
                  <span className="font-semibold">Private Channels</span>
                </button>
              </div>
              <div className="space-y-0.5">
                {privateChannels.map((channel) => (
                  <button
                    key={channel.id}
                    onClick={() => setCurrentChannel(channel)}
                    className={cn(
                      'flex w-full items-center px-2 py-1.5 text-sm rounded hover:bg-white/10',
                      currentChannel?.id === channel.id && 'bg-[#1164A3] hover:bg-[#1164A3]'
                    )}
                  >
                    <Lock className="mr-2 h-4 w-4" />
                    <span className="truncate">{channel.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Invite User Section */}
          <div className="py-3 border-t border-[#522653]">
            <button
              onClick={() => setShowInviteUser(true)}
              className="flex w-full items-center px-2 py-2 text-sm rounded hover:bg-white/10 text-white/90"
            >
              <UserPlus className="mr-2 h-4 w-4" />
              <span>Invite People</span>
            </button>
          </div>

          {/* Direct Messages */}
          <div className="py-3">
            <div className="flex items-center justify-between px-2 mb-1">
              <button className="flex items-center text-sm text-white/70 hover:text-white">
                <ChevronDown className="mr-1 h-3 w-3" />
                <span className="font-semibold">Direct Messages</span>
              </button>
              <button className="p-1 hover:bg-white/10 rounded">
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>
        </ScrollArea>

        {/* User Profile Footer */}
        <div className="border-t border-[#522653] p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 flex-1 min-w-0">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.avatarUrl} />
                <AvatarFallback className="bg-primary text-white text-xs">
                  {user ? getInitials(user.displayName) : 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{user?.displayName}</p>
                <div className="flex items-center">
                  <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                  <span className="text-xs text-white/70">Active</span>
                </div>
              </div>
            </div>
            <button
              onClick={logout}
              className="p-1.5 hover:bg-white/10 rounded"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <CreateChannelDialog open={showCreateChannel} onOpenChange={setShowCreateChannel} />
      <InviteUserDialog open={showInviteUser} onOpenChange={setShowInviteUser} />
    </>
  );
}

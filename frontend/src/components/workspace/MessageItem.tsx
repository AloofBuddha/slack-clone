import { useState } from 'react';
import { Smile, Reply, Trash2, Edit2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Button } from '../ui/button';
import { useAuthStore } from '../../stores/authStore';
import { useMessageStore } from '../../stores/messageStore';
import { formatTime, getInitials } from '../../lib/utils';
import { useToast } from '../ui/use-toast';
import type { Message } from '../../types';

interface MessageItemProps {
  message: Message;
}

const EMOJI_OPTIONS = ['👍', '❤️', '😂', '🎉', '🤔', '👀'];

export default function MessageItem({ message }: MessageItemProps) {
  const { user } = useAuthStore();
  const { addReaction, deleteMessage, updateMessage } = useMessageStore();
  const { toast } = useToast();
  const [isHovered, setIsHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.content);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const isOwn = user?.id === message.userId;

  const handleReaction = async (emoji: string) => {
    try {
      await addReaction(message.id, emoji);
      setShowEmojiPicker(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add reaction',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this message?')) return;
    
    try {
      await deleteMessage(message.id);
      toast({
        title: 'Success',
        description: 'Message deleted',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete message',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = async () => {
    if (!editText.trim() || editText === message.content) {
      setIsEditing(false);
      return;
    }

    try {
      await updateMessage(message.id, editText.trim());
      setIsEditing(false);
      toast({
        title: 'Success',
        description: 'Message updated',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update message',
        variant: 'destructive',
      });
    }
  };

  // Group reactions by emoji
  const reactionGroups = message.reactions?.reduce((acc, reaction) => {
    if (!acc[reaction.emoji]) {
      acc[reaction.emoji] = [];
    }
    acc[reaction.emoji].push(reaction);
    return acc;
  }, {} as Record<string, typeof message.reactions>);

  return (
    <div
      className="group flex space-x-3 hover:bg-gray-50 px-3 py-2 rounded"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Avatar className="h-9 w-9 mt-0.5">
        <AvatarImage src={message.user.avatarUrl} />
        <AvatarFallback className="bg-primary text-white text-xs">
          {getInitials(message.user.displayName)}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline space-x-2">
          <span className="font-semibold text-sm">{message.user.displayName}</span>
          <span className="text-xs text-gray-500">{formatTime(message.createdAt)}</span>
          {message.updatedAt !== message.createdAt && (
            <span className="text-xs text-gray-400">(edited)</span>
          )}
        </div>

        {isEditing ? (
          <div className="mt-1">
            <input
              type="text"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleEdit();
                if (e.key === 'Escape') setIsEditing(false);
              }}
              className="w-full px-2 py-1 border rounded text-sm"
              autoFocus
            />
            <div className="flex space-x-2 mt-2">
              <Button size="sm" onClick={handleEdit}>
                Save
              </Button>
              <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-900 mt-1 break-words">{message.content}</p>
        )}

        {/* Reactions */}
        {reactionGroups && Object.keys(reactionGroups).length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {Object.entries(reactionGroups).map(([emoji, reactions]) => {
              const hasReacted = reactions.some((r) => r.userId === user?.id);
              return (
                <button
                  key={emoji}
                  onClick={() => handleReaction(emoji)}
                  className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs border transition-colors ${
                    hasReacted
                      ? 'bg-blue-50 border-blue-300 text-blue-700'
                      : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <span>{emoji}</span>
                  <span>{reactions.length}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Thread Info */}
        {message._count && message._count.replies > 0 && (
          <button className="flex items-center space-x-2 mt-2 text-sm text-primary hover:underline">
            <Reply className="h-3 w-3" />
            <span>{message._count.replies} {message._count.replies === 1 ? 'reply' : 'replies'}</span>
          </button>
        )}
      </div>

      {/* Action Buttons */}
      {isHovered && !isEditing && (
        <div className="flex items-start space-x-1">
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            >
              <Smile className="h-4 w-4" />
            </Button>
            {showEmojiPicker && (
              <div className="absolute right-0 top-8 bg-white border rounded-lg shadow-lg p-2 flex space-x-1 z-10">
                {EMOJI_OPTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => handleReaction(emoji)}
                    className="hover:bg-gray-100 p-1 rounded text-lg"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>
          {isOwn && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setIsEditing(true)}
              >
                <Edit2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-red-600 hover:text-red-700"
                onClick={handleDelete}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

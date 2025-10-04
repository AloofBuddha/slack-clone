import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Hash, Lock, Users, Send } from 'lucide-react';
import { useChannelStore } from '../../stores/channelStore';
import { useMessageStore } from '../../stores/messageStore';
import { useAuthStore } from '../../stores/authStore';
import { socketService } from '../../services/socket';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { ScrollArea } from '../ui/scroll-area';
import MessageItem from './MessageItem';
import { useToast } from '../ui/use-toast';

export default function ChannelView() {
  const { currentChannel } = useChannelStore();
  const { messages, fetchMessages, sendMessage, typingUsers, typingActivity } = useMessageStore();
  const { user } = useAuthStore();
  const { toast } = useToast();
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const bottomAnchorRef = useRef<HTMLDivElement>(null);
  // In the browser, setTimeout returns a number
  const typingTimeoutRef = useRef<number | null>(null);

  const getViewport = () =>
    (scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]') as HTMLDivElement | null) || null;

  const scrollToBottom = () => {
    // Try immediately after render and after layout settles
    requestAnimationFrame(() => {
      // 1) Try anchor method (works in many cases)
      bottomAnchorRef.current?.scrollIntoView({ behavior: 'auto', block: 'end' });

      // 2) Also directly set scrollTop on the actual viewport (Radix ScrollArea)
      const vp = getViewport();
      if (vp) {
        vp.scrollTop = vp.scrollHeight;
      }

      setTimeout(() => {
        bottomAnchorRef.current?.scrollIntoView({ behavior: 'auto', block: 'end' });
        const vp2 = getViewport();
        if (vp2) {
          vp2.scrollTop = vp2.scrollHeight;
        }
      }, 0);
    });
  };

  const channelMessages = currentChannel ? messages[currentChannel.id] || [] : [];
  // Render-time safeguard against duplicate entries
  const uniqueChannelMessages = (() => {
    const seen = new Set<string>();
    const result: typeof channelMessages = [];
    for (const m of channelMessages) {
      if (!seen.has(m.id)) {
        seen.add(m.id);
        result.push(m);
      }
    }
    return result;
  })();
  const channelTyping = currentChannel ? Array.from(typingUsers[currentChannel.id] || []) : [];

  useEffect(() => {
    if (currentChannel) {
      fetchMessages(currentChannel.id);
    }
  }, [currentChannel, fetchMessages]);

  useLayoutEffect(() => {
    // Scroll to bottom when new messages arrive
    scrollToBottom();
  }, [uniqueChannelMessages]);

  // Also scroll when typing activity happens (even if set size is unchanged)
  const typingActivityTick = currentChannel ? typingActivity[currentChannel.id] || 0 : 0;
  useLayoutEffect(() => {
    scrollToBottom();
  }, [typingActivityTick]);

  const handleTyping = () => {
    if (!currentChannel || !user) return;

    socketService.startTyping(currentChannel.id, user.displayName);

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Stop typing after 3 seconds of inactivity
    typingTimeoutRef.current = window.setTimeout(() => {
      socketService.stopTyping(currentChannel.id);
    }, 3000);

    // Ensure typing indicator stays visible
    scrollToBottom();
  };

  // Cleanup any pending typing timeout on unmount or channel change
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
    };
  }, [currentChannel?.id]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !currentChannel || isSending) return;

    setIsSending(true);
    try {
      await sendMessage(currentChannel.id, messageText.trim());
      setMessageText('');
      // Ensure view stays pinned to bottom after send
      scrollToBottom();
      
      // Stop typing indicator
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      socketService.stopTyping(currentChannel.id);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  if (!currentChannel) {
    return null;
  }

  return (
    <div className="flex flex-1 flex-col">
      {/* Channel Header */}
      <div className="flex items-center justify-between border-b px-4 py-3 bg-white">
        <div className="flex items-center space-x-2">
          {currentChannel.isPrivate ? (
            <Lock className="h-5 w-5 text-gray-500" />
          ) : (
            <Hash className="h-5 w-5 text-gray-500" />
          )}
          <div>
            <h2 className="font-bold text-lg">{currentChannel.name}</h2>
            {currentChannel.description && (
              <p className="text-sm text-gray-500">{currentChannel.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm">
            <Users className="h-4 w-4 mr-2" />
            {currentChannel._count?.members || 0}
          </Button>
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea ref={scrollAreaRef} className="flex-1 px-4">
        <div className="py-4 space-y-4">
          {uniqueChannelMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <div className="bg-gray-100 rounded-full p-6 mb-4">
                {currentChannel.isPrivate ? (
                  <Lock className="h-12 w-12 text-gray-400" />
                ) : (
                  <Hash className="h-12 w-12 text-gray-400" />
                )}
              </div>
              <h3 className="text-xl font-bold mb-2">
                This is the beginning of #{currentChannel.name}
              </h3>
              <p className="text-gray-500 max-w-md">
                {currentChannel.description || 'This channel is for team-wide communication.'}
              </p>
            </div>
          ) : (
            uniqueChannelMessages.map((message) => (
              <MessageItem key={message.id} message={message} />
            ))
          )}

          {/* Typing Indicator */}
          {channelTyping.length > 0 && (
            <div className="text-sm text-gray-500 italic">
              {channelTyping.join(', ')} {channelTyping.length === 1 ? 'is' : 'are'} typing...
            </div>
          )}

          {/* Bottom anchor to ensure reliable scrolling */}
          <div ref={bottomAnchorRef} />
        </div>
      </ScrollArea>

      {/* Message Input */}
      <div className="border-t p-4 bg-white">
        <form onSubmit={handleSendMessage} className="flex items-end space-x-2">
          <div className="flex-1">
            <Input
              value={messageText}
              onChange={(e) => {
                setMessageText(e.target.value);
                handleTyping();
              }}
              placeholder={`Message #${currentChannel.name}`}
              className="resize-none"
              disabled={isSending}
            />
          </div>
          <Button type="submit" disabled={!messageText.trim() || isSending}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}

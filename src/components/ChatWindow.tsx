"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { Game, Message, SOCKET_EVENTS } from "@/types";
import { useSocket } from "@/hooks/useSocket";
import { useChatStore } from "@/lib/store";
import ChatMessage from "./ChatMessage";
import UserProfileModal from "./UserProfileModal";
import {
  Send,
  Users,
  Smile,
  Lock,
  ArrowDown,
  Loader2,
  X,
  Reply,
} from "lucide-react";

const QUICK_REACTIONS = ["⚽", "🔥", "😮", "👏", "😂", "💪", "❤️", "😤"];

interface ChatWindowProps {
  gameId: string;
  game: Game;
}

export default function ChatWindow({ gameId, game }: ChatWindowProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  const {
    messages,
    activeUsers,
    typingUsers,
    isLoadingMessages,
    addMessage,
    setMessages,
    setActiveUsers,
    addTypingUser,
    removeTypingUser,
    setLoadingMessages,
    clearChat,
  } = useChatStore();

  const [inputValue, setInputValue] = useState("");
  const [showReactions, setShowReactions] = useState(false);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [profileModalUserId, setProfileModalUserId] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const user = session?.user
    ? {
        id: (session.user as any).id,
        username: (session.user as any).username || session.user.name || "User",
        avatar: (session.user as any).avatar || session.user.image,
      }
    : null;

  // Socket connection
  const { isConnected, broadcastSavedMessage, startTyping, stopTyping } = useSocket({
    gameId,
    user,
    onNewMessage: (message) => {
      addMessage(message);
    },
    onRoomUsers: (data) => {
      setActiveUsers(data.count);
    },
    onUserJoined: (data) => {
      setActiveUsers(data.count);
    },
    onUserLeft: (data) => {
      setActiveUsers(data.count);
    },
    onUserTyping: (data) => {
      if (data.isTyping) {
        addTypingUser(data.username);
        // Auto-remove after 3 seconds
        setTimeout(() => removeTypingUser(data.username), 3000);
      } else {
        removeTypingUser(data.username);
      }
    },
  });

  // Fetch existing messages
  useEffect(() => {
    clearChat();
    setLoadingMessages(true);

    fetch(`/api/messages/${gameId}?limit=100`)
      .then((res) => res.json())
      .then((result) => {
        if (result.success) {
          setMessages(result.data.messages);
        }
      })
      .catch(console.error)
      .finally(() => setLoadingMessages(false));

    return () => clearChat();
  }, [gameId]);

  // Auto-scroll to bottom
  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({
      behavior: smooth ? "smooth" : "auto",
    });
  }, []);

  useEffect(() => {
    scrollToBottom(false);
  }, [messages.length]);

  // Track scroll position for "scroll to bottom" button
  const handleScroll = useCallback(() => {
    if (!messagesContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } =
      messagesContainerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    setShowScrollToBottom(!isNearBottom);
  }, []);

  // Handle sending message — save first (Next.js 16 needs real gameId in API route), then broadcast
  const handleSend = async () => {
    if (!inputValue.trim() || !user) return;

    const replyData = replyingTo
      ? {
          _id: replyingTo._id,
          content: replyingTo.content,
          username: replyingTo.user.username,
        }
      : undefined;

    const content = inputValue.trim();
    const res = await fetch(`/api/messages/${gameId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content,
        type: "text",
        replyTo: replyData,
      }),
    });
    const result = await res.json().catch(() => ({}));
    if (!result.success || !result.data) {
      console.error("Failed to save message:", result);
      return;
    }

    addMessage(result.data);
    broadcastSavedMessage(result.data);

    setInputValue("");
    setReplyingTo(null);
    stopTyping();
    inputRef.current?.focus();
  };

  const handleReaction = async (emoji: string) => {
    if (!user) return;
    const res = await fetch(`/api/messages/${gameId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: emoji, type: "reaction" }),
    });
    const result = await res.json().catch(() => ({}));
    if (!result.success || !result.data) {
      console.error("Failed to save reaction:", result);
      return;
    }
    addMessage(result.data);
    broadcastSavedMessage(result.data);
    setShowReactions(false);
  };

  // Handle typing
  const handleInputChange = (value: string) => {
    setInputValue(value);

    if (!user) return;

    startTyping();
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(stopTyping, 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-dark-900">
      {/* Chat Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-dark-700/50 bg-dark-850">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            {isConnected ? (
              <span className="w-2 h-2 rounded-full bg-accent-green" />
            ) : (
              <span className="w-2 h-2 rounded-full bg-dark-500" />
            )}
            <span className="text-xs text-dark-400">
              {isConnected ? "Connected" : "Connecting..."}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-dark-400">
          <Users className="w-4 h-4" />
          <span className="text-xs font-medium">{activeUsers}</span>
        </div>
      </div>

      {/* Messages Area */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-3 scrollbar-thin"
      >
        {isLoadingMessages ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-6 h-6 text-dark-500 animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="w-16 h-16 rounded-full bg-dark-800 flex items-center justify-center mb-4">
              <span className="text-3xl">💬</span>
            </div>
            <h3 className="text-sm font-semibold text-dark-300 mb-1">
              No messages yet
            </h3>
            <p className="text-xs text-dark-500 max-w-[240px]">
              Be the first to share your thoughts about this match!
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <ChatMessage
              key={msg._id}
              message={msg}
              isOwnMessage={user?.id === msg.user._id}
              onClickAvatar={(uid) => setProfileModalUserId(uid)}
              onReply={(m) => {
                setReplyingTo(m);
                inputRef.current?.focus();
              }}
            />
          ))
        )}

        {/* Typing indicator */}
        {typingUsers.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-dark-500 animate-fade-in">
            <div className="flex gap-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-dark-500 animate-bounce [animation-delay:0ms]" />
              <span className="w-1.5 h-1.5 rounded-full bg-dark-500 animate-bounce [animation-delay:150ms]" />
              <span className="w-1.5 h-1.5 rounded-full bg-dark-500 animate-bounce [animation-delay:300ms]" />
            </div>
            <span>
              {typingUsers.length === 1
                ? `${typingUsers[0]} is typing...`
                : `${typingUsers.length} people are typing...`}
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Scroll to bottom */}
      {showScrollToBottom && (
        <button
          onClick={() => scrollToBottom()}
          className="absolute bottom-24 right-6 w-8 h-8 rounded-full bg-dark-700 border border-dark-600 flex items-center justify-center text-dark-300 hover:text-white transition-colors shadow-lg"
        >
          <ArrowDown className="w-4 h-4" />
        </button>
      )}

      {/* Quick Reactions */}
      {showReactions && user && (
        <div className="flex items-center gap-1 px-4 py-2 border-t border-dark-700/50 bg-dark-850 animate-slide-up">
          {QUICK_REACTIONS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => handleReaction(emoji)}
              className="w-10 h-10 rounded-xl hover:bg-dark-700/50 flex items-center justify-center text-xl transition-all hover:scale-110"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* Input Area */}
      <div className="px-4 py-3 border-t border-dark-700/50 bg-dark-850">
        {user ? (
          <>
            {/* Reply preview bar */}
            {replyingTo && (
              <div className="flex items-center gap-2 mb-2 px-3 py-2 bg-dark-800 rounded-lg border-l-2 border-primary-500 animate-fade-in">
                <Reply className="w-3.5 h-3.5 text-primary-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-semibold text-primary-400">
                    {replyingTo.user.username}
                  </p>
                  <p className="text-xs text-dark-400 truncate">
                    {replyingTo.content}
                  </p>
                </div>
                <button
                  onClick={() => setReplyingTo(null)}
                  className="p-0.5 rounded text-dark-500 hover:text-dark-300 transition-colors flex-shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            <div className="flex items-center gap-2">
            <button
              onClick={() => setShowReactions(!showReactions)}
              className={`p-2 rounded-lg transition-colors ${
                showReactions
                  ? "text-primary-400 bg-primary-600/10"
                  : "text-dark-400 hover:text-dark-200"
              }`}
            >
              <Smile className="w-5 h-5" />
            </button>
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Share your thoughts..."
              maxLength={500}
              className="flex-1 bg-dark-800 border border-dark-700/50 rounded-xl px-4 py-2.5 text-sm text-white placeholder-dark-500 focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/25 transition-all"
            />
            <button
              onClick={handleSend}
              disabled={!inputValue.trim()}
              className="p-2.5 rounded-xl bg-primary-600 text-white hover:bg-primary-500 disabled:opacity-30 disabled:hover:bg-primary-600 transition-all disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          </>
        ) : (
          <button
            onClick={() =>
              router.push(
                `/auth?callbackUrl=${encodeURIComponent(pathname || "/")}`
              )
            }
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-dark-800 border border-dark-700/50 text-dark-300 hover:text-white hover:border-primary-500/50 transition-all group"
          >
            <Lock className="w-4 h-4 text-dark-500 group-hover:text-primary-400 transition-colors" />
            <span className="text-sm">
              Sign in to join the conversation
            </span>
          </button>
        )}
      </div>

      {/* User Profile Modal */}
      <UserProfileModal
        userId={profileModalUserId || ""}
        isOpen={!!profileModalUserId}
        onClose={() => setProfileModalUserId(null)}
      />
    </div>
  );
}

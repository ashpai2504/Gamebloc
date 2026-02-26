"use client";

import {
  useState,
  useRef,
  useEffect,
  useCallback,
} from "react";
import { useSession } from "next-auth/react";
import { io, Socket } from "socket.io-client";
import {
  X,
  ChevronLeft,
  Send,
  MessageCircle,
  Loader2,
  Check,
  CheckCheck,
  Edit3,
} from "lucide-react";
import { format, parseISO, isToday, isYesterday } from "date-fns";
import { useDMStore } from "@/lib/store";
import { DMConversation, DMMessage } from "@/types";

interface DMPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

function Avatar({
  username,
  avatar,
  size = "md",
}: {
  username: string;
  avatar?: string;
  size?: "sm" | "md" | "lg";
}) {
  const dims = size === "sm" ? "w-7 h-7" : size === "lg" ? "w-12 h-12" : "w-9 h-9";
  const text = size === "sm" ? "text-xs" : size === "lg" ? "text-xl" : "text-sm";
  return avatar ? (
    <img
      src={avatar}
      alt={username}
      className={`${dims} rounded-full object-cover flex-shrink-0`}
    />
  ) : (
    <div
      className={`${dims} rounded-full bg-primary-600/25 flex items-center justify-center flex-shrink-0`}
    >
      <span className={`${text} font-bold text-primary-400`}>
        {username.charAt(0).toUpperCase()}
      </span>
    </div>
  );
}

function formatTimestamp(dateStr: string): string {
  const date = parseISO(dateStr);
  if (isToday(date)) return format(date, "HH:mm");
  if (isYesterday(date)) return "Yesterday";
  return format(date, "MMM d");
}

export default function DMPanel({ isOpen, onClose }: DMPanelProps) {
  const { data: session } = useSession();
  const { targetDMUserId, clearTargetDMUser, setTotalUnread } = useDMStore();

  const [view, setView] = useState<"list" | "chat">("list");
  const [conversations, setConversations] = useState<DMConversation[]>([]);
  const [activeConv, setActiveConv] = useState<DMConversation | null>(null);
  const [messages, setMessages] = useState<DMMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoadingConvs, setIsLoadingConvs] = useState(false);
  const [isLoadingMsgs, setIsLoadingMsgs] = useState(false);
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const [initializingTarget, setInitializingTarget] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const activeConvIdRef = useRef<string | null>(null);

  const currentUser = session?.user as any;
  const userId = currentUser?.id;

  // ---------- Socket Setup ----------
  useEffect(() => {
    if (!isOpen || !userId) return;

    const socketUrl =
      process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3000";
    const socket = io(socketUrl, { transports: ["websocket", "polling"] });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("register_user", { userId });
    });

    socket.on("new_dm", (message: DMMessage) => {
      // Only add to messages if it's for the active conversation
      if (message.conversationId === activeConvIdRef.current) {
        setMessages((prev) => {
          // Avoid duplicates (optimistic vs real)
          if (prev.some((m) => m._id === message._id)) return prev;
          return [...prev, message];
        });
      }
      // Update conversation list preview
      setConversations((prev) =>
        prev
          .map((conv) =>
            conv._id === message.conversationId
              ? {
                  ...conv,
                  lastMessage: message.content,
                  lastMessageAt: message.createdAt,
                  lastSenderId: message.sender._id,
                  unreadCount:
                    message.conversationId === activeConvIdRef.current
                      ? 0
                      : conv.unreadCount + 1,
                }
              : conv
          )
          .sort(
            (a, b) =>
              new Date(b.lastMessageAt || 0).getTime() -
              new Date(a.lastMessageAt || 0).getTime()
          )
      );
    });

    socket.on(
      "dm_user_typing",
      ({ username, isTyping }: { username: string; isTyping: boolean }) => {
        setTypingUser(isTyping ? username : null);
        if (isTyping) {
          setTimeout(() => setTypingUser(null), 3000);
        }
      }
    );

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [isOpen, userId]);

  // ---------- Join/leave DM room ----------
  useEffect(() => {
    activeConvIdRef.current = activeConv?._id || null;

    if (!socketRef.current) return;

    if (activeConv) {
      socketRef.current.emit("join_dm_room", {
        conversationId: activeConv._id,
        userId,
      });
    }

    return () => {
      if (activeConv && socketRef.current) {
        socketRef.current.emit("leave_dm_room", {
          conversationId: activeConv._id,
        });
      }
    };
  }, [activeConv?._id]);

  // ---------- Reset when panel closes ----------
  useEffect(() => {
    if (!isOpen) {
      setView("list");
      setActiveConv(null);
      setMessages([]);
      setInput("");
      setTypingUser(null);
    }
  }, [isOpen]);

  // ---------- Fetch conversations ----------
  const fetchConversations = useCallback(async () => {
    if (!userId) return;
    setIsLoadingConvs(true);
    try {
      const res = await fetch("/api/dm/conversations");
      const result = await res.json();
      if (result.success) {
        setConversations(result.data);
        const total = result.data.reduce(
          (sum: number, c: DMConversation) => sum + c.unreadCount,
          0
        );
        setTotalUnread(total);
      }
    } catch (e) {
      console.error("[DM] fetchConversations error:", e);
    } finally {
      setIsLoadingConvs(false);
    }
  }, [userId, setTotalUnread]);

  useEffect(() => {
    if (isOpen && userId) {
      fetchConversations();
    }
  }, [isOpen, userId, fetchConversations]);

  // ---------- Open targeted conversation (from profile modal) ----------
  useEffect(() => {
    if (!targetDMUserId || !userId || !isOpen) return;

    setInitializingTarget(true);

    fetch("/api/dm/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetUserId: targetDMUserId }),
    })
      .then((r) => r.json())
      .then((result) => {
        if (result.success) {
          const conv: DMConversation = result.data;
          setConversations((prev) => {
            const exists = prev.find((c) => c._id === conv._id);
            return exists ? prev : [conv, ...prev];
          });
          setActiveConv(conv);
          setView("chat");
        }
      })
      .catch(console.error)
      .finally(() => {
        clearTargetDMUser();
        setInitializingTarget(false);
      });
  }, [targetDMUserId, userId, isOpen, clearTargetDMUser]);

  // ---------- Fetch messages for active conversation ----------
  const fetchMessages = useCallback(async (conversationId: string) => {
    setIsLoadingMsgs(true);
    setMessages([]);
    try {
      const res = await fetch(
        `/api/dm/${conversationId}/messages?limit=50`
      );
      const result = await res.json();
      if (result.success) {
        setMessages(result.data.messages);
        // Mark as read locally
        setConversations((prev) =>
          prev.map((c) =>
            c._id === conversationId ? { ...c, unreadCount: 0 } : c
          )
        );
      }
    } catch (e) {
      console.error("[DM] fetchMessages error:", e);
    } finally {
      setIsLoadingMsgs(false);
    }
  }, []);

  useEffect(() => {
    if (activeConv) {
      fetchMessages(activeConv._id);
      setInput("");
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [activeConv?._id]);

  // ---------- Auto-scroll ----------
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, typingUser]);

  // ---------- Send message ----------
  const handleSend = useCallback(() => {
    if (!input.trim() || !activeConv || !currentUser) return;

    const content = input.trim();
    setInput("");

    const optimistic: DMMessage = {
      _id: `opt_${Date.now()}`,
      conversationId: activeConv._id,
      sender: {
        _id: userId,
        username: currentUser.username || currentUser.name || "You",
        avatar: currentUser.avatar || currentUser.image,
      },
      content,
      createdAt: new Date().toISOString(),
      readBy: [userId],
    };

    setMessages((prev) => [...prev, optimistic]);

    fetch(`/api/dm/${activeConv._id}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    })
      .then((r) => r.json())
      .then((result) => {
        if (result.success) {
          const real: DMMessage = result.data;
          setMessages((prev) =>
            prev.map((m) => (m._id === optimistic._id ? real : m))
          );
          // Broadcast via socket
          socketRef.current?.emit("send_dm", {
            conversationId: activeConv._id,
            message: real,
          });
          // Update conversation list
          setConversations((prev) =>
            prev
              .map((c) =>
                c._id === activeConv._id
                  ? {
                      ...c,
                      lastMessage: content,
                      lastMessageAt: real.createdAt,
                      lastSenderId: userId,
                    }
                  : c
              )
              .sort(
                (a, b) =>
                  new Date(b.lastMessageAt || 0).getTime() -
                  new Date(a.lastMessageAt || 0).getTime()
              )
          );
        }
      })
      .catch(console.error);

    stopTyping();
    inputRef.current?.focus();
  }, [input, activeConv, currentUser, userId]);

  const startTyping = () => {
    if (!activeConv || !currentUser) return;
    socketRef.current?.emit("dm_typing", {
      conversationId: activeConv._id,
      username: currentUser.username || currentUser.name,
      isTyping: true,
    });
  };

  const stopTyping = () => {
    if (!activeConv || !currentUser) return;
    socketRef.current?.emit("dm_typing", {
      conversationId: activeConv._id,
      username: currentUser.username || currentUser.name,
      isTyping: false,
    });
  };

  const handleInputChange = (value: string) => {
    setInput(value);
    startTyping();
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(stopTyping, 2000);
  };

  const handleBack = () => {
    setView("list");
    setActiveConv(null);
    setMessages([]);
    setTypingUser(null);
    fetchConversations();
  };

  const openConversation = (conv: DMConversation) => {
    setActiveConv(conv);
    setView("chat");
  };

  const getOther = (conv: DMConversation) => conv.participants[0];

  // ---------- Render ----------
  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-[390px] z-[70] flex flex-col bg-dark-900 border-l border-dark-700/40 shadow-2xl transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* ── Conversation List View ── */}
        <div
          className={`absolute inset-0 flex flex-col transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
            view === "list" ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-dark-700/40">
            <div className="flex items-center gap-2.5">
              <h2 className="text-base font-bold text-white">Messages</h2>
              {conversations.some((c) => c.unreadCount > 0) && (
                <span className="px-1.5 py-0.5 rounded-full bg-primary-600 text-[10px] font-bold text-white">
                  {conversations.reduce((s, c) => s + c.unreadCount, 0)}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                title="New message"
                className="p-1.5 rounded-lg text-dark-400 hover:text-white hover:bg-dark-800 transition-colors"
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-dark-400 hover:text-white hover:bg-dark-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Conversation List */}
          <div className="flex-1 overflow-y-auto scrollbar-thin">
            {isLoadingConvs ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-5 h-5 text-primary-500 animate-spin" />
              </div>
            ) : conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
                <div className="w-20 h-20 rounded-full bg-dark-800 flex items-center justify-center mb-5">
                  <MessageCircle className="w-9 h-9 text-dark-500" />
                </div>
                <h3 className="text-sm font-semibold text-dark-200 mb-1.5">
                  No messages yet
                </h3>
                <p className="text-xs text-dark-500 leading-relaxed">
                  Tap on a user&apos;s avatar in any match chat to start a private conversation.
                </p>
              </div>
            ) : (
              <div className="py-1">
                {conversations.map((conv) => {
                  const other = getOther(conv);
                  const isUnread = conv.unreadCount > 0;
                  const isMe = conv.lastSenderId === userId;

                  return (
                    <button
                      key={conv._id}
                      onClick={() => openConversation(conv)}
                      className="w-full flex items-center gap-3.5 px-5 py-3.5 hover:bg-dark-800/50 active:bg-dark-800 transition-colors text-left"
                    >
                      {/* Avatar with unread dot */}
                      <div className="relative">
                        <Avatar
                          username={other.username}
                          avatar={other.avatar}
                          size="lg"
                        />
                        {isUnread && (
                          <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-primary-500 rounded-full border-2 border-dark-900" />
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between mb-0.5">
                          <span
                            className={`text-sm truncate ${
                              isUnread
                                ? "font-bold text-white"
                                : "font-semibold text-dark-200"
                            }`}
                          >
                            {other.username}
                          </span>
                          {conv.lastMessageAt && (
                            <span
                              className={`text-[10px] ml-2 flex-shrink-0 ${
                                isUnread ? "text-primary-400 font-medium" : "text-dark-500"
                              }`}
                            >
                              {formatTimestamp(conv.lastMessageAt)}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5">
                          {isMe && !isUnread && (
                            <CheckCheck className="w-3 h-3 text-dark-500 flex-shrink-0" />
                          )}
                          <p
                            className={`text-xs truncate flex-1 ${
                              isUnread ? "text-dark-200 font-medium" : "text-dark-500"
                            }`}
                          >
                            {conv.lastMessage
                              ? isMe
                                ? `You: ${conv.lastMessage}`
                                : conv.lastMessage
                              : "Tap to start chatting"}
                          </p>
                          {isUnread && (
                            <span className="flex-shrink-0 min-w-[18px] h-[18px] rounded-full bg-primary-600 flex items-center justify-center text-[10px] font-bold text-white px-1">
                              {conv.unreadCount > 9 ? "9+" : conv.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Chat View ── */}
        <div
          className={`absolute inset-0 flex flex-col transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
            view === "chat" ? "translate-x-0" : "translate-x-full"
          }`}
        >
          {(activeConv || initializingTarget) && (() => {
            const other = activeConv ? getOther(activeConv) : null;

            return (
              <>
                {/* Chat Header */}
                <div className="flex items-center gap-3 px-4 py-3.5 border-b border-dark-700/40 bg-dark-900">
                  <button
                    onClick={handleBack}
                    className="p-1.5 rounded-lg text-dark-400 hover:text-white hover:bg-dark-800 transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  {other ? (
                    <>
                      <Avatar
                        username={other.username}
                        avatar={other.avatar}
                        size="md"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-white leading-tight">
                          {other.username}
                        </h3>
                        <div className="h-3.5">
                          {typingUser && (
                            <p className="text-[11px] text-primary-400 animate-fade-in">
                              typing…
                            </p>
                          )}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex-1" />
                  )}

                  <button
                    onClick={onClose}
                    className="p-1.5 rounded-lg text-dark-400 hover:text-white hover:bg-dark-800 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1.5 scrollbar-thin">
                  {isLoadingMsgs || initializingTarget ? (
                    <div className="flex items-center justify-center py-16">
                      <Loader2 className="w-5 h-5 text-primary-500 animate-spin" />
                    </div>
                  ) : messages.length === 0 && other ? (
                    <div className="flex flex-col items-center justify-center py-14 text-center px-4">
                      <Avatar
                        username={other.username}
                        avatar={other.avatar}
                        size="lg"
                      />
                      <h4 className="mt-3 text-sm font-semibold text-dark-200">
                        {other.username}
                      </h4>
                      <p className="mt-1 text-xs text-dark-500">
                        Say hi to start the conversation!
                      </p>
                    </div>
                  ) : (
                    messages.map((msg, idx) => {
                      const isOwn = msg.sender._id === userId;
                      const prevMsg = idx > 0 ? messages[idx - 1] : null;
                      const nextMsg = idx < messages.length - 1 ? messages[idx + 1] : null;
                      const isFirstInGroup =
                        !prevMsg || prevMsg.sender._id !== msg.sender._id;
                      const isLastInGroup =
                        !nextMsg || nextMsg.sender._id !== msg.sender._id;
                      const isRead = msg.readBy.some((id) => id !== userId);

                      // Bubble rounding per group position
                      const ownRadius = `rounded-2xl ${
                        isFirstInGroup ? "rounded-tr-md" : ""
                      } ${isLastInGroup ? "rounded-br-md" : ""} ${
                        !isFirstInGroup && !isLastInGroup ? "rounded-r-md" : ""
                      }`;
                      const otherRadius = `rounded-2xl ${
                        isFirstInGroup ? "rounded-tl-md" : ""
                      } ${isLastInGroup ? "rounded-bl-md" : ""} ${
                        !isFirstInGroup && !isLastInGroup ? "rounded-l-md" : ""
                      }`;

                      const bubbleRadius = isOwn ? ownRadius : otherRadius;
                      const gap = isFirstInGroup && idx > 0 ? "mt-3" : "mt-0.5";

                      return (
                        <div
                          key={msg._id}
                          className={`flex gap-2 animate-slide-up ${
                            isOwn ? "flex-row-reverse" : ""
                          } ${gap}`}
                        >
                          {/* Avatar (only last in group for others) */}
                          {!isOwn && (
                            <div className="w-7 self-end flex-shrink-0 mb-0.5">
                              {isLastInGroup && other && (
                                <Avatar
                                  username={other.username}
                                  avatar={other.avatar}
                                  size="sm"
                                />
                              )}
                            </div>
                          )}

                          <div
                            className={`max-w-[72%] flex flex-col ${
                              isOwn ? "items-end" : "items-start"
                            }`}
                          >
                            <div
                              className={`px-3.5 py-2.5 text-sm leading-relaxed break-words ${bubbleRadius} ${
                                isOwn
                                  ? "bg-primary-600 text-white"
                                  : "bg-dark-700/90 text-dark-100"
                              } ${msg._id.startsWith("opt_") ? "opacity-70" : ""}`}
                            >
                              {msg.content}
                            </div>

                            {/* Meta: time + read receipt (only last in group) */}
                            {isLastInGroup && (
                              <div
                                className={`flex items-center gap-1 mt-1 ${
                                  isOwn ? "flex-row-reverse" : ""
                                }`}
                              >
                                <span className="text-[10px] text-dark-500">
                                  {format(parseISO(msg.createdAt), "HH:mm")}
                                </span>
                                {isOwn &&
                                  !msg._id.startsWith("opt_") &&
                                  (isRead ? (
                                    <CheckCheck className="w-3 h-3 text-primary-400" />
                                  ) : (
                                    <Check className="w-3 h-3 text-dark-500" />
                                  ))}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}

                  {/* Typing indicator */}
                  {typingUser && other && (
                    <div className="flex gap-2 mt-3 animate-fade-in">
                      <div className="w-7 self-end flex-shrink-0">
                        <Avatar
                          username={other.username}
                          avatar={other.avatar}
                          size="sm"
                        />
                      </div>
                      <div className="bg-dark-700/90 px-4 py-3 rounded-2xl rounded-bl-md">
                        <div className="flex gap-1 items-center">
                          <span className="w-1.5 h-1.5 rounded-full bg-dark-400 animate-bounce [animation-delay:0ms]" />
                          <span className="w-1.5 h-1.5 rounded-full bg-dark-400 animate-bounce [animation-delay:150ms]" />
                          <span className="w-1.5 h-1.5 rounded-full bg-dark-400 animate-bounce [animation-delay:300ms]" />
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="px-4 py-3.5 border-t border-dark-700/40 bg-dark-900">
                  <div className="flex items-center gap-2.5 bg-dark-800 rounded-full border border-dark-700/50 pl-4 pr-2 py-2 focus-within:border-primary-500/50 focus-within:ring-1 focus-within:ring-primary-500/20 transition-all">
                    <input
                      ref={inputRef}
                      type="text"
                      value={input}
                      onChange={(e) => handleInputChange(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                      placeholder={
                        other ? `Message ${other.username}…` : "Message…"
                      }
                      maxLength={1000}
                      className="flex-1 bg-transparent text-sm text-white placeholder-dark-500 focus:outline-none py-0.5"
                    />
                    <button
                      onClick={handleSend}
                      disabled={!input.trim()}
                      className="w-8 h-8 rounded-full bg-primary-600 text-white hover:bg-primary-500 disabled:opacity-30 disabled:hover:bg-primary-600 transition-all disabled:cursor-not-allowed flex items-center justify-center flex-shrink-0"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </>
            );
          })()}
        </div>
      </div>
    </>
  );
}

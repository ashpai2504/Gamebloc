"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { io, Socket } from "socket.io-client";
import { Message, SOCKET_EVENTS } from "@/types";

interface UseSocketOptions {
  gameId: string;
  user?: {
    id: string;
    username: string;
    avatar?: string;
  } | null;
  onNewMessage?: (message: Message) => void;
  onRoomUsers?: (data: { count: number; users: any[] }) => void;
  onUserJoined?: (data: { username: string; count: number }) => void;
  onUserLeft?: (data: { username: string; count: number }) => void;
  onUserTyping?: (data: { username: string; isTyping: boolean }) => void;
}

export function useSocket({
  gameId,
  user,
  onNewMessage,
  onRoomUsers,
  onUserJoined,
  onUserLeft,
  onUserTyping,
}: UseSocketOptions) {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3000";
    const socket = io(socketUrl, {
      transports: ["websocket", "polling"],
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setIsConnected(true);
      console.log("🔌 Socket connected");

      // Join the game room
      socket.emit(SOCKET_EVENTS.JOIN_ROOM, {
        gameId,
        user: user || { username: "Spectator" },
      });
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
      console.log("🔌 Socket disconnected");
    });

    // Listen for events
    socket.on(SOCKET_EVENTS.NEW_MESSAGE, (message: Message) => {
      onNewMessage?.(message);
    });

    socket.on(SOCKET_EVENTS.ROOM_USERS, (data) => {
      onRoomUsers?.(data);
    });

    socket.on(SOCKET_EVENTS.USER_JOINED, (data) => {
      onUserJoined?.(data);
    });

    socket.on(SOCKET_EVENTS.USER_LEFT, (data) => {
      onUserLeft?.(data);
    });

    socket.on(SOCKET_EVENTS.USER_TYPING, (data) => {
      onUserTyping?.(data);
    });

    return () => {
      socket.emit(SOCKET_EVENTS.LEAVE_ROOM, { gameId });
      socket.disconnect();
      socketRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId, user?.id]);

  const sendMessage = useCallback(
    (content: string, type: "text" | "reaction" = "text") => {
      if (!socketRef.current || !user) return;

      socketRef.current.emit(SOCKET_EVENTS.SEND_MESSAGE, {
        gameId,
        message: {
          userId: user.id,
          username: user.username,
          userAvatar: user.avatar,
          content,
          type,
        },
      });
    },
    [gameId, user]
  );

  const startTyping = useCallback(() => {
    if (!socketRef.current || !user) return;
    socketRef.current.emit(SOCKET_EVENTS.TYPING, {
      gameId,
      username: user.username,
    });
  }, [gameId, user]);

  const stopTyping = useCallback(() => {
    if (!socketRef.current || !user) return;
    socketRef.current.emit(SOCKET_EVENTS.STOP_TYPING, {
      gameId,
      username: user.username,
    });
  }, [gameId, user]);

  return {
    socket: socketRef.current,
    isConnected,
    sendMessage,
    startTyping,
    stopTyping,
  };
}

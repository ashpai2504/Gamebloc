"use client";

import { Message } from "@/types";
import { format, parseISO } from "date-fns";

interface ChatMessageProps {
  message: Message;
  isOwnMessage: boolean;
}

export default function ChatMessage({ message, isOwnMessage }: ChatMessageProps) {
  const time = format(parseISO(message.createdAt), "HH:mm");

  if (message.type === "reaction") {
    return (
      <div className="flex justify-center py-1 animate-fade-in">
        <span className="text-2xl">{message.content}</span>
      </div>
    );
  }

  return (
    <div
      className={`flex gap-2.5 animate-slide-up ${
        isOwnMessage ? "flex-row-reverse" : ""
      }`}
    >
      {/* Avatar */}
      <div className="flex-shrink-0">
        {message.user.avatar ? (
          <img
            src={message.user.avatar}
            alt={message.user.username}
            className="w-8 h-8 rounded-full"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-primary-600/30 flex items-center justify-center">
            <span className="text-xs font-bold text-primary-300">
              {message.user.username.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
      </div>

      {/* Message Bubble */}
      <div className={`max-w-[75%] ${isOwnMessage ? "items-end" : "items-start"}`}>
        {/* Username */}
        {!isOwnMessage && (
          <p className="text-[11px] font-medium text-dark-400 mb-0.5 px-1">
            {message.user.username}
          </p>
        )}
        <div
          className={`px-3 py-2 rounded-2xl text-sm leading-relaxed break-words ${
            isOwnMessage
              ? "bg-primary-600 text-white rounded-br-md"
              : "bg-dark-700/80 text-dark-100 rounded-bl-md"
          }`}
        >
          {message.content}
        </div>
        <p
          className={`text-[10px] text-dark-500 mt-0.5 px-1 ${
            isOwnMessage ? "text-right" : "text-left"
          }`}
        >
          {time}
        </p>
      </div>
    </div>
  );
}

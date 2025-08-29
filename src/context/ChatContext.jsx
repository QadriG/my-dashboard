import React, { createContext, useState, useRef } from "react";

export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  // Initialize minimized to true to ensure chat is minimized by default
  const [minimized, setMinimized] = useState(true);
  const chatRef = useRef(null);

  return (
    <ChatContext.Provider
      value={{
        messages,
        setMessages,
        input,
        setInput,
        showEmoji,
        setShowEmoji,
        minimized,
        setMinimized,
        chatRef,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};
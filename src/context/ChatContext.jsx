// src/context/ChatContext.js
import React, { createContext, useState, useRef, useEffect } from "react";

export const ChatContext = createContext();

export const ChatProvider = ({ children, user }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const chatRef = useRef(null);

  // Update currentUser whenever the prop `user` changes
  useEffect(() => {
    if (user) setCurrentUser(user);
  }, [user]);

  const addMessage = (msg) => {
    if (!msg || typeof msg !== "object") return;
    if (!msg.id) msg.id = Date.now();
    setMessages((prev) => [...prev, msg]);
  };

  return (
    <ChatContext.Provider
      value={{
        user: currentUser,
        messages,
        setMessages,
        addMessage,
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

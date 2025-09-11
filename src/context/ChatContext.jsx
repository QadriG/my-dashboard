// src/context/ChatContext.jsx
import { createContext, useState, useRef } from "react";

export const ChatContext = createContext();

export const ChatProvider = ({ children, user }) => {
  const [messages, setMessages] = useState([]);   // store chat messages
  const [input, setInput] = useState("");         // current input text
  const [showEmoji, setShowEmoji] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const chatRef = useRef(null);                   // for auto-scroll

  return (
    <ChatContext.Provider
      value={{
        user,                // user object for DB requests
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

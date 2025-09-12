// src/context/ChatContext.jsx
import { createContext, useState, useEffect, useRef } from "react";

export const ChatContext = createContext();

export const ChatProvider = ({ children, user }) => {
  // If no user, create a guest user object
  const safeUser = user || { id: "guest", username: "Guest" };

  const [messages, setMessages] = useState([]);     // chat history
  const [input, setInput] = useState("");           // current input
  const [showEmoji, setShowEmoji] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const chatRef = useRef(null);

  // Fetch chat history when user logs in (or guest)
  useEffect(() => {
    if (!safeUser?.id) return;

    const fetchMessages = async () => {
      try {
        const res = await fetch("/api/chat/messages", {
          credentials: "include", // send cookies/session
        });

        if (!res.ok) throw new Error("Failed to fetch messages");

        const data = await res.json();
        setMessages(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error fetching messages:", err);
      }
    };

    fetchMessages();

    // Optional: refresh messages every 5s
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [safeUser]);

  // Send message safely
  const sendMessage = async (roomId = null) => {
    if (!input.trim() || !safeUser?.id) return;

    try {
      const payload = {
        content: input,
        senderId: safeUser.id,
      };
      if (roomId) payload.roomId = roomId;

      const res = await fetch("/api/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to send message");

      const msg = await res.json();
      setMessages((prev) => [...prev, msg]);
      setInput("");
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  return (
    <ChatContext.Provider
      value={{
        user: safeUser,
        messages,
        setMessages,
        input,
        setInput,
        sendMessage,
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

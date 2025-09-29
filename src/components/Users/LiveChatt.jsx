// src/components/Users/LiveChat.jsx
import React, { useContext, useEffect, useRef, useState } from "react";
import Picker from "emoji-picker-react";
import { ChatContext } from "../../context/ChatContext";

export default function LiveChat() {
  const {
    userId,        // from ChatContext
    messages,
    setMessages,
    input,
    setInput,
    showEmoji,
    setShowEmoji,
    minimized,
    setMinimized,
    chatRef,
  } = useContext(ChatContext);

  const [loading, setLoading] = useState(true);

  // Fetch messages from backend on mount
  useEffect(() => {
    if (!userId) return;

    const fetchMessages = async () => {
      try {
        const res = await fetch(`/api/chat/${userId}`, {
          method: "GET",
          credentials: "include",
          headers: { "Cache-Control": "no-store" },
        });
        if (res.ok) {
          const data = await res.json();
          setMessages(data);
        } else {
          console.error("Failed to fetch chat messages");
        }
      } catch (err) {
        console.error("Error fetching chat messages:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [userId, setMessages]);

  // Send a new message
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const msg = {
      id: Date.now(),
      userId,
      text: input,
      from: "user",
      createdAt: new Date().toISOString(),
    };

    // Optimistic update
    setMessages((prev) => [...prev, msg]);
    setInput("");

    try {
      await fetch(`/api/chat/${userId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(msg),
      });
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  };

  const onEmojiClick = (emojiObject) => {
    setInput((prev) => prev + emojiObject.emoji);
    setShowEmoji(false);
  };

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages, chatRef]);

  // Loading state
  if (loading) {
    return (
      <div className="fixed bottom-4 right-4 z-50 p-4 bg-gray-700 text-white rounded-lg">
        Loading chat...
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end space-y-2">
      {minimized ? (
        <div
          onClick={() => setMinimized(false)}
          className="cursor-pointer px-2 py-1 bg-gray-700 text-white rounded-lg"
        >
          💬 Need Help?
        </div>
      ) : (
        <div className="w-96 bg-gray-900 text-white rounded-2xl shadow-lg flex flex-col">
          <div ref={chatRef} className="h-80 overflow-y-auto p-3 space-y-2">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`px-4 py-2 rounded-2xl max-w-xs break-words ${
                    msg.from === "user" ? "bg-red-500" : "bg-green-500"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
          </div>

          <form className="flex p-2" onSubmit={sendMessage}>
            <button type="button" onClick={() => setShowEmoji(!showEmoji)}>😀</button>
            {showEmoji && <Picker onEmojiClick={onEmojiClick} />}
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message..."
              className="flex-grow px-2 mx-2 rounded-lg text-black"
            />
            <button type="submit" className="bg-red-500 px-3 rounded-lg">Send</button>
          </form>
        </div>
      )}
    </div>
  );
}

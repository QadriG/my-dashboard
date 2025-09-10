// src/components/Users/LiveChat.jsx
import React, { useContext, useRef, useEffect } from "react";
import Picker from "emoji-picker-react";
import { ChatContext } from "../../context/ChatContext";
import io from "socket.io-client";

// Initialize socket outside component
const socket = io("http://localhost:5001", {
  withCredentials: true,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

export default function LiveChat() {
  const {
    user,
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

  const fileInputRef = useRef(null);

  // Connect socket only after user exists
  useEffect(() => {
    if (!user?.id) return;

    socket.emit("joinUser", { userId: user.id, username: user.name });

    socket.on("message", (msg) => setMessages((prev) => [...prev, msg]));

    return () => {
      socket.off("message");
    };
  }, [user, setMessages]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!input.trim() || !user?.id) return;

    const msg = {
      from: "user",
      userId: user.id,
      text: input,
      id: Date.now(),
    };

    socket.emit("message", msg);
    setMessages((prev) => [...prev, msg]);
    setInput("");
  };

  const onEmojiClick = (emojiObject) => {
    setInput((prev) => prev + emojiObject.emoji);
    setShowEmoji(false);
  };

  // Auto scroll
  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages, chatRef]);

  if (!user?.id) {
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
            <button type="button" onClick={() => setShowEmoji(!showEmoji)}>
              😀
            </button>
            {showEmoji && <Picker onEmojiClick={onEmojiClick} />}
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message..."
              className="flex-grow px-2 mx-2 rounded-lg"
            />
            <button type="submit" className="bg-red-500 px-3 rounded-lg">
              Send
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

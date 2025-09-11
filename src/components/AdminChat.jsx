// AdminChat.jsx
import React, { useContext, useState, useEffect, useRef } from "react";
import Picker from "emoji-picker-react";
import { ChatContext } from "../context/ChatContext";
import io from "socket.io-client";

// ✅ Socket initialized outside component
const socket = io("http://localhost:5001", {
  withCredentials: true,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

export default function AdminChat({ adminId }) {
  const { messages, setMessages, input, setInput, showEmoji, setShowEmoji, chatRef } =
    useContext(ChatContext);

  const [requests, setRequests] = useState([]);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [minimized, setMinimized] = useState(false);

  // 🔹 Join admin & listen to events
  useEffect(() => {
    if (!adminId) return;

    socket.emit("joinAdmin", { adminId });

    socket.on("newChatRequest", (req) => setRequests((prev) => [...prev, req]));
    socket.on("message", (msg) => {
      if (msg.roomId === currentRoom) setMessages((prev) => [...prev, msg]);
    });

    return () => {
      socket.off("newChatRequest");
      socket.off("message");
    };
  }, [adminId, currentRoom, setMessages]);

  // 🔹 Assign session
  const assignToMe = (userId) => {
    if (!adminId) return;
    const roomId = `room_${userId}`;
    socket.emit("assignSession", { userId, agentId: adminId });
    setCurrentRoom(roomId);
    setRequests((prev) => prev.filter((r) => r.userId !== userId));
    setMessages([]);
    setMinimized(false); // auto-open chat when assigned
  };

  // 🔹 Send message
  const sendMessage = (e) => {
    e.preventDefault();
    if (!input.trim() || !currentRoom) return;

    const msg = { from: "admin", text: input, id: Date.now(), roomId: currentRoom };
    socket.emit("message", msg);
    setMessages((prev) => [...prev, msg]);
    setInput("");
  };

  // 🔹 Auto-scroll
  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages, chatRef]);

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96">
      {/* Toggle Button */}
      <button
        onClick={() => setMinimized(!minimized)}
        className="bg-blue-600 text-white px-4 py-2 rounded-t-xl w-full shadow-lg"
      >
        {minimized ? "Open Admin Chat" : "Minimize Admin Chat"}
      </button>

      {/* Chat Box */}
      {!minimized && (
        <div className="bg-white rounded-b-xl shadow-lg flex flex-col h-[500px]">
          {/* Requests */}
          {!currentRoom && (
            <div className="p-3 border-b border-gray-300">
              <h2 className="font-bold mb-2">Pending Requests</h2>
              {requests.length === 0 ? (
                <p className="text-gray-600 text-sm">No pending requests</p>
              ) : (
                requests.map((req) => (
                  <div
                    key={req.userId}
                    className="flex justify-between items-center p-2 bg-gray-100 rounded-lg mb-2"
                  >
                    <span>{req.username}</span>
                    <button
                      onClick={() => assignToMe(req.userId)}
                      className="bg-blue-500 text-white px-2 py-1 rounded-lg"
                    >
                      Assign
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Chat Messages */}
          {currentRoom && (
            <>
              <div
                ref={chatRef}
                className="flex-1 overflow-y-auto p-3 space-y-2 bg-gray-50"
              >
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.from === "admin" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`px-4 py-2 rounded-2xl max-w-xs break-words ${
                        msg.from === "admin" ? "bg-blue-500" : "bg-green-500"
                      } text-white`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>

              {/* Input Box */}
              <form className="flex items-center p-2 border-t border-gray-300" onSubmit={sendMessage}>
                <button type="button" onClick={() => setShowEmoji(!showEmoji)}>
                  😀
                </button>
                {showEmoji && (
                  <Picker
                    onEmojiClick={(e) => {
                      setInput((prev) => prev + e.emoji);
                      setShowEmoji(false);
                    }}
                  />
                )}
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-grow px-3 py-2 rounded-lg mx-2 border border-gray-300"
                />
                <button
                  type="submit"
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg"
                >
                  Send
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </div>
  );
}

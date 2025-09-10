import React, { useContext, useState, useEffect, useRef } from "react";
import Picker from "emoji-picker-react";
import { ChatContext } from "../context/ChatContext";
import io from "socket.io-client";

// Initialize socket outside
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

  const assignToMe = (userId) => {
    if (!adminId) return;

    const roomId = `room_${userId}`;
    socket.emit("assignSession", { userId, agentId: adminId });
    setCurrentRoom(roomId);
    setRequests((prev) => prev.filter((r) => r.userId !== userId));
    setMessages([]);
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (!input.trim() || !currentRoom) return;

    const msg = { from: "admin", text: input, id: Date.now(), roomId: currentRoom };
    socket.emit("message", msg);
    setMessages((prev) => [...prev, msg]);
    setInput("");
  };

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages, chatRef]);

  return (
    <div className="p-4 flex space-x-6">
      {/* Pending Requests */}
      <div className="w-64 bg-gray-200 p-3 rounded-xl shadow-lg">
        <h2 className="font-bold mb-2">Pending Requests</h2>
        {requests.length === 0 ? (
          <p className="text-gray-600">No pending requests</p>
        ) : (
          requests.map((req) => (
            <div
              key={req.userId}
              className="flex justify-between items-center p-2 bg-gray-300 rounded-lg mb-2"
            >
              <span>{req.username}</span>
              <button
                onClick={() => assignToMe(req.userId)}
                className="bg-blue-500 text-white px-2 py-1 rounded-lg"
              >
                Assign to Me
              </button>
            </div>
          ))
        )}
      </div>

      {/* Chat Window */}
      {currentRoom && (
        <div className="flex-1 flex flex-col bg-gray-100 rounded-2xl shadow-lg p-3">
          <div
            ref={chatRef}
            className="flex-1 overflow-y-auto p-3 space-y-2 bg-gray-50 rounded-2xl"
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

          <form className="flex items-center mt-2" onSubmit={sendMessage}>
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
              className="flex-grow px-3 py-2 rounded-2xl mx-2"
            />
            <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded-2xl">
              Send
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

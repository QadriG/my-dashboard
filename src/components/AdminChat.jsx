// src/components/AdminChat.jsx
import React, { useContext, useState, useEffect } from "react";
import Picker from "emoji-picker-react";
import { ChatContext } from "../context/ChatContext";

export default function AdminChat({ adminId }) {
  const {
    user,          // admin object from ChatProvider
    messages,
    input,
    setInput,
    sendMessage,
    showEmoji,
    setShowEmoji,
    chatRef,
  } = useContext(ChatContext);

  const [requests, setRequests] = useState([]);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [minimized, setMinimized] = useState(false);

  // 🔹 Fetch pending requests periodically
  useEffect(() => {
    if (!adminId) return;

    const fetchRequests = async () => {
      try {
        const res = await fetch("/api/chat/requests", { credentials: "include" });
        if (!res.ok) throw new Error("Failed to fetch requests");
        const data = await res.json();
        setRequests(data.requests || []);
      } catch (err) {
        console.error("Failed to fetch requests", err);
      }
    };

    fetchRequests();
    const interval = setInterval(fetchRequests, 5000);
    return () => clearInterval(interval);
  }, [adminId]);

  // 🔹 Assign session
  const assignToMe = async (userId) => {
    try {
      const res = await fetch("/api/chat/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ userId, agentId: adminId }),
      });
      if (!res.ok) throw new Error("Failed to assign session");
      const data = await res.json();
      setCurrentRoom(data.roomId || null);
      setRequests((prev) => prev.filter((r) => r.userId !== userId));
      setMinimized(false);
    } catch (err) {
      console.error("Failed to assign session", err);
    }
  };

  // 🔹 Auto-scroll on messages
  useEffect(() => {
    if (chatRef?.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages, chatRef]);

  if (!user) return null; // Ensure admin exists

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96">
      {/* Toggle */}
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
                    <span>{req.username || "Unknown User"}</span>
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

          {/* Messages */}
          {currentRoom && (
            <>
              <div
                ref={chatRef}
                className="flex-1 overflow-y-auto p-3 space-y-2 bg-gray-50"
              >
                {Array.isArray(messages) && messages.map((msg) => (
                  <div
                    key={msg.id || Math.random()}
                    className={`flex ${msg.senderId === user.id ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`px-4 py-2 rounded-2xl max-w-xs break-words ${
                        msg.senderId === user.id ? "bg-blue-500" : "bg-green-500"
                      } text-white`}
                    >
                      {msg.content || ""}
                    </div>
                  </div>
                ))}
              </div>

              {/* Input */}
              <form
                className="flex items-center p-2 border-t border-gray-300"
                onSubmit={(e) => {
                  e.preventDefault();
                  sendMessage(currentRoom);
                }}
              >
                <button type="button" onClick={() => setShowEmoji(!showEmoji)}>😀</button>
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

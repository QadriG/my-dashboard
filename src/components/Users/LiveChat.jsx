// src/components/Users/LiveChat.jsx
import React, { useContext, useEffect } from "react";
import Picker from "emoji-picker-react";
import { ChatContext } from "../../context/ChatContext";

export default function LiveChat() {
  const {
    user,
    messages = [],
    input,
    setInput,
    sendMessage,
    showEmoji,
    setShowEmoji,
    minimized,
    setMinimized,
    chatRef,
  } = useContext(ChatContext);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (chatRef?.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages, chatRef]);

  const onEmojiClick = (emojiObject) => {
    setInput?.((prev) => prev + emojiObject.emoji);
    setShowEmoji?.(false);
  };

  // If no user and messages are empty, show minimized guest chat
  if (!user) {
    return (
      <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end">
        <div
          onClick={() => setMinimized?.(false)}
          className="cursor-pointer px-2 py-1 bg-gray-700 text-white rounded-lg"
        >
          💬 Chat (Guest)
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end space-y-2">
      {minimized ? (
        <div
          onClick={() => setMinimized(true)}
          className="cursor-pointer px-2 py-1 bg-gray-700 text-white rounded-lg"
        >
          💬 Need Help?
        </div>
      ) : (
        <div className="w-96 bg-gray-900 text-white rounded-2xl shadow-lg flex flex-col">
          {/* Messages */}
          <div ref={chatRef} className="h-80 overflow-y-auto p-3 space-y-2">
            {messages.map((msg) => (
              <div
                key={msg.id || Math.random()}
                className={`flex ${
                  msg.senderId === user.id ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`px-4 py-2 rounded-2xl max-w-xs break-words ${
                    msg.senderId === user.id ? "bg-red-500" : "bg-green-500"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          <form
            className="flex p-2"
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage?.();
            }}
          >
            <button
              type="button"
              onClick={() => setShowEmoji?.(!showEmoji)}
              className="mr-2"
            >
              😀
            </button>
            {showEmoji && <Picker onEmojiClick={onEmojiClick} />}
            <input
              type="text"
              value={input || ""}
              onChange={(e) => setInput?.(e.target.value)}
              placeholder="Type a message..."
              className="flex-grow px-2 mx-2 rounded-lg text-black"
            />
            <button
              type="submit"
              className="bg-red-500 px-3 rounded-lg"
            >
              Send
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

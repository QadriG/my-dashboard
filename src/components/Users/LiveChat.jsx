import React, { useContext, useRef, useEffect } from "react";
import Picker from "emoji-picker-react";
import { ChatContext } from "../../context/ChatContext";

export default function LiveChat() {
  const {
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

  const sendMessage = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    setMessages([...messages, { from: "user", text: input }]);
    setInput("");
  };

  const onEmojiClick = (emojiObject) => {
    setInput((prev) => prev + emojiObject.emoji);
    setShowEmoji(false);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setMessages([...messages, { from: "user", text: `📎 File: ${file.name}` }]);
    }
  };

  const handlePaste = (e) => {
    if (e.clipboardData.files.length > 0) {
      const file = e.clipboardData.files[0];
      setMessages([...messages, { from: "user", text: `📷 Screenshot: ${file.name}` }]);
    }
  };

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end space-y-1">
      {minimized && (
        <div
          onClick={() => setMinimized(false)}
          className="bg-cyan-600 text-white px-4 py-2 rounded-lg shadow-lg cursor-pointer animate-bump"
        >
          💬 Need Help?
        </div>
      )}

      <div
  className="w-96 bg-gray-200 dark:bg-gray-800 text-black dark:text-white px-4 py-2 rounded-t-lg cursor-pointer flex justify-between items-center shadow-lg"
  onClick={() => setMinimized(!minimized)}
>
  <span>Live Chat</span>
  <span className="text-lg">{minimized ? "▲" : "▼"}</span>
</div>


      {!minimized && (
        <div
          className="w-96 bg-gray-900 text-white shadow-lg border border-cyan-400 rounded-b-lg"
          onPaste={handlePaste}
        >
          <div
            ref={chatRef}
            className="h-80 overflow-y-auto p-3 space-y-2 bg-black"
          >
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`px-4 py-2 rounded-lg max-w-xs ${
                    msg.from === "user"
                      ? "bg-red-600 text-white"
                      : "bg-blue-600 text-white"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
          </div>

          <form
            onSubmit={sendMessage}
            className="flex items-center border-t border-gray-700 relative"
          >
            <button
              type="button"
              className="px-2 text-xl"
              onClick={() => setShowEmoji(!showEmoji)}
            >
              😀
            </button>
            {showEmoji && (
              <div className="absolute bottom-16 right-0 z-50">
                <Picker onEmojiClick={onEmojiClick} theme="dark" />
              </div>
            )}

            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message..."
              className="flex-grow bg-gray-800 px-3 py-2 focus:outline-none"
            />

            <button
              type="button"
              className="px-2"
              onClick={() => fileInputRef.current.click()}
            >
              📎
            </button>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              onChange={handleFileUpload}
            />

            <button type="submit" className="bg-red-600 px-4 py-2">
              Send
            </button>
          </form>
        </div>
      )}

      <style>
        {`
          @keyframes bump {
            0%, 100% { transform: translateY(0); }
            25% { transform: translateY(-4px); }
            50% { transform: translateY(2px); }
            75% { transform: translateY(-2px); }
          }
          .animate-bump {
            animation: bump 1s ease-in-out infinite;
          }
        `}
      </style>
    </div>
  );
}
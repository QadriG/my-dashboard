// hooks/useSocket.js
import { useEffect, useState } from "react";
import { io } from "socket.io-client";

export function useSocket(url, options = {}) {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const s = io(url, { withCredentials: true, ...options });
    setSocket(s);
    return () => s.disconnect();
  }, [url, JSON.stringify(options)]);

  return socket;
}

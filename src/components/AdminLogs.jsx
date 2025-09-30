// components/AdminLogs.jsx
import { useEffect, useState, useMemo } from "react";
import { useSocket } from "../hooks/useSocket";

export default function AdminLogs({ filters }) {
  const socket = useSocket("http://localhost:5000");
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    if (!socket) return;

    socket.on("logs", (newLog) => {
      setLogs((prev) => [newLog, ...prev].slice(0, 1000)); // keep latest 1000 logs
    });

    return () => socket.off("logs");
  }, [socket]);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (!filters) return true;
      if (filters.user && log.user !== filters.user) return false;
      if (filters.exchange && log.exchange !== filters.exchange) return false;
      return true;
    });
  }, [logs, filters]);

  return (
    <table className="w-full table-fixed border-collapse">
      <thead>
        <tr>
          <th>User</th>
          <th>Exchange</th>
          <th>Symbol</th>
          <th>Log</th>
          <th>Time</th>
        </tr>
      </thead>
      <tbody>
        {filteredLogs.map((log, idx) => (
          <tr key={idx}>
            <td>{log.user}</td>
            <td>{log.exchange}</td>
            <td>{log.symbol}</td>
            <td>{log.log}</td>
            <td>{log.createdAt}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

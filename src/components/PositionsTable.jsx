// components/PositionsTable.jsx
import { useEffect, useState, useMemo } from "react";
import { useSocket } from "../hooks/useSocket";

export default function PositionsTable({ userId, isAdmin = false, filters }) {
  const socket = useSocket("http://localhost:5000");
  const [positions, setPositions] = useState([]);

  useEffect(() => {
    if (!socket) return;

    const channel = isAdmin ? "positions/all" : `positions/${userId}`;
    socket.on(channel, (data) => {
      setPositions((prev) => {
        // merge or update positions
        const updated = [...prev];
        data.forEach((pos) => {
          const idx = updated.findIndex((p) => p.id === pos.id);
          if (idx > -1) updated[idx] = pos;
          else updated.push(pos);
        });
        return updated;
      });
    });

    return () => socket.off(channel);
  }, [socket, userId, isAdmin]);

  // Apply filters
  const filteredPositions = useMemo(() => {
    return positions.filter((pos) => {
      if (!filters) return true;
      if (filters.status && pos.status !== filters.status) return false;
      if (filters.symbol && pos.symbol !== filters.symbol) return false;
      return true;
    });
  }, [positions, filters]);

  return (
    <table className="w-full table-fixed border-collapse">
      <thead>
        <tr>
          <th>ID</th>
          <th>Symbol</th>
          <th>Side</th>
          <th>Qty</th>
          <th>Entry</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {filteredPositions.map((pos) => (
          <tr key={pos.id}>
            <td>{pos.id}</td>
            <td>{pos.symbol}</td>
            <td>{pos.side}</td>
            <td>{pos.qty}</td>
            <td>{pos.entryPrice}</td>
            <td>{pos.status}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

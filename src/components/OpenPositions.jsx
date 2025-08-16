import React from "react";
export default function OpenPositions() {
  return (
    <div className="dashboard-column open-positions p-4 text-center border-emerald-400">
  <h2 className="text-lg font-semibold mb-4 text-white drop-shadow">
    Active Positions
  </h2>
  <table className="min-w-full table-auto text-sm text-left text-white">
    <thead className="bg-gray-800 font-semibold">
      <tr>
        <th className="p-2">ID</th>
        <th className="p-2">Symbol</th>
        <th className="p-2">Side</th>
        <th className="p-2">Amount</th>
        <th className="p-2">Order Value</th>
        <th className="p-2">Open Price</th>
        <th className="p-2">Status</th>
        <th className="p-2">Open Date</th>
      </tr>
    </thead>
        <tbody className="divide-y divide-gray-700">
          <tr>
            <td className="p-2"><span className="bg-red-600 text-white px-2 py-1 rounded">2S</span></td>
            <td className="p-2">XMR/USDT:USDT</td>
            <td className="p-2"><span className="bg-red-600 text-white px-2 py-1 rounded">Short</span></td>
            <td className="p-2">0.0800</td>
            <td className="p-2">0.0000</td>
            <td className="p-2">328.8800</td>
            <td className="p-2 text-green-400">Open</td>
            <td className="p-2">03/25/2025</td>
          </tr>
          <tr>
            <td className="p-2"><span className="bg-green-600 text-white px-2 py-1 rounded">1L</span></td>
            <td className="p-2">UNI/USDT:USDT</td>
            <td className="p-2"><span className="bg-green-600 text-white px-2 py-1 rounded">Long</span></td>
            <td className="p-2">2.7000</td>
            <td className="p-2">0.0000</td>
            <td className="p-2">10.5086</td>
            <td className="p-2 text-green-400">Open</td>
            <td className="p-2">05/13/2025</td>
          </tr>
          <tr>
            <td className="p-2"><span className="bg-green-600 text-white px-2 py-1 rounded">1L</span></td>
            <td className="p-2">AVAX/USDT:USDT</td>
            <td className="p-2"><span className="bg-green-600 text-white px-2 py-1 rounded">Long</span></td>
            <td className="p-2">1.1000</td>
            <td className="p-2">0.0000</td>
            <td className="p-2">25.9260</td>
            <td className="p-2 text-green-400">Open</td>
            <td className="p-2">06/07/2023</td>
          </tr>
          <tr>
            <td className="p-2"><span className="bg-red-600 text-white px-2 py-1 rounded">2S</span></td>
            <td className="p-2">1000PEPE/USDT:USDT</td>
            <td className="p-2"><span className="bg-red-600 text-white px-2 py-1 rounded">Short</span></td>
            <td className="p-2">2100.0000</td>
            <td className="p-2">0.0000</td>
            <td className="p-2">0.0130</td>
            <td className="p-2 text-green-400">Open</td>
            <td className="p-2">06/07/2023</td>
          </tr>
          <tr>
            <td className="p-2"><span className="bg-green-600 text-white px-2 py-1 rounded">1L</span></td>
            <td className="p-2">XRP/USDT:USDT</td>
            <td className="p-2"><span className="bg-green-600 text-white px-2 py-1 rounded">Long</span></td>
            <td className="p-2">10.0000</td>
            <td className="p-2">0.0000</td>
            <td className="p-2">3.4871</td>
            <td className="p-2 text-green-400">Open</td>
            <td className="p-2">06/07/2023</td>
          </tr>
          <tr>
            <td className="p-2"><span className="bg-red-600 text-white px-2 py-1 rounded">2S</span></td>
            <td className="p-2">SOL/USDT:USDT</td>
            <td className="p-2"><span className="bg-red-600 text-white px-2 py-1 rounded">Short</span></td>
            <td className="p-2">0.1000</td>
            <td className="p-2">0.0000</td>
            <td className="p-2">187.6700</td>
            <td className="p-2 text-green-400">Open</td>
            <td className="p-2">06/07/2023</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
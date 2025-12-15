import { useEffect, useState } from "react";
import { API_URL } from "../config/api";

export default function Dashboard({ user, onLogout }) {
  const [data, setData] = useState({});
  const [selectedNode, setSelectedNode] = useState("");
  const [temp, setTemp] = useState("");
  const [gas, setGas] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      fetch(`${API_URL}/realtime`)
        .then((res) => res.json())
        .then(setData);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const sendCommand = (action) => {
    fetch(`${API_URL}/command`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        device: selectedNode,
        action,
      }),
    });
  };

  const setLimits = () => {
    fetch(`${API_URL}/set_limits`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        device: selectedNode,
        temp_th: Number(temp),
        gas_th: Number(gas),
      }),
    });
  };

  return (
    <div style={{ padding: 30 }}>
      <h2>Welcome {user.username}</h2>
      <button onClick={onLogout}>Logout</button>

      <hr />

      <h3>Realtime Data</h3>
      <pre>{JSON.stringify(data, null, 2)}</pre>

      <hr />

      <h3>Device Control</h3>
      <input
        placeholder="Device name (e.g. ESP32-1)"
        value={selectedNode}
        onChange={(e) => setSelectedNode(e.target.value)}
      />

      <br /><br />

      <button onClick={() => sendCommand("turn on")}>Turn ON</button>
      <button onClick={() => sendCommand("turn off")}>Turn OFF</button>

      <hr />

      <h3>Set Limits</h3>
      <input
        placeholder="Temp Threshold"
        value={temp}
        onChange={(e) => setTemp(e.target.value)}
      />
      <br /><br />
      <input
        placeholder="Gas Threshold"
        value={gas}
        onChange={(e) => setGas(e.target.value)}
      />
      <br /><br />

      <button onClick={setLimits}>Update Limits</button>
    </div>
  );
}

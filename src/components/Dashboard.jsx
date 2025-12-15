import React from "react";

export default function Dashboard({ user, data, history, logout, sendCommand, updateLimits, goUsers }) {
  const nodes = Object.keys(data); // assuming data is { node1: {...}, node2: {...} }

  return (
    <div style={{ padding: "20px" }}>
      <h1>Welcome, {user.name}</h1>
      <button onClick={logout} style={{ marginBottom: "20px" }}>Logout</button>
      {user.role === "admin" && (
        <button onClick={goUsers} style={{ marginLeft: "10px", marginBottom: "20px" }}>Manage Users</button>
      )}

      {nodes.map(node => (
        <div key={node} style={{ border: "1px solid #ccc", padding: "15px", marginBottom: "15px" }}>
          <h2>{node}</h2>
          <p>Temperature: {data[node].temperature}</p>
          <p>Gas: {data[node].gas}</p>

          {/* LED button */}
          <button
            onClick={() => sendCommand(node, "led")}
            style={{ padding: "10px 18px", marginRight: "10px", cursor: "pointer" }}
          >
            Toggle LED
          </button>

          {/* Fan button */}
          <button
            onClick={() => sendCommand(node, "fan")}
            style={{ padding: "10px 18px", marginRight: "10px", cursor: "pointer" }}
          >
            Toggle Fan
          </button>

          {/* Limit inputs */}
          <div style={{ marginTop: "10px" }}>
            <input
              id={`${node}-temp-limit`}
              type="number"
              placeholder="Temp limit"
              style={{ marginRight: "10px", padding: "5px" }}
              defaultValue={data[node].temp_limit || 50}
            />
            <input
              id={`${node}-gas-limit`}
              type="number"
              placeholder="Gas limit"
              style={{ marginRight: "10px", padding: "5px" }}
              defaultValue={data[node].gas_limit || 100}
            />
            <button
              onClick={() => updateLimits(node)}
              style={{ padding: "10px 18px", cursor: "pointer" }}
            >
              Set Limits
            </button>
          </div>
        </div>
      ))}

      {/* Optional: History table */}
      <h3>History</h3>
      <pre>{JSON.stringify(history, null, 2)}</pre>
    </div>
  );
}

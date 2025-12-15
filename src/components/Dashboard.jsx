import GraphCard from "./GraphCard";

export default function Dashboard({ user, data, history, logout, sendCommand, updateLimits, goUsers }) {
  const cardStyle = (device) => {
    let bg = "#ffffff";
    if (device.ao_v > device.gas_th) bg = "#ffe0e0";
    if (device.t > device.temp_th) bg = "#ffe9d6";
    return {
      width: "360px",
      background: bg,
      borderRadius: "18px",
      padding: "22px",
      margin: "20px",
      boxShadow: "0px 10px 25px rgba(0,0,0,0.1)",
      color: "#1a1a1a",
      fontWeight: "500",
      transition: "0.3s",
    };
  };

  const buttonStyle = {
    padding: "10px 16px",
    borderRadius: "8px",
    border: "none",
    cursor: "pointer",
    marginRight: "10px",
    marginTop: "10px",
    fontWeight: "600",
  };

  return (
    <div style={{ fontFamily: "Arial, sans-serif", padding: "40px", background: "#f5f5f7", minHeight: "100vh" }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <h1 style={{ marginBottom: "30px", color: "#1e90ff" }}>🌐 Smart IoT Dashboard</h1>
        <div style={{ textAlign: "right", marginRight: "20px" }}>
          <p>Logged in as: <strong style={{ color: "#1e90ff" }}>{user.username}</strong> ({user.role})</p>
          {user.role === "admin" && (
            <button onClick={goUsers} style={{ marginTop: "10px", marginRight: "10px", padding: "8px 12px", background: "#17a2b8", color: "white", border: "none", borderRadius: "6px", cursor: "pointer" }}>
              👤 User Management
            </button>
          )}
          <button onClick={logout} style={{ marginTop: "10px", padding: "8px 12px", background: "#dc3545", color: "white", border: "none", borderRadius: "6px", cursor: "pointer" }}>
            Logout
          </button>
        </div>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center" }}>
        {Object.keys(data).length === 0 && <p>Waiting for data...</p>}
        {Object.keys(data).map((node) => {
          const d = data[node];
          return (
            <div key={node} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={cardStyle(d)}>
                <h2>{node}</h2>
                <p><strong>Time:</strong> {d.time}</p>
                <p><strong>Temp:</strong> {d.t}°C {d.t > d.temp_th && <span style={{ color: "red" }}>🔥 HIGH</span>}</p>
                <p><strong>Humidity:</strong> {d.h}%</p>
                <p><strong>LED:</strong> {d.led === "ON" ? "🟢 ON" : "⚪ OFF"}</p>
                <p><strong>Fan:</strong> {d.fan === "ON" ? "🟢 ON" : "⚪ OFF"}</p>
                <p><strong>Gas Voltage:</strong> {d.ao_v}V {d.ao_v > d.gas_th && <span style={{ color: "red" }}>⚠️ GAS ALERT</span>}</p>

                {user.role === "admin" && (
                  <>
                    <label>
                      New Temp Limit:
                      <input id={`${node}-temp-limit`} type="number" defaultValue={d.temp_th} step="0.1" />
                    </label>
                    <label>
                      New Gas Limit:
                      <input id={`${node}-gas-limit`} type="number" defaultValue={d.gas_th} step="0.01" />
                    </label>
                    <button onClick={() => updateLimits(node)} style={{ ...buttonStyle, background: "#007bff", color: "white" }}>Save Limits</button>
                    <h3>Controls</h3>
                    <button onClick={() => sendCommand(node, "LED_ON")} style={{ ...buttonStyle, background: "#28a745", color: "white" }}>LED ON</button>
                    <button onClick={() => sendCommand(node, "LED_OFF")} style={{ ...buttonStyle, background: "#dc3545", color: "white" }}>LED OFF</button>
                    <button onClick={() => sendCommand(node, "FAN_ON")} style={{ ...buttonStyle, background: "#17a2b8", color: "white" }}>FAN ON</button>
                    <button onClick={() => sendCommand(node, "FAN_OFF")} style={{ ...buttonStyle, background: "#6c757d", color: "white" }}>FAN OFF</button>
                  </>
                )}
              </div>

              {history[node] && <GraphCard title="Temperature (°C)" labels={history[node].time} data={history[node].temp} color="#ff5733" />}
              {history[node] && <GraphCard title="Gas Voltage (V)" labels={history[node].time} data={history[node].gas} color="#3366ff" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

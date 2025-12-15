export default function Dashboard({
  user,
  data,
  logout,
  sendCommand,
  updateLimits,
  goUsers,
}) {
  return (
    <div style={{ padding: 30 }}>
      <h1>🌐 IoT Dashboard</h1>

      <p>
        Logged in as <b>{user.username}</b> ({user.role})
      </p>

      {user.role === "admin" && (
        <button onClick={goUsers}>User Management</button>
      )}
      <button onClick={logout}>Logout</button>

      <hr />

      {Object.keys(data).length === 0 && <p>No data yet...</p>}

      {Object.entries(data).map(([node, d]) => (
        <div key={node} style={{ border: "1px solid #ccc", margin: 10, padding: 10 }}>
          <h3>{node}</h3>
          <p>Temp: {d.t} °C</p>
          <p>Humidity: {d.h} %</p>
          <p>Gas: {d.ao_v} V</p>

          {user.role === "admin" && (
            <>
              <input id={`${node}-temp-limit`} defaultValue={d.temp_th} />
              <input id={`${node}-gas-limit`} defaultValue={d.gas_th} />
              <br />
              <button onClick={() => updateLimits(node)}>Save Limits</button>
              <br /><br />
              <button onClick={() => sendCommand(node, "LED_ON")}>LED ON</button>
              <button onClick={() => sendCommand(node, "LED_OFF")}>LED OFF</button>
            </>
          )}
        </div>
      ))}
    </div>
  );
}

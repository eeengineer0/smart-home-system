import { useState, useEffect } from "react";
import Login from "./components/Login.jsx";
import Dashboard from "./components/Dashboard.jsx";
import UserManager from "./components/UserManager.jsx";

// Make sure VITE_API_BASE_URL is set in .env as your backend URL
const API = import.meta.env.VITE_API_BASE_URL;

export default function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("dashboard");
  const [data, setData] = useState({});
  const [history, setHistory] = useState({});

  // Restore login on refresh
  useEffect(() => {
    const saved = localStorage.getItem("user");
    if (saved) setUser(JSON.parse(saved));
  }, []);

  // Poll data every 2 seconds
  useEffect(() => {
    if (!user) return;

    const fetchData = () => {
      // ✅ Real-time data
      fetch(`${API}/data`) // replace /data if your backend uses /realtime or other
        .then(res => {
          if (!res.ok) throw new Error("Data fetch failed");
          return res.json();
        })
        .then(newData => setData(newData))
        .catch(err => console.error("Data fetch error:", err));

      // ✅ History data
      fetch(`${API}/history`)
        .then(res => {
          if (!res.ok) throw new Error("History fetch failed");
          return res.json();
        })
        .then(newHistory => setHistory(newHistory))
        .catch(err => console.error("History fetch error:", err));
    };

    fetchData(); // Initial fetch
    const interval = setInterval(fetchData, 2000);
    return () => clearInterval(interval);
  }, [user]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
  };

  const sendCommand = (node, command) => {
    fetch(`${API}/command`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ node, command }),
    })
      .then(res => res.json())
      .then(console.log)
      .catch(err => console.error("Command error:", err));
  };

  const updateLimits = (node) => {
    const tempLimit = parseFloat(document.getElementById(`${node}-temp-limit`).value);
    const gasLimit = parseFloat(document.getElementById(`${node}-gas-limit`).value);

    fetch(`${API}/update_limits`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ node, temp_th: tempLimit, gas_th: gasLimit }),
    })
      .then(res => {
        if (!res.ok) throw new Error("Update limits failed");
        alert("Limits updated!");
      })
      .catch(err => console.error(err));
  };

  if (!user) return <Login setUser={setUser} />;

  return (
    <div>
      {page === "dashboard" && (
        <Dashboard
          user={user}
          data={data}
          history={history}
          logout={handleLogout}
          sendCommand={sendCommand}
          updateLimits={updateLimits}
          goUsers={() => setPage("users")}
        />
      )}

      {page === "users" && user.role === "admin" && (
        <UserManager goBack={() => setPage("dashboard")} />
      )}
    </div>
  );
}

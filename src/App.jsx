import { useState, useEffect } from "react";
import Login from "./Login";
import Dashboard from "./Dashboard";
import UserManager from "./UserManager";

const API = import.meta.env.VITE_API_BASE_URL;

export default function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("dashboard");
  const [data, setData] = useState({});
  const [history, setHistory] = useState({});

  // Restore login on refresh
  useEffect(() => {
    const saved = localStorage.getItem("user");
    if (saved) {
      setUser(JSON.parse(saved));
    }
  }, []);

  // Poll Data (Runs every 2 seconds when logged in)
  useEffect(() => {
    if (!user) return;

    const fetchData = () => {
      // 1. Fetch Real-time Data
      fetch(`${API}/data`)
        .then((res) => res.json())
        .then((newData) => setData(newData))
        .catch((err) => console.error("Data fetch error:", err));

      // 2. Fetch History Data (Graph)
      fetch(`${API}/history`)
        .then((res) => res.json())
        .then((newHistory) => setHistory(newHistory))
        .catch((err) => console.error("History fetch error:", err));
    };

    fetchData(); // Initial fetch
    const interval = setInterval(fetchData, 2000); // Poll every 2s

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
    }).then(res => res.json()).then(console.log);
  };

  const updateLimits = (node) => {
    const tempLimit = document.getElementById(`${node}-temp-limit`).value;
    const gasLimit = document.getElementById(`${node}-gas-limit`).value;

    fetch(`${API}/update_limits`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        node,
        temp_th: parseFloat(tempLimit),
        gas_th: parseFloat(gasLimit),
      }),
    }).then(() => alert("Limits updated!"));
  };

  // NOT LOGGED IN
  if (!user) {
    return <Login setUser={setUser} />;
  }

  // LOGGED IN
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

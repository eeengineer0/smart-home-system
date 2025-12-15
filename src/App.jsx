import { useEffect, useState } from "react";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import UserManager from "./components/UserManager";

const API = import.meta.env.VITE_API_BASE_URL;

export default function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("dashboard");
  const [data, setData] = useState({});

  useEffect(() => {
    const saved = localStorage.getItem("user");
    if (saved) setUser(JSON.parse(saved));
  }, []);

  useEffect(() => {
    if (!user) return;

    const fetchData = () => {
      fetch(`${API}/realtime`)
        .then(res => res.json())
        .then(setData)
        .catch(console.error);
    };

    fetchData();
    const i = setInterval(fetchData, 2000);
    return () => clearInterval(i);
  }, [user]);

  const logout = () => {
    localStorage.removeItem("user");
    setUser(null);
  };

  const sendCommand = (device, action) => {
    fetch(`${API}/command`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ device, action }),
    });
  };

  const updateLimits = (device) => {
    const temp = document.getElementById(`${device}-temp-limit`).value;
    const gas = document.getElementById(`${device}-gas-limit`).value;

    fetch(`${API}/set_limits`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        device,
        temp_th: parseFloat(temp),
        gas_th: parseFloat(gas),
      }),
    }).then(() => alert("Limits updated"));
  };

  if (!user) return <Login setUser={setUser} />;

  return (
    <>
      {page === "dashboard" && (
        <Dashboard
          user={user}
          data={data}
          logout={logout}
          sendCommand={sendCommand}
          updateLimits={updateLimits}
          goUsers={() => setPage("users")}
        />
      )}

      {page === "users" && user.role === "admin" && (
        <UserManager goBack={() => setPage("dashboard")} />
      )}
    </>
  );
}

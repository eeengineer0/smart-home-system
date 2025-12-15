import { useEffect, useState } from "react";

const API = import.meta.env.VITE_API_BASE_URL;

export default function UserManager({ goBack }) {
  const [users, setUsers] = useState({});
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user");
  const [mode, setMode] = useState("create");
  const [message, setMessage] = useState("");

  const loadUsers = () => {
    fetch(`${API}/users`)
      .then((res) => res.json())
      .then((data) => setUsers(data));
  };

  useEffect(() => { loadUsers(); }, []);

  const resetForm = () => {
    setUsername(""); setPassword(""); setRole("user"); setMode("create");
  };

  const handleSave = () => {
    setMessage("");
    if (!username) { setMessage("Username required"); return; }

    const url = mode === "create" ? `${API}/add_user` : `${API}/update_user`;
    const body = mode === "create"
      ? { username, password, role }
      : { username, password: password || null, role };

    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then((res) => res.json()).then((data) => {
      if (data.status === "error") setMessage(data.msg);
      else { setMessage(mode === "create" ? "User created" : "User updated"); loadUsers(); resetForm(); }
    });
  };

  const handleEdit = (name) => { setMode("edit"); setUsername(name); setPassword(""); setRole(users[name].role); setMessage(`Editing user "${name}"`); };
  const handleDelete = (name) => {
    if (!window.confirm(`Delete user "${name}"?`)) return;
    fetch(`${API}/delete_user`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: name }),
    }).then((res) => res.json()).then((data) => {
      if (data.status === "error") setMessage(data.msg);
      else { setMessage("User deleted"); loadUsers(); if (name === username) resetForm(); }
    });
  };

  return (
    <div style={{ padding: "40px", fontFamily: "Arial, sans-serif" }}>
      <h1 style={{ textAlign: "center", marginBottom: "20px" }}>👥 User Management</h1>
      <button onClick={goBack} style={{ marginBottom: "20px", padding: "8px 14px", borderRadius: "6px", border: "none", background: "#1e90ff", color: "white", cursor: "pointer" }}>⬅ Back to Dashboard</button>

      <div style={{ maxWidth: "400px", margin: "0 auto 30px auto", padding: "20px", borderRadius: "12px", background: "#f9f9f9", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}>
        <h2 style={{ marginTop: 0 }}>{mode === "create" ? "Create New User" : "Edit User"}</h2>
        <div style={{ marginBottom: "10px" }}>
          <label>Username:</label><br />
          <input value={username} onChange={(e) => setUsername(e.target.value)} disabled={mode === "edit"} style={{ width: "100%", padding: "8px", borderRadius: "6px" }} />
        </div>

        <div style={{ marginBottom: "10px" }}>
          <label>Password {mode === "edit" && <span style={{ fontSize: "12px", color: "#666" }}>(leave empty to keep old)</span>}</label><br />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: "100%", padding: "8px", borderRadius: "6px" }} />
        </div>

        <div style={{ marginBottom: "10px" }}>
          <label>Role:</label><br />
          <select value={role} onChange={(e) => setRole(e.target.value)} style={{ width: "100%", padding: "8px", borderRadius: "6px" }}>
            <option value="admin">Admin</option>
            <option value="user">User</option>
          </select>
        </div>

        <button onClick={handleSave} style={{ padding: "10px 18px", borderRadius: "6px", border: "none", background: "#28a745", color: "white", cursor: "pointer", marginRight: "10px" }}>{mode === "create" ? "Create User" : "Save Changes"}</button>
        {mode === "edit" && <button onClick={resetForm} style={{ padding: "10px 18px", borderRadius: "6px", border: "none", background: "#6

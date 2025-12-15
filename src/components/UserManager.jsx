import { useEffect, useState } from "react";

const API = import.meta.env.VITE_API_BASE_URL;

export default function UserManager({ goBack }) {
  const [users, setUsers] = useState({});
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user");
  const [mode, setMode] = useState("create"); // 'create' or 'edit'
  const [message, setMessage] = useState("");

  const loadUsers = () => {
    fetch(`${API}/users`)
      .then((res) => res.json())
      .then((data) => setUsers(data));
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const resetForm = () => {
    setUsername("");
    setPassword("");
    setRole("user");
    setMode("create");
    setMessage("");
  };

  const handleSave = () => {
    setMessage("");

    if (!username) {
      setMessage("Username required");
      return;
    }

    if (mode === "create") {
      fetch(`${API}/add_user`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, role }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.status === "error") {
            setMessage(data.msg);
          } else {
            setMessage("User created");
            loadUsers();
            resetForm();
          }
        });
    } else {
      fetch(`${API}/update_user`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          password: password || null,
          role,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.status === "error") {
            setMessage(data.msg);
          } else {
            setMessage("User updated");
            loadUsers();
            resetForm();
          }
        });
    }
  };

  const handleEdit = (name) => {
    setMode("edit");
    setUsername(name);
    setPassword("");
    setRole(users[name].role);
    setMessage(`Editing user "${name}"`);
  };

  const handleDelete = (name) => {
    if (!window.confirm(`Delete user "${name}"?`)) return;

    fetch(`${API}/delete_user`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: name }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "error") {
          setMessage(data.msg);
        } else {
          setMessage("User deleted");
          loadUsers();
          if (name === username) resetForm();
        }
      });
  };

  return (
    <div style={{ padding: "40px", fontFamily: "Arial, sans-serif" }}>
      <h1 style={{ textAlign: "center", marginBottom: "20px" }}>
        👥 User Management
      </h1>

      <button
        onClick={goBack}
        style={{
          marginBottom: "20px",
          padding: "8px 14px",
          borderRadius: "6px",
          border: "none",
          background: "#1e90ff",
          color: "white",
          cursor: "pointer",
        }}
      >
        ⬅ Back to Dashboard
      </button>

      {/* FORM */}
      <div
        style={{
          maxWidth: "400px",
          margin: "0 auto 30px auto",
          padding: "20px",
          borderRadius: "12px",
          background: "#f9f9f9",
          boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
        }}
      >
        <h2 style={{ marginTop: 0 }}>
          {mode === "create" ? "Create New User" : "Edit User"}
        </h2>

        <div style={{ marginBottom: "10px" }}>
          <label>Username:</label>
          <br />
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={mode === "edit"}
            style={{ width: "100%", padding: "8px", borderRadius: "6px" }}
          />
        </div>

        <div style={{ marginBottom: "10px" }}>
          <label>
            Password{" "}
            {mode === "edit" ? (
              <span style={{ fontSize: "12px", color: "#666" }}>
                (leave empty to keep old)
              </span>
            ) : null}
          </label>
          <br />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: "100%", padding: "8px", borderRadius: "6px" }}
          />
        </div>

        <div style={{ marginBottom: "10px" }}>
          <label>Role:</label>
          <br />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            style={{ width: "100%", padding: "8px", borderRadius: "6px" }}
          >
            <option value="admin">Admin</option>
            <option value="user">User</option>
          </select>
        </div>

        <button
          onClick={handleSave}
          style={{
            padding: "10px 18px",
            borderRadius: "6px",
            border: "none",
            background: "#28a745",
            color: "white",
            cursor: "pointer",
            marginRight: "10px",
          }}
        >
          {mode === "create" ? "Create User" : "Save Changes"}
        </button>

        {mode === "edit" && (
          <button
            onClick={resetForm}
            style={{
              padding: "10px 18px",
              borderRadius: "6px",
              border: "none",
              background: "#6c757d",
              color: "white",
              cursor: "pointer",
            }}
          >
            Cancel Edit
          </button>
        )}

        {message && (
          <p style={{ marginTop: "10px", color: "#d9534f" }}>{message}</p>
        )}
      </div>

      {/* USERS TABLE */}
      <div
        style={{
          maxWidth: "600px",
          margin: "0 auto",
          padding: "20px",
          borderRadius: "12px",
          background: "white",
          boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
        }}
      >
        <h2 style={{ marginTop: 0 }}>Existing Users</h2>

        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "14px",
          }}
        >
          <thead>
            <tr>
              <th
                style={{
                  borderBottom: "1px solid #ddd",
                  textAlign: "left",
                  padding: "8px",
                }}
              >
                Username
              </th>
              <th
                style={{
                  borderBottom: "1px solid #ddd",
                  textAlign: "left",
                  padding: "8px",
                }}
              >
                Role
              </th>
              <th
                style={{
                  borderBottom: "1px solid #ddd",
                  textAlign: "left",
                  padding: "8px",
                }}
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {Object.keys(users).length === 0 && (
              <tr>
                <td colSpan="3" style={{ padding: "10px", textAlign: "center" }}>
                  No users found.
                </td>
              </tr>
            )}

            {Object.keys(users).map((name) => (
              <tr key={name}>
                <td style={{ padding: "8px", borderBottom: "1px solid #f0f0f0" }}>
                  {name}
                </td>
                <td style={{ padding: "8px", borderBottom: "1px solid #f0f0f0" }}>
                  {users[name].role}
                </td>
                <td style={{ padding: "8px", borderBottom: "1px solid #f0f0f0" }}>
                  <button
                    onClick={() => handleEdit(name)}
                    style={{
                      padding: "4px 8px",
                      marginRight: "6px",
                      borderRadius: "4px",
                      border: "none",
                      background: "#007bff",
                      color: "white",
                      cursor: "pointer",
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(name)}
                    style={{
                      padding: "4px 8px",
                      borderRadius: "4px",
                      border: "none",
                      background: "#dc3545",
                      color: "white",
                      cursor: "pointer",
                    }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

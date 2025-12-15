import { useEffect, useState } from "react";
const API = import.meta.env.VITE_API_BASE_URL;

export default function UserManager({ goBack }) {
  const [users, setUsers] = useState({});

  useEffect(() => {
    fetch(`${API}/users`)
      .then(res => res.json())
      .then(setUsers);
  }, []);

  return (
    <div style={{ padding: 30 }}>
      <h2>User Management</h2>
      <button onClick={goBack}>⬅ Back</button>

      <ul>
        {Object.keys(users).map(u => (
          <li key={u}>{u} ({users[u].role})</li>
        ))}
      </ul>
    </div>
  );
}

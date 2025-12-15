import GraphCard from "./GraphCard";

export default function Dashboard({
  user,
  data,
  history,
  logout,
  updateLimits,
}) {
  const cardStyle = (device) => {
    const now = Date.now();
    const age = now - (device._timestamp || 0);

    let bg = "#ffffff";
    if (age > 5000) bg = "#e8e8e8"; // Grey if offline
    if (device.ao_v > device.gas_th) bg = "#ffe0e0"; // Red if Gas high
    if (device.t > device.temp_th) bg = "#ffe9d6"; // Orange if Temp high

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

  const sendCommand = async (node, type) => {
    let action;
    if (type === "LED_ON") action = "LED_ON";
    if (type === "LED_OFF") action = "LED_OFF";
    if (type === "FAN_ON") action = "FAN_ON";
    if (type === "FAN_OFF") action = "FAN_OFF";

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/realtime`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          device: node,
          action: action, // Correct field name for backend
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        console.error("Command failed:", data);
      } else {
        console.log("Command sent successfully!");
      }
    } catch (error) {
      console.error("Network error:", error);
    }
  };

  // NOT LOGGED IN
  if (!user) {
    return <p>Please login to see the dashboard</p>;
  }

  // LOGGED IN
  return (
    <div
      style={{
        fontFamily: "Arial, sans-serif",
        padding: "40px",
        background: "#f5f5f7",
        minHeight: "100vh",
      }}
    >
      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <h1 style={{ marginBottom: "30px", color: "#1e90ff" }}>
          🌐 Smart IoT Dashboard
        </h1>

        <div style={{ textAlign: "right", marginRight: "20px" }}>
          <p style={{ margin: 0 }}>
            Logged in as: <

import { useState } from "react";
import axios from "axios";

export default function AdminAuthModal({ onSuccess, onCancel }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const verifyAdmin = async () => {
    setError("");
    setLoading(true);

    try {
      const res = await axios.post(
        "https://dynatos-pos-backend-1.onrender.com",
        { username, password }
      );

      if (res.data.user.role !== "ADMIN") {
        throw new Error("No admin");
      }

      onSuccess();
    } catch {
      setError("Credenciales de administrador inválidas");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.6)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          backgroundColor: "#fff",
          padding: 24,
          width: 360,
          borderRadius: 8,
        }}
      >
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>
          Autorización de administrador
        </h2>

        <input
          placeholder="Usuario admin"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={{
            width: "100%",
            padding: 8,
            marginBottom: 8,
            border: "1px solid #ccc",
          }}
        />

        <input
          type="password"
          placeholder="Contraseña admin"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{
            width: "100%",
            padding: 8,
            marginBottom: 8,
            border: "1px solid #ccc",
          }}
        />

        {error && (
          <div style={{ color: "red", fontSize: 13, marginBottom: 8 }}>
            {error}
          </div>
        )}

        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              padding: 10,
              background: "#ccc",
              border: "none",
              cursor: "pointer",
            }}
          >
            Cancelar
          </button>

          <button
            onClick={verifyAdmin}
            disabled={loading}
            style={{
              flex: 1,
              padding: 10,
              background: "#000",
              color: "#fff",
              border: "none",
              cursor: "pointer",
            }}
          >
            {loading ? "Validando…" : "Autorizar"}
          </button>
        </div>
      </div>
    </div>
  );
}

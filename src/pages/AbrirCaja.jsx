import { useState } from "react";
import api from "../api/api";
import { FiUnlock, FiDollarSign } from "react-icons/fi";

export default function AbrirCaja({ onOpened }) {
  const [openingAmount, setOpeningAmount] = useState("");
  const [loading, setLoading] = useState(false);

  const openCashDrawer = async () => {
    if (!openingAmount || openingAmount < 0) {
      alert("Por favor, ingresa un monto inicial válido");
      return;
    }

    try {
      setLoading(true);
      // Mantenemos tu estructura de datos exacta: opening_amount
      await api.post("/cash/open", {
        opening_amount: Number(openingAmount),
      });
      onOpened();
    } catch (err) {
      alert(
        err?.response?.data?.message ||
          "Error abriendo caja"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      backgroundColor: "#111", padding: "30px", borderRadius: "15px",
      border: "1px solid #D4AF37", width: "100%", maxWidth: "380px",
      boxShadow: "0 10px 40px rgba(0,0,0,0.5)", animation: "fadeIn 0.5s ease"
    }}>
      <div style={{ textAlign: "center", marginBottom: "25px" }}>
        <FiUnlock size={40} style={{ color: "#D4AF37", marginBottom: "15px" }} />
        <h2 style={{ 
          color: "#D4AF37", margin: 0, fontSize: "1.2rem", 
          letterSpacing: "2px", fontWeight: "bold" 
        }}>
          APERTURA DE CAJA
        </h2>
        <p style={{ color: "#666", fontSize: "0.8rem", marginTop: "8px" }}>
          Registre el efectivo base para iniciar el turno
        </p>
      </div>

      <div style={{ position: "relative", marginBottom: "25px" }}>
        <FiDollarSign style={{ 
          position: "absolute", left: "15px", top: "50%", 
          transform: "translateY(-50%)", color: "#D4AF37", fontSize: "1.2rem" 
        }} />
        <input
          type="number"
          placeholder="Monto inicial"
          value={openingAmount}
          onChange={(e) => setOpeningAmount(e.target.value)}
          style={{ 
            width: "100%", padding: "15px 15px 15px 45px", background: "#000", 
            border: "1px solid #333", borderRadius: "10px", color: "#fff", 
            fontSize: "1.1rem", outline: "none", boxSizing: "border-box"
          }}
          autoFocus
        />
      </div>

      <button
        onClick={openCashDrawer}
        disabled={loading}
        style={{ 
          width: "100%", backgroundColor: "#D4AF37", color: "#000", border: "none", 
          padding: "16px", borderRadius: "10px", cursor: loading ? "not-allowed" : "pointer", 
          fontWeight: "bold", fontSize: "0.9rem", letterSpacing: "1px",
          transition: "0.3s", opacity: loading ? 0.7 : 1
        }}
      >
        {loading ? "PROCESANDO..." : "CONFIRMAR APERTURA"}
      </button>
    </div>
  );
}
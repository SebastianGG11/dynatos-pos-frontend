import { useEffect, useState } from "react";
import api from "../api/api";
import AdminAuthModal from "../components/AdminAuthModal";
import { FiLock, FiPieChart, FiDollarSign, FiSmartphone, FiFlag, FiX } from "react-icons/fi";

export default function CerrarCaja({ cashDrawer, onClosed }) {
  const [authorized, setAuthorized] = useState(false);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);

  // =========================
  // CARGAR RESUMEN (POST-AUTORIZACIÓN)
  // =========================
  const loadSummary = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/cash/${cashDrawer.id}/summary`);
      setSummary(res.data);
    } catch {
      alert("Error cargando resumen de caja");
      onClosed();
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // EJECUTAR CIERRE
  // =========================
  const closeCash = async () => {
    if (!window.confirm("¿Confirmar cierre de caja definitivo?")) return;

    try {
      await api.post(`/cash/${cashDrawer.id}/close`);
      onClosed();
    } catch {
      alert("Error cerrando caja");
    }
  };

  return (
    <>
      {/* 🔐 PASO 1: AUTORIZACIÓN ADMIN */}
      {!authorized && (
        <AdminAuthModal
          onSuccess={() => {
            setAuthorized(true);
            loadSummary();
          }}
          onCancel={onClosed}
        />
      )}

      {/* 📊 PASO 2: RESUMEN DE CIERRE */}
      {authorized && (
        <div style={{ 
          position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.9)", 
          display: "flex", alignItems: "center", justifyContent: "center", 
          zIndex: 9999, backdropFilter: "blur(5px)" 
        }}>
          <div style={{ 
            background: "#111", border: "1px solid #D4AF37", 
            borderRadius: "20px", width: "95%", maxWidth: "420px", 
            padding: "35px", boxShadow: "0 20px 50px rgba(0,0,0,1)" 
          }}>
            
            <div style={{ textAlign: "center", marginBottom: "30px" }}>
              <FiPieChart size={40} style={{ color: "#D4AF37", marginBottom: "15px" }} />
              <h2 style={{ 
                color: "#D4AF37", margin: 0, fontSize: "1.3rem", 
                letterSpacing: "2px", fontWeight: "bold" 
              }}>
                RESUMEN DE CIERRE
              </h2>
              <p style={{ color: "#555", fontSize: "0.8rem", marginTop: "5px" }}>
                ID Turno: #{cashDrawer.id}
              </p>
            </div>

            {loading ? (
              <div style={{ textAlign: "center", color: "#D4AF37", padding: "20px" }}>
                Cargando auditoría...
              </div>
            ) : (
              summary && (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "12px", background: "#000", borderRadius: "8px", border: "1px solid #222" }}>
                    <span style={{ color: "#888", fontSize: "0.9rem" }}>Monto Inicial</span>
                    <span style={{ color: "#fff", fontWeight: "bold" }}>${Number(summary.opening_amount).toLocaleString("es-CO")}</span>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", padding: "12px", background: "#000", borderRadius: "8px", border: "1px solid #222" }}>
                    <span style={{ color: "#888", fontSize: "0.9rem" }}>Ventas Totales</span>
                    <span style={{ color: "#fff", fontWeight: "bold" }}>${Number(summary.total_sales).toLocaleString("es-CO")}</span>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", padding: "12px", borderLeft: "3px solid #D4AF37" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#888" }}>
                      <FiDollarSign size={14} /> <span>Efectivo</span>
                    </div>
                    <span style={{ color: "#fff" }}>${Number(summary.cash_total).toLocaleString("es-CO")}</span>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", padding: "12px", borderLeft: "3px solid #5c5" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#888" }}>
                      <FiSmartphone size={14} /> <span>Transferencias / QR</span>
                    </div>
                    <span style={{ color: "#fff" }}>${Number(summary.qr_total).toLocaleString("es-CO")}</span>
                  </div>

                  <hr style={{ border: "none", borderTop: "1px solid #333", margin: "10px 0" }} />

                  <div style={{ 
                    display: "flex", justifyContent: "space-between", padding: "15px", 
                    backgroundColor: "#D4AF37", borderRadius: "10px", color: "#000" 
                  }}>
                    <span style={{ fontWeight: "bold", fontSize: "1rem" }}>TOTAL FINAL</span>
                    <span style={{ fontWeight: "bold", fontSize: "1.2rem" }}>
                      ${Number(summary.final_total).toLocaleString("es-CO")}
                    </span>
                  </div>
                </div>
              )
            )}

            <div style={{ display: "flex", gap: "15px", marginTop: "35px" }}>
              <button
                onClick={onClosed}
                style={{ 
                  flex: 1, padding: "14px", background: "transparent", border: "1px solid #333", 
                  color: "#666", borderRadius: "10px", fontWeight: "bold", cursor: "pointer" 
                }}
              >
                CANCELAR
              </button>
              <button
                onClick={closeCash}
                style={{ 
                  flex: 1, padding: "14px", background: "#f44", border: "none", 
                  color: "#fff", borderRadius: "10px", fontWeight: "bold", 
                  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" 
                }}
              >
                <FiLock /> CERRAR CAJA
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
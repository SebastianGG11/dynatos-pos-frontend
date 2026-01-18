import { useEffect, useState } from "react";
import api from "../api/api";
import AbrirCaja from "./AbrirCaja";
import Venta from "./Venta";
import AdminAuthModal from "../components/AdminAuthModal";
import { FiUnlock, FiLogOut, FiLock, FiMonitor, FiClock, FiShield } from "react-icons/fi";

export default function Caja() {
  const [loading, setLoading] = useState(true);
  const [cashDrawer, setCashDrawer] = useState(null);
  const [step, setStep] = useState("idle");

  useEffect(() => {
    loadCash();
  }, []);

  const loadCash = async () => {
    setLoading(true);
    try {
      // ✅ Usamos encadenamiento opcional para evitar errores de lectura
      const res = await api.get("/cash/current");
      setCashDrawer(res.data || null);
    } catch (error) {
      console.error("Error al verificar estado de caja:", error);
      setCashDrawer(null);
    } finally {
      // ✅ Aseguramos que el loading SIEMPRE se apague
      setLoading(false);
    }
  };

  const logout = () => {
    if (cashDrawer) return;
    localStorage.clear();
    window.location.assign("/login");
  };

  if (loading) {
    return (
      <div style={{ 
        minHeight: "100vh", backgroundColor: "#000", display: "flex", 
        flexDirection: "column", justifyContent: "center", alignItems: "center", color: "#D4AF37" 
      }}>
        <div className="animate-spin" style={{ marginBottom: "20px" }}><FiMonitor size={40} /></div>
        <p style={{ letterSpacing: "2px", fontSize: "0.8rem" }}>CONECTANDO TERMINAL DYNATOS...</p>
      </div>
    );
  }

  // ✅ SI HAY CAJA ABIERTA
  if (cashDrawer) {
    return (
      <Venta
        cashDrawer={cashDrawer}
        onCashClosed={loadCash}
      />
    );
  }

  // ❌ NO HAY CAJA ABIERTA
  return (
    <div style={{ 
      minHeight: "100vh", backgroundColor: "#000", 
      display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center",
      backgroundImage: "radial-gradient(circle, #111 0%, #000 100%)"
    }}>
      
      <div style={{ textAlign: "center", marginBottom: "50px" }}>
        <h1 style={{ color: "#D4AF37", fontSize: "3rem", margin: 0, fontFamily: "serif", letterSpacing: "5px" }}>DYNATOS</h1>
        <p style={{ color: "#666", letterSpacing: "3px", fontSize: "0.7rem", marginTop: "10px" }}>MARKET & LICORERÍA</p>
      </div>

      <div style={{ 
        backgroundColor: "#111", padding: "40px", borderRadius: "20px", border: "1px solid #D4AF37",
        boxShadow: "0 0 50px rgba(212, 175, 55, 0.1)", width: "90%", maxWidth: "400px", textAlign: "center"
      }}>
        
        {step === "idle" && (
          <>
            <div style={{ color: "#D4AF37", marginBottom: "30px" }}>
              <FiLock size={50} style={{ margin: "0 auto 20px" }} />
              <h2 style={{ fontSize: "1.2rem", margin: 0 }}>SISTEMA BLOQUEADO</h2>
              <p style={{ color: "#555", fontSize: "0.8rem", marginTop: "10px" }}>Apertura de turno requerida</p>
            </div>

            <button
              onClick={() => setStep("auth_admin")}
              style={{ 
                width: "100%", backgroundColor: "#D4AF37", color: "#000", border: "none", 
                padding: "16px", borderRadius: "12px", cursor: "pointer", fontWeight: "bold",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
                transition: "0.3s", marginBottom: "20px", fontSize: "1rem"
              }}
            >
              <FiUnlock size={20} /> ABRIR CAJA
            </button>

            <button
              onClick={logout}
              style={{ 
                background: "none", color: "#f55", border: "none", cursor: "pointer",
                display: "flex", alignItems: "center", gap: "8px", fontSize: "0.85rem", margin: "0 auto"
              }}
            >
              <FiLogOut /> Cerrar sesión
            </button>
          </>
        )}

        {step === "open_form" && (
          <div style={{ animation: "fadeIn 0.5s ease" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", color: "#D4AF37", marginBottom: "25px" }}>
                <FiShield size={20} />
                <span style={{ fontWeight: "bold", letterSpacing: "1px" }}>AUTORIZADO</span>
            </div>
            
            <AbrirCaja
              onOpened={() => {
                setStep("idle");
                loadCash();
              }}
            />

            <button
              onClick={() => setStep("idle")}
              style={{ 
                marginTop: "20px", background: "none", color: "#666", border: "none", 
                cursor: "pointer", fontSize: "0.8rem", textDecoration: "underline"
              }}
            >
              Volver al inicio
            </button>
          </div>
        )}
      </div>

      <div style={{ position: "absolute", bottom: "30px", color: "#333", display: "flex", gap: "30px", fontSize: "0.75rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <FiClock /> {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
        <div>STATION: POS_TERM_01</div>
      </div>

      {step === "auth_admin" && (
        <AdminAuthModal
          onSuccess={() => setStep("open_form")}
          onCancel={() => setStep("idle")}
        />
      )}
    </div>
  );
}
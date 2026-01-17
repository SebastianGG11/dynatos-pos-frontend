import { useEffect, useState } from "react";
import api from "../api/api";
import AbrirCaja from "./AbrirCaja";
import Venta from "./Venta";
import AdminAuthModal from "../components/AdminAuthModal";

export default function Caja() {
  const [loading, setLoading] = useState(true);
  const [cashDrawer, setCashDrawer] = useState(null);

  // idle | auth_admin | open_form
  const [step, setStep] = useState("idle");

  useEffect(() => {
    loadCash();
  }, []);

  const loadCash = async () => {
    setLoading(true);
    try {
      const res = await api.get("/cash/current");
      setCashDrawer(res.data);
    } catch {
      setCashDrawer(null);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 🔒 Logout SOLO permitido si NO hay caja abierta
   */
  const logout = () => {
    if (cashDrawer) return;

    localStorage.clear();
    window.location.assign("/login");
  };

  if (loading) {
    return <div className="p-6">Cargando caja...</div>;
  }

  /**
   * ✅ SI HAY CAJA ABIERTA
   * - NO existe cerrar sesión
   * - SOLO ventas + cerrar caja
   */
  if (cashDrawer) {
    return (
      <Venta
        cashDrawer={cashDrawer}
        onCashClosed={loadCash}
      />
    );
  }

  /**
   * ❌ NO HAY CAJA ABIERTA
   * - Se puede abrir caja
   * - Se puede cerrar sesión
   */
  return (
    <>
      <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center gap-4">
        {step === "idle" && (
          <>
            <button
              className="bg-black text-white px-6 py-3 rounded"
              onClick={() => setStep("auth_admin")}
            >
              Abrir caja
            </button>

            <button
              className="text-sm text-red-600 underline"
              onClick={logout}
            >
              Cerrar sesión
            </button>
          </>
        )}

        {step === "open_form" && (
          <>
            <AbrirCaja
              onOpened={() => {
                setStep("idle");
                loadCash();
              }}
            />

            <button
              className="text-sm text-red-600 underline"
              onClick={logout}
            >
              Cerrar sesión
            </button>
          </>
        )}
      </div>

      {/* 🔐 Modal de autorización ADMIN */}
      {step === "auth_admin" && (
        <AdminAuthModal
          onSuccess={() => setStep("open_form")}
          onCancel={() => setStep("idle")}
        />
      )}
    </>
  );
}

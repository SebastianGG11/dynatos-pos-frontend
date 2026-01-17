import { useEffect, useState } from "react";
import api from "../api/api";
import AdminAuthModal from "../components/AdminAuthModal";

export default function CerrarCaja({ cashDrawer, onClosed }) {
  const [authorized, setAuthorized] = useState(false);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);

  // =========================
  // LOAD SUMMARY (POST-AUTH)
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
  // CLOSE CASH
  // =========================
  const closeCash = async () => {
    if (!window.confirm("¿Confirmar cierre de caja?")) return;

    try {
      await api.post(`/cash/${cashDrawer.id}/close`);
      onClosed();
    } catch {
      alert("Error cerrando caja");
    }
  };

  // =========================
  // RENDER
  // =========================
  return (
    <>
      {/* 🔐 AUTORIZACIÓN ADMIN (MISMO MODAL QUE ABRIR CAJA) */}
      {!authorized && (
        <AdminAuthModal
          onSuccess={() => {
            setAuthorized(true);
            loadSummary();
          }}
          onCancel={onClosed}
        />
      )}

      {/* 📊 RESUMEN DE CAJA */}
      {authorized && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
          <div className="bg-white rounded w-[420px] p-6">
            <h2 className="text-lg font-semibold mb-4">
              Resumen de caja
            </h2>

            {loading && <p>Cargando resumen…</p>}

            {summary && (
              <div className="text-sm space-y-2">
                <div className="flex justify-between">
                  <span>Monto inicial</span>
                  <span>${Number(summary.opening_amount).toLocaleString("es-CO")}</span>
                </div>

                <div className="flex justify-between">
                  <span>Total ventas</span>
                  <span>${Number(summary.total_sales).toLocaleString("es-CO")}</span>
                </div>

                <div className="flex justify-between">
                  <span>Efectivo</span>
                  <span>${Number(summary.cash_total).toLocaleString("es-CO")}</span>
                </div>

                <div className="flex justify-between">
                  <span>Transferencias / QR</span>
                  <span>${Number(summary.qr_total).toLocaleString("es-CO")}</span>
                </div>

                <hr />

                <div className="flex justify-between font-semibold">
                  <span>Total final</span>
                  <span>${Number(summary.final_total).toLocaleString("es-CO")}</span>
                </div>
              </div>
            )}

            <div className="flex gap-2 mt-6">
              <button
                className="flex-1 bg-gray-300 py-2 rounded"
                onClick={onClosed}
              >
                Cancelar
              </button>
              <button
                className="flex-1 bg-red-600 text-white py-2 rounded"
                onClick={closeCash}
              >
                Cerrar caja
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

import { useState } from "react";
import api from "../api/api";

export default function AbrirCaja({ onOpened }) {
  const [openingAmount, setOpeningAmount] = useState("");
  const [loading, setLoading] = useState(false);

  const openCashDrawer = async () => {
    if (!openingAmount) {
      alert("Ingresa el monto inicial");
      return;
    }

    try {
      setLoading(true);
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
//si
  return (
    <div className="bg-white p-6 rounded w-96 shadow">
      <h2 className="text-xl font-semibold mb-4">
        Abrir Caja
      </h2>

      <input
        type="number"
        placeholder="Monto inicial"
        className="w-full border p-2 mb-4"
        value={openingAmount}
        onChange={(e) => setOpeningAmount(e.target.value)}
      />

      <button
        className="w-full bg-black text-white py-2 rounded"
        onClick={openCashDrawer}
        disabled={loading}
      >
        {loading ? "Abriendo..." : "Confirmar apertura"}
      </button>
    </div>
  );
}

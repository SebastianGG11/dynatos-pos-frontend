import { useState, useEffect } from "react";
import api from "../api/api";
import { FiPlus, FiTruck, FiCalendar, FiDollarSign, FiTrash2, FiAlertCircle } from "react-icons/fi";

export default function AdminPurchases() {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uiError, setUiError] = useState("");

  const [form, setForm] = useState({
    supplier_name: "",
    invoice_number: "",
    total_amount: "",
    notes: ""
  });

  useEffect(() => {
    loadPurchases();
  }, []);

  const loadPurchases = async () => {
    setLoading(true);
    try {
      // Intentamos cargar las compras del backend
      const res = await api.get("/purchases");
      setPurchases(res.data?.items ?? []);
    } catch (err) {
      console.error("Error cargando compras:", err);
      // Si el backend aún no tiene la tabla compras, mostramos vacío
      setPurchases([]);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const savePurchase = async () => {
    setUiError("");
    if (!form.supplier_name || !form.total_amount) {
      return setUiError("Proveedor y Monto son obligatorios");
    }

    setSaving(true);
    try {
      await api.post("/purchases", {
        ...form,
        total_amount: Number(form.total_amount)
      });
      await loadPurchases();
      setShowForm(false);
      setForm({ supplier_name: "", invoice_number: "", total_amount: "", notes: "" });
    } catch (err) {
      setUiError("Error al guardar. Verifica si la tabla de compras existe en tu DB.");
    } finally {
      setSaving(false);
    }
  };

  const deletePurchase = async (id) => {
    if (!window.confirm("¿Eliminar este registro de compra?")) return;
    try {
      await api.delete(`/purchases/${id}`);
      await loadPurchases();
    } catch (err) {
      alert("Error al eliminar");
    }
  };

  const money = (n) => `$${Number(n).toLocaleString("es-CO")}`;

  if (loading) return <div style={{ color: "#D4AF37", padding: "40px", textAlign: "center" }}>Cargando Compras...</div>;

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", animation: "fadeIn 0.5s ease" }}>
      
      {/* HEADER */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        backgroundColor: "#111", padding: "30px", borderRadius: "15px",
        border: "1px solid #D4AF37", marginBottom: "30px"
      }}>
        <div>
          <h1 style={{ color: "#D4AF37", margin: 0, fontSize: "2rem", letterSpacing: "3px", fontWeight: "bold" }}>COMPRAS</h1>
          <p style={{ color: "#888", fontSize: "0.9rem" }}>Gestión de Facturas de Proveedores</p>
        </div>
        <button onClick={() => setShowForm(true)} style={{
          backgroundColor: "#D4AF37", color: "#000", border: "none", padding: "14px 28px",
          borderRadius: "10px", fontWeight: "bold", cursor: "pointer", display: "flex", alignItems: "center", gap: "10px"
        }}>
          <FiPlus size={20} /> REGISTRAR COMPRA
        </button>
      </div>

      {uiError && (
        <div style={{ backgroundColor: "#300", color: "#f88", padding: "15px", borderRadius: "10px", border: "1px solid #f00", marginBottom: "20px" }}>
          <FiAlertCircle /> {uiError}
        </div>
      )}

      {/* MODAL FORM */}
      {showForm && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.9)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ backgroundColor: "#111", border: "1px solid #D4AF37", padding: "40px", borderRadius: "20px", width: "100%", maxWidth: "600px" }}>
            <h3 style={{ color: "#D4AF37", marginBottom: "30px" }}>NUEVA COMPRA</h3>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              <div style={{ gridColumn: "span 2" }}>
                <label style={{ color: "#D4AF37", fontSize: "0.8rem" }}>PROVEEDOR</label>
                <input name="supplier_name" value={form.supplier_name} onChange={handleChange} style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #333", backgroundColor: "#000", color: "#fff" }} />
              </div>
              <div>
                <label style={{ color: "#D4AF37", fontSize: "0.8rem" }}>N° FACTURA</label>
                <input name="invoice_number" value={form.invoice_number} onChange={handleChange} style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #333", backgroundColor: "#000", color: "#fff" }} />
              </div>
              <div>
                <label style={{ color: "#D4AF37", fontSize: "0.8rem" }}>MONTO TOTAL</label>
                <input name="total_amount" type="number" value={form.total_amount} onChange={handleChange} style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #333", backgroundColor: "#000", color: "#fff" }} />
              </div>
            </div>

            <div style={{ display: "flex", gap: "15px", marginTop: "30px" }}>
              <button onClick={() => setShowForm(false)} style={{ flex: 1, padding: "12px", border: "1px solid #333", backgroundColor: "transparent", color: "#888", cursor: "pointer" }}>CANCELAR</button>
              <button onClick={savePurchase} disabled={saving} style={{ flex: 1, padding: "12px", border: "none", backgroundColor: "#D4AF37", color: "#000", fontWeight: "bold", cursor: "pointer" }}>
                {saving ? "GUARDANDO..." : "GUARDAR COMPRA"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TABLA */}
      <div style={{ backgroundColor: "#111", borderRadius: "15px", border: "1px solid #222", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", color: "#eee" }}>
          <thead>
            <tr style={{ backgroundColor: "#1a1a1a", color: "#D4AF37", textAlign: "left" }}>
              <th style={{ padding: "20px" }}>FECHA</th>
              <th style={{ padding: "20px" }}>PROVEEDOR</th>
              <th style={{ padding: "20px" }}>FACTURA</th>
              <th style={{ padding: "20px", textAlign: "right" }}>TOTAL</th>
              <th style={{ padding: "20px", textAlign: "center" }}>ACCIONES</th>
            </tr>
          </thead>
          <tbody>
            {purchases.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ padding: "40px", textAlign: "center", color: "#555" }}>No hay compras registradas aún.</td>
              </tr>
            ) : (
              purchases.map(p => (
                <tr key={p.id} style={{ borderBottom: "1px solid #222" }}>
                  <td style={{ padding: "20px" }}>{new Date(p.created_at).toLocaleDateString()}</td>
                  <td style={{ padding: "20px", fontWeight: "bold" }}>{p.supplier_name}</td>
                  <td style={{ padding: "20px", color: "#888" }}>{p.invoice_number || "S/N"}</td>
                  <td style={{ padding: "20px", textAlign: "right", color: "#D4AF37", fontWeight: "bold" }}>{money(p.total_amount)}</td>
                  <td style={{ padding: "20px", textAlign: "center" }}>
                    <button onClick={() => deletePurchase(p.id)} style={{ background: "none", border: "none", color: "#f55", cursor: "pointer" }}>
                      <FiTrash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
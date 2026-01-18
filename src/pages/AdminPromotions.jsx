import { useEffect, useState, useMemo } from "react";
import api from "../api/api";
import { FiTag, FiPlus, FiTrash2, FiPercent, FiPackage, FiLayers, FiAlertCircle } from "react-icons/fi";

const EMPTY_FORM = {
  name: "",
  type: "INDIVIDUAL",
  product_id: "",
  min_quantity: 1,
  discount_type: "PERCENT",
  discount_value: ""
};

export default function AdminPromotions() {
  const [promotions, setPromotions] = useState([]);
  const [products, setProducts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [promoRes, prodRes] = await Promise.all([
        api.get("/promotions"),
        api.get("/products")
      ]);
      setPromotions(promoRes.data.items || []);
      setProducts(prodRes.data.items || []);
    } catch {
      setError("Error cargando promociones");
    } finally {
      setLoading(false);
    }
  };

  // Helper para mostrar el nombre del producto en la tabla
  const productNames = useMemo(() => {
    const map = new Map();
    products.forEach(p => map.set(p.id, p.name));
    return map;
  }, [products]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const savePromotion = async () => {
    setError("");
    if (!form.name || !form.product_id || !form.discount_value) {
      setError("Completa todos los campos obligatorios");
      return;
    }

    try {
      await api.post("/promotions", {
        name: form.name,
        type: form.type,
        product_id: Number(form.product_id),
        min_quantity: form.type === "PACK" ? Number(form.min_quantity) : 1,
        discount_type: form.discount_type,
        discount_value: Number(form.discount_value)
      });

      setForm(EMPTY_FORM);
      setShowForm(false);
      await loadAll();
    } catch (err) {
      setError(err?.response?.data?.message || "Error creando promoción");
    }
  };

  const deletePromotion = async (id) => {
    if (!window.confirm("¿Eliminar promoción definitivamente?")) return;
    try {
      await api.delete(`/promotions/${id}`);
      loadAll();
    } catch (err) {
      setError("No se pudo eliminar la promoción");
    }
  };

  if (loading && promotions.length === 0) return (
    <div style={{ color: "#D4AF37", textAlign: "center", padding: "50px" }}>Cargando ofertas...</div>
  );

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", animation: "fadeIn 0.5s ease" }}>
      
      {/* HEADER */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        backgroundColor: "#111", padding: "30px", borderRadius: "15px",
        border: "1px solid #D4AF37", marginBottom: "30px", boxShadow: "0 10px 30px rgba(0,0,0,0.5)"
      }}>
        <div>
          <h1 style={{ color: "#D4AF37", margin: 0, fontSize: "2rem", letterSpacing: "3px", fontWeight: "bold", fontFamily: 'serif' }}>
            PROMOCIONES
          </h1>
          <p style={{ color: "#888", fontSize: "0.9rem", margin: "5px 0 0 0" }}>Estrategias de Venta Dynatos</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          style={{
            backgroundColor: "#D4AF37", color: "#000", border: "none", padding: "14px 28px",
            borderRadius: "10px", fontWeight: "bold", cursor: "pointer", display: "flex", alignItems: "center", gap: "10px"
          }}
        >
          <FiPlus size={20} /> NUEVA PROMOCIÓN
        </button>
      </div>

      {error && (
        <div style={{ backgroundColor: "#300", color: "#f88", padding: "15px", borderRadius: "10px", border: "1px solid #f00", marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
          <FiAlertCircle /> {error}
        </div>
      )}

      {/* MODAL FORM */}
      {showForm && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.9)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ backgroundColor: "#111", border: "1px solid #D4AF37", padding: "40px", borderRadius: "20px", width: "100%", maxWidth: "500px" }}>
            <h3 style={{ color: "#D4AF37", marginTop: 0, marginBottom: "30px", fontSize: "1.5rem", textAlign: "center" }}>CONFIGURAR OFERTA</h3>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
              <div>
                <label style={{ color: "#D4AF37", fontSize: "0.7rem", fontWeight: "bold", display: "block", marginBottom: "5px" }}>NOMBRE DE LA PROMO</label>
                <input name="name" placeholder="Ej: Black Friday Whisky" value={form.name} onChange={handleChange}
                  style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #333", backgroundColor: "#000", color: "#fff" }} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
                <div>
                  <label style={{ color: "#D4AF37", fontSize: "0.7rem", fontWeight: "bold", marginBottom: "5px", display: "block" }}>TIPO</label>
                  <select name="type" value={form.type} onChange={handleChange}
                    style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #333", backgroundColor: "#000", color: "#fff" }}>
                    <option value="INDIVIDUAL">Individual</option>
                    <option value="PACK">Paquete (3x2, etc)</option>
                  </select>
                </div>
                <div>
                  <label style={{ color: "#D4AF37", fontSize: "0.7rem", fontWeight: "bold", marginBottom: "5px", display: "block" }}>PRODUCTO</label>
                  <select name="product_id" value={form.product_id} onChange={handleChange}
                    style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #333", backgroundColor: "#000", color: "#fff" }}>
                    <option value="">Seleccionar...</option>
                    {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              </div>

              {form.type === "PACK" && (
                <div>
                  <label style={{ color: "#D4AF37", fontSize: "0.7rem", fontWeight: "bold", marginBottom: "5px", display: "block" }}>CANTIDAD MÍNIMA</label>
                  <input type="number" name="min_quantity" value={form.min_quantity} onChange={handleChange}
                    style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #333", backgroundColor: "#000", color: "#fff" }} />
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
                <div>
                  <label style={{ color: "#D4AF37", fontSize: "0.7rem", fontWeight: "bold", marginBottom: "5px", display: "block" }}>TIPO DESCUENTO</label>
                  <select name="discount_type" value={form.discount_type} onChange={handleChange}
                    style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #333", backgroundColor: "#000", color: "#fff" }}>
                    <option value="PERCENT">Porcentaje (%)</option>
                    <option value="FIXED">Monto Fijo ($)</option>
                  </select>
                </div>
                <div>
                  <label style={{ color: "#D4AF37", fontSize: "0.7rem", fontWeight: "bold", marginBottom: "5px", display: "block" }}>VALOR</label>
                  <input type="number" name="discount_value" placeholder="0" value={form.discount_value} onChange={handleChange}
                    style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #333", backgroundColor: "#000", color: "#fff" }} />
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: "15px", marginTop: "30px" }}>
              <button onClick={() => setShowForm(false)} style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "1px solid #333", backgroundColor: "transparent", color: "#888", cursor: "pointer" }}>CANCELAR</button>
              <button onClick={savePromotion} style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "none", backgroundColor: "#D4AF37", color: "#000", fontWeight: "bold", cursor: "pointer" }}>GUARDAR</button>
            </div>
          </div>
        </div>
      )}

      {/* TABLA */}
      <div style={{ backgroundColor: "#111", borderRadius: "15px", border: "1px solid #222", overflow: "hidden", boxShadow: "0 10px 30px rgba(0,0,0,0.3)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", color: "#eee" }}>
          <thead>
            <tr style={{ backgroundColor: "#1a1a1a", color: "#D4AF37", textAlign: "left" }}>
              <th style={{ padding: "20px", borderBottom: "1px solid #222" }}>PROMOCIÓN</th>
              <th style={{ padding: "20px", borderBottom: "1px solid #222" }}>MODALIDAD</th>
              <th style={{ padding: "20px", borderBottom: "1px solid #222" }}>PRODUCTO AFECTADO</th>
              <th style={{ padding: "20px", borderBottom: "1px solid #222", textAlign: "right" }}>DESCUENTO</th>
              <th style={{ padding: "20px", borderBottom: "1px solid #222", textAlign: "center" }}>ESTADO</th>
              <th style={{ padding: "20px", borderBottom: "1px solid #222", textAlign: "center" }}>ACCIÓN</th>
            </tr>
          </thead>
          <tbody>
            {promotions.map((p) => (
              <tr key={p.id} style={{ borderBottom: "1px solid #222", transition: "0.2s" }} onMouseOver={e => e.currentTarget.style.backgroundColor = "#161616"} onMouseOut={e => e.currentTarget.style.backgroundColor = "transparent"}>
                <td style={{ padding: "20px", fontWeight: "bold" }}>{p.name}</td>
                <td style={{ padding: "20px" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.8rem", color: "#888" }}>
                    {p.type === "PACK" ? <FiLayers style={{ color: "#D4AF37" }} /> : <FiTag style={{ color: "#D4AF37" }} />}
                    {p.type}
                  </span>
                </td>
                <td style={{ padding: "20px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <FiPackage size={14} style={{ color: "#666" }} />
                    {productNames.get(p.product_id) || `ID: ${p.product_id}`}
                  </div>
                </td>
                <td style={{ padding: "20px", textAlign: "right", color: "#D4AF37", fontWeight: "bold" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "5px" }}>
                    {p.discount_type === "PERCENT" ? <FiPercent size={14} /> : "$"}
                    {p.discount_value}
                  </div>
                </td>
                <td style={{ padding: "20px", textAlign: "center" }}>
                  <span style={{ color: p.is_active ? "#5c5" : "#555", fontSize: "0.7rem", fontWeight: "bold", border: `1px solid ${p.is_active ? "#5c5" : "#333"}`, padding: "3px 8px", borderRadius: "4px" }}>
                    {p.is_active ? "ACTIVA" : "PAUSADA"}
                  </span>
                </td>
                <td style={{ padding: "20px", textAlign: "center" }}>
                  <button onClick={() => deletePromotion(p.id)} style={{ background: "none", border: "none", color: "#f55", cursor: "pointer", transition: "0.3s" }} onMouseOver={e => e.currentTarget.style.transform = "scale(1.2)"} onMouseOut={e => e.currentTarget.style.transform = "scale(1)"}>
                    <FiTrash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
            {promotions.length === 0 && (
              <tr><td colSpan="6" style={{ padding: "50px", textAlign: "center", color: "#555" }}>No hay promociones configuradas actualmente.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
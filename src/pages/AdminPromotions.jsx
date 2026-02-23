import { useEffect, useState, useMemo } from "react";
import api from "../api/api";
import { FiTag, FiPlus, FiTrash2, FiPercent, FiPackage, FiLayers, FiAlertCircle, FiEdit2, FiPower, FiClock, FiCheckCircle, FiXCircle } from "react-icons/fi";

const EMPTY_FORM = {
  name: "",
  type: "INDIVIDUAL",
  product_id: "",
  min_quantity: 1,
  discount_type: "PERCENT",
  discount_value: "",
  start_date: "",
  end_date: "",
  max_uses: ""
};

export default function AdminPromotions() {
  const [promotions, setPromotions] = useState([]);
  const [products, setProducts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
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

  const productNames = useMemo(() => {
    const map = new Map();
    products.forEach(p => map.set(p.id, p.name));
    return map;
  }, [products]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const openEditForm = (promo) => {
    setEditingId(promo.id);
    setForm({
      name: promo.name || "",
      type: promo.type || "INDIVIDUAL",
      product_id: promo.product_id || "",
      min_quantity: promo.min_quantity || 1,
      discount_type: promo.discount_type || "PERCENT",
      discount_value: promo.discount_value || "",
      start_date: promo.start_date ? promo.start_date.substring(0, 16) : "",
      end_date: promo.end_date ? promo.end_date.substring(0, 16) : "",
      max_uses: promo.max_uses || ""
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError("");
  };

  const savePromotion = async () => {
    setError("");
    if (!form.name || !form.product_id || !form.discount_value) {
      setError("Completa todos los campos obligatorios");
      return;
    }

    const payload = {
      name: form.name,
      type: form.type,
      product_id: Number(form.product_id),
      min_quantity: form.type === "PACK" ? Number(form.min_quantity) : 1,
      discount_type: form.discount_type,
      discount_value: Number(form.discount_value),
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      max_uses: form.max_uses ? Number(form.max_uses) : null
    };

    try {
      if (editingId) {
        await api.put(`/promotions/${editingId}`, payload);
      } else {
        await api.post("/promotions", payload);
      }
      closeForm();
      await loadAll();
    } catch (err) {
      setError(err?.response?.data?.message || "Error guardando promoción");
    }
  };

  const togglePromotion = async (id) => {
    try {
      await api.put(`/promotions/${id}/toggle`);
      await loadAll();
    } catch (err) {
      setError("Error cambiando estado");
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

  // Helper: Determinar estado de vigencia
  const getPromotionStatus = (promo) => {
    if (!promo.is_active) return { status: 'PAUSADA', color: '#666', icon: FiXCircle };
    
    const now = new Date();
    const start = promo.start_date ? new Date(promo.start_date) : null;
    const end = promo.end_date ? new Date(promo.end_date) : null;

    if (start && now < start) return { status: 'PRÓXIMA', color: '#ff9500', icon: FiClock };
    if (end && now > end) return { status: 'EXPIRADA', color: '#f55', icon: FiXCircle };
    
    return { status: 'ACTIVA', color: '#5c5', icon: FiCheckCircle };
  };

  if (loading && promotions.length === 0) return (
    <div style={{ color: "#D4AF37", textAlign: "center", padding: "50px" }}>Cargando ofertas...</div>
  );

  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto", animation: "fadeIn 0.5s ease" }}>
      
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
          onClick={() => { setEditingId(null); setForm(EMPTY_FORM); setShowForm(true); }}
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
          <button onClick={() => setError("")} style={{ marginLeft: "auto", background: "none", border: "none", color: "#f88", cursor: "pointer" }}>✕</button>
        </div>
      )}

      {/* MODAL FORM */}
      {showForm && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.95)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", overflowY: "auto" }}>
          <div style={{ backgroundColor: "#111", border: "2px solid #D4AF37", padding: "40px", borderRadius: "20px", width: "100%", maxWidth: "600px", maxHeight: "90vh", overflowY: "auto" }}>
            <h3 style={{ color: "#D4AF37", marginTop: 0, marginBottom: "30px", fontSize: "1.5rem", textAlign: "center" }}>
              {editingId ? "EDITAR PROMOCIÓN" : "NUEVA PROMOCIÓN"}
            </h3>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              
              {/* Nombre */}
              <div>
                <label style={{ color: "#D4AF37", fontSize: "0.75rem", fontWeight: "bold", display: "block", marginBottom: "8px" }}>NOMBRE DE LA PROMOCIÓN *</label>
                <input name="name" placeholder="Ej: Black Friday Whisky" value={form.name} onChange={handleChange}
                  style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #333", backgroundColor: "#000", color: "#fff", fontSize: "1rem" }} />
              </div>

              {/* Tipo y Producto */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
                <div>
                  <label style={{ color: "#D4AF37", fontSize: "0.75rem", fontWeight: "bold", marginBottom: "8px", display: "block" }}>TIPO *</label>
                  <select name="type" value={form.type} onChange={handleChange}
                    style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #333", backgroundColor: "#000", color: "#fff" }}>
                    <option value="INDIVIDUAL">Individual</option>
                    <option value="PACK">Paquete (3x2, etc)</option>
                  </select>
                </div>
                <div>
                  <label style={{ color: "#D4AF37", fontSize: "0.75rem", fontWeight: "bold", marginBottom: "8px", display: "block" }}>PRODUCTO *</label>
                  <select name="product_id" value={form.product_id} onChange={handleChange}
                    style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #333", backgroundColor: "#000", color: "#fff" }}>
                    <option value="">Seleccionar...</option>
                    {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              </div>

              {/* Cantidad mínima (solo PACK) */}
              {form.type === "PACK" && (
                <div>
                  <label style={{ color: "#D4AF37", fontSize: "0.75rem", fontWeight: "bold", marginBottom: "8px", display: "block" }}>CANTIDAD MÍNIMA *</label>
                  <input type="number" name="min_quantity" value={form.min_quantity} onChange={handleChange}
                    style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #333", backgroundColor: "#000", color: "#fff" }} />
                  <small style={{ color: "#666", fontSize: "0.7rem" }}>Ej: 3 para "3x2"</small>
                </div>
              )}

              {/* Tipo de descuento y Valor */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
                <div>
                  <label style={{ color: "#D4AF37", fontSize: "0.75rem", fontWeight: "bold", marginBottom: "8px", display: "block" }}>TIPO DESCUENTO *</label>
                  <select name="discount_type" value={form.discount_type} onChange={handleChange}
                    style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #333", backgroundColor: "#000", color: "#fff" }}>
                    <option value="PERCENT">Porcentaje (%)</option>
                    <option value="FIXED">Monto Fijo ($)</option>
                  </select>
                </div>
                <div>
                  <label style={{ color: "#D4AF37", fontSize: "0.75rem", fontWeight: "bold", marginBottom: "8px", display: "block" }}>VALOR *</label>
                  <input type="number" name="discount_value" placeholder="0" value={form.discount_value} onChange={handleChange}
                    style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #333", backgroundColor: "#000", color: "#fff" }} />
                </div>
              </div>

              {/* Fechas */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
                <div>
                  <label style={{ color: "#D4AF37", fontSize: "0.75rem", fontWeight: "bold", marginBottom: "8px", display: "block" }}>FECHA INICIO (Opcional)</label>
                  <input type="datetime-local" name="start_date" value={form.start_date} onChange={handleChange}
                    style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #333", backgroundColor: "#000", color: "#fff" }} />
                </div>
                <div>
                  <label style={{ color: "#D4AF37", fontSize: "0.75rem", fontWeight: "bold", marginBottom: "8px", display: "block" }}>FECHA FIN (Opcional)</label>
                  <input type="datetime-local" name="end_date" value={form.end_date} onChange={handleChange}
                    style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #333", backgroundColor: "#000", color: "#fff" }} />
                </div>
              </div>

              {/* Límite de uso */}
              <div>
                <label style={{ color: "#D4AF37", fontSize: "0.75rem", fontWeight: "bold", marginBottom: "8px", display: "block" }}>LÍMITE DE USO (Opcional)</label>
                <input type="number" name="max_uses" placeholder="Ilimitado" value={form.max_uses} onChange={handleChange}
                  style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #333", backgroundColor: "#000", color: "#fff" }} />
                <small style={{ color: "#666", fontSize: "0.7rem" }}>Máximo de veces que se puede usar esta promoción</small>
              </div>

            </div>

            <div style={{ display: "flex", gap: "15px", marginTop: "30px" }}>
              <button onClick={closeForm} style={{ flex: 1, padding: "14px", borderRadius: "8px", border: "1px solid #333", backgroundColor: "transparent", color: "#888", cursor: "pointer", fontWeight: "bold" }}>CANCELAR</button>
              <button onClick={savePromotion} style={{ flex: 1, padding: "14px", borderRadius: "8px", border: "none", backgroundColor: "#D4AF37", color: "#000", fontWeight: "bold", cursor: "pointer", fontSize: "1rem" }}>
                {editingId ? "ACTUALIZAR" : "CREAR"}
              </button>
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
              <th style={{ padding: "20px", borderBottom: "1px solid #222" }}>TIPO</th>
              <th style={{ padding: "20px", borderBottom: "1px solid #222" }}>PRODUCTO</th>
              <th style={{ padding: "20px", borderBottom: "1px solid #222", textAlign: "right" }}>DESCUENTO</th>
              <th style={{ padding: "20px", borderBottom: "1px solid #222", textAlign: "center" }}>VIGENCIA</th>
              <th style={{ padding: "20px", borderBottom: "1px solid #222", textAlign: "center" }}>ESTADO</th>
              <th style={{ padding: "20px", borderBottom: "1px solid #222", textAlign: "center" }}>ACCIONES</th>
            </tr>
          </thead>
          <tbody>
            {promotions.map((p) => {
              const status = getPromotionStatus(p);
              const StatusIcon = status.icon;
              
              return (
                <tr key={p.id} style={{ borderBottom: "1px solid #222", transition: "0.2s" }} onMouseOver={e => e.currentTarget.style.backgroundColor = "#161616"} onMouseOut={e => e.currentTarget.style.backgroundColor = "transparent"}>
                  <td style={{ padding: "20px" }}>
                    <div style={{ fontWeight: "bold", marginBottom: "4px" }}>{p.name}</div>
                    {p.max_uses && (
                      <div style={{ fontSize: "0.7rem", color: "#666" }}>
                        Usos: {p.current_uses || 0} / {p.max_uses}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: "20px" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.8rem", color: "#888" }}>
                      {p.type === "PACK" ? <FiLayers style={{ color: "#D4AF37" }} /> : <FiTag style={{ color: "#D4AF37" }} />}
                      {p.type}
                      {p.type === "PACK" && <span style={{ color: "#666" }}>({p.min_quantity}+)</span>}
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
                  <td style={{ padding: "20px" }}>
                    <div style={{ fontSize: "0.7rem", color: "#888", textAlign: "center" }}>
                      {p.start_date && <div>📅 {new Date(p.start_date).toLocaleDateString()}</div>}
                      {p.end_date && <div>⏰ {new Date(p.end_date).toLocaleDateString()}</div>}
                      {!p.start_date && !p.end_date && <div style={{ color: "#666" }}>Sin límite</div>}
                    </div>
                  </td>
                  <td style={{ padding: "20px", textAlign: "center" }}>
                    <span style={{ 
                      color: status.color, 
                      fontSize: "0.7rem", 
                      fontWeight: "bold", 
                      border: `1px solid ${status.color}`, 
                      padding: "4px 10px", 
                      borderRadius: "6px",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "5px"
                    }}>
                      <StatusIcon size={12} />
                      {status.status}
                    </span>
                  </td>
                  <td style={{ padding: "20px", textAlign: "center" }}>
                    <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
                      <button 
                        onClick={() => togglePromotion(p.id)} 
                        title={p.is_active ? "Desactivar" : "Activar"}
                        style={{ 
                          background: "none", 
                          border: "1px solid", 
                          borderColor: p.is_active ? "#5c5" : "#666",
                          color: p.is_active ? "#5c5" : "#666",
                          cursor: "pointer", 
                          padding: "8px",
                          borderRadius: "6px",
                          transition: "0.3s" 
                        }} 
                        onMouseOver={e => e.currentTarget.style.transform = "scale(1.1)"}
                        onMouseOut={e => e.currentTarget.style.transform = "scale(1)"}
                      >
                        <FiPower size={16} />
                      </button>
                      <button 
                        onClick={() => openEditForm(p)} 
                        title="Editar"
                        style={{ 
                          background: "none", 
                          border: "1px solid #D4AF37", 
                          color: "#D4AF37", 
                          cursor: "pointer", 
                          padding: "8px",
                          borderRadius: "6px",
                          transition: "0.3s" 
                        }} 
                        onMouseOver={e => e.currentTarget.style.transform = "scale(1.1)"}
                        onMouseOut={e => e.currentTarget.style.transform = "scale(1)"}
                      >
                        <FiEdit2 size={16} />
                      </button>
                      <button 
                        onClick={() => deletePromotion(p.id)} 
                        title="Eliminar"
                        style={{ 
                          background: "none", 
                          border: "1px solid #f55", 
                          color: "#f55", 
                          cursor: "pointer", 
                          padding: "8px",
                          borderRadius: "6px",
                          transition: "0.3s" 
                        }} 
                        onMouseOver={e => e.currentTarget.style.transform = "scale(1.1)"}
                        onMouseOut={e => e.currentTarget.style.transform = "scale(1)"}
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {promotions.length === 0 && (
              <tr><td colSpan="7" style={{ padding: "50px", textAlign: "center", color: "#555" }}>No hay promociones configuradas actualmente.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
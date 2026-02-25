import { useEffect, useState, useMemo } from "react";
import api from "../api/api";
import { 
  FiTag, FiPlus, FiTrash2, FiEdit2, FiPower, FiClock, 
  FiCheckCircle, FiXCircle, FiAlertCircle, FiGift, FiShoppingBag 
} from "react-icons/fi";

const EMPTY_FORM = {
  name: "",
  description: "",
  promotion_type: "COMBO",
  priority: 0,
  start_date: "",
  end_date: "",
  max_uses: "",
  conditions: [
    {
      condition_type: "MIN_QUANTITY",
      target_type: "PRODUCT",
      target_id: "",
      min_quantity: 1,
      min_amount: 0
    }
  ],
  benefits: [
    {
      benefit_type: "PERCENT_DISCOUNT",
      target_type: "PRODUCT",
      target_id: "",
      discount_value: 0,
      max_applications: 1
    }
  ]
};

export default function AdminPromotionsV2() {
  const [promotions, setPromotions] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
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
      const [promoRes, prodRes, catRes] = await Promise.all([
        api.get("/promotions-v2"),
        api.get("/products"),
        api.get("/categories")
      ]);
      setPromotions(promoRes.data.items || []);
      setProducts(prodRes.data.items || []);
      setCategories(catRes.data.items || []);
    } catch (err) {
      setError("Error cargando datos");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const productNames = useMemo(() => {
    const map = new Map();
    products.forEach(p => map.set(p.id, p.name));
    return map;
  }, [products]);

  const categoryNames = useMemo(() => {
    const map = new Map();
    categories.forEach(c => map.set(c.id, c.name));
    return map;
  }, [categories]);

  const openEditForm = (promo) => {
    setEditingId(promo.id);
    setForm({
      name: promo.name || "",
      description: promo.description || "",
      promotion_type: promo.promotion_type || "COMBO",
      priority: promo.priority || 0,
      start_date: promo.start_date ? promo.start_date.substring(0, 16) : "",
      end_date: promo.end_date ? promo.end_date.substring(0, 16) : "",
      max_uses: promo.max_uses || "",
      conditions: promo.conditions || [EMPTY_FORM.conditions[0]],
      benefits: promo.benefits || [EMPTY_FORM.benefits[0]]
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError("");
  };

  const addCondition = () => {
    setForm(prev => ({
      ...prev,
      conditions: [...prev.conditions, { ...EMPTY_FORM.conditions[0] }]
    }));
  };

  const removeCondition = (index) => {
    setForm(prev => ({
      ...prev,
      conditions: prev.conditions.filter((_, i) => i !== index)
    }));
  };

  const updateCondition = (index, field, value) => {
    setForm(prev => ({
      ...prev,
      conditions: prev.conditions.map((c, i) => 
        i === index ? { ...c, [field]: value } : c
      )
    }));
  };

  const addBenefit = () => {
    setForm(prev => ({
      ...prev,
      benefits: [...prev.benefits, { ...EMPTY_FORM.benefits[0] }]
    }));
  };

  const removeBenefit = (index) => {
    setForm(prev => ({
      ...prev,
      benefits: prev.benefits.filter((_, i) => i !== index)
    }));
  };

  const updateBenefit = (index, field, value) => {
    setForm(prev => ({
      ...prev,
      benefits: prev.benefits.map((b, i) => 
        i === index ? { ...b, [field]: value } : b
      )
    }));
  };

  const savePromotion = async () => {
    setError("");

    if (!form.name || !form.promotion_type) {
      setError("Nombre y tipo son obligatorios");
      return;
    }

    if (form.conditions.length === 0) {
      setError("Debe tener al menos una condición");
      return;
    }

    if (form.benefits.length === 0) {
      setError("Debe tener al menos un beneficio");
      return;
    }

    const payload = {
      name: form.name,
      description: form.description,
      promotion_type: form.promotion_type,
      priority: Number(form.priority) || 0,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      max_uses: form.max_uses ? Number(form.max_uses) : null,
      conditions: form.conditions.map(c => ({
        condition_type: c.condition_type,
        target_type: c.target_type,
        target_id: c.target_id ? Number(c.target_id) : null,
        min_quantity: Number(c.min_quantity) || 1,
        min_amount: Number(c.min_amount) || 0
      })),
      benefits: form.benefits.map(b => ({
        benefit_type: b.benefit_type,
        target_type: b.target_type,
        target_id: b.target_id ? Number(b.target_id) : null,
        discount_value: Number(b.discount_value),
        max_applications: Number(b.max_applications) || 1
      }))
    };

    try {
      if (editingId) {
        await api.put(`/promotions-v2/${editingId}`, payload);
      } else {
        await api.post("/promotions-v2", payload);
      }
      closeForm();
      await loadAll();
    } catch (err) {
      setError(err?.response?.data?.message || "Error guardando promoción");
    }
  };

  const togglePromotion = async (id) => {
    try {
      await api.put(`/promotions-v2/${id}/toggle`);
      await loadAll();
    } catch (err) {
      setError("Error cambiando estado");
    }
  };

  const deletePromotion = async (id) => {
    if (!window.confirm("¿Eliminar promoción definitivamente?")) return;
    try {
      await api.delete(`/promotions-v2/${id}`);
      loadAll();
    } catch (err) {
      setError("No se pudo eliminar la promoción");
    }
  };

  const getPromotionStatus = (promo) => {
    if (!promo.is_active) return { status: 'PAUSADA', color: '#666', icon: FiXCircle };
    
    const now = new Date();
    const start = promo.start_date ? new Date(promo.start_date) : null;
    const end = promo.end_date ? new Date(promo.end_date) : null;

    if (start && now < start) return { status: 'PRÓXIMA', color: '#ff9500', icon: FiClock };
    if (end && now > end) return { status: 'EXPIRADA', color: '#f55', icon: FiXCircle };
    
    return { status: 'ACTIVA', color: '#5c5', icon: FiCheckCircle };
  };

  const getPromoTypeLabel = (type) => {
    const labels = {
      SIMPLE: "Simple",
      COMBO: "Combo Cruzado",
      THRESHOLD: "Por Monto",
      CATEGORY: "Por Categoría"
    };
    return labels[type] || type;
  };

  if (loading && promotions.length === 0) return (
    <div style={{ color: "#D4AF37", textAlign: "center", padding: "50px" }}>Cargando promociones avanzadas...</div>
  );

  return (
    <div style={{ maxWidth: "1600px", margin: "0 auto", animation: "fadeIn 0.5s ease" }}>
      
      {/* HEADER */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        backgroundColor: "#111", padding: "30px", borderRadius: "15px",
        border: "1px solid #D4AF37", marginBottom: "30px", boxShadow: "0 10px 30px rgba(0,0,0,0.5)"
      }}>
        <div>
          <h1 style={{ color: "#D4AF37", margin: 0, fontSize: "2rem", letterSpacing: "3px", fontWeight: "bold", fontFamily: 'serif' }}>
            PROMOCIONES AVANZADAS V2
          </h1>
          <p style={{ color: "#888", fontSize: "0.9rem", margin: "5px 0 0 0" }}>Combos, Montos Mínimos y Descuentos por Categoría</p>
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
          <div style={{ backgroundColor: "#111", border: "2px solid #D4AF37", padding: "40px", borderRadius: "20px", width: "100%", maxWidth: "900px", maxHeight: "90vh", overflowY: "auto" }}>
            <h3 style={{ color: "#D4AF37", marginTop: 0, marginBottom: "30px", fontSize: "1.5rem", textAlign: "center" }}>
              {editingId ? "EDITAR PROMOCIÓN" : "NUEVA PROMOCIÓN"}
            </h3>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "25px" }}>
              
              {/* Nombre y Descripción */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
                <div>
                  <label style={{ color: "#D4AF37", fontSize: "0.75rem", fontWeight: "bold", display: "block", marginBottom: "8px" }}>NOMBRE *</label>
                  <input 
                    value={form.name} 
                    onChange={(e) => setForm({...form, name: e.target.value})}
                    placeholder="Ej: Combo Ron + Hielo"
                    style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #333", backgroundColor: "#000", color: "#fff" }} 
                  />
                </div>
                <div>
                  <label style={{ color: "#D4AF37", fontSize: "0.75rem", fontWeight: "bold", display: "block", marginBottom: "8px" }}>TIPO *</label>
                  <select 
                    value={form.promotion_type} 
                    onChange={(e) => setForm({...form, promotion_type: e.target.value})}
                    style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #333", backgroundColor: "#000", color: "#fff" }}
                  >
                    <option value="COMBO">Combo Cruzado (B)</option>
                    <option value="THRESHOLD">Por Monto Mínimo (C)</option>
                    <option value="CATEGORY">Por Categoría (E)</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ color: "#D4AF37", fontSize: "0.75rem", fontWeight: "bold", display: "block", marginBottom: "8px" }}>DESCRIPCIÓN</label>
                <textarea 
                  value={form.description} 
                  onChange={(e) => setForm({...form, description: e.target.value})}
                  placeholder="Ej: Compra 2 six packs y el ron sale 50% OFF"
                  rows={2}
                  style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #333", backgroundColor: "#000", color: "#fff", resize: "vertical" }} 
                />
              </div>

              {/* CONDICIONES */}
              <div style={{ border: "2px solid #D4AF37", padding: "20px", borderRadius: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
                  <h4 style={{ color: "#D4AF37", margin: 0 }}>CONDICIONES (¿Qué debe hacer el cliente?)</h4>
                  <button onClick={addCondition} style={{ padding: "8px 15px", background: "#D4AF37", color: "#000", border: "none", borderRadius: "6px", fontWeight: "bold", cursor: "pointer", fontSize: "0.85rem" }}>
                    + Agregar
                  </button>
                </div>

                {form.conditions.map((cond, idx) => (
                  <div key={idx} style={{ background: "#0a0a0a", padding: "15px", borderRadius: "8px", marginBottom: "10px", position: "relative" }}>
                    {form.conditions.length > 1 && (
                      <button onClick={() => removeCondition(idx)} style={{ position: "absolute", top: "10px", right: "10px", background: "#f55", color: "#fff", border: "none", borderRadius: "4px", padding: "4px 8px", cursor: "pointer" }}>
                        ✕
                      </button>
                    )}
                    
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "10px" }}>
                      <div>
                        <label style={{ color: "#888", fontSize: "0.7rem", display: "block", marginBottom: "5px" }}>Tipo de Condición</label>
                        <select 
                          value={cond.condition_type}
                          onChange={(e) => updateCondition(idx, 'condition_type', e.target.value)}
                          style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #333", backgroundColor: "#000", color: "#fff", fontSize: "0.85rem" }}
                        >
                          <option value="MIN_QUANTITY">Cantidad Mínima</option>
                          <option value="MIN_AMOUNT">Monto Mínimo</option>
                          <option value="PRODUCT_IN_CART">Producto en Carrito</option>
                          <option value="CATEGORY_IN_CART">Categoría en Carrito</option>
                        </select>
                      </div>

                      <div>
                        <label style={{ color: "#888", fontSize: "0.7rem", display: "block", marginBottom: "5px" }}>Target</label>
                        <select 
                          value={cond.target_type}
                          onChange={(e) => updateCondition(idx, 'target_type', e.target.value)}
                          style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #333", backgroundColor: "#000", color: "#fff", fontSize: "0.85rem" }}
                        >
                          <option value="PRODUCT">Producto Específico</option>
                          <option value="CATEGORY">Categoría</option>
                          <option value="CART">Todo el Carrito</option>
                        </select>
                      </div>
                    </div>

                    {cond.target_type === 'PRODUCT' && (
                      <div style={{ marginBottom: "10px" }}>
                        <label style={{ color: "#888", fontSize: "0.7rem", display: "block", marginBottom: "5px" }}>Producto</label>
                        <select 
                          value={cond.target_id}
                          onChange={(e) => updateCondition(idx, 'target_id', e.target.value)}
                          style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #333", backgroundColor: "#000", color: "#fff", fontSize: "0.85rem" }}
                        >
                          <option value="">Seleccionar...</option>
                          {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                      </div>
                    )}

                    {cond.target_type === 'CATEGORY' && (
                      <div style={{ marginBottom: "10px" }}>
                        <label style={{ color: "#888", fontSize: "0.7rem", display: "block", marginBottom: "5px" }}>Categoría</label>
                        <select 
                          value={cond.target_id}
                          onChange={(e) => updateCondition(idx, 'target_id', e.target.value)}
                          style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #333", backgroundColor: "#000", color: "#fff", fontSize: "0.85rem" }}
                        >
                          <option value="">Seleccionar...</option>
                          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </div>
                    )}

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                      {(cond.condition_type === 'MIN_QUANTITY' || cond.condition_type === 'PRODUCT_IN_CART') && (
                        <div>
                          <label style={{ color: "#888", fontSize: "0.7rem", display: "block", marginBottom: "5px" }}>Cantidad Mínima</label>
                          <input 
                            type="number"
                            value={cond.min_quantity}
                            onChange={(e) => updateCondition(idx, 'min_quantity', e.target.value)}
                            style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #333", backgroundColor: "#000", color: "#fff", fontSize: "0.85rem" }}
                          />
                        </div>
                      )}

                      {cond.condition_type === 'MIN_AMOUNT' && (
                        <div>
                          <label style={{ color: "#888", fontSize: "0.7rem", display: "block", marginBottom: "5px" }}>Monto Mínimo ($)</label>
                          <input 
                            type="number"
                            value={cond.min_amount}
                            onChange={(e) => updateCondition(idx, 'min_amount', e.target.value)}
                            style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #333", backgroundColor: "#000", color: "#fff", fontSize: "0.85rem" }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* BENEFICIOS */}
              <div style={{ border: "2px solid #2ecc71", padding: "20px", borderRadius: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
                  <h4 style={{ color: "#2ecc71", margin: 0 }}>BENEFICIOS (¿Qué gana el cliente?)</h4>
                  <button onClick={addBenefit} style={{ padding: "8px 15px", background: "#2ecc71", color: "#000", border: "none", borderRadius: "6px", fontWeight: "bold", cursor: "pointer", fontSize: "0.85rem" }}>
                    + Agregar
                  </button>
                </div>

                {form.benefits.map((ben, idx) => (
                  <div key={idx} style={{ background: "#0a0a0a", padding: "15px", borderRadius: "8px", marginBottom: "10px", position: "relative" }}>
                    {form.benefits.length > 1 && (
                      <button onClick={() => removeBenefit(idx)} style={{ position: "absolute", top: "10px", right: "10px", background: "#f55", color: "#fff", border: "none", borderRadius: "4px", padding: "4px 8px", cursor: "pointer" }}>
                        ✕
                      </button>
                    )}

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "10px" }}>
                      <div>
                        <label style={{ color: "#888", fontSize: "0.7rem", display: "block", marginBottom: "5px" }}>Tipo de Beneficio</label>
                        <select 
                          value={ben.benefit_type}
                          onChange={(e) => updateBenefit(idx, 'benefit_type', e.target.value)}
                          style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #333", backgroundColor: "#000", color: "#fff", fontSize: "0.85rem" }}
                        >
                          <option value="PERCENT_DISCOUNT">Descuento %</option>
                          <option value="FIXED_DISCOUNT">Descuento Fijo $</option>
                          <option value="FREE_PRODUCT">Producto Gratis</option>
                          <option value="DISCOUNTED_PRODUCT">Producto con Descuento</option>
                        </select>
                      </div>

                      <div>
                        <label style={{ color: "#888", fontSize: "0.7rem", display: "block", marginBottom: "5px" }}>Aplicar a</label>
                        <select 
                          value={ben.target_type}
                          onChange={(e) => updateBenefit(idx, 'target_type', e.target.value)}
                          style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #333", backgroundColor: "#000", color: "#fff", fontSize: "0.85rem" }}
                        >
                          <option value="PRODUCT">Producto Específico</option>
                          <option value="CATEGORY">Categoría</option>
                          <option value="CART">Todo el Carrito</option>
                          <option value="CHEAPEST">Item Más Barato</option>
                          <option value="TRIGGERING">Items que Activaron</option>
                        </select>
                      </div>
                    </div>

                    {ben.target_type === 'PRODUCT' && (
                      <div style={{ marginBottom: "10px" }}>
                        <label style={{ color: "#888", fontSize: "0.7rem", display: "block", marginBottom: "5px" }}>Producto</label>
                        <select 
                          value={ben.target_id}
                          onChange={(e) => updateBenefit(idx, 'target_id', e.target.value)}
                          style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #333", backgroundColor: "#000", color: "#fff", fontSize: "0.85rem" }}
                        >
                          <option value="">Seleccionar...</option>
                          {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                      </div>
                    )}

                    {ben.target_type === 'CATEGORY' && (
                      <div style={{ marginBottom: "10px" }}>
                        <label style={{ color: "#888", fontSize: "0.7rem", display: "block", marginBottom: "5px" }}>Categoría</label>
                        <select 
                          value={ben.target_id}
                          onChange={(e) => updateBenefit(idx, 'target_id', e.target.value)}
                          style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #333", backgroundColor: "#000", color: "#fff", fontSize: "0.85rem" }}
                        >
                          <option value="">Seleccionar...</option>
                          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </div>
                    )}

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                      <div>
                        <label style={{ color: "#888", fontSize: "0.7rem", display: "block", marginBottom: "5px" }}>
                          {ben.benefit_type === 'PERCENT_DISCOUNT' ? 'Porcentaje (%)' : 'Valor ($)'}
                        </label>
                        <input 
                          type="number"
                          value={ben.discount_value}
                          onChange={(e) => updateBenefit(idx, 'discount_value', e.target.value)}
                          style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #333", backgroundColor: "#000", color: "#fff", fontSize: "0.85rem" }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Fechas y Límites */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "15px" }}>
                <div>
                  <label style={{ color: "#D4AF37", fontSize: "0.75rem", fontWeight: "bold", marginBottom: "8px", display: "block" }}>FECHA INICIO</label>
                  <input type="datetime-local" value={form.start_date} onChange={(e) => setForm({...form, start_date: e.target.value})}
                    style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #333", backgroundColor: "#000", color: "#fff" }} />
                </div>
                <div>
                  <label style={{ color: "#D4AF37", fontSize: "0.75rem", fontWeight: "bold", marginBottom: "8px", display: "block" }}>FECHA FIN</label>
                  <input type="datetime-local" value={form.end_date} onChange={(e) => setForm({...form, end_date: e.target.value})}
                    style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #333", backgroundColor: "#000", color: "#fff" }} />
                </div>
                <div>
                  <label style={{ color: "#D4AF37", fontSize: "0.75rem", fontWeight: "bold", marginBottom: "8px", display: "block" }}>LÍMITE DE USO</label>
                  <input type="number" placeholder="Ilimitado" value={form.max_uses} onChange={(e) => setForm({...form, max_uses: e.target.value})}
                    style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #333", backgroundColor: "#000", color: "#fff" }} />
                </div>
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
              <th style={{ padding: "20px", borderBottom: "1px solid #222" }}>CONDICIONES</th>
              <th style={{ padding: "20px", borderBottom: "1px solid #222" }}>BENEFICIOS</th>
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
                    <div style={{ fontSize: "0.7rem", color: "#666" }}>{p.description}</div>
                    {p.max_uses && (
                      <div style={{ fontSize: "0.7rem", color: "#666", marginTop: "4px" }}>
                        Usos: {p.current_uses || 0} / {p.max_uses}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: "20px" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "4px 10px", background: "#222", borderRadius: "6px", fontSize: "0.75rem" }}>
                      <FiGift size={14} style={{ color: "#D4AF37" }} />
                      {getPromoTypeLabel(p.promotion_type)}
                    </span>
                  </td>
                  <td style={{ padding: "20px", fontSize: "0.75rem", color: "#888" }}>
                    {p.conditions && p.conditions.length > 0 ? (
                      p.conditions.map((c, i) => (
                        <div key={i} style={{ marginBottom: "4px" }}>
                          • {c.condition_type === 'MIN_QUANTITY' && `Min ${c.min_quantity}x`}
                          {c.condition_type === 'MIN_AMOUNT' && `Min $${c.min_amount}`}
                          {c.condition_type === 'PRODUCT_IN_CART' && 'Producto en carrito'}
                          {c.condition_type === 'CATEGORY_IN_CART' && 'Categoría en carrito'}
                          {c.target_type === 'PRODUCT' && c.target_id && ` - ${productNames.get(c.target_id) || `#${c.target_id}`}`}
                          {c.target_type === 'CATEGORY' && c.target_id && ` - ${categoryNames.get(c.target_id) || `#${c.target_id}`}`}
                        </div>
                      ))
                    ) : '—'}
                  </td>
                  <td style={{ padding: "20px", fontSize: "0.75rem", color: "#2ecc71" }}>
                    {p.benefits && p.benefits.length > 0 ? (
                      p.benefits.map((b, i) => (
                        <div key={i} style={{ marginBottom: "4px" }}>
                          • {b.benefit_type === 'PERCENT_DISCOUNT' && `${b.discount_value}% OFF`}
                          {b.benefit_type === 'FIXED_DISCOUNT' && `$${b.discount_value} OFF`}
                          {b.benefit_type === 'FREE_PRODUCT' && 'GRATIS'}
                          {b.benefit_type === 'DISCOUNTED_PRODUCT' && `${b.discount_value}% OFF`}
                          {b.target_type === 'PRODUCT' && b.target_id && ` - ${productNames.get(b.target_id) || `#${b.target_id}`}`}
                          {b.target_type === 'CATEGORY' && b.target_id && ` - ${categoryNames.get(b.target_id) || `#${b.target_id}`}`}
                          {b.target_type === 'CART' && ' - Todo'}
                          {b.target_type === 'CHEAPEST' && ' - Más barato'}
                        </div>
                      ))
                    ) : '—'}
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
              <tr><td colSpan="6" style={{ padding: "50px", textAlign: "center", color: "#555" }}>No hay promociones avanzadas configuradas.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
import { useEffect, useMemo, useState } from "react";
import api from "../api/api";
import { FiPlus, FiEdit2, FiTrash2, FiPackage, FiImage, FiAlertCircle } from "react-icons/fi";

const EMPTY_FORM = {
  id: null,
  name: "",
  category_id: "",
  cost_price: "",
  sale_price: "",
  current_stock: "",
  is_active: true,
};

function money(n) {
  const x = Number(n);
  if (Number.isNaN(x)) return "—";
  return `$${x.toLocaleString("es-CO")}`;
}

function getApiErrorMessage(err) {
  return err?.response?.data?.message || err?.message || "Error desconocido";
}

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [uiError, setUiError] = useState("");

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  /* ========================= LOAD DATA ========================= */
  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [prodRes, catRes] = await Promise.all([
        api.get("/products"),
        api.get("/categories"),
      ]);
      setProducts(prodRes.data?.items ?? []);
      setCategories(catRes.data?.items ?? []);
    } catch (err) {
      setUiError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  /* ========================= HELPERS ========================= */
  const categoryNameById = useMemo(() => {
    const map = new Map();
    categories.forEach((c) => map.set(String(c.id), c.name));
    return map;
  }, [categories]);

  const filteredProducts = useMemo(() => {
    if (selectedCategory === "ALL") return products;
    return products.filter((p) => String(p.category_id) === String(selectedCategory));
  }, [products, selectedCategory]);

  const resolveImageUrl = (p) => {
    if (!p?.image_filename) return "";
    const base = api.defaults.baseURL?.replace(/\/$/, "") || "";
    return `${base}/uploads/products/${p.image_filename}`;
  };

  /* ========================= FORM HANDLERS ========================= */
  const openCreate = () => {
    setForm(EMPTY_FORM);
    setImageFile(null);
    setImagePreview("");
    setUiError("");
    setShowForm(true);
  };

  const openEdit = (p) => {
    setForm({
      id: p.id,
      name: p.name ?? "",
      category_id: String(p.category_id ?? ""),
      cost_price: String(p.cost_price ?? ""),
      sale_price: String(p.sale_price ?? ""),
      current_stock: String(p.current_stock ?? ""),
      is_active: Boolean(p.is_active),
    });
    setImageFile(null);
    setImagePreview(resolveImageUrl(p));
    setUiError("");
    setShowForm(true);
  };

  const closeForm = () => {
    setForm(EMPTY_FORM);
    setImageFile(null);
    setImagePreview("");
    setUiError("");
    setShowForm(false);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handlePickImage = (file) => {
    setImageFile(file || null);
    if (!file) {
      setImagePreview("");
      return;
    }
    setImagePreview(URL.createObjectURL(file));
  };

  /* ========================= SAVE PRODUCT ========================= */
  const saveProduct = async () => {
    setUiError("");
    if (!form.name.trim()) return setUiError("Nombre obligatorio");
    if (!form.category_id) return setUiError("Categoría obligatoria");

    const cost = Number(form.cost_price);
    const sale = Number(form.sale_price);
    const stock = Number(form.current_stock);

    if (Number.isNaN(cost) || cost < 0) return setUiError("Precio compra inválido");
    if (Number.isNaN(sale) || sale <= 0) return setUiError("Precio venta inválido");
    if (Number.isNaN(stock) || stock < 0) return setUiError("Stock inválido");

    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("name", form.name.trim());
      fd.append("category_id", String(form.category_id));
      fd.append("cost_price", String(cost));
      fd.append("sale_price", String(sale));
      fd.append("unit", "UND");
      fd.append("is_active", form.is_active ? "1" : "0");
      if (imageFile) fd.append("image", imageFile);

      if (form.id) {
        await api.put(`/products/${form.id}`, fd, { headers: { "Content-Type": "multipart/form-data" } });
        await api.patch(`/products/${form.id}/stock/set`, { current_stock: stock });
      } else {
        const res = await api.post("/products", fd, { headers: { "Content-Type": "multipart/form-data" } });
        if (res?.data?.product?.id) {
          await api.patch(`/products/${res.data.product.id}/stock/set`, { current_stock: stock });
        }
      }
      await loadAll();
      closeForm();
    } catch (err) {
      setUiError(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const hardDelete = async (p) => {
    if (!window.confirm(`¿Eliminar DEFINITIVAMENTE "${p.name}"?`)) return;
    try {
      await api.delete(`/products/${p.id}/hard`);
      await loadAll();
    } catch (err) {
      setUiError(getApiErrorMessage(err));
    }
  };

  if (loading) return <div style={{ color: "#D4AF37", padding: "40px", textAlign: "center", fontSize: "1.2rem" }}>Cargando Inventario...</div>;

  return (
    <div style={{ maxWidth: "1250px", margin: "0 auto", animation: "fadeIn 0.5s ease" }}>
      
      {/* HEADER DINÁMICO */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        backgroundColor: "#111", padding: "30px", borderRadius: "15px",
        border: "1px solid #D4AF37", marginBottom: "30px", boxShadow: "0 10px 30px rgba(0,0,0,0.5)"
      }}>
        <div>
          <h1 style={{ color: "#D4AF37", margin: 0, fontSize: "2rem", letterSpacing: "3px", fontWeight: "bold" }}>PRODUCTOS</h1>
          <p style={{ color: "#888", fontSize: "0.9rem", margin: "5px 0 0 0" }}>Dynatos Market & Licorería POS</p>
        </div>
        <button onClick={openCreate} style={{
          backgroundColor: "#D4AF37", color: "#000", border: "none", padding: "14px 28px",
          borderRadius: "10px", fontWeight: "bold", cursor: "pointer", display: "flex", alignItems: "center", 
          gap: "10px", fontSize: "1rem", transition: "0.3s"
        }}>
          <FiPlus size={20} /> NUEVO PRODUCTO
        </button>
      </div>

      {/* CATEGORÍAS PROFESIONALES */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "30px", overflowX: "auto", paddingBottom: "10px" }}>
        <button
          onClick={() => setSelectedCategory("ALL")}
          style={{
            padding: "12px 24px", borderRadius: "10px", border: "1px solid #D4AF37",
            backgroundColor: selectedCategory === "ALL" ? "#D4AF37" : "transparent",
            color: selectedCategory === "ALL" ? "#000" : "#D4AF37",
            fontWeight: "bold", cursor: "pointer", transition: "0.3s", whiteSpace: "nowrap"
          }}
        >
          TODOS
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelectedCategory(String(c.id))}
            style={{
              padding: "12px 24px", borderRadius: "10px", border: "1px solid #333",
              backgroundColor: selectedCategory === String(c.id) ? "#D4AF37" : "#111",
              color: selectedCategory === String(c.id) ? "#000" : "#eee",
              fontWeight: "bold", cursor: "pointer", transition: "0.3s", whiteSpace: "nowrap"
            }}
          >
            {c.name.toUpperCase()}
          </button>
        ))}
      </div>

      {uiError && (
        <div style={{ backgroundColor: "#300", color: "#f88", padding: "15px", borderRadius: "10px", border: "1px solid #f00", marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
          <FiAlertCircle /> {uiError}
        </div>
      )}

      {/* MODAL FORM (REEMPLAZA AL FORMULARIO SIMPLE) */}
      {showForm && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.85)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ backgroundColor: "#111", border: "1px solid #D4AF37", padding: "40px", borderRadius: "20px", width: "100%", maxWidth: "650px", boxShadow: "0 0 50px rgba(0,0,0,1)" }}>
            <h3 style={{ color: "#D4AF37", marginTop: 0, marginBottom: "30px", fontSize: "1.5rem" }}>
              {form.id ? "EDITAR PRODUCTO" : "NUEVO PRODUCTO"}
            </h3>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              <div style={{ gridColumn: "span 2" }}>
                <label style={{ color: "#D4AF37", fontSize: "0.8rem", display: "block", marginBottom: "5px" }}>NOMBRE</label>
                <input name="name" value={form.name} onChange={handleChange} style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #333", backgroundColor: "#000", color: "#fff" }} />
              </div>
              <div>
                <label style={{ color: "#D4AF37", fontSize: "0.8rem", display: "block", marginBottom: "5px" }}>CATEGORÍA</label>
                <select name="category_id" value={form.category_id} onChange={handleChange} style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #333", backgroundColor: "#000", color: "#fff" }}>
                  <option value="">Seleccione...</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ color: "#D4AF37", fontSize: "0.8rem", display: "block", marginBottom: "5px" }}>STOCK INICIAL</label>
                <input name="current_stock" type="number" value={form.current_stock} onChange={handleChange} style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #333", backgroundColor: "#000", color: "#fff" }} />
              </div>
              <div>
                <label style={{ color: "#D4AF37", fontSize: "0.8rem", display: "block", marginBottom: "5px" }}>COSTO (COMPRA)</label>
                <input name="cost_price" type="number" value={form.cost_price} onChange={handleChange} style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #333", backgroundColor: "#000", color: "#fff" }} />
              </div>
              <div>
                <label style={{ color: "#D4AF37", fontSize: "0.8rem", display: "block", marginBottom: "5px" }}>PRECIO VENTA</label>
                <input name="sale_price" type="number" value={form.sale_price} onChange={handleChange} style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #333", backgroundColor: "#000", color: "#fff" }} />
              </div>
              <div style={{ gridColumn: "span 2" }}>
                <label style={{ color: "#D4AF37", fontSize: "0.8rem", display: "block", marginBottom: "5px" }}>IMAGEN</label>
                <input type="file" onChange={(e) => handlePickImage(e.target.files?.[0])} style={{ color: "#888" }} />
                {imagePreview && <img src={imagePreview} style={{ width: "60px", height: "60px", marginTop: "10px", borderRadius: "5px", border: "1px solid #D4AF37", objectFit: "cover" }} alt="prev" />}
              </div>
            </div>

            <div style={{ display: "flex", gap: "15px", marginTop: "30px" }}>
              <button onClick={closeForm} style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "1px solid #333", backgroundColor: "transparent", color: "#888", cursor: "pointer" }}>CANCELAR</button>
              <button onClick={saveProduct} disabled={saving} style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "none", backgroundColor: "#D4AF37", color: "#000", fontWeight: "bold", cursor: "pointer" }}>
                {saving ? "GUARDANDO..." : "GUARDAR"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TABLA PRINCIPAL */}
      <div style={{ backgroundColor: "#111", borderRadius: "15px", border: "1px solid #222", overflow: "hidden", boxShadow: "0 10px 30px rgba(0,0,0,0.3)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", color: "#eee", fontSize: "0.95rem" }}>
          <thead>
            <tr style={{ backgroundColor: "#1a1a1a", color: "#D4AF37", textAlign: "left" }}>
              <th style={{ padding: "20px", borderBottom: "1px solid #222" }}>PRODUCTO</th>
              <th style={{ padding: "20px", borderBottom: "1px solid #222" }}>CATEGORÍA</th>
              <th style={{ padding: "20px", borderBottom: "1px solid #222", textAlign: "right" }}>VENTA</th>
              <th style={{ padding: "20px", borderBottom: "1px solid #222", textAlign: "right" }}>GANANCIA</th>
              <th style={{ padding: "20px", borderBottom: "1px solid #222", textAlign: "center" }}>STOCK</th>
              <th style={{ padding: "20px", borderBottom: "1px solid #222", textAlign: "center" }}>ACCIONES</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map(p => (
              <tr key={p.id} style={{ borderBottom: "1px solid #222", transition: "0.2s" }} onMouseOver={e => e.currentTarget.style.backgroundColor = "#161616"} onMouseOut={e => e.currentTarget.style.backgroundColor = "transparent"}>
                <td style={{ padding: "20px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                    <div style={{ width: "45px", height: "45px", backgroundColor: "#000", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #333", overflow: "hidden" }}>
                      {p.image_filename ? <img src={resolveImageUrl(p)} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <FiPackage style={{ color: "#333" }} />}
                    </div>
                    <span style={{ fontWeight: "bold" }}>{p.name}</span>
                  </div>
                </td>
                <td style={{ padding: "20px", color: "#888" }}>{categoryNameById.get(String(p.category_id))}</td>
                <td style={{ padding: "20px", textAlign: "right", color: "#D4AF37", fontWeight: "bold" }}>{money(p.sale_price)}</td>
                <td style={{ padding: "20px", textAlign: "right", color: "#5c5" }}>+{money(p.sale_price - p.cost_price)}</td>
                <td style={{ padding: "20px", textAlign: "center" }}>
                  <span style={{ 
                    padding: "5px 12px", borderRadius: "6px", fontSize: "0.85rem", fontWeight: "bold",
                    backgroundColor: p.current_stock < 5 ? "#411" : "#114",
                    color: p.current_stock < 5 ? "#f88" : "#8af",
                    border: p.current_stock < 5 ? "1px solid #822" : "1px solid #228"
                  }}>
                    {p.current_stock}
                  </span>
                </td>
                <td style={{ padding: "20px", textAlign: "center" }}>
                  <button onClick={() => openEdit(p)} style={{ background: "none", border: "none", color: "#D4AF37", cursor: "pointer", marginRight: "15px" }}><FiEdit2 size={18} /></button>
                  <button onClick={() => hardDelete(p)} style={{ background: "none", border: "none", color: "#f55", cursor: "pointer" }}><FiTrash2 size={18} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
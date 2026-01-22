import { useEffect, useMemo, useState } from "react";
import api from "../api/api";
import { FiPlus, FiEdit2, FiTrash2, FiPackage, FiAlertCircle } from "react-icons/fi";

const EMPTY_FORM = {
  id: null,
  name: "",
  category_id: "",
  barcode: "",              // 🆕 NUEVO
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
      barcode: p.barcode ?? "",          // 🆕 CARGAR BARCODE
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

      // 🆕 BARCODE SOLO SI VIENE LLENO
      if (form.barcode.trim()) {
        fd.append("barcode", form.barcode.trim());
      }

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

      {/* HEADER */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        backgroundColor: "#111", padding: "30px", borderRadius: "15px",
        border: "1px solid #D4AF37", marginBottom: "30px"
      }}>
        <div>
          <h1 style={{ color: "#D4AF37", margin: 0, fontSize: "2rem", letterSpacing: "3px", fontWeight: "bold" }}>PRODUCTOS</h1>
          <p style={{ color: "#888", fontSize: "0.9rem", margin: "5px 0 0 0" }}>Dynatos Market & Licorería POS</p>
        </div>
        <button onClick={openCreate} style={{
          backgroundColor: "#D4AF37", color: "#000", border: "none", padding: "14px 28px",
          borderRadius: "10px", fontWeight: "bold", cursor: "pointer",
          display: "flex", alignItems: "center", gap: "10px"
        }}>
          <FiPlus size={20} /> NUEVO PRODUCTO
        </button>
      </div>

      {uiError && (
        <div style={{ backgroundColor: "#300", color: "#f88", padding: "15px", borderRadius: "10px", border: "1px solid #f00", marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
          <FiAlertCircle /> {uiError}
        </div>
      )}

      {/* MODAL FORM */}
      {showForm && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.85)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ backgroundColor: "#111", border: "1px solid #D4AF37", padding: "40px", borderRadius: "20px", width: "100%", maxWidth: "650px" }}>

            <h3 style={{ color: "#D4AF37", marginTop: 0, marginBottom: "30px", fontSize: "1.5rem" }}>
              {form.id ? "EDITAR PRODUCTO" : "NUEVO PRODUCTO"}
            </h3>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              <div style={{ gridColumn: "span 2" }}>
                <label style={{ color: "#D4AF37", fontSize: "0.8rem" }}>NOMBRE</label>
                <input name="name" value={form.name} onChange={handleChange} style={{ width: "100%", padding: "12px", borderRadius: "8px", backgroundColor: "#000", color: "#fff", border: "1px solid #333" }} />
              </div>

              {/* 🆕 BARCODE */}
              <div style={{ gridColumn: "span 2" }}>
                <label style={{ color: "#D4AF37", fontSize: "0.8rem" }}>CÓDIGO DE BARRAS (OPCIONAL)</label>
                <input
                  name="barcode"
                  value={form.barcode}
                  onChange={handleChange}
                  placeholder="Escanea o escribe el código"
                  style={{ width: "100%", padding: "12px", borderRadius: "8px", backgroundColor: "#000", color: "#fff", border: "1px solid #333" }}
                />
              </div>

              <div>
                <label style={{ color: "#D4AF37", fontSize: "0.8rem" }}>CATEGORÍA</label>
                <select name="category_id" value={form.category_id} onChange={handleChange} style={{ width: "100%", padding: "12px", borderRadius: "8px", backgroundColor: "#000", color: "#fff", border: "1px solid #333" }}>
                  <option value="">Seleccione...</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div>
                <label style={{ color: "#D4AF37", fontSize: "0.8rem" }}>STOCK INICIAL</label>
                <input name="current_stock" type="number" value={form.current_stock} onChange={handleChange} style={{ width: "100%", padding: "12px", borderRadius: "8px", backgroundColor: "#000", color: "#fff", border: "1px solid #333" }} />
              </div>

              <div>
                <label style={{ color: "#D4AF37", fontSize: "0.8rem" }}>COSTO</label>
                <input name="cost_price" type="number" value={form.cost_price} onChange={handleChange} style={{ width: "100%", padding: "12px", borderRadius: "8px", backgroundColor: "#000", color: "#fff", border: "1px solid #333" }} />
              </div>

              <div>
                <label style={{ color: "#D4AF37", fontSize: "0.8rem" }}>PRECIO VENTA</label>
                <input name="sale_price" type="number" value={form.sale_price} onChange={handleChange} style={{ width: "100%", padding: "12px", borderRadius: "8px", backgroundColor: "#000", color: "#fff", border: "1px solid #333" }} />
              </div>

              <div style={{ gridColumn: "span 2" }}>
                <label style={{ color: "#D4AF37", fontSize: "0.8rem" }}>IMAGEN</label>
                <input type="file" onChange={(e) => handlePickImage(e.target.files?.[0])} />
                {imagePreview && <img src={imagePreview} style={{ width: "60px", height: "60px", marginTop: "10px", borderRadius: "5px", border: "1px solid #D4AF37" }} />}
              </div>
            </div>

            <div style={{ display: "flex", gap: "15px", marginTop: "30px" }}>
              <button onClick={closeForm} style={{ flex: 1, padding: "12px", borderRadius: "8px", backgroundColor: "transparent", border: "1px solid #333", color: "#888" }}>CANCELAR</button>
              <button onClick={saveProduct} disabled={saving} style={{ flex: 1, padding: "12px", borderRadius: "8px", backgroundColor: "#D4AF37", border: "none", fontWeight: "bold" }}>
                {saving ? "GUARDANDO..." : "GUARDAR"}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* TABLA (SIN CAMBIOS) */}
      {/* … el resto de tu tabla queda EXACTAMENTE igual */}
    </div>
  );
}

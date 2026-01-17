import { useEffect, useMemo, useState } from "react";
import api from "../api/api";

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

  // 🔑 imagen real
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  /* =========================
     LOAD DATA
  ========================= */
  useEffect(() => {
    loadAll();
  }, []);

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

  /* =========================
     HELPERS
  ========================= */
  const categoryNameById = useMemo(() => {
    const map = new Map();
    categories.forEach((c) => map.set(String(c.id), c.name));
    return map;
  }, [categories]);

  const filteredProducts = useMemo(() => {
    if (selectedCategory === "ALL") return products;
    return products.filter(
      (p) => String(p.category_id) === String(selectedCategory)
    );
  }, [products, selectedCategory]);

  const resolveImageUrl = (p) => {
    if (!p?.image_filename) return "";
    const base = api.defaults.baseURL?.replace(/\/$/, "") || "";
    return `${base}/uploads/products/${p.image_filename}`;
  };

  /* =========================
     FORM HANDLERS
  ========================= */
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

  /* =========================
     SAVE PRODUCT (CREATE + UPDATE)
  ========================= */
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
        await api.put(`/products/${form.id}`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        await api.patch(`/products/${form.id}/stock/set`, {
          current_stock: stock,
        });
      } else {
        const res = await api.post("/products", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        if (res?.data?.product?.id) {
          await api.patch(`/products/${res.data.product.id}/stock/set`, {
            current_stock: stock,
          });
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

  /* =========================
     HARD DELETE
  ========================= */
  const hardDelete = async (p) => {
    if (!window.confirm(`Eliminar DEFINITIVAMENTE "${p.name}"?`)) return;
    try {
      await api.delete(`/products/${p.id}/hard`);
      await loadAll();
    } catch (err) {
      setUiError(getApiErrorMessage(err));
    }
  };

  /* =========================
     UI
  ========================= */
  if (loading) return <div className="p-6">Cargando…</div>;

  return (
    <div className="bg-white p-6 rounded shadow">
      <div className="flex justify-between mb-4">
        <h2 className="text-xl font-semibold">Productos</h2>
        <button className="bg-black text-white px-4 py-2 rounded" onClick={openCreate}>
          + Nuevo producto
        </button>
      </div>

      {/* FILTRO */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <button
          className={`px-3 py-1 rounded ${selectedCategory === "ALL" ? "bg-black text-white" : "bg-gray-200"}`}
          onClick={() => setSelectedCategory("ALL")}
        >
          Todas
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            className={`px-3 py-1 rounded ${
              selectedCategory === String(c.id) ? "bg-black text-white" : "bg-gray-200"
            }`}
            onClick={() => setSelectedCategory(String(c.id))}
          >
            {c.name}
          </button>
        ))}
      </div>

      {uiError && (
        <div className="mb-3 p-3 bg-red-50 border border-red-300 text-red-700 text-sm">
          {uiError}
        </div>
      )}

      {/* FORM */}
      {showForm && (
        <div className="border p-4 rounded mb-6 bg-gray-50">
          <h3 className="font-semibold mb-3">
            {form.id ? "Editar producto" : "Nuevo producto"}
          </h3>

          <div className="grid grid-cols-2 gap-3">
            <input name="name" placeholder="Nombre" className="border p-2 col-span-2"
              value={form.name} onChange={handleChange} />

            <select name="category_id" className="border p-2"
              value={form.category_id} onChange={handleChange}>
              <option value="">Categoría</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            <input name="current_stock" type="number" placeholder="Stock"
              className="border p-2" value={form.current_stock}
              onChange={handleChange} />

            <input name="cost_price" type="number" placeholder="Precio compra"
              className="border p-2" value={form.cost_price}
              onChange={handleChange} />

            <input name="sale_price" type="number" placeholder="Precio venta"
              className="border p-2" value={form.sale_price}
              onChange={handleChange} />

            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="border p-2 col-span-2"
              onChange={(e) => handlePickImage(e.target.files?.[0])}
            />

            {imagePreview && (
              <img src={imagePreview} alt="preview" className="w-24 h-24 object-cover rounded border" />
            )}
          </div>

          <div className="flex gap-2 mt-4">
            <button className="bg-gray-300 px-4 py-2 rounded" onClick={closeForm}>
              Cancelar
            </button>
            <button className="bg-black text-white px-4 py-2 rounded"
              onClick={saveProduct} disabled={saving}>
              Guardar
            </button>
          </div>
        </div>
      )}

      {/* TABLA */}
      <table className="w-full text-sm border">
        <thead className="bg-gray-100">
          <tr>
            <th className="border px-2">Producto</th>
            <th className="border px-2">Categoría</th>
            <th className="border px-2">Compra</th>
            <th className="border px-2">Venta</th>
            <th className="border px-2">Ganancia</th>
            <th className="border px-2">Stock</th>
            <th className="border px-2">Activo</th>
            <th className="border px-2">Acción</th>
          </tr>
        </thead>
        <tbody>
          {filteredProducts.map(p => (
            <tr key={p.id}>
              <td className="border px-2">{p.name}</td>
              <td className="border px-2">{categoryNameById.get(String(p.category_id))}</td>
              <td className="border px-2 text-right">{money(p.cost_price)}</td>
              <td className="border px-2 text-right">{money(p.sale_price)}</td>
              <td className="border px-2 text-right">{money(p.sale_price - p.cost_price)}</td>
              <td className="border px-2 text-center">{p.current_stock}</td>
              <td className="border px-2 text-center">{p.is_active ? "Sí" : "No"}</td>
              <td className="border px-2 text-center">
                <button className="text-blue-600 mr-2" onClick={() => openEdit(p)}>Editar</button>
                <button className="text-red-600" onClick={() => hardDelete(p)}>Eliminar definitivo</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

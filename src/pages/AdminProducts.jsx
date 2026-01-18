import { useEffect, useMemo, useState } from "react";
import api from "../api/api";
import { FiPlus, FiEdit2, FiTrash2, FiPackage, FiImage } from "react-icons/fi"; // Asegúrate de tener react-icons

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

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="text-[#D4AF37] text-xl animate-pulse font-serif">Cargando inventario...</div>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* HEADER */}
      <div className="flex justify-between items-center bg-[#111] p-6 rounded-xl border border-[#D4AF37]/30 shadow-2xl">
        <div>
          <h2 className="text-3xl font-serif text-[#D4AF37] tracking-wider uppercase">Inventario</h2>
          <p className="text-gray-400 text-sm">Gestión de productos Dynatos Premium</p>
        </div>
        <button 
          className="bg-[#D4AF37] hover:bg-[#B8962E] text-black px-6 py-3 rounded-lg font-bold flex items-center gap-2 transition-all transform hover:scale-105 shadow-lg"
          onClick={openCreate}
        >
          <FiPlus size={20} /> NUEVO PRODUCTO
        </button>
      </div>

      {/* FILTROS */}
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        <button
          className={`px-5 py-2 rounded-full border transition-all whitespace-nowrap ${
            selectedCategory === "ALL" 
            ? "bg-[#D4AF37] border-[#D4AF37] text-black font-bold" 
            : "bg-transparent border-[#333] text-gray-400 hover:border-[#D4AF37]"
          }`}
          onClick={() => setSelectedCategory("ALL")}
        >
          Todas las Categorías
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            className={`px-5 py-2 rounded-full border transition-all whitespace-nowrap ${
              selectedCategory === String(c.id) 
              ? "bg-[#D4AF37] border-[#D4AF37] text-black font-bold" 
              : "bg-transparent border-[#333] text-gray-400 hover:border-[#D4AF37]"
            }`}
            onClick={() => setSelectedCategory(String(c.id))}
          >
            {c.name}
          </button>
        ))}
      </div>

      {uiError && (
        <div className="bg-red-900/30 border border-red-500 text-red-200 p-4 rounded-lg text-sm animate-shake">
          {uiError}
        </div>
      )}

      {/* MODAL FORM (ESTILO PREMIUM) */}
      {showForm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[1100] flex items-center justify-center p-4">
          <div className="bg-[#111] border border-[#D4AF37] p-8 rounded-2xl w-full max-w-2xl shadow-2xl overflow-y-auto max-h-[90vh]">
            <h3 className="text-2xl font-serif text-[#D4AF37] mb-6 flex items-center gap-2">
              {form.id ? <FiEdit2 /> : <FiPlus />}
              {form.id ? "EDITAR PRODUCTO" : "REGISTRAR PRODUCTO"}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <label className="text-[#D4AF37] text-xs font-bold mb-1 block">NOMBRE DEL PRODUCTO</label>
                <input name="name" className="w-full bg-[#0a0a0a] border border-[#333] p-3 rounded-lg text-white focus:border-[#D4AF37] outline-none transition-all"
                  value={form.name} onChange={handleChange} placeholder="Ej: Whisky Blue Label" />
              </div>

              <div>
                <label className="text-[#D4AF37] text-xs font-bold mb-1 block">CATEGORÍA</label>
                <select name="category_id" className="w-full bg-[#0a0a0a] border border-[#333] p-3 rounded-lg text-white focus:border-[#D4AF37] outline-none"
                  value={form.category_id} onChange={handleChange}>
                  <option value="">Seleccionar...</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[#D4AF37] text-xs font-bold mb-1 block">STOCK ACTUAL</label>
                <input name="current_stock" type="number" className="w-full bg-[#0a0a0a] border border-[#333] p-3 rounded-lg text-white focus:border-[#D4AF37] outline-none"
                  value={form.current_stock} onChange={handleChange} />
              </div>

              <div>
                <label className="text-[#D4AF37] text-xs font-bold mb-1 block">PRECIO DE COMPRA</label>
                <input name="cost_price" type="number" className="w-full bg-[#0a0a0a] border border-[#333] p-3 rounded-lg text-white focus:border-[#D4AF37] outline-none"
                  value={form.cost_price} onChange={handleChange} />
              </div>

              <div>
                <label className="text-[#D4AF37] text-xs font-bold mb-1 block">PRECIO DE VENTA</label>
                <input name="sale_price" type="number" className="w-full bg-[#0a0a0a] border border-[#333] p-3 rounded-lg text-white focus:border-[#D4AF37] outline-none"
                  value={form.sale_price} onChange={handleChange} />
              </div>

              <div className="md:col-span-2">
                <label className="text-[#D4AF37] text-xs font-bold mb-2 block">IMAGEN DEL PRODUCTO</label>
                <div className="flex items-center gap-4 bg-[#0a0a0a] p-4 rounded-lg border border-dashed border-[#333]">
                  {imagePreview ? (
                    <img src={imagePreview} alt="preview" className="w-20 h-20 object-cover rounded-lg border border-[#D4AF37]" />
                  ) : (
                    <div className="w-20 h-20 bg-[#111] rounded-lg flex items-center justify-center text-[#333]">
                      <FiImage size={30} />
                    </div>
                  )}
                  <input type="file" accept="image/*" className="text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#D4AF37] file:text-black hover:file:bg-[#B8962E] cursor-pointer"
                    onChange={(e) => handlePickImage(e.target.files?.[0])} />
                </div>
              </div>
            </div>

            <div className="flex gap-4 mt-8">
              <button className="flex-1 bg-transparent border border-[#333] text-gray-400 px-4 py-3 rounded-lg hover:bg-[#222] transition-all" onClick={closeForm}>
                CANCELAR
              </button>
              <button className="flex-1 bg-[#D4AF37] text-black font-bold px-4 py-3 rounded-lg hover:shadow-[0_0_15px_rgba(212,175,55,0.4)] transition-all"
                onClick={saveProduct} disabled={saving}>
                {saving ? "GUARDANDO..." : "GUARDAR CAMBIOS"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TABLA PREMIUM */}
      <div className="bg-[#111] rounded-xl border border-[#333] overflow-hidden shadow-2xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#1a1a1a] border-b border-[#D4AF37]/20">
              <th className="p-4 text-[#D4AF37] font-serif uppercase text-xs tracking-widest">Producto</th>
              <th className="p-4 text-[#D4AF37] font-serif uppercase text-xs tracking-widest">Categoría</th>
              <th className="p-4 text-[#D4AF37] font-serif uppercase text-xs tracking-widest text-right">Compra</th>
              <th className="p-4 text-[#D4AF37] font-serif uppercase text-xs tracking-widest text-right">Venta</th>
              <th className="p-4 text-[#D4AF37] font-serif uppercase text-xs tracking-widest text-right">Ganancia</th>
              <th className="p-4 text-[#D4AF37] font-serif uppercase text-xs tracking-widest text-center">Stock</th>
              <th className="p-4 text-[#D4AF37] font-serif uppercase text-xs tracking-widest text-center">Estado</th>
              <th className="p-4 text-[#D4AF37] font-serif uppercase text-xs tracking-widest text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#222]">
            {filteredProducts.map(p => (
              <tr key={p.id} className="hover:bg-[#1a1a1a] transition-all group">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded bg-[#222] flex items-center justify-center overflow-hidden border border-[#333]">
                       {p.image_filename ? <img src={resolveImageUrl(p)} alt="" className="w-full h-full object-cover"/> : <FiPackage className="text-[#444]"/>}
                    </div>
                    <span className="font-bold text-gray-200">{p.name}</span>
                  </div>
                </td>
                <td className="p-4 text-gray-400">{categoryNameById.get(String(p.category_id))}</td>
                <td className="p-4 text-right text-gray-400">{money(p.cost_price)}</td>
                <td className="p-4 text-right text-[#D4AF37] font-bold">{money(p.sale_price)}</td>
                <td className="p-4 text-right text-green-500 font-medium">+{money(p.sale_price - p.cost_price)}</td>
                <td className="p-4 text-center">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${Number(p.current_stock) < 5 ? "bg-red-900/40 text-red-400" : "bg-blue-900/40 text-blue-400"}`}>
                    {p.current_stock}
                  </span>
                </td>
                <td className="p-4 text-center">
                  <span className={`text-[10px] uppercase px-2 py-1 rounded-full border ${p.is_active ? "border-green-500 text-green-500" : "border-gray-600 text-gray-600"}`}>
                    {p.is_active ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td className="p-4 text-center">
                  <div className="flex justify-center gap-2">
                    <button className="p-2 bg-[#222] text-[#D4AF37] rounded hover:bg-[#D4AF37] hover:text-black transition-all" onClick={() => openEdit(p)}>
                      <FiEdit2 size={16}/>
                    </button>
                    <button className="p-2 bg-[#222] text-red-500 rounded hover:bg-red-500 hover:text-white transition-all" onClick={() => hardDelete(p)}>
                      <FiTrash2 size={16}/>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
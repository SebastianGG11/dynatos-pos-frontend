import { useEffect, useState } from "react";
import api from "../api/api";

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

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    try {
      const [promoRes, prodRes] = await Promise.all([
        api.get("/promotions"),
        api.get("/products")
      ]);

      setPromotions(promoRes.data.items || []);
      setProducts(prodRes.data.items || []);
    } catch {
      setError("Error cargando promociones");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const savePromotion = async () => {
    setError("");

    if (!form.name || !form.product_id || !form.discount_value) {
      setError("Completa todos los campos");
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
      setError(
        err?.response?.data?.message || "Error creando promoción"
      );
    }
  };

  const deletePromotion = async (id) => {
    if (!window.confirm("¿Eliminar promoción definitivamente?")) return;
    await api.delete(`/promotions/${id}`);
    loadAll();
  };

  return (
    <div className="bg-black text-white p-6 rounded">
      <div className="flex justify-between mb-4">
        <h2 className="text-xl font-semibold">Promociones</h2>
        <button
          className="bg-white text-black px-4 py-2 rounded"
          onClick={() => setShowForm(true)}
        >
          + Nueva promoción
        </button>
      </div>

      {error && (
        <div className="mb-3 p-3 bg-red-900 text-red-200 text-sm">
          {error}
        </div>
      )}

      {showForm && (
        <div className="border border-gray-700 p-4 mb-6">
          <input
            name="name"
            placeholder="Nombre promoción"
            className="w-full p-2 mb-2"
            value={form.name}
            onChange={handleChange}
          />

          <select
            name="type"
            className="w-full p-2 mb-2"
            value={form.type}
            onChange={handleChange}
          >
            <option value="INDIVIDUAL">Individual</option>
            <option value="PACK">Paquete</option>
          </select>

          <select
            name="product_id"
            className="w-full p-2 mb-2"
            value={form.product_id}
            onChange={handleChange}
          >
            <option value="">Producto</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          {form.type === "PACK" && (
            <input
              type="number"
              name="min_quantity"
              placeholder="Cantidad mínima"
              className="w-full p-2 mb-2"
              value={form.min_quantity}
              onChange={handleChange}
            />
          )}

          <select
            name="discount_type"
            className="w-full p-2 mb-2"
            value={form.discount_type}
            onChange={handleChange}
          >
            <option value="PERCENT">Porcentaje</option>
            <option value="FIXED">Valor fijo</option>
          </select>

          <input
            type="number"
            name="discount_value"
            placeholder="Valor descuento"
            className="w-full p-2 mb-3"
            value={form.discount_value}
            onChange={handleChange}
          />

          <div className="flex gap-2">
            <button
              className="bg-gray-700 px-4 py-2"
              onClick={() => setShowForm(false)}
            >
              Cancelar
            </button>
            <button
              className="bg-white text-black px-4 py-2"
              onClick={savePromotion}
            >
              Guardar
            </button>
          </div>
        </div>
      )}

      <table className="w-full text-sm border border-gray-700">
        <thead>
          <tr>
            <th className="border px-2">Nombre</th>
            <th className="border px-2">Tipo</th>
            <th className="border px-2">Producto</th>
            <th className="border px-2">Desc.</th>
            <th className="border px-2">Activo</th>
            <th className="border px-2">Acción</th>
          </tr>
        </thead>
        <tbody>
          {promotions.map((p) => (
            <tr key={p.id}>
              <td className="border px-2">{p.name}</td>
              <td className="border px-2">{p.type}</td>
              <td className="border px-2">{p.product_id}</td>
              <td className="border px-2">
                {p.discount_type} {p.discount_value}
              </td>
              <td className="border px-2">
                {p.is_active ? "Sí" : "No"}
              </td>
              <td className="border px-2">
                <button
                  className="text-red-400"
                  onClick={() => deletePromotion(p.id)}
                >
                  Eliminar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

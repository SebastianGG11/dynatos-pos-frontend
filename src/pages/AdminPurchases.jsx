import { useState, useEffect } from "react";
import api from "../api/api";
import { FiPlus, FiTrash2, FiAlertCircle, FiFileText, FiX } from "react-icons/fi";

export default function AdminPurchases() {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uiError, setUiError] = useState("");

  const [form, setForm] = useState({
    supplier_name: "",
    invoice_number: "",
    notes: ""
  });

  // ✅ NUEVA FUNCIONALIDAD: Lista de productos
  const [products, setProducts] = useState([
    { id: Date.now(), name: "", quantity: "", unit_price: "" }
  ]);

  useEffect(() => {
    loadPurchases();
  }, []);

  const loadPurchases = async () => {
    setLoading(true);
    try {
      const res = await api.get("/purchases");
      setPurchases(res.data?.items ?? []);
    } catch (err) {
      console.error("Error cargando compras:", err);
      setPurchases([]);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  // ✅ Agregar producto a la lista
  const addProduct = () => {
    setProducts([...products, { id: Date.now(), name: "", quantity: "", unit_price: "" }]);
  };

  // ✅ Actualizar datos de un producto
  const updateProduct = (id, field, value) => {
    setProducts(products.map(p => 
      p.id === id ? { ...p, [field]: value } : p
    ));
  };

  // ✅ Eliminar producto de la lista
  const removeProduct = (id) => {
    if (products.length === 1) return; // Mantener al menos 1
    setProducts(products.filter(p => p.id !== id));
  };

  // ✅ Calcular total automáticamente
  const calculateTotal = () => {
    return products.reduce((sum, p) => {
      const qty = Number(p.quantity) || 0;
      const price = Number(p.unit_price) || 0;
      return sum + (qty * price);
    }, 0);
  };

  const savePurchase = async () => {
    setUiError("");
    if (!form.supplier_name) {
      return setUiError("El Proveedor es obligatorio");
    }

    // Validar que haya al menos un producto con datos
    const validProducts = products.filter(p => p.name && p.quantity && p.unit_price);
    if (validProducts.length === 0) {
      return setUiError("Debes agregar al menos un producto con nombre, cantidad y precio");
    }

    setSaving(true);
    try {
      const total = calculateTotal();
      
      // Guardar productos en el campo notes como JSON
      const productDetails = validProducts.map(p => 
        `${p.quantity}x ${p.name} @ $${Number(p.unit_price).toLocaleString()}`
      ).join("\n");

      await api.post("/purchases", {
        supplier_name: form.supplier_name,
        invoice_number: form.invoice_number,
        total_amount: total,
        notes: `${form.notes ? form.notes + "\n\n" : ""}PRODUCTOS:\n${productDetails}`
      });

      await loadPurchases();
      setShowForm(false);
      setForm({ supplier_name: "", invoice_number: "", notes: "" });
      setProducts([{ id: Date.now(), name: "", quantity: "", unit_price: "" }]);
      alert("¡Compra registrada con éxito!");
    } catch (err) {
      setUiError("Error al guardar la compra.");
    } finally {
      setSaving(false);
    }
  };

  const deletePurchase = async (id) => {
    if (!window.confirm("¿Seguro que quieres eliminar este registro de compra?")) return;
    try {
      await api.delete(`/purchases/${id}`);
      await loadPurchases();
    } catch (err) {
      alert("No se pudo eliminar el registro.");
    }
  };

  const money = (n) => `$${Number(n).toLocaleString("es-CO")}`;

  if (loading) return <div style={{ color: "#D4AF37", padding: "40px", textAlign: "center" }}>Cargando sistema de compras...</div>;

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
      
      {/* HEADER */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        backgroundColor: "#111", padding: "30px", borderRadius: "15px",
        border: "1px solid #D4AF37", marginBottom: "30px", boxShadow: "0 10px 30px rgba(0,0,0,0.5)"
      }}>
        <div>
          <h1 style={{ color: "#D4AF37", margin: 0, fontSize: "2rem", letterSpacing: "3px", fontWeight: "bold" }}>COMPRAS</h1>
          <p style={{ color: "#888", fontSize: "0.9rem" }}>Control de Mercancía y Proveedores</p>
        </div>
        <button onClick={() => setShowForm(true)} style={{
          backgroundColor: "#D4AF37", color: "#000", border: "none", padding: "14px 28px",
          borderRadius: "10px", fontWeight: "bold", cursor: "pointer", display: "flex", alignItems: "center", gap: "10px"
        }}>
          <FiPlus size={20} /> REGISTRAR ENTRADA
        </button>
      </div>

      {uiError && (
        <div style={{ backgroundColor: "#300", color: "#f88", padding: "15px", borderRadius: "10px", border: "1px solid #f00", marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
          <FiAlertCircle /> {uiError}
        </div>
      )}

      {/* FORMULARIO MODAL */}
      {showForm && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.95)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ backgroundColor: "#111", border: "1px solid #D4AF37", padding: "40px", borderRadius: "20px", width: "100%", maxWidth: "900px", maxHeight: "90vh", overflowY: "auto" }}>
            <h3 style={{ color: "#D4AF37", marginTop: 0, marginBottom: "30px", fontSize: "1.5rem" }}>REGISTRAR COMPRA</h3>
            
            {/* INFORMACIÓN GENERAL */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "30px" }}>
              <div style={{ gridColumn: "span 2" }}>
                <label style={{ color: "#D4AF37", fontSize: "0.8rem", display: "block", marginBottom: "5px" }}>PROVEEDOR *</label>
                <input name="supplier_name" value={form.supplier_name} onChange={handleChange} placeholder="Ej: Distribuidora Central" style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #333", backgroundColor: "#000", color: "#fff" }} />
              </div>
              <div>
                <label style={{ color: "#D4AF37", fontSize: "0.8rem", display: "block", marginBottom: "5px" }}>N° FACTURA</label>
                <input name="invoice_number" value={form.invoice_number} onChange={handleChange} placeholder="Opcional" style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #333", backgroundColor: "#000", color: "#fff" }} />
              </div>
              <div>
                <label style={{ color: "#D4AF37", fontSize: "0.8rem", display: "block", marginBottom: "5px" }}>TOTAL CALCULADO</label>
                <div style={{ padding: "12px", borderRadius: "8px", border: "2px solid #D4AF37", backgroundColor: "#000", color: "#D4AF37", fontSize: "1.2rem", fontWeight: "bold" }}>
                  {money(calculateTotal())}
                </div>
              </div>
            </div>

            {/* LISTA DE PRODUCTOS */}
            <div style={{ marginBottom: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
                <label style={{ color: "#D4AF37", fontSize: "0.9rem", fontWeight: "bold" }}>PRODUCTOS *</label>
                <button onClick={addProduct} style={{ background: "#2ecc71", color: "#000", border: "none", padding: "8px 15px", borderRadius: "6px", fontWeight: "bold", cursor: "pointer", display: "flex", alignItems: "center", gap: "5px" }}>
                  <FiPlus size={16} /> AGREGAR PRODUCTO
                </button>
              </div>

              <div style={{ background: "#0a0a0a", padding: "15px", borderRadius: "10px", border: "1px solid #222" }}>
                {products.map((product, index) => (
                  <div key={product.id} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr auto", gap: "10px", marginBottom: "10px", alignItems: "center" }}>
                    <input
                      type="text"
                      value={product.name}
                      onChange={(e) => updateProduct(product.id, "name", e.target.value)}
                      placeholder="Nombre del producto"
                      style={{ padding: "10px", borderRadius: "6px", border: "1px solid #333", backgroundColor: "#000", color: "#fff" }}
                    />
                    <input
                      type="number"
                      value={product.quantity}
                      onChange={(e) => updateProduct(product.id, "quantity", e.target.value)}
                      placeholder="Cantidad"
                      style={{ padding: "10px", borderRadius: "6px", border: "1px solid #333", backgroundColor: "#000", color: "#fff" }}
                    />
                    <input
                      type="number"
                      value={product.unit_price}
                      onChange={(e) => updateProduct(product.id, "unit_price", e.target.value)}
                      placeholder="Precio c/u"
                      style={{ padding: "10px", borderRadius: "6px", border: "1px solid #333", backgroundColor: "#000", color: "#fff" }}
                    />
                    <button
                      onClick={() => removeProduct(product.id)}
                      disabled={products.length === 1}
                      style={{ background: "transparent", border: "1px solid #f55", color: "#f55", padding: "10px", borderRadius: "6px", cursor: products.length === 1 ? "not-allowed" : "pointer", opacity: products.length === 1 ? 0.3 : 1 }}
                    >
                      <FiX size={18} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* NOTAS ADICIONALES */}
            <div style={{ marginBottom: "30px" }}>
              <label style={{ color: "#D4AF37", fontSize: "0.8rem", display: "block", marginBottom: "5px" }}>NOTAS ADICIONALES</label>
              <textarea 
                name="notes" 
                value={form.notes} 
                onChange={handleChange} 
                placeholder="Observaciones opcionales..."
                rows="3"
                style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #333", backgroundColor: "#000", color: "#fff", resize: "none", fontFamily: "inherit" }}
              />
            </div>

            {/* BOTONES */}
            <div style={{ display: "flex", gap: "15px" }}>
              <button onClick={() => setShowForm(false)} style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "1px solid #333", backgroundColor: "transparent", color: "#888", cursor: "pointer" }}>CANCELAR</button>
              <button onClick={savePurchase} disabled={saving} style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "none", backgroundColor: "#D4AF37", color: "#000", fontWeight: "bold", cursor: "pointer" }}>
                {saving ? "PROCESANDO..." : "REGISTRAR COMPRA"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LISTADO */}
      <div style={{ backgroundColor: "#111", borderRadius: "15px", border: "1px solid #222", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", color: "#eee" }}>
          <thead>
            <tr style={{ backgroundColor: "#1a1a1a", color: "#D4AF37", textAlign: "left" }}>
              <th style={{ padding: "20px" }}>FECHA</th>
              <th style={{ padding: "20px" }}>PROVEEDOR</th>
              <th style={{ padding: "20px" }}>DETALLES</th>
              <th style={{ padding: "20px", textAlign: "right" }}>TOTAL</th>
              <th style={{ padding: "20px", textAlign: "center" }}>ACCIONES</th>
            </tr>
          </thead>
          <tbody>
            {purchases.length === 0 ? (
              <tr><td colSpan="5" style={{ padding: "40px", textAlign: "center", color: "#555" }}>No hay registros de compras.</td></tr>
            ) : (
              purchases.map(p => (
                <tr key={p.id} style={{ borderBottom: "1px solid #222" }}>
                  <td style={{ padding: "20px" }}>{new Date(p.created_at).toLocaleDateString()}</td>
                  <td style={{ padding: "20px", fontWeight: "bold" }}>{p.supplier_name}</td>
                  <td style={{ padding: "20px", color: "#888", fontSize: "0.85rem", whiteSpace: "pre-line" }}>
                    {p.notes || "Sin descripción"}
                  </td>
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
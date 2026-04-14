import { useState, useEffect } from "react";
import api from "../api/api";
import { FiPlus, FiTrash2, FiAlertCircle, FiX, FiPackage, FiSearch } from "react-icons/fi";

export default function AdminPurchases() {
  const [purchases, setPurchases] = useState([]);
  const [allProducts, setAllProducts] = useState([]); // 🔥 Productos de la DB
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uiError, setUiError] = useState("");

  const [form, setForm] = useState({
    supplier_name: "",
    invoice_number: "",
    notes: ""
  });

  const [products, setProducts] = useState([
    { id: Date.now(), product_id: null, product_name: "", quantity: "", unit_cost: "", isNew: false }
  ]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [purchasesRes, productsRes] = await Promise.all([
        api.get("/purchases"),
        api.get("/products")
      ]);
      setPurchases(purchasesRes.data?.items ?? []);
      setAllProducts(productsRes.data?.items ?? []);
    } catch (err) {
      console.error("Error cargando datos:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const addProductLine = () => {
    setProducts([...products, { 
      id: Date.now(), 
      product_id: null, 
      product_name: "", 
      quantity: "", 
      unit_cost: "", 
      isNew: false 
    }]);
  };

  const updateProductLine = (id, field, value) => {
    setProducts(products.map(p => {
      if (p.id !== id) return p;
      
      // Si cambia el nombre del producto, buscar si existe
      if (field === "product_name") {
        const existingProduct = allProducts.find(prod => 
          prod.name.toLowerCase() === value.toLowerCase()
        );
        
        if (existingProduct) {
          return {
            ...p,
            product_name: existingProduct.name,
            product_id: existingProduct.id,
            unit_cost: existingProduct.cost_price || "",
            isNew: false
          };
        } else {
          return {
            ...p,
            product_name: value,
            product_id: null,
            isNew: true
          };
        }
      }
      
      return { ...p, [field]: value };
    }));
  };

  const selectProduct = (lineId, product) => {
    setProducts(products.map(p => 
      p.id === lineId ? {
        ...p,
        product_id: product.id,
        product_name: product.name,
        unit_cost: product.cost_price || "",
        isNew: false
      } : p
    ));
  };

  const removeProductLine = (id) => {
    if (products.length === 1) return;
    setProducts(products.filter(p => p.id !== id));
  };

  const calculateTotal = () => {
    return products.reduce((sum, p) => {
      const qty = Number(p.quantity) || 0;
      const price = Number(p.unit_cost) || 0;
      return sum + (qty * price);
    }, 0);
  };

  const savePurchase = async () => {
    setUiError("");
    if (!form.supplier_name) {
      return setUiError("El Proveedor es obligatorio");
    }

    const validProducts = products.filter(p => p.product_name && p.quantity && p.unit_cost);
    if (validProducts.length === 0) {
      return setUiError("Debes agregar al menos un producto con nombre, cantidad y precio");
    }

    setSaving(true);
    try {
      const total = calculateTotal();
      
      // Preparar items para el backend
      const items = validProducts.map(p => ({
        product_id: p.product_id,
        product_name: p.product_name,
        quantity: Number(p.quantity),
        unit_cost: Number(p.unit_cost),
        is_new: p.isNew
      }));

      // Enviar compra con items
      await api.post("/purchases", {
        supplier_name: form.supplier_name,
        invoice_number: form.invoice_number,
        total_amount: total,
        notes: form.notes,
        items: items // 🔥 Enviamos los productos
      });

      await loadData(); // Recargar productos y compras
      setShowForm(false);
      setForm({ supplier_name: "", invoice_number: "", notes: "" });
      setProducts([{ id: Date.now(), product_id: null, product_name: "", quantity: "", unit_cost: "", isNew: false }]);
      alert("¡Compra registrada con éxito! Stock actualizado.");
    } catch (err) {
      setUiError("Error al guardar la compra: " + (err.response?.data?.error || err.message));
    } finally {
      setSaving(false);
    }
  };

  const deletePurchase = async (id) => {
    if (!window.confirm("¿Seguro que quieres eliminar este registro de compra?")) return;
    try {
      await api.delete(`/purchases/${id}`);
      await loadData();
    } catch (err) {
      alert("No se pudo eliminar el registro.");
    }
  };

  const money = (n) => `$${Number(n).toLocaleString("es-CO")}`;

  if (loading) return <div style={{ color: "#D4AF37", padding: "40px", textAlign: "center" }}>Cargando sistema de compras...</div>;

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
      
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

      {showForm && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.95)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", overflowY: "auto" }}>
          <div style={{ backgroundColor: "#111", border: "1px solid #D4AF37", padding: "40px", borderRadius: "20px", width: "100%", maxWidth: "1000px", maxHeight: "90vh", overflowY: "auto" }}>
            <h3 style={{ color: "#D4AF37", marginTop: 0, marginBottom: "30px", fontSize: "1.5rem" }}>REGISTRAR COMPRA</h3>
            
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

            <div style={{ marginBottom: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
                <label style={{ color: "#D4AF37", fontSize: "0.9rem", fontWeight: "bold" }}>PRODUCTOS *</label>
                <button onClick={addProductLine} style={{ background: "#2ecc71", color: "#000", border: "none", padding: "8px 15px", borderRadius: "6px", fontWeight: "bold", cursor: "pointer", display: "flex", alignItems: "center", gap: "5px" }}>
                  <FiPlus size={16} /> AGREGAR PRODUCTO
                </button>
              </div>

              <div style={{ background: "#0a0a0a", padding: "15px", borderRadius: "10px", border: "1px solid #222" }}>
                {products.map((product) => (
                  <ProductLine
                    key={product.id}
                    product={product}
                    allProducts={allProducts}
                    onUpdate={updateProductLine}
                    onSelect={selectProduct}
                    onRemove={removeProductLine}
                    canRemove={products.length > 1}
                  />
                ))}
              </div>
            </div>

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

            <div style={{ display: "flex", gap: "15px" }}>
              <button onClick={() => setShowForm(false)} style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "1px solid #333", backgroundColor: "transparent", color: "#888", cursor: "pointer" }}>CANCELAR</button>
              <button onClick={savePurchase} disabled={saving} style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "none", backgroundColor: "#D4AF37", color: "#000", fontWeight: "bold", cursor: "pointer" }}>
                {saving ? "PROCESANDO..." : "REGISTRAR COMPRA"}
              </button>
            </div>
          </div>
        </div>
      )}

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

// 🔥 COMPONENTE PARA CADA LÍNEA DE PRODUCTO
function ProductLine({ product, allProducts, onUpdate, onSelect, onRemove, canRemove }) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchTerm, setSearchTerm] = useState(product.product_name);

  const filteredProducts = allProducts.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  ).slice(0, 5);

  const handleNameChange = (value) => {
    setSearchTerm(value);
    onUpdate(product.id, "product_name", value);
    setShowSuggestions(value.length > 0);
  };

  const handleSelectProduct = (p) => {
    onSelect(product.id, p);
    setSearchTerm(p.name);
    setShowSuggestions(false);
  };

  const subtotal = (Number(product.quantity) || 0) * (Number(product.unit_cost) || 0);

  return (
    <div style={{ marginBottom: "15px", padding: "15px", background: "#111", borderRadius: "8px", border: "1px solid #222" }}>
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr auto", gap: "10px", alignItems: "center", marginBottom: "10px" }}>
        
        {/* NOMBRE DEL PRODUCTO CON AUTOCOMPLETE */}
        <div style={{ position: "relative" }}>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => handleNameChange(e.target.value)}
            onFocus={() => setShowSuggestions(searchTerm.length > 0)}
            placeholder="Buscar o escribir producto nuevo..."
            style={{ width: "100%", padding: "10px", borderRadius: "6px", border: product.isNew ? "2px solid #2ecc71" : "1px solid #333", backgroundColor: "#000", color: "#fff" }}
          />
          
          {showSuggestions && filteredProducts.length > 0 && (
            <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#000", border: "1px solid #D4AF37", borderRadius: "6px", marginTop: "5px", maxHeight: "200px", overflowY: "auto", zIndex: 1000 }}>
              {filteredProducts.map(p => (
                <div
                  key={p.id}
                  onClick={() => handleSelectProduct(p)}
                  style={{ padding: "10px", cursor: "pointer", borderBottom: "1px solid #222", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "#1a1a1a"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                >
                  <div>
                    <div style={{ color: "#fff", fontWeight: "bold" }}>{p.name}</div>
                    <div style={{ color: "#666", fontSize: "0.75rem" }}>Stock: {p.current_stock}</div>
                  </div>
                  <div style={{ color: "#D4AF37", fontSize: "0.85rem" }}>${Number(p.cost_price || 0).toLocaleString()}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <input
          type="number"
          value={product.quantity}
          onChange={(e) => onUpdate(product.id, "quantity", e.target.value)}
          placeholder="Cantidad"
          style={{ padding: "10px", borderRadius: "6px", border: "1px solid #333", backgroundColor: "#000", color: "#fff" }}
        />
        
        <input
          type="number"
          value={product.unit_cost}
          onChange={(e) => onUpdate(product.id, "unit_cost", e.target.value)}
          placeholder="Costo c/u"
          style={{ padding: "10px", borderRadius: "6px", border: "1px solid #333", backgroundColor: "#000", color: "#fff" }}
        />

        <div style={{ color: "#D4AF37", fontWeight: "bold", fontSize: "1rem", textAlign: "right" }}>
          ${subtotal.toLocaleString()}
        </div>

        <button
          onClick={() => onRemove(product.id)}
          disabled={!canRemove}
          style={{ background: "transparent", border: "1px solid #f55", color: "#f55", padding: "10px", borderRadius: "6px", cursor: canRemove ? "pointer" : "not-allowed", opacity: canRemove ? 1 : 0.3 }}
        >
          <FiX size={18} />
        </button>
      </div>

      {product.isNew && (
        <div style={{ display: "flex", alignItems: "center", gap: "5px", color: "#2ecc71", fontSize: "0.75rem" }}>
          <FiPackage size={12} /> Producto nuevo - Se creará automáticamente
        </div>
      )}
      
      {product.product_id && !product.isNew && (
        <div style={{ display: "flex", alignItems: "center", gap: "5px", color: "#888", fontSize: "0.75rem" }}>
          <FiPackage size={12} /> Producto existente - Stock se actualizará
        </div>
      )}
    </div>
  );
}
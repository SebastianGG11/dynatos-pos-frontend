import { useEffect, useState, useRef } from "react";
import api from "../api/api"; 
import { FiPlus, FiEdit, FiTrash2, FiSearch, FiX, FiTrendingUp, FiPackage } from "react-icons/fi";
import { FaBarcode } from "react-icons/fa"; 

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const barcodeInputRef = useRef(null);

  // Estado del Formulario Simplificado
  const [formData, setFormData] = useState({
    id: null,
    name: "",
    barcode: "",
    category_id: "",
    sale_price: "",
    cost_price: "",
    current_stock: "",
    is_active: true
  });

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);

  // Foco automático al abrir el modal para el escáner
  useEffect(() => {
    if (showModal && barcodeInputRef.current) {
      setTimeout(() => barcodeInputRef.current.focus(), 100);
    }
  }, [showModal]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const res = await api.get("/products");
      setProducts(res.data.items || []);
    } catch (error) {
      console.error("Error al cargar productos", error);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const res = await api.get("/categories");
      setCategories(res.data.items || []);
    } catch (error) {
      console.error("Error al cargar categorías", error);
    }
  };

  const handleSearch = async (val) => {
    setSearchTerm(val);
    if (val.trim().length === 0) {
      loadProducts();
      return;
    }
    if (val.length > 2) {
      try {
        const res = await api.get(`/products/search?q=${val}`);
        setProducts(res.data.items || []);
      } catch (error) {
        console.error("Error en búsqueda", error);
      }
    }
  };

  const handleOpenCreate = () => {
    setFormData({ id: null, name: "", barcode: "", category_id: "", sale_price: "", cost_price: "", current_stock: "", is_active: true });
    setIsEditing(false);
    setShowModal(true);
  };

  const handleOpenEdit = (prod) => {
    setFormData({
      id: prod.id,
      name: prod.name,
      barcode: prod.barcode || "",
      category_id: prod.category_id || "",
      sale_price: prod.sale_price,
      cost_price: prod.cost_price,
      current_stock: prod.current_stock,
      is_active: prod.is_active === 1
    });
    setIsEditing(true);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await api.put(`/products/${formData.id}`, formData);
      } else {
        await api.post("/products", formData);
      }
      setShowModal(false);
      loadProducts();
    } catch (error) {
      alert("Error al procesar el producto. Verifica que el código no esté duplicado.");
    }
  };

  const handleDelete = async (id) => {
    if(!window.confirm("¿Estás seguro de que deseas eliminar este producto de forma permanente?")) return;
    try {
      await api.delete(`/products/${id}/hard`);
      loadProducts();
    } catch (error) {
      alert("No se pudo eliminar el producto.");
    }
  };

  return (
    <div style={{ padding: "40px", backgroundColor: "#000", minHeight: "100vh", color: "#fff", fontFamily: "'Inter', sans-serif" }}>
      
      {/* SECCIÓN DE TÍTULO */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "40px" }}>
        <div>
          <h1 style={{ color: "#D4AF37", margin: 0, fontSize: "2.2rem", fontWeight: "800" }}>PRODUCTOS</h1>
          <p style={{ color: "#555", marginTop: "5px" }}>Control total de existencias y márgenes comerciales</p>
        </div>
        <button onClick={handleOpenCreate} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "14px 30px", background: "#D4AF37", border: "none", borderRadius: "12px", fontWeight: "bold", cursor: "pointer", color: "#000", boxShadow: "0 4px 15px rgba(212, 175, 55, 0.2)" }}>
          <FiPlus size={20} /> NUEVO PRODUCTO
        </button>
      </div>

      {/* FILTROS Y BÚSQUEDA */}
      <div style={{ marginBottom: "30px" }}>
        <div style={{ position: "relative", maxWidth: "600px" }}>
          <FiSearch style={{ position: "absolute", left: "18px", top: "18px", color: "#D4AF37" }} />
          <input 
            type="text" 
            placeholder="Buscar por nombre o código..." 
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            style={{ width: "100%", padding: "18px 18px 18px 50px", background: "#0a0a0a", border: "1px solid #1a1a1a", color: "#fff", borderRadius: "15px", outline: "none", fontSize: "1rem" }}
          />
        </div>
      </div>

      {/* LISTADO DE PRODUCTOS */}
      <div style={{ background: "#050505", borderRadius: "20px", border: "1px solid #111", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#0a0a0a", textAlign: "left" }}>
              <th style={{ padding: "22px", color: "#D4AF37", borderBottom: "1px solid #1a1a1a" }}>CÓDIGO</th>
              <th style={{ padding: "22px", color: "#D4AF37", borderBottom: "1px solid #1a1a1a" }}>PRODUCTO</th>
              <th style={{ padding: "22px", color: "#D4AF37", borderBottom: "1px solid #1a1a1a" }}>CATEGORÍA</th>
              <th style={{ padding: "22px", color: "#D4AF37", borderBottom: "1px solid #1a1a1a" }}>P. VENTA</th>
              <th style={{ padding: "22px", color: "#D4AF37", borderBottom: "1px solid #1a1a1a" }}>GANANCIA</th>
              <th style={{ padding: "22px", color: "#D4AF37", borderBottom: "1px solid #1a1a1a" }}>STOCK</th>
              <th style={{ padding: "22px", color: "#D4AF37", borderBottom: "1px solid #1a1a1a", textAlign: "center" }}>ACCIONES</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" style={{ textAlign: "center", padding: "50px", color: "#444" }}>Actualizando inventario...</td></tr>
            ) : products.map(p => {
              const profit = Number(p.sale_price) - Number(p.cost_price);
              return (
                <tr key={p.id} style={{ borderBottom: "1px solid #0f0f0f" }}>
                  <td style={{ padding: "20px", color: "#666", fontFamily: "monospace" }}>{p.barcode || "S/N"}</td>
                  <td style={{ padding: "20px", fontWeight: "700", color: "#eee" }}>{p.name}</td>
                  <td style={{ padding: "20px", color: "#888" }}>{categories.find(c => c.id === p.category_id)?.name || "General"}</td>
                  <td style={{ padding: "20px", color: "#fff" }}>${Number(p.sale_price).toLocaleString()}</td>
                  <td style={{ padding: "20px", color: "#2ecc71", fontWeight: "800" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <FiTrendingUp size={16} />
                      ${profit.toLocaleString()}
                    </div>
                  </td>
                  <td style={{ padding: "20px" }}>
                    <span style={{ padding: "6px 14px", background: p.current_stock < 10 ? "rgba(255, 68, 68, 0.1)" : "rgba(46, 204, 113, 0.1)", color: p.current_stock < 10 ? "#ff4444" : "#2ecc71", borderRadius: "8px", fontSize: "0.9rem", border: `1px solid ${p.current_stock < 10 ? "#ff4444" : "#2ecc71"}` }}>
                      {p.current_stock}
                    </span>
                  </td>
                  <td style={{ padding: "20px", textAlign: "center" }}>
                    <button onClick={() => handleOpenEdit(p)} style={{ background: "none", border: "none", cursor: "pointer", marginRight: "20px" }}><FiEdit color="#D4AF37" size={20} /></button>
                    <button onClick={() => handleDelete(p.id)} style={{ background: "none", border: "none", cursor: "pointer" }}><FiTrash2 color="#ff4444" size={20} /></button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* VENTANA EMERGENTE (MODAL) */}
      {showModal && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.85)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000, backdropFilter: "blur(10px)" }}>
          <div style={{ background: "#0a0a0a", width: "550px", padding: "40px", borderRadius: "30px", border: "1px solid #D4AF37" }}>
            
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "35px" }}>
              <h2 style={{ margin: 0, color: "#D4AF37" }}>{isEditing ? "MODIFICAR" : "REGISTRAR"}</h2>
              <button onClick={() => setShowModal(false)} style={{ background: "#111", border: "none", borderRadius: "50%", width: "40px", height: "40px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><FiX size={20} color="#fff" /></button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "25px" }}>
              
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={{ color: "#D4AF37", display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px", fontWeight: "bold" }}><FaBarcode /> CÓDIGO DEL PRODUCTO</label>
                <input 
                  type="text" 
                  ref={barcodeInputRef}
                  value={formData.barcode}
                  onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                  placeholder="Escanea o escribe el código..." 
                  style={{ width: "100%", padding: "16px", background: "#000", border: "1px solid #222", color: "#fff", borderRadius: "12px", outline: "none", borderLeft: "5px solid #D4AF37" }}
                />
              </div>

              <div style={{ gridColumn: "1 / -1" }}>
                <label style={{ color: "#555", marginBottom: "8px", display: "block" }}>Descripción / Nombre</label>
                <input required type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} style={{ width: "100%", padding: "14px", background: "#000", border: "1px solid #1a1a1a", color: "#fff", borderRadius: "12px" }} />
              </div>

              <div>
                <label style={{ color: "#555", marginBottom: "8px", display: "block" }}>Categoría</label>
                <select value={formData.category_id} onChange={(e) => setFormData({ ...formData, category_id: e.target.value })} style={{ width: "100%", padding: "14px", background: "#000", border: "1px solid #1a1a1a", color: "#fff", borderRadius: "12px" }}>
                  <option value="">Sin categoría</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div>
                <label style={{ color: "#555", marginBottom: "8px", display: "block" }}>Existencias (Stock)</label>
                <div style={{ position: "relative" }}>
                  <FiPackage style={{ position: "absolute", right: "15px", top: "16px", color: "#333" }} />
                  <input required type="number" value={formData.current_stock} onChange={(e) => setFormData({ ...formData, current_stock: e.target.value })} style={{ width: "100%", padding: "14px", background: "#000", border: "1px solid #1a1a1a", color: "#fff", borderRadius: "12px" }} />
                </div>
              </div>

              <div>
                <label style={{ color: "#555", marginBottom: "8px", display: "block" }}>Costo Unidad ($)</label>
                <input required type="number" value={formData.cost_price} onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })} style={{ width: "100%", padding: "14px", background: "#000", border: "1px solid #1a1a1a", color: "#fff", borderRadius: "12px" }} />
              </div>

              <div>
                <label style={{ color: "#D4AF37", marginBottom: "8px", display: "block" }}>Precio Venta ($)</label>
                <input required type="number" value={formData.sale_price} onChange={(e) => setFormData({ ...formData, sale_price: e.target.value })} style={{ width: "100%", padding: "14px", background: "#000", border: "1px solid #D4AF37", color: "#fff", borderRadius: "12px", fontWeight: "bold" }} />
              </div>

              <button type="submit" style={{ gridColumn: "1 / -1", padding: "18px", background: "#D4AF37", color: "#000", border: "none", borderRadius: "15px", fontWeight: "bold", cursor: "pointer", fontSize: "1.1rem", marginTop: "15px" }}>
                {isEditing ? "GUARDAR CAMBIOS" : "FINALIZAR REGISTRO"}
              </button>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}
import { useState, useEffect } from "react";
import api from "../api/api";
import { FiAlertTriangle, FiSearch, FiSave, FiTrash2 } from "react-icons/fi";

export default function AdminAdjustments() {
  const [adjustments, setAdjustments] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // 🔥 CORRECCIÓN 1: Inicializar siempre como array vacío
  const [products, setProducts] = useState([]); 
  
  // Formulario
  const [search, setSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState("Dañado / Roto");

  useEffect(() => { 
    fetchAdjustments(); 
    fetchProducts(); 
  }, []);

  const fetchAdjustments = async () => {
    try {
      const res = await api.get("/adjustments");
      // Protección: Si no es array, poner vacío
      setAdjustments(Array.isArray(res.data) ? res.data : []);
    } catch (error) { console.error("Error historial:", error); }
  };

  const fetchProducts = async () => {
    try {
      const res = await api.get("/products"); 
      // 🔥 CORRECCIÓN 2: Detectar si el backend devuelve array directo o un objeto con paginación
      if (Array.isArray(res.data)) {
        setProducts(res.data);
      } else if (res.data && Array.isArray(res.data.products)) {
        setProducts(res.data.products); // Caso común si hay paginación
      } else if (res.data && Array.isArray(res.data.data)) {
        setProducts(res.data.data); // Otro formato común
      } else {
        setProducts([]); // Evitar crash si no entiende el formato
        console.warn("Formato de productos desconocido:", res.data);
      }
    } catch (error) { 
      console.error("Error cargando productos", error);
      setProducts([]); 
    }
  };

  // 🔥 CORRECCIÓN 3: Filtrado seguro (Evita pantalla negra)
  const filteredProducts = Array.isArray(products) 
    ? products.filter(p => p.name && p.name.toLowerCase().includes(search.toLowerCase()))
    : [];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProduct) return alert("Selecciona un producto");

    if (!window.confirm(`¿Confirmar pérdida de ${quantity}x ${selectedProduct.name}? Esto se restará del inventario.`)) return;

    try {
      await api.post("/adjustments", {
        product_id: selectedProduct.id,
        quantity: Number(quantity),
        reason
      });
      alert("✅ Pérdida registrada");
      fetchAdjustments(); 
      setSelectedProduct(null);
      setSearch("");
      setQuantity(1);
    } catch (error) {
      alert("Error registrando: " + (error.response?.data?.message || "Error desconocido"));
    }
  };

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "20px", animation: "fadeIn 0.5s ease-in-out" }}>
      
      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px", borderBottom: "1px solid #333", paddingBottom: "20px" }}>
        <div>
          <h1 style={{ color: "#ff9900", margin: 0, fontSize: "1.8rem", fontFamily: 'serif', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FiAlertTriangle /> CONTROL DE MERMAS
          </h1>
          <p style={{ color: "#888", marginTop: "5px", fontSize: "0.9rem" }}>Registro de productos rotos, vencidos o perdidos</p>
        </div>
      </div>

      {/* CONTENEDOR GRID */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "30px" }}>
        
        {/* COLUMNA IZQUIERDA: FORMULARIO */}
        <div style={{ background: "#1a1a1a", padding: "25px", borderRadius: "15px", border: "1px solid #333", height: "fit-content", boxShadow: "0 4px 10px rgba(0,0,0,0.3)" }}>
          <h3 style={{ color: "#fff", marginTop: 0, borderBottom: "1px solid #333", paddingBottom: "10px" }}>Registrar Pérdida</h3>
          
          <div style={{ marginBottom: "20px", position: "relative" }}>
            <label style={{ color: "#aaa", fontSize: "0.8rem", display: "block", marginBottom: "5px" }}>Buscar Producto</label>
            <div style={{ display: "flex", alignItems: "center", background: "#333", borderRadius: "8px", padding: "8px 12px", border: "1px solid #444" }}>
              <FiSearch color="#888" size={18} />
              <input 
                type="text" 
                placeholder="Escribe el nombre..." 
                value={search}
                onChange={e => { setSearch(e.target.value); setSelectedProduct(null); }}
                style={{ background: "transparent", border: "none", color: "#fff", width: "100%", paddingLeft: "10px", outline: "none", fontSize: "1rem" }}
              />
            </div>
            
            {/* Lista desplegable de sugerencias */}
            {search.length > 0 && !selectedProduct && (
              <div style={{ 
                position: "absolute", 
                top: "100%", 
                left: 0, 
                right: 0, 
                maxHeight: "200px", 
                overflowY: "auto", 
                background: "#222", 
                border: "1px solid #555", 
                borderRadius: "0 0 8px 8px",
                zIndex: 100,
                boxShadow: "0 10px 20px rgba(0,0,0,0.5)"
              }}>
                {filteredProducts.length > 0 ? (
                  filteredProducts.map(p => (
                    <div 
                      key={p.id} 
                      onClick={() => { setSelectedProduct(p); setSearch(p.name); }}
                      style={{ padding: "12px", cursor: "pointer", borderBottom: "1px solid #333", color: "#eee", fontSize: "0.9rem" }}
                      onMouseOver={(e) => e.currentTarget.style.background = "#3a3a3a"}
                      onMouseOut={(e) => e.currentTarget.style.background = "transparent"}
                    >
                      <span style={{ fontWeight: "bold" }}>{p.name}</span> 
                      <span style={{ float: "right", color: "#888", fontSize: "0.8rem" }}>Stock: {p.current_stock}</span>
                    </div>
                  ))
                ) : (
                  <div style={{ padding: "10px", color: "#666", textAlign: "center", fontSize: "0.9rem" }}>No encontrado</div>
                )}
              </div>
            )}
          </div>

          {selectedProduct && (
            <div style={{ background: "rgba(255, 153, 0, 0.1)", padding: "15px", borderRadius: "8px", marginBottom: "20px", border: "1px solid #ff9900", color: "#ffcc80" }}>
              <p style={{ margin: 0, fontSize: "0.8rem", color: "#ff9900" }}>PRODUCTO SELECCIONADO:</p>
              <strong style={{ fontSize: "1.1rem" }}>{selectedProduct.name}</strong>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "15px" }}>
              <label style={{ color: "#aaa", fontSize: "0.8rem", display: "block", marginBottom: "5px" }}>Cantidad a descartar</label>
              <input 
                type="number" 
                min="1" 
                value={quantity} 
                onChange={e => setQuantity(e.target.value)} 
                style={{ width: "100%", padding: "12px", background: "#222", border: "1px solid #444", color: "#fff", borderRadius: "8px", fontSize: "1rem" }} 
              />
            </div>

            <div style={{ marginBottom: "25px" }}>
              <label style={{ color: "#aaa", fontSize: "0.8rem", display: "block", marginBottom: "5px" }}>Motivo de la pérdida</label>
              <select 
                value={reason} 
                onChange={e => setReason(e.target.value)} 
                style={{ width: "100%", padding: "12px", background: "#222", border: "1px solid #444", color: "#fff", borderRadius: "8px", fontSize: "1rem" }}
              >
                <option value="Dañado / Roto">Dañado / Roto</option>
                <option value="Vencido">Vencido / Caducado</option>
                <option value="Robo">Robo / Hurto</option>
                <option value="Consumo Interno">Consumo Interno</option>
                <option value="Error Inventario">Ajuste de Inventario</option>
              </select>
            </div>

            <button type="submit" style={{ width: "100%", background: "#ff9900", color: "#000", border: "none", padding: "15px", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", display: "flex", justifyContent: "center", alignItems: "center", gap: "10px", fontSize: "1rem", transition: "transform 0.1s" }}>
              <FiSave size={20} /> CONFIRMAR PÉRDIDA
            </button>
          </form>
        </div>

        {/* COLUMNA DERECHA: HISTORIAL */}
        <div style={{ background: "#111", borderRadius: "15px", border: "1px solid #222", overflow: "hidden", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "20px", background: "#1a1a1a", borderBottom: "1px solid #333" }}>
            <h3 style={{ margin: 0, color: "#ccc", fontSize: "1.1rem" }}>Historial de Mermas</h3>
          </div>
          
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", color: "#eee", fontSize: "0.9rem" }}>
              <thead>
                <tr style={{ textAlign: "left", color: "#666", borderBottom: "1px solid #222" }}>
                  <th style={{ padding: "15px" }}>FECHA</th>
                  <th style={{ padding: "15px" }}>PRODUCTO</th>
                  <th style={{ padding: "15px" }}>CANT</th>
                  <th style={{ padding: "15px" }}>MOTIVO</th>
                  <th style={{ padding: "15px" }}>COSTO</th>
                </tr>
              </thead>
              <tbody>
                {adjustments.length === 0 ? (
                  <tr><td colSpan="5" style={{ padding: "30px", textAlign: "center", color: "#444" }}>Sin registros recientes</td></tr>
                ) : (
                  adjustments.map(adj => (
                    <tr key={adj.id} style={{ borderBottom: "1px solid #222" }}>
                      <td style={{ padding: "15px", color: "#666" }}>{new Date(adj.created_at).toLocaleDateString()}</td>
                      <td style={{ padding: "15px", fontWeight: "500" }}>{adj.product_name}</td>
                      <td style={{ padding: "15px", color: "#ff4444", fontWeight: "bold" }}>-{adj.quantity}</td>
                      <td style={{ padding: "15px" }}>
                        <span style={{ background: "#222", padding: "4px 8px", borderRadius: "4px", fontSize: "0.8rem", color: "#aaa", border: "1px solid #333" }}>
                          {adj.reason}
                        </span>
                      </td>
                      <td style={{ padding: "15px", color: "#666" }}>${(Number(adj.cost_at_time) * adj.quantity).toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
import { useState, useEffect } from "react";
import api from "../api/api";
import { FiAlertTriangle, FiSearch, FiSave } from "react-icons/fi";

export default function AdminAdjustments() {
  const [adjustments, setAdjustments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]); // Para el buscador
  
  // Formulario
  const [search, setSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState("Dañado / Roto");

  useEffect(() => { fetchAdjustments(); fetchProducts(); }, []);

  const fetchAdjustments = async () => {
    try {
      const res = await api.get("/adjustments");
      setAdjustments(res.data);
    } catch (error) { console.error("Error historial:", error); }
  };

  const fetchProducts = async () => {
    // Traemos productos simples para el select
    try {
      const res = await api.get("/products"); // Asumiendo que esta ruta trae lista
      setProducts(res.data);
    } catch (error) { }
  };

  // Filtrar productos en el combo
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase())
  );

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
      fetchAdjustments(); // Recargar tabla
      setSelectedProduct(null);
      setSearch("");
      setQuantity(1);
    } catch (error) {
      alert("Error registrando");
    }
  };

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "20px", animation: "fadeIn 0.5s" }}>
      
      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px", borderBottom: "1px solid #333", paddingBottom: "20px" }}>
        <div>
          <h1 style={{ color: "#ff9900", margin: 0, fontSize: "1.8rem", fontFamily: 'serif', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FiAlertTriangle /> CONTROL DE MERMAS
          </h1>
          <p style={{ color: "#888", marginTop: "5px" }}>Registro de productos rotos, vencidos o perdidos</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "30px" }}>
        
        {/* COLUMNA IZQUIERDA: FORMULARIO */}
        <div style={{ background: "#1a1a1a", padding: "25px", borderRadius: "15px", border: "1px solid #333", height: "fit-content" }}>
          <h3 style={{ color: "#fff", marginTop: 0 }}>Registrar Pérdida</h3>
          
          <div style={{ marginBottom: "15px" }}>
            <label style={{ color: "#aaa", fontSize: "0.8rem" }}>Buscar Producto</label>
            <div style={{ display: "flex", alignItems: "center", background: "#333", borderRadius: "5px", padding: "5px 10px", marginTop: "5px" }}>
              <FiSearch color="#666" />
              <input 
                type="text" 
                placeholder="Escribe para buscar..." 
                value={search}
                onChange={e => { setSearch(e.target.value); setSelectedProduct(null); }}
                style={{ background: "transparent", border: "none", color: "#fff", width: "100%", padding: "5px", outline: "none" }}
              />
            </div>
            
            {/* Lista de sugerencias */}
            {search && !selectedProduct && (
              <div style={{ maxHeight: "150px", overflowY: "auto", background: "#222", border: "1px solid #444", marginTop: "5px", borderRadius: "5px" }}>
                {filteredProducts.map(p => (
                  <div 
                    key={p.id} 
                    onClick={() => { setSelectedProduct(p); setSearch(p.name); }}
                    style={{ padding: "10px", cursor: "pointer", borderBottom: "1px solid #333", color: "#eee" }}
                    onMouseOver={(e) => e.target.style.background = "#444"}
                    onMouseOut={(e) => e.target.style.background = "transparent"}
                  >
                    {p.name} (Stock: {p.current_stock})
                  </div>
                ))}
              </div>
            )}
          </div>

          {selectedProduct && (
            <div style={{ background: "#331a00", padding: "10px", borderRadius: "5px", marginBottom: "15px", border: "1px solid #663300", color: "#ffcc80" }}>
              Producto: <strong>{selectedProduct.name}</strong>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "15px" }}>
              <label style={{ color: "#aaa", fontSize: "0.8rem" }}>Cantidad Perdida</label>
              <input type="number" min="1" value={quantity} onChange={e => setQuantity(e.target.value)} style={{ width: "100%", padding: "10px", background: "#333", border: "1px solid #555", color: "#fff", borderRadius: "5px", marginTop: "5px" }} />
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ color: "#aaa", fontSize: "0.8rem" }}>Motivo</label>
              <select value={reason} onChange={e => setReason(e.target.value)} style={{ width: "100%", padding: "10px", background: "#333", border: "1px solid #555", color: "#fff", borderRadius: "5px", marginTop: "5px" }}>
                <option value="Dañado / Roto">Dañado / Roto</option>
                <option value="Vencido">Vencido</option>
                <option value="Robo">Robo / Hurto</option>
                <option value="Consumo Interno">Consumo Interno (Degustación)</option>
                <option value="Error Inventario">Error de Conteo</option>
              </select>
            </div>

            <button type="submit" style={{ width: "100%", background: "#ff9900", color: "#000", border: "none", padding: "12px", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", display: "flex", justifyContent: "center", alignItems: "center", gap: "10px" }}>
              <FiSave /> CONFIRMAR PÉRDIDA
            </button>
          </form>
        </div>

        {/* COLUMNA DERECHA: HISTORIAL */}
        <div style={{ background: "#111", borderRadius: "15px", border: "1px solid #222", overflow: "hidden" }}>
          <div style={{ padding: "15px", background: "#1a1a1a", borderBottom: "1px solid #333" }}>
            <h3 style={{ margin: 0, color: "#ccc", fontSize: "1rem" }}>Últimos Incidentes</h3>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", color: "#eee", fontSize: "0.9rem" }}>
            <thead>
              <tr style={{ textAlign: "left", color: "#888" }}>
                <th style={{ padding: "15px" }}>Fecha</th>
                <th style={{ padding: "15px" }}>Producto</th>
                <th style={{ padding: "15px" }}>Cant</th>
                <th style={{ padding: "15px" }}>Motivo</th>
                <th style={{ padding: "15px" }}>Resp.</th>
                <th style={{ padding: "15px" }}>Costo</th>
              </tr>
            </thead>
            <tbody>
              {adjustments.map(adj => (
                <tr key={adj.id} style={{ borderBottom: "1px solid #222" }}>
                  <td style={{ padding: "15px", color: "#666" }}>{new Date(adj.created_at).toLocaleDateString()}</td>
                  <td style={{ padding: "15px" }}>{adj.product_name}</td>
                  <td style={{ padding: "15px", color: "#ff4444", fontWeight: "bold" }}>-{adj.quantity}</td>
                  <td style={{ padding: "15px", fontStyle: "italic", color: "#aaa" }}>{adj.reason}</td>
                  <td style={{ padding: "15px", color: "#666" }}>{adj.username}</td>
                  <td style={{ padding: "15px", color: "#666" }}>${(Number(adj.cost_at_time) * adj.quantity).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}
import { useState, useEffect } from "react";
import api from "../api/api";
import { FiAlertTriangle, FiSearch, FiSave } from "react-icons/fi";

export default function AdminAdjustments() {
  const [adjustments, setAdjustments] = useState([]);
  const [products, setProducts] = useState([]); 
  
  // Formulario
  const [search, setSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState("Dañado / Roto");
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => { fetchAdjustments(); }, []);

  // 🔥 EFECTO MÁGICO: Busca en el servidor cuando dejas de escribir por 300ms
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (search.length > 1) { // Solo busca si escribes más de 1 letra
        searchProducts(search);
      } else {
        setProducts([]); // Limpia si borras
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  const fetchAdjustments = async () => {
    try {
      const res = await api.get("/adjustments");
      setAdjustments(Array.isArray(res.data) ? res.data : []);
    } catch (error) { console.error("Error historial:", error); }
  };

  // 🔥 NUEVA FUNCIÓN DE BÚSQUEDA REAL
  const searchProducts = async (term) => {
    setIsSearching(true);
    try {
      // Pedimos 50 resultados que coincidan con "term"
      const res = await api.get(`/products?limit=50&search=${term}`);
      
      // Manejo robusto de la respuesta (data.data o data)
      let list = [];
      if (res.data?.data && Array.isArray(res.data.data)) list = res.data.data;
      else if (Array.isArray(res.data)) list = res.data;
      
      setProducts(list);
    } catch (error) {
      console.error("Error buscando:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProduct) return alert("Selecciona un producto de la lista");

    if (!window.confirm(`¿Confirmar pérdida de ${quantity}x ${selectedProduct.name}?`)) return;

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
      setProducts([]); // Limpiar lista
      setQuantity(1);
    } catch (error) {
      alert("Error: " + (error.response?.data?.message || "Error al guardar"));
    }
  };

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "20px", animation: "fadeIn 0.5s" }}>
      
      {/* HEADER */}
      <div style={{ marginBottom: "30px", borderBottom: "1px solid #333", paddingBottom: "20px" }}>
          <h1 style={{ color: "#ff9900", margin: 0, fontSize: "1.8rem", fontFamily: 'serif', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FiAlertTriangle /> CONTROL DE MERMAS
          </h1>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "30px" }}>
        
        {/* FORMULARIO */}
        <div style={{ background: "#1a1a1a", padding: "25px", borderRadius: "15px", border: "1px solid #333" }}>
          <h3 style={{ color: "#fff", marginTop: 0 }}>Registrar Pérdida</h3>
          
          <div style={{ marginBottom: "20px", position: "relative" }}>
            <label style={{ color: "#aaa", fontSize: "0.8rem" }}>Buscar Producto</label>
            <div style={{ display: "flex", alignItems: "center", background: "#333", borderRadius: "8px", padding: "10px", border: "1px solid #444" }}>
              <FiSearch color="#888" />
              <input 
                type="text" 
                placeholder="Escribe nombre del producto..." 
                value={search}
                onChange={e => { setSearch(e.target.value); setSelectedProduct(null); }}
                style={{ background: "transparent", border: "none", color: "#fff", width: "100%", paddingLeft: "10px", outline: "none", fontSize: "1rem" }}
              />
            </div>
            
            {/* Lista de Resultados */}
            {search.length > 1 && !selectedProduct && (
              <div style={{ position: "absolute", top: "100%", left: 0, right: 0, maxHeight: "200px", overflowY: "auto", background: "#222", border: "1px solid #555", borderRadius: "0 0 8px 8px", zIndex: 100, boxShadow: "0 10px 30px rgba(0,0,0,0.5)" }}>
                {isSearching ? (
                  <div style={{ padding: "15px", color: "#888", textAlign: "center" }}>Buscando...</div>
                ) : products.length > 0 ? (
                  products.map(p => (
                    <div 
                      key={p.id} 
                      onClick={() => { setSelectedProduct(p); setSearch(p.name); setProducts([]); }}
                      style={{ padding: "12px", cursor: "pointer", borderBottom: "1px solid #333", color: "#eee" }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "#333"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                    >
                      <strong>{p.name}</strong> <span style={{ color: "#666", fontSize: "0.8rem" }}>| Stock: {p.current_stock}</span>
                    </div>
                  ))
                ) : (
                  <div style={{ padding: "15px", color: "#666", textAlign: "center" }}>No encontrado</div>
                )}
              </div>
            )}
          </div>

          {selectedProduct && (
            <div style={{ background: "rgba(255,153,0,0.1)", padding: "15px", borderRadius: "8px", marginBottom: "20px", border: "1px solid #ff9900" }}>
              <strong style={{ color: "#ff9900", display: "block" }}>PRODUCTO SELECCIONADO:</strong>
              <span style={{ color: "#fff", fontSize: "1.2rem" }}>{selectedProduct.name}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "15px" }}>
              <label style={{ color: "#aaa" }}>Cantidad</label>
              <input type="number" min="1" value={quantity} onChange={e => setQuantity(e.target.value)} style={{ width: "100%", padding: "12px", background: "#222", border: "1px solid #444", color: "#fff", borderRadius: "8px" }} />
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ color: "#aaa" }}>Motivo</label>
              <select value={reason} onChange={e => setReason(e.target.value)} style={{ width: "100%", padding: "12px", background: "#222", border: "1px solid #444", color: "#fff", borderRadius: "8px" }}>
                <option value="Dañado / Roto">Dañado / Roto</option>
                <option value="Vencido">Vencido</option>
                <option value="Robo">Robo</option>
                <option value="Consumo Interno">Consumo Interno</option>
              </select>
            </div>

            <button type="submit" style={{ width: "100%", background: "#ff9900", color: "#000", border: "none", padding: "15px", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", display: "flex", justifyContent: "center", gap: "10px" }}>
              <FiSave size={20} /> GUARDAR
            </button>
          </form>
        </div>

        {/* HISTORIAL */}
        <div style={{ background: "#111", borderRadius: "15px", border: "1px solid #222", padding: "20px" }}>
          <h3 style={{ margin: "0 0 20px 0", color: "#ccc" }}>Historial Reciente</h3>
          <table style={{ width: "100%", borderCollapse: "collapse", color: "#bbb", fontSize: "0.9rem" }}>
            <tbody>
              {adjustments.map(adj => (
                <tr key={adj.id} style={{ borderBottom: "1px solid #222" }}>
                  <td style={{ padding: "10px 0" }}>{new Date(adj.created_at).toLocaleDateString()}</td>
                  <td style={{ padding: "10px 10px", color: "#fff" }}>{adj.product_name}</td>
                  <td style={{ padding: "10px 0", color: "#ff4444" }}>-{adj.quantity}</td>
                  <td style={{ padding: "10px 0", fontStyle: "italic" }}>{adj.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
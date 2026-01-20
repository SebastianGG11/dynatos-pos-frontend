import { useState, useEffect } from "react";
import api from "../api/api"; // Asegúrate que la ruta sea correcta
import { FiAlertTriangle, FiFilter, FiSave, FiCheckCircle } from "react-icons/fi";

export default function AdminAdjustments() {
  const [adjustments, setAdjustments] = useState([]);
  const [products, setProducts] = useState([]); 
  
  // Estados para Categorías
  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);

  // Formulario
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState("Dañado / Roto");
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);

  // 1. Cargar Historial y Categorías al iniciar
  useEffect(() => { 
    fetchAdjustments(); 
    fetchCategories();
  }, []);

  const fetchAdjustments = async () => {
    try {
      const res = await api.get("/adjustments");
      setAdjustments(Array.isArray(res.data) ? res.data : []);
    } catch (error) { console.error("Error historial:", error); }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get("/categories");
      // Soporte por si tu API devuelve { items: [...] } o directo [...]
      setCategories(res.data.items || res.data || []);
    } catch (error) { console.error("Error categorías:", error); }
  };

  // 2. Cargar productos cuando seleccionas una categoría
  const handleCategorySelect = async (catId) => {
    setSelectedCategoryId(catId);
    setSelectedProduct(null); // Reseteamos selección
    setIsLoadingProducts(true);
    setProducts([]);

    try {
      // Usamos el endpoint que arreglamos hoy en el backend
      const res = await api.get(`/products?category_id=${catId}`);
      
      // Manejo robusto de la respuesta
      let list = [];
      if (res.data?.items && Array.isArray(res.data.items)) list = res.data.items;
      else if (Array.isArray(res.data)) list = res.data;
      
      setProducts(list);
    } catch (error) {
      console.error("Error cargando productos:", error);
    } finally {
      setIsLoadingProducts(false);
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
      
      // Reseteo parcial (mantenemos la categoría para seguir trabajando)
      setSelectedProduct(null);
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
          
          {/* SECCIÓN 1: BOTONES DE CATEGORÍAS */}
          <div style={{ marginBottom: "20px" }}>
            <label style={{ color: "#aaa", fontSize: "0.8rem", display: "block", marginBottom: "8px" }}>1. Selecciona Categoría</label>
            <div style={{ display: "flex", gap: "10px", overflowX: "auto", paddingBottom: "5px" }}>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => handleCategorySelect(cat.id)}
                  style={{
                    background: selectedCategoryId === cat.id ? "#ff9900" : "#333",
                    color: selectedCategoryId === cat.id ? "#000" : "#ccc",
                    border: "1px solid #444",
                    padding: "8px 16px",
                    borderRadius: "20px",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    fontWeight: "bold",
                    transition: "all 0.2s"
                  }}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* SECCIÓN 2: LISTA DE PRODUCTOS DE LA CATEGORÍA */}
          <div style={{ marginBottom: "20px" }}>
             <label style={{ color: "#aaa", fontSize: "0.8rem", display: "block", marginBottom: "8px" }}>2. Selecciona Producto</label>
             
             {/* Contenedor tipo lista scrolleable */}
             <div style={{ 
               height: "180px", 
               overflowY: "auto", 
               background: "#222", 
               border: "1px solid #444", 
               borderRadius: "8px" 
             }}>
                {isLoadingProducts ? (
                   <div style={{ padding: "20px", color: "#666", textAlign: "center" }}>Cargando productos...</div>
                ) : products.length > 0 ? (
                   products.map(p => (
                     <div 
                       key={p.id} 
                       onClick={() => setSelectedProduct(p)}
                       style={{ 
                         padding: "10px", 
                         cursor: "pointer", 
                         borderBottom: "1px solid #333", 
                         color: selectedProduct?.id === p.id ? "#fff" : "#bbb",
                         background: selectedProduct?.id === p.id ? "rgba(255, 153, 0, 0.2)" : "transparent",
                         display: "flex",
                         justifyContent: "space-between"
                       }}
                     >
                       <span>{p.name}</span>
                       <span style={{ fontSize: "0.8rem", color: "#666" }}>Stock: {p.current_stock}</span>
                     </div>
                   ))
                ) : (
                   <div style={{ padding: "20px", color: "#666", textAlign: "center" }}>
                     {selectedCategoryId ? "Sin productos en esta categoría" : "Selecciona una categoría arriba"}
                   </div>
                )}
             </div>
          </div>

          {/* MUESTRA PRODUCTO SELECCIONADO (Tu estilo original) */}
          {selectedProduct && (
            <div style={{ background: "rgba(255,153,0,0.1)", padding: "15px", borderRadius: "8px", marginBottom: "20px", border: "1px solid #ff9900", display: "flex", alignItems: "center", gap: "10px" }}>
              <FiCheckCircle color="#ff9900" size={24} />
              <div>
                <strong style={{ color: "#ff9900", display: "block", fontSize: "0.8rem" }}>LISTO PARA PROCESAR:</strong>
                <span style={{ color: "#fff", fontSize: "1.1rem", fontWeight: "bold" }}>{selectedProduct.name}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "15px" }}>
              <label style={{ color: "#aaa" }}>Cantidad a descontar</label>
              <input type="number" min="1" value={quantity} onChange={e => setQuantity(e.target.value)} style={{ width: "100%", padding: "12px", background: "#222", border: "1px solid #444", color: "#fff", borderRadius: "8px", fontSize: "1.1rem" }} />
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

            <button type="submit" style={{ width: "100%", background: "#ff9900", color: "#000", border: "none", padding: "15px", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", display: "flex", justifyContent: "center", gap: "10px", fontSize: "1rem" }}>
              <FiSave size={20} /> REGISTRAR MERMA
            </button>
          </form>
        </div>

        {/* HISTORIAL (Intacto) */}
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
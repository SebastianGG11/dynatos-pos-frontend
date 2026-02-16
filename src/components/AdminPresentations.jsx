import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/api";
import { FiPlus, FiEdit, FiTrash2, FiArrowLeft, FiPackage, FiDollarSign } from "react-icons/fi";
import { FaBarcode } from "react-icons/fa";

export default function AdminPresentations() {
  const { productId } = useParams();
  const navigate = useNavigate();
  
  const [product, setProduct] = useState(null);
  const [presentations, setPresentations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState({
    id: null,
    name: "",
    quantity: "",
    barcode: "",
    sale_price: ""
  });

  useEffect(() => {
    loadProduct();
    loadPresentations();
  }, [productId]);

  const loadProduct = async () => {
    try {
      const res = await api.get(`/products/${productId}`);
      setProduct(res.data);
    } catch (error) {
      console.error("Error cargando producto:", error);
      alert("Producto no encontrado");
      navigate("/admin/products");
    }
  };

  const loadPresentations = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/presentations/${productId}/presentations`);
      setPresentations(res.data.items || []);
    } catch (error) {
      console.error("Error cargando presentaciones:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setFormData({ id: null, name: "", quantity: "", barcode: "", sale_price: "" });
    setIsEditing(false);
    setShowModal(true);
  };

  const handleOpenEdit = (pres) => {
    setFormData({
      id: pres.id,
      name: pres.name,
      quantity: String(pres.quantity),
      barcode: pres.barcode || "",
      sale_price: String(pres.sale_price)
    });
    setIsEditing(true);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const payload = {
      name: formData.name.trim(),
      quantity: Number(formData.quantity),
      barcode: formData.barcode.trim() || null,
      sale_price: Number(formData.sale_price)
    };

    try {
      if (isEditing) {
        await api.put(`/presentations/${formData.id}`, payload);
        alert("Presentación actualizada");
      } else {
        await api.post(`/presentations/${productId}/presentations`, payload);
        alert("Presentación creada");
      }
      setShowModal(false);
      loadPresentations();
    } catch (error) {
      console.error("Error:", error);
      alert(error.response?.data?.message || "Error procesando presentación");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Eliminar esta presentación?")) return;
    
    try {
      await api.delete(`/presentations/${id}`);
      alert("Presentación eliminada");
      loadPresentations();
    } catch (error) {
      console.error("Error:", error);
      alert("No se pudo eliminar");
    }
  };

  return (
    <div style={{ padding: "40px", backgroundColor: "#000", minHeight: "100vh", color: "#fff" }}>
      
      {/* HEADER */}
      <div style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "40px" }}>
        <button 
          onClick={() => navigate("/admin/products")}
          style={{ background: "#111", border: "1px solid #333", padding: "12px", borderRadius: "10px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <FiArrowLeft color="#D4AF37" size={20} />
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ color: "#D4AF37", margin: 0, fontSize: "2rem" }}>
            PRESENTACIONES
          </h1>
          {product && (
            <p style={{ color: "#666", marginTop: "5px" }}>
              Producto: <span style={{ color: "#fff", fontWeight: "bold" }}>{product.name}</span>
              {" | "}Stock actual: <span style={{ color: "#2ecc71", fontWeight: "bold" }}>{product.current_stock}</span>
            </p>
          )}
        </div>
        <button 
          onClick={handleOpenCreate}
          style={{ display: "flex", alignItems: "center", gap: "10px", padding: "14px 30px", background: "#D4AF37", border: "none", borderRadius: "12px", fontWeight: "bold", cursor: "pointer", color: "#000" }}
        >
          <FiPlus size={20} /> NUEVA PRESENTACIÓN
        </button>
      </div>

      {/* TABLA DE PRESENTACIONES */}
      <div style={{ background: "#050505", borderRadius: "20px", border: "1px solid #111", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#0a0a0a", textAlign: "left" }}>
              <th style={{ padding: "22px", color: "#D4AF37", borderBottom: "1px solid #1a1a1a" }}>PRESENTACIÓN</th>
              <th style={{ padding: "22px", color: "#D4AF37", borderBottom: "1px solid #1a1a1a" }}>CANTIDAD</th>
              <th style={{ padding: "22px", color: "#D4AF37", borderBottom: "1px solid #1a1a1a" }}>CÓDIGO BARRAS</th>
              <th style={{ padding: "22px", color: "#D4AF37", borderBottom: "1px solid #1a1a1a" }}>PRECIO</th>
              <th style={{ padding: "22px", color: "#D4AF37", borderBottom: "1px solid #1a1a1a", textAlign: "center" }}>ACCIONES</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" style={{ textAlign: "center", padding: "50px", color: "#444" }}>Cargando...</td></tr>
            ) : presentations.length === 0 ? (
              <tr><td colSpan="5" style={{ textAlign: "center", padding: "50px", color: "#444" }}>No hay presentaciones. Crea la primera.</td></tr>
            ) : presentations.map(p => (
              <tr key={p.id} style={{ borderBottom: "1px solid #0f0f0f" }}>
                <td style={{ padding: "20px", fontWeight: "700", color: "#eee" }}>{p.name}</td>
                <td style={{ padding: "20px", color: "#888" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <FiPackage color="#D4AF37" size={16} />
                    {p.quantity} {p.quantity === 1 ? 'unidad' : 'unidades'}
                  </div>
                </td>
                <td style={{ padding: "20px", color: "#666", fontFamily: "monospace" }}>
                  {p.barcode || product?.barcode || "Usa código del producto"}
                </td>
                <td style={{ padding: "20px", color: "#2ecc71", fontWeight: "800" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <FiDollarSign size={16} />
                    ${Number(p.sale_price).toLocaleString()}
                  </div>
                </td>
                <td style={{ padding: "20px", textAlign: "center" }}>
                  <button onClick={() => handleOpenEdit(p)} style={{ background: "none", border: "none", cursor: "pointer", marginRight: "20px" }}>
                    <FiEdit color="#D4AF37" size={20} />
                  </button>
                  <button onClick={() => handleDelete(p.id)} style={{ background: "none", border: "none", cursor: "pointer" }}>
                    <FiTrash2 color="#ff4444" size={20} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL */}
      {showModal && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.85)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }}>
          <div style={{ background: "#0a0a0a", width: "500px", padding: "40px", borderRadius: "30px", border: "1px solid #D4AF37" }}>
            
            <h2 style={{ margin: "0 0 30px 0", color: "#D4AF37" }}>
              {isEditing ? "EDITAR PRESENTACIÓN" : "NUEVA PRESENTACIÓN"}
            </h2>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              
              <div>
                <label style={{ color: "#D4AF37", marginBottom: "8px", display: "block", fontWeight: "bold" }}>
                  Nombre de la Presentación *
                </label>
                <input 
                  required 
                  type="text" 
                  placeholder="Ej: Six Pack, Paca 24, Unidad"
                  value={formData.name} 
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                  style={{ width: "100%", padding: "14px", background: "#000", border: "1px solid #333", color: "#fff", borderRadius: "12px", outline: "none" }} 
                />
              </div>

              <div>
                <label style={{ color: "#2ecc71", marginBottom: "8px", display: "block", fontWeight: "bold" }}>
                  <FiPackage style={{ verticalAlign: "middle", marginRight: "5px" }} />
                  Cantidad de Unidades *
                </label>
                <input 
                  required 
                  type="number" 
                  min="1"
                  step="1"
                  placeholder="Ej: 6 para Six Pack, 24 para Paca"
                  value={formData.quantity} 
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })} 
                  style={{ width: "100%", padding: "14px", background: "#000", border: "1px solid #2ecc71", color: "#2ecc71", borderRadius: "12px", fontWeight: "bold", outline: "none" }} 
                />
                <small style={{ color: "#666", fontSize: "0.85rem", marginTop: "5px", display: "block" }}>
                  Cuántas unidades base contiene esta presentación
                </small>
              </div>

              <div>
                <label style={{ color: "#888", marginBottom: "8px", display: "block" }}>
                  <FaBarcode style={{ verticalAlign: "middle", marginRight: "5px" }} />
                  Código de Barras (Opcional)
                </label>
                <input 
                  type="text" 
                  placeholder="Dejar vacío para usar el código del producto"
                  value={formData.barcode} 
                  onChange={(e) => setFormData({ ...formData, barcode: e.target.value })} 
                  style={{ width: "100%", padding: "14px", background: "#000", border: "1px solid #333", color: "#fff", borderRadius: "12px", outline: "none" }} 
                />
              </div>

              <div>
                <label style={{ color: "#D4AF37", marginBottom: "8px", display: "block", fontWeight: "bold" }}>
                  Precio de Venta *
                </label>
                <input 
                  required 
                  type="number" 
                  min="0"
                  step="0.01"
                  placeholder="Ej: 17000"
                  value={formData.sale_price} 
                  onChange={(e) => setFormData({ ...formData, sale_price: e.target.value })} 
                  style={{ width: "100%", padding: "14px", background: "#000", border: "1px solid #D4AF37", color: "#D4AF37", borderRadius: "12px", fontWeight: "bold", outline: "none" }} 
                />
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{ flex: 1, padding: "14px", background: "#222", color: "#fff", border: "1px solid #333", borderRadius: "12px", cursor: "pointer" }}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  style={{ flex: 1, padding: "14px", background: "#D4AF37", color: "#000", border: "none", borderRadius: "12px", fontWeight: "bold", cursor: "pointer" }}
                >
                  {isEditing ? "GUARDAR" : "CREAR"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}
import { useEffect, useState, useRef } from "react";
import api from "../api/api"; 
// CORRECCIÓN AQUÍ ABAJO:
import { FiPlus, FiEdit, FiTrash2, FiSearch, FiX, FiImage } from "react-icons/fi";
import { FaBarcode } from "react-icons/fa"; 

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  const barcodeInputRef = useRef(null);

  const [formData, setFormData] = useState({
    id: null,
    name: "",
    sku: "",
    barcode: "",
    description: "",
    category_id: "",
    sale_price: "",
    cost_price: "",
    current_stock: "",
    min_stock: "",
    unit: "UND",
    is_active: true,
    image: null 
  });

  const [categories, setCategories] = useState([]);

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);

  useEffect(() => {
    if (showModal && barcodeInputRef.current) {
      setTimeout(() => {
        barcodeInputRef.current.focus();
      }, 100);
    }
  }, [showModal]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const res = await api.get("/products");
      setProducts(res.data.items || []);
    } catch (error) {
      console.error("Error cargando productos", error);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const res = await api.get("/categories");
      setCategories(res.data.items || []);
    } catch (error) {
      console.error("Error cargando categorías", error);
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
        console.error("Error buscando", error);
      }
    }
  };

  const handleOpenCreate = () => {
    setFormData({
      id: null,
      name: "",
      sku: "",
      barcode: "",
      description: "",
      category_id: "",
      sale_price: "",
      cost_price: "",
      current_stock: "",
      min_stock: "",
      unit: "UND",
      is_active: true,
      image: null
    });
    setPreviewImage(null);
    setIsEditing(false);
    setShowModal(true);
  };

  const handleOpenEdit = (prod) => {
    setFormData({
      id: prod.id,
      name: prod.name,
      sku: prod.sku || "",
      barcode: prod.barcode || "",
      description: prod.description || "",
      category_id: prod.category_id || "",
      sale_price: prod.sale_price,
      cost_price: prod.cost_price,
      current_stock: prod.current_stock,
      min_stock: prod.min_stock,
      unit: prod.unit || "UND",
      is_active: prod.is_active === 1,
      image: null
    });
    setPreviewImage(prod.image_filename ? `http://localhost:4000/uploads/${prod.image_filename}` : null);
    setIsEditing(true);
    setShowModal(true);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, image: file });
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const data = new FormData();
    data.append("name", formData.name);
    data.append("sale_price", formData.sale_price);
    data.append("current_stock", formData.current_stock);
    if(formData.barcode) data.append("barcode", formData.barcode);
    if(formData.sku) data.append("sku", formData.sku);
    if(formData.description) data.append("description", formData.description);
    if(formData.category_id) data.append("category_id", formData.category_id);
    if(formData.cost_price) data.append("cost_price", formData.cost_price);
    if(formData.min_stock) data.append("min_stock", formData.min_stock);
    if(formData.unit) data.append("unit", formData.unit);
    data.append("is_active", formData.is_active);
    
    if (formData.image) {
      data.append("image", formData.image);
    }

    try {
      if (isEditing) {
        await api.put(`/products/${formData.id}`, data, { headers: { "Content-Type": "multipart/form-data" } });
        alert("Producto actualizado");
      } else {
        await api.post("/products", data, { headers: { "Content-Type": "multipart/form-data" } });
        alert("Producto creado");
      }
      setShowModal(false);
      loadProducts();
    } catch (error) {
      console.error(error);
      alert("Error al guardar producto. Revisa si el código ya existe.");
    }
  };

  const handleDelete = async (id) => {
    if(!window.confirm("¿Seguro que quieres eliminar este producto?")) return;
    try {
      await api.delete(`/products/${id}/hard`);
      loadProducts();
    } catch (error) {
      alert("Error al eliminar");
    }
  };

  return (
    <div style={{ padding: "30px", backgroundColor: "#000", minHeight: "100vh", color: "#fff" }}>
      
      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
        <h1 style={{ color: "#D4AF37", fontFamily: "serif" }}>GESTIÓN DE PRODUCTOS</h1>
        <button onClick={handleOpenCreate} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px 25px", background: "#D4AF37", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", color: "#000" }}>
          <FiPlus size={20} /> NUEVO PRODUCTO
        </button>
      </div>

      {/* BUSCADOR */}
      <div style={{ marginBottom: "20px", display: "flex", gap: "10px" }}>
        <div style={{ position: "relative", flex: 1, maxWidth: "400px" }}>
          <FiSearch style={{ position: "absolute", left: "12px", top: "12px", color: "#666" }} />
          <input 
            type="text" 
            placeholder="Buscar por Nombre, Barcode o SKU..." 
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            style={{ width: "100%", padding: "12px 12px 12px 40px", background: "#111", border: "1px solid #333", color: "#fff", borderRadius: "8px", outline: "none" }}
          />
        </div>
      </div>

      {/* TABLA */}
      <div style={{ overflowX: "auto", background: "#050505", borderRadius: "10px", border: "1px solid #222" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
          <thead>
            <tr style={{ background: "#111", color: "#D4AF37", textAlign: "left" }}>
              <th style={{ padding: "15px" }}>IMAGEN</th>
              <th style={{ padding: "15px" }}>BARCODE</th>
              <th style={{ padding: "15px" }}>NOMBRE</th>
              <th style={{ padding: "15px" }}>CATEGORÍA</th>
              <th style={{ padding: "15px" }}>PRECIO</th>
              <th style={{ padding: "15px" }}>STOCK</th>
              <th style={{ padding: "15px", textAlign: "center" }}>ACCIONES</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" style={{ textAlign: "center", padding: "20px" }}>Cargando...</td></tr>
            ) : products.map(p => (
              <tr key={p.id} style={{ borderBottom: "1px solid #222" }}>
                <td style={{ padding: "10px" }}>
                  {p.image_filename ? (
                     <img src={`http://localhost:4000/uploads/${p.image_filename}`} alt="img" style={{width:"40px", height:"40px", objectFit:"cover", borderRadius:"4px"}} />
                  ) : (
                     <div style={{width:"40px", height:"40px", background:"#222", borderRadius:"4px", display:"flex", alignItems:"center", justifyContent:"center"}}><FiImage color="#555"/></div>
                  )}
                </td>
                <td style={{ padding: "15px", fontFamily: "monospace", color: "#aaa" }}>{p.barcode || "---"}</td>
                <td style={{ padding: "15px", fontWeight: "bold" }}>{p.name}</td>
                <td style={{ padding: "15px" }}>{categories.find(c => c.id === p.category_id)?.name || "Sin Cat"}</td>
                <td style={{ padding: "15px", color: "#D4AF37" }}>${Number(p.sale_price).toLocaleString()}</td>
                <td style={{ padding: "15px", color: p.current_stock <= p.min_stock ? "#ff4444" : "#fff" }}>{p.current_stock}</td>
                <td style={{ padding: "15px", textAlign: "center" }}>
                  <button onClick={() => handleOpenEdit(p)} style={{ background: "none", border: "none", cursor: "pointer", marginRight: "10px" }}><FiEdit color="#fff" /></button>
                  <button onClick={() => handleDelete(p.id)} style={{ background: "none", border: "none", cursor: "pointer" }}><FiTrash2 color="#f44" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL CREAR / EDITAR */}
      {showModal && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.8)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }}>
          <div style={{ background: "#111", width: "600px", maxWidth: "95%", padding: "30px", borderRadius: "12px", border: "1px solid #D4AF37", maxHeight: "90vh", overflowY: "auto" }}>
            
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
              <h2 style={{ margin: 0, color: "#D4AF37" }}>{isEditing ? "EDITAR PRODUCTO" : "NUEVO PRODUCTO"}</h2>
              <button onClick={() => setShowModal(false)} style={{ background: "none", border: "none", cursor: "pointer" }}><FiX size={24} color="#fff" /></button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              
              {/* CAMPO BARCODE / ESCÁNER CORREGIDO */}
              <div style={{ gridColumn: "1 / -1", background: "#1a1a1a", padding: "15px", borderRadius: "8px", border: "1px dashed #444" }}>
                <label style={{ color: "#D4AF37", display: "block", marginBottom: "8px", fontWeight: "bold" }}>
                  {/* CORRECCIÓN AQUÍ: FaBarcode en vez de FiBarcode */}
                  <FaBarcode style={{ marginRight: "5px", verticalAlign: "bottom" }} /> 
                  CÓDIGO DE BARRAS (Escáner aquí)
                </label>
                <input 
                  type="text" 
                  name="barcode"
                  ref={barcodeInputRef}
                  value={formData.barcode}
                  onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                  placeholder="Escanea el producto o escribe manual..." 
                  style={{ width: "100%", padding: "12px", background: "#000", border: "1px solid #D4AF37", color: "#fff", borderRadius: "5px", fontSize: "1rem" }}
                />
                <small style={{ color: "#666", marginTop: "5px", display: "block" }}>* Si lo dejas vacío, el sistema generará uno automático.</small>
              </div>

              <div>
                <label style={{ display: "block", color: "#aaa", marginBottom: "5px" }}>Nombre Producto *</label>
                <input required type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} style={{ width: "100%", padding: "10px", background: "#222", border: "1px solid #333", color: "#fff", borderRadius: "5px" }} />
              </div>

              <div>
                <label style={{ display: "block", color: "#aaa", marginBottom: "5px" }}>Categoría</label>
                <select value={formData.category_id} onChange={(e) => setFormData({ ...formData, category_id: e.target.value })} style={{ width: "100%", padding: "10px", background: "#222", border: "1px solid #333", color: "#fff", borderRadius: "5px" }}>
                  <option value="">Seleccione...</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div>
                <label style={{ display: "block", color: "#aaa", marginBottom: "5px" }}>Precio Venta *</label>
                <input required type="number" value={formData.sale_price} onChange={(e) => setFormData({ ...formData, sale_price: e.target.value })} style={{ width: "100%", padding: "10px", background: "#222", border: "1px solid #333", color: "#D4AF37", fontWeight: "bold", borderRadius: "5px" }} />
              </div>

              <div>
                <label style={{ display: "block", color: "#aaa", marginBottom: "5px" }}>Costo Compra</label>
                <input type="number" value={formData.cost_price} onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })} style={{ width: "100%", padding: "10px", background: "#222", border: "1px solid #333", color: "#fff", borderRadius: "5px" }} />
              </div>

              <div>
                <label style={{ display: "block", color: "#aaa", marginBottom: "5px" }}>Stock Actual</label>
                <input type="number" value={formData.current_stock} onChange={(e) => setFormData({ ...formData, current_stock: e.target.value })} style={{ width: "100%", padding: "10px", background: "#222", border: "1px solid #333", color: "#fff", borderRadius: "5px" }} />
              </div>

              <div>
                <label style={{ display: "block", color: "#aaa", marginBottom: "5px" }}>Stock Mínimo</label>
                <input type="number" value={formData.min_stock} onChange={(e) => setFormData({ ...formData, min_stock: e.target.value })} style={{ width: "100%", padding: "10px", background: "#222", border: "1px solid #333", color: "#fff", borderRadius: "5px" }} />
              </div>

              <div style={{ gridColumn: "1 / -1" }}>
                <label style={{ display: "block", color: "#aaa", marginBottom: "5px" }}>Imagen del Producto</label>
                <input type="file" accept="image/*" onChange={handleImageChange} style={{ marginBottom: "10px", color: "#fff" }} />
                {previewImage && <img src={previewImage} alt="Preview" style={{ width: "100px", height: "100px", objectFit: "cover", borderRadius: "8px", border: "1px solid #444" }} />}
              </div>

              <div style={{ gridColumn: "1 / -1", marginTop: "20px" }}>
                <button type="submit" style={{ width: "100%", padding: "15px", background: "#D4AF37", color: "#000", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", fontSize: "1rem" }}>
                  {isEditing ? "GUARDAR CAMBIOS" : "CREAR PRODUCTO"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}
import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api"; 
import { FiPlus, FiEdit, FiTrash2, FiSearch, FiX, FiTrendingUp, FiPackage, FiGrid, FiAlertCircle, FiEye, FiEyeOff, FiRefreshCw } from "react-icons/fi";
import { FaBarcode } from "react-icons/fa"; 

export default function AdminProducts() {
  const navigate = useNavigate();
  
  const [products, setProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // 🆕 Estado para mostrar inactivos
  const [showInactive, setShowInactive] = useState(false);

  // Estado para modal de confirmación de eliminación
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [deleteError, setDeleteError] = useState(null);

  const barcodeInputRef = useRef(null);

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
  }, [showInactive]); // 🔥 Recargar cuando cambie showInactive

  useEffect(() => {
    if (showModal && barcodeInputRef.current) {
      setTimeout(() => barcodeInputRef.current.focus(), 100);
    }
  }, [showModal]);

  // 🔥 FUNCIÓN ACTUALIZADA: Cargar productos con filtro de inactivos
  const loadProducts = async () => {
    setLoading(true);
    try {
      const url = showInactive ? "/products?include_inactive=true" : "/products";
      const res = await api.get(url);
      const productsList = res.data.items || [];
      setAllProducts(productsList);
      setProducts(productsList);
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
      if (selectedCategory) {
        setProducts(allProducts.filter(p => p.category_id === selectedCategory));
      } else {
        setProducts(allProducts);
      }
      return;
    }
    
    if (val.length > 2) {
      try {
        const url = showInactive 
          ? `/products/search?q=${val}&include_inactive=true` 
          : `/products/search?q=${val}`;
        const res = await api.get(url);
        let filtered = res.data.items || [];
        
        if (selectedCategory) {
          filtered = filtered.filter(p => p.category_id === selectedCategory);
        }
        
        setProducts(filtered);
      } catch (error) {
        console.error("Error en búsqueda", error);
      }
    }
  };

  const handleCategoryFilter = (categoryId) => {
    setSelectedCategory(categoryId);
    
    if (categoryId === null) {
      if (searchTerm.trim().length > 0) {
        handleSearch(searchTerm);
      } else {
        setProducts(allProducts);
      }
    } else {
      let filtered = allProducts.filter(p => p.category_id === categoryId);
      
      if (searchTerm.trim().length > 0) {
        const searchLower = searchTerm.toLowerCase();
        filtered = filtered.filter(p => 
          p.name.toLowerCase().includes(searchLower) || 
          (p.barcode && p.barcode.includes(searchTerm))
        );
      }
      
      setProducts(filtered);
    }
  };

  const getProductCountByCategory = (categoryId) => {
    return allProducts.filter(p => p.category_id === categoryId).length;
  };

  const handleOpenCreate = () => {
    setFormData({ 
      id: null, 
      name: "", 
      barcode: "", 
      category_id: "", 
      sale_price: "", 
      cost_price: "", 
      current_stock: "", 
      is_active: true 
    });
    setIsEditing(false);
    setShowModal(true);
  };

  const handleOpenEdit = (prod) => {
    setFormData({
      id: prod.id,
      name: prod.name,
      barcode: prod.barcode || "",
      category_id: prod.category_id || "",
      sale_price: String(prod.sale_price),
      cost_price: String(prod.cost_price),
      current_stock: String(prod.current_stock),
      is_active: prod.is_active === 1
    });
    setIsEditing(true);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const payload = {
      name: formData.name.trim(),
      barcode: formData.barcode.trim() || null,
      category_id: formData.category_id ? Number(formData.category_id) : null,
      sale_price: Number(formData.sale_price),
      cost_price: Number(formData.cost_price),
      current_stock: Number(formData.current_stock),
      is_active: formData.is_active ? 1 : 0
    };

    try {
      if (isEditing) {
        console.log("📝 Actualizando producto:", payload);
        await api.put(`/products/${formData.id}`, payload);
        alert("Producto actualizado correctamente");
      } else {
        console.log("➕ Creando producto:", payload);
        await api.post("/products", payload);
        alert("Producto creado correctamente");
      }
      setShowModal(false);
      loadProducts();
    } catch (error) {
      console.error("Error al procesar:", error);
      const errorMsg = error.response?.data?.message || "Error al procesar el producto. Verifica los datos.";
      alert(errorMsg);
    }
  };

  // NUEVA FUNCIÓN: Reactivar producto
  const handleReactivate = async (productId) => {
    if (!window.confirm("¿Deseas reactivar este producto para que vuelva a aparecer en el POS?")) return;

    try {
      await api.put(`/products/${productId}`, { is_active: 1 });
      alert("✅ Producto reactivado correctamente");
      loadProducts();
    } catch (error) {
      console.error("Error al reactivar:", error);
      alert("Error al reactivar el producto");
    }
  };

  const handleDeleteClick = (product) => {
    setProductToDelete(product);
    setDeleteError(null);
    setShowDeleteModal(true);
  };

  const handleDeleteHard = async () => {
    if (!productToDelete) return;

    try {
      await api.delete(`/products/${productToDelete.id}/hard`);
      alert("✅ Producto eliminado definitivamente");
      setShowDeleteModal(false);
      setProductToDelete(null);
      loadProducts();
    } catch (error) {
      console.error("Error al eliminar:", error);
      
      const errorData = error.response?.data;
      
      if (error.response?.status === 400) {
        setDeleteError({
          message: errorData?.message || "No se puede eliminar este producto",
          recommendation: errorData?.recommendation,
          sales_count: errorData?.sales_count
        });
      } else {
        alert("Error al eliminar el producto. Inténtalo de nuevo.");
        setShowDeleteModal(false);
      }
    }
  };

  const handleDeleteSoft = async () => {
    if (!productToDelete) return;

    try {
      const res = await api.delete(`/products/${productToDelete.id}/soft`);
      alert(`✅ ${res.data.message}\n\nEl producto ya no aparecerá en el POS pero se preserva el historial de ventas.`);
      setShowDeleteModal(false);
      setProductToDelete(null);
      loadProducts();
    } catch (error) {
      console.error("Error al marcar como inactivo:", error);
      alert("Error al marcar el producto como inactivo.");
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
        <div style={{ display: "flex", gap: "12px" }}>
          {/* 🆕 BOTÓN TOGGLE INACTIVOS */}
          <button 
            onClick={() => setShowInactive(!showInactive)}
            style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: "10px", 
              padding: "14px 24px", 
              background: showInactive ? "#444" : "#222", 
              border: showInactive ? "2px solid #888" : "1px solid #333",
              borderRadius: "12px", 
              fontWeight: "bold", 
              cursor: "pointer", 
              color: showInactive ? "#fff" : "#888",
              transition: "all 0.2s"
            }}
          >
            {showInactive ? <FiEye size={20} /> : <FiEyeOff size={20} />}
            {showInactive ? "OCULTAR INACTIVOS" : "VER INACTIVOS"}
          </button>

          <button onClick={handleOpenCreate} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "14px 30px", background: "#D4AF37", border: "none", borderRadius: "12px", fontWeight: "bold", cursor: "pointer", color: "#000", boxShadow: "0 4px 15px rgba(212, 175, 55, 0.2)" }}>
            <FiPlus size={20} /> NUEVO PRODUCTO
          </button>
        </div>
      </div>

      {/* BÚSQUEDA */}
      <div style={{ marginBottom: "20px" }}>
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

      {/* BARRA DE CATEGORÍAS */}
      <div style={{ marginBottom: "30px", padding: "20px", background: "#0a0a0a", borderRadius: "15px", border: "1px solid #1a1a1a" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "15px" }}>
          <FiGrid color="#D4AF37" size={20} />
          <h3 style={{ margin: 0, color: "#D4AF37", fontSize: "1rem" }}>FILTRAR POR CATEGORÍA</h3>
        </div>
        
        <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
          <button
            onClick={() => handleCategoryFilter(null)}
            style={{
              padding: "10px 20px",
              background: selectedCategory === null ? "#D4AF37" : "#111",
              color: selectedCategory === null ? "#000" : "#888",
              border: selectedCategory === null ? "none" : "1px solid #222",
              borderRadius: "10px",
              fontWeight: "bold",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              transition: "all 0.2s"
            }}
          >
            TODAS
            <span style={{ 
              padding: "2px 8px", 
              background: selectedCategory === null ? "#000" : "#1a1a1a", 
              color: selectedCategory === null ? "#D4AF37" : "#555",
              borderRadius: "6px", 
              fontSize: "0.85rem" 
            }}>
              {allProducts.length}
            </span>
          </button>

          {categories.map(cat => {
            const count = getProductCountByCategory(cat.id);
            const isActive = selectedCategory === cat.id;
            
            return (
              <button
                key={cat.id}
                onClick={() => handleCategoryFilter(cat.id)}
                style={{
                  padding: "10px 20px",
                  background: isActive ? "#D4AF37" : "#111",
                  color: isActive ? "#000" : "#888",
                  border: isActive ? "none" : "1px solid #222",
                  borderRadius: "10px",
                  fontWeight: "bold",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  transition: "all 0.2s"
                }}
              >
                {cat.name.toUpperCase()}
                <span style={{ 
                  padding: "2px 8px", 
                  background: isActive ? "#000" : "#1a1a1a", 
                  color: isActive ? "#D4AF37" : "#555",
                  borderRadius: "6px", 
                  fontSize: "0.85rem" 
                }}>
                  {count}
                </span>
              </button>
            );
          })}
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
              <th style={{ padding: "22px", color: "#D4AF37", borderBottom: "1px solid #1a1a1a" }}>ESTADO</th>
              <th style={{ padding: "22px", color: "#D4AF37", borderBottom: "1px solid #1a1a1a", textAlign: "center" }}>ACCIONES</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="8" style={{ textAlign: "center", padding: "50px", color: "#444" }}>Actualizando inventario...</td></tr>
            ) : products.length === 0 ? (
              <tr><td colSpan="8" style={{ textAlign: "center", padding: "50px", color: "#444" }}>
                {selectedCategory ? "No hay productos en esta categoría" : "No hay productos registrados"}
              </td></tr>
            ) : products.map(p => {
              const profit = Number(p.sale_price) - Number(p.cost_price);
              const isInactive = p.is_active === 0;
              
              return (
                <tr key={p.id} style={{ borderBottom: "1px solid #0f0f0f", opacity: isInactive ? 0.5 : 1 }}>
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
                  <td style={{ padding: "20px" }}>
                    {isInactive ? (
                      <span style={{ padding: "6px 14px", background: "rgba(136, 136, 136, 0.1)", color: "#888", borderRadius: "8px", fontSize: "0.8rem", border: "1px solid #444", fontWeight: "bold" }}>
                        INACTIVO
                      </span>
                    ) : (
                      <span style={{ padding: "6px 14px", background: "rgba(46, 204, 113, 0.1)", color: "#2ecc71", borderRadius: "8px", fontSize: "0.8rem", border: "1px solid #2ecc71", fontWeight: "bold" }}>
                        ACTIVO
                      </span>
                    )}
                  </td>
                  <td style={{ padding: "20px", textAlign: "center" }}>
                    {isInactive ? (
                      <button 
                        onClick={() => handleReactivate(p.id)}
                        style={{ background: "#2ecc71", border: "none", padding: "8px 16px", borderRadius: "6px", color: "#000", fontWeight: "bold", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", margin: "0 auto" }}
                        title="Reactivar producto"
                      >
                        <FiRefreshCw size={16} /> REACTIVAR
                      </button>
                    ) : (
                      <>
                        <button 
                          onClick={() => navigate(`/admin/productos/${p.id}/presentations`)} 
                          style={{ background: "none", border: "none", cursor: "pointer", marginRight: "15px" }}
                          title="Gestionar presentaciones"
                        >
                          <FiPackage color="#2ecc71" size={20} />
                        </button>
                        
                        <button onClick={() => handleOpenEdit(p)} style={{ background: "none", border: "none", cursor: "pointer", marginRight: "15px" }}>
                          <FiEdit color="#D4AF37" size={20} />
                        </button>
                        
                        <button onClick={() => handleDeleteClick(p)} style={{ background: "none", border: "none", cursor: "pointer" }}>
                          <FiTrash2 color="#ff4444" size={20} />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* MODAL DE PRODUCTO (CREATE/EDIT) */}
      {showModal && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.85)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000, backdropFilter: "blur(10px)" }}>
          <div style={{ background: "#0a0a0a", width: "550px", maxHeight: "90vh", overflowY: "auto", padding: "40px", borderRadius: "30px", border: "1px solid #D4AF37" }}>
            
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "35px" }}>
              <h2 style={{ margin: 0, color: "#D4AF37" }}>
                {isEditing ? "✏️ MODIFICAR PRODUCTO" : "➕ NUEVO PRODUCTO"}
              </h2>
              <button onClick={() => setShowModal(false)} style={{ background: "#111", border: "none", borderRadius: "50%", width: "40px", height: "40px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><FiX size={20} color="#fff" /></button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "25px" }}>
              
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={{ color: "#D4AF37", display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px", fontWeight: "bold" }}>
                  <FaBarcode /> CÓDIGO DE BARRAS {!isEditing && "(Opcional)"}
                </label>
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
                <label style={{ color: "#555", marginBottom: "8px", display: "block" }}>Nombre del Producto *</label>
                <input 
                  required 
                  type="text" 
                  value={formData.name} 
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                  placeholder="Ej: Coca Cola 2L"
                  style={{ width: "100%", padding: "14px", background: "#000", border: "1px solid #1a1a1a", color: "#fff", borderRadius: "12px" }} 
                />
              </div>

              <div>
                <label style={{ color: "#555", marginBottom: "8px", display: "block" }}>Categoría</label>
                <select 
                  value={formData.category_id} 
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })} 
                  style={{ width: "100%", padding: "14px", background: "#000", border: "1px solid #1a1a1a", color: "#fff", borderRadius: "12px" }}
                >
                  <option value="">Sin categoría</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div>
                <label style={{ color: "#2ecc71", marginBottom: "8px", display: "flex", alignItems: "center", gap: "5px" }}>
                  <FiPackage /> Stock Actual *
                </label>
                <input 
                  required 
                  type="number" 
                  min="0"
                  step="1"
                  value={formData.current_stock} 
                  onChange={(e) => setFormData({ ...formData, current_stock: e.target.value })} 
                  placeholder="Ej: 50"
                  style={{ width: "100%", padding: "14px", background: "#000", border: "1px solid #2ecc71", color: "#2ecc71", borderRadius: "12px", fontWeight: "bold" }} 
                />
              </div>

              <div>
                <label style={{ color: "#555", marginBottom: "8px", display: "block" }}>Precio Costo ($) *</label>
                <input 
                  required 
                  type="number" 
                  min="0"
                  step="0.01"
                  value={formData.cost_price} 
                  onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })} 
                  placeholder="Ej: 5000"
                  style={{ width: "100%", padding: "14px", background: "#000", border: "1px solid #1a1a1a", color: "#fff", borderRadius: "12px" }} 
                />
              </div>

              <div>
                <label style={{ color: "#D4AF37", marginBottom: "8px", display: "block" }}>Precio Venta ($) *</label>
                <input 
                  required 
                  type="number" 
                  min="0"
                  step="0.01"
                  value={formData.sale_price} 
                  onChange={(e) => setFormData({ ...formData, sale_price: e.target.value })} 
                  placeholder="Ej: 7000"
                  style={{ width: "100%", padding: "14px", background: "#000", border: "1px solid #D4AF37", color: "#D4AF37", borderRadius: "12px", fontWeight: "bold" }} 
                />
              </div>

              {formData.sale_price && formData.cost_price && (
                <div style={{ gridColumn: "1 / -1", padding: "12px", background: "#0f0f0f", borderRadius: "12px", border: "1px solid #1a1a1a" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ color: "#888" }}>Ganancia por unidad:</span>
                    <span style={{ color: "#2ecc71", fontWeight: "bold", fontSize: "1.2rem" }}>
                      ${(Number(formData.sale_price) - Number(formData.cost_price)).toLocaleString()}
                    </span>
                  </div>
                </div>
              )}

              <button 
                type="submit" 
                style={{ 
                  gridColumn: "1 / -1", 
                  padding: "18px", 
                  background: "#D4AF37", 
                  color: "#000", 
                  border: "none", 
                  borderRadius: "15px", 
                  fontWeight: "bold", 
                  cursor: "pointer", 
                  fontSize: "1.1rem", 
                  marginTop: "15px" 
                }}
              >
                {isEditing ? "💾 GUARDAR CAMBIOS" : "✅ CREAR PRODUCTO"}
              </button>

            </form>
          </div>
        </div>
      )}

      {/* MODAL DE ELIMINACIÓN */}
      {showDeleteModal && productToDelete && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.9)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 2000, backdropFilter: "blur(10px)" }}>
          <div style={{ background: "#0a0a0a", width: "500px", padding: "40px", borderRadius: "25px", border: "2px solid #ff4444" }}>
            
            <div style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "25px" }}>
              <FiAlertCircle size={40} color="#ff4444" />
              <h2 style={{ margin: 0, color: "#ff4444", fontSize: "1.5rem" }}>ELIMINAR PRODUCTO</h2>
            </div>

            <div style={{ marginBottom: "30px" }}>
              <p style={{ color: "#fff", fontSize: "1.1rem", marginBottom: "10px" }}>
                <strong>{productToDelete.name}</strong>
              </p>
              <p style={{ color: "#888", fontSize: "0.9rem" }}>
                Código: {productToDelete.barcode || "Sin código"}
              </p>
            </div>

            {!deleteError ? (
              <>
                <p style={{ color: "#ccc", marginBottom: "30px", lineHeight: "1.6" }}>
                  ¿Estás seguro de que deseas <strong>eliminar definitivamente</strong> este producto?
                </p>

                <div style={{ display: "flex", gap: "12px" }}>
                  <button 
                    onClick={() => {
                      setShowDeleteModal(false);
                      setProductToDelete(null);
                    }}
                    style={{ flex: 1, padding: "14px", background: "#222", color: "#fff", border: "1px solid #444", borderRadius: "12px", fontWeight: "bold", cursor: "pointer" }}
                  >
                    CANCELAR
                  </button>
                  <button 
                    onClick={handleDeleteHard}
                    style={{ flex: 1, padding: "14px", background: "#ff4444", color: "#fff", border: "none", borderRadius: "12px", fontWeight: "bold", cursor: "pointer" }}
                  >
                    SÍ, ELIMINAR
                  </button>
                </div>
              </>
            ) : (
              <>
                <div style={{ padding: "20px", background: "#1a0000", border: "1px solid #ff4444", borderRadius: "12px", marginBottom: "25px" }}>
                  <p style={{ color: "#ff6666", marginBottom: "15px", lineHeight: "1.6" }}>
                    <strong>{deleteError.message}</strong>
                  </p>
                  
                  {deleteError.sales_count && (
                    <p style={{ color: "#888", fontSize: "0.9rem", marginBottom: "15px" }}>
                      Este producto tiene <strong>{deleteError.sales_count}</strong> venta(s) registrada(s).
                    </p>
                  )}

                  <p style={{ color: "#aaa", fontSize: "0.95rem", lineHeight: "1.5" }}>
                    {deleteError.recommendation}
                  </p>
                </div>

                <div style={{ display: "flex", gap: "12px" }}>
                  <button 
                    onClick={() => {
                      setShowDeleteModal(false);
                      setProductToDelete(null);
                      setDeleteError(null);
                    }}
                    style={{ flex: 1, padding: "14px", background: "#222", color: "#fff", border: "1px solid #444", borderRadius: "12px", fontWeight: "bold", cursor: "pointer" }}
                  >
                    CANCELAR
                  </button>
                  <button 
                    onClick={handleDeleteSoft}
                    style={{ flex: 1, padding: "14px", background: "#D4AF37", color: "#000", border: "none", borderRadius: "12px", fontWeight: "bold", cursor: "pointer" }}
                  >
                    MARCAR COMO INACTIVO
                  </button>
                </div>
              </>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
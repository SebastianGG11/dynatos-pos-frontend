import { useState, useEffect } from "react";
import axios from "axios";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  
  // URL DE TU BACKEND EN RENDER (Verifica que sea la correcta)
  const API_URL = "https://dynatos-pos-backend-1.onrender.com/users";

  // Estado para el formulario
  const [formData, setFormData] = useState({
    full_name: "",
    username: "",
    password: "",
    role_id: "2" // Por defecto seleccionamos "Cajero"
  });

  // 1. CARGAR USUARIOS AL INICIAR
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      // Si ya implementaste seguridad con token, aquí deberías agregar los headers
      const res = await axios.get(API_URL);
      setUsers(res.data);
    } catch (error) {
      console.error("Error cargando usuarios:", error);
      // No mostramos alerta al cargar para no molestar si solo está lento
    }
  };

  // 2. GUARDAR NUEVO USUARIO
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.post(API_URL, formData);
      alert("✅ Usuario creado correctamente");
      
      // Limpiar y cerrar
      setShowModal(false);
      setFormData({ full_name: "", username: "", password: "", role_id: "2" });
      fetchUsers(); // Recargar la lista para ver al nuevo
    } catch (error) {
      console.error(error);
      alert("❌ Error: " + (error.response?.data?.message || "No se pudo crear el usuario"));
    } finally {
      setLoading(false);
    }
  };

  // 3. ACTIVAR / DESACTIVAR (Soft Delete)
  const toggleStatus = async (id, currentStatus) => {
    const accion = currentStatus ? "desactivar" : "activar";
    if (!window.confirm(`¿Seguro que deseas ${accion} a este usuario?`)) return;

    try {
      await axios.put(`${API_URL}/${id}/status`);
      fetchUsers(); // Recargar para ver el cambio de color
    } catch (error) {
      alert("Error al cambiar estado");
    }
  };

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h2 style={{ margin: 0 }}>👥 Gestión de Personal</h2>
        <button 
          onClick={() => setShowModal(true)}
          style={{ 
            backgroundColor: "#007bff", color: "white", border: "none", 
            padding: "10px 20px", borderRadius: "5px", cursor: "pointer", fontWeight: "bold"
          }}
        >
          + Nuevo Empleado
        </button>
      </div>

      {/* TABLA DE USUARIOS */}
      <div style={{ overflowX: "auto", boxShadow: "0 0 10px rgba(0,0,0,0.1)", borderRadius: "8px" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", background: "white" }}>
          <thead>
            <tr style={{ background: "#343a40", color: "white", textAlign: "left" }}>
              <th style={{ padding: "12px" }}>Nombre Completo</th>
              <th style={{ padding: "12px" }}>Usuario</th>
              <th style={{ padding: "12px" }}>Rol</th>
              <th style={{ padding: "12px" }}>Estado</th>
              <th style={{ padding: "12px", textAlign: "center" }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} style={{ borderBottom: "1px solid #dee2e6" }}>
                <td style={{ padding: "12px" }}>{user.full_name}</td>
                <td style={{ padding: "12px", fontWeight: "bold" }}>{user.username}</td>
                <td style={{ padding: "12px" }}>
                  <span style={{ 
                    padding: "4px 10px", borderRadius: "15px", fontSize: "12px", fontWeight: "bold",
                    backgroundColor: user.role_name === "ADMIN" ? "#d1ecf1" : "#fff3cd",
                    color: user.role_name === "ADMIN" ? "#0c5460" : "#856404"
                  }}>
                    {user.role_name || (user.role_id === 1 ? "ADMIN" : "CAJERO")}
                  </span>
                </td>
                <td style={{ padding: "12px" }}>
                  <span style={{ color: user.is_active ? "green" : "red", fontWeight: "bold" }}>
                    {user.is_active ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td style={{ padding: "12px", textAlign: "center" }}>
                  <button 
                    onClick={() => toggleStatus(user.id, user.is_active)}
                    style={{ 
                      padding: "6px 12px", cursor: "pointer", border: "none", borderRadius: "4px", color: "white",
                      backgroundColor: user.is_active ? "#dc3545" : "#28a745" // Rojo si activo, Verde si inactivo
                    }}
                  >
                    {user.is_active ? "Desactivar" : "Activar"}
                  </button>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan="5" style={{ padding: "20px", textAlign: "center", color: "#666" }}>
                  No hay usuarios registrados (además de ti).
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL (Ventana emergente) */}
      {showModal && (
        <div style={{ 
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 
        }}>
          <div style={{ background: "white", padding: "25px", borderRadius: "8px", width: "90%", maxWidth: "400px" }}>
            <h3 style={{ marginTop: 0 }}>Nuevo Empleado</h3>
            <form onSubmit={handleSubmit}>
              
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Nombre Completo:</label>
              <input 
                required 
                placeholder="Ej: Juan Pérez"
                value={formData.full_name}
                onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                style={{ width: "100%", padding: "8px", marginBottom: "15px", border: "1px solid #ccc", borderRadius: "4px" }}
              />

              <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Usuario (Login):</label>
              <input 
                required 
                placeholder="Ej: juan.caja1"
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
                style={{ width: "100%", padding: "8px", marginBottom: "15px", border: "1px solid #ccc", borderRadius: "4px" }}
              />

              <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Contraseña:</label>
              <input 
                type="password"
                required 
                placeholder="******"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                style={{ width: "100%", padding: "8px", marginBottom: "15px", border: "1px solid #ccc", borderRadius: "4px" }}
              />

              <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Rol:</label>
              <select 
                value={formData.role_id}
                onChange={(e) => setFormData({...formData, role_id: e.target.value})}
                style={{ width: "100%", padding: "8px", marginBottom: "20px", border: "1px solid #ccc", borderRadius: "4px" }}
              >
                <option value="2">Cajero (Ventas)</option>
                <option value="1">Administrador (Total)</option>
              </select>

              <div style={{ display: "flex", gap: "10px" }}>
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  style={{ flex: 1, padding: "10px", background: "#6c757d", color: "white", border: "none", borderRadius: "5px", cursor: "pointer" }}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={loading}
                  style={{ flex: 1, padding: "10px", background: "#28a745", color: "white", border: "none", borderRadius: "5px", cursor: "pointer" }}
                >
                  {loading ? "Guardando..." : "Guardar Empleado"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}
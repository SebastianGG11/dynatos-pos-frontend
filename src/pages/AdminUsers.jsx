import { useState, useEffect } from "react";
import axios from "axios";
import { FiUserPlus, FiUserCheck, FiUserX, FiShield, FiUsers, FiAlertCircle } from "react-icons/fi";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  
  const API_URL = "https://dynatos-pos-backend-1.onrender.com/users";

  const [formData, setFormData] = useState({
    full_name: "",
    username: "",
    password: "",
    role_id: "2"
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await axios.get(API_URL);
      setUsers(res.data);
    } catch (error) {
      console.error("Error cargando usuarios:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(API_URL, formData);
      setShowModal(false);
      setFormData({ full_name: "", username: "", password: "", role_id: "2" });
      fetchUsers();
    } catch (error) {
      alert("❌ Error: " + (error.response?.data?.message || "No se pudo crear el usuario"));
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    const accion = currentStatus ? "desactivar" : "activar";
    if (!window.confirm(`¿Seguro que deseas ${accion} a este usuario?`)) return;

    try {
      await axios.put(`${API_URL}/${id}/status`);
      fetchUsers();
    } catch (error) {
      alert("Error al cambiar estado");
    }
  };

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", animation: "fadeIn 0.5s ease" }}>
      
      {/* HEADER PREMIUM */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        backgroundColor: "#111", padding: "30px", borderRadius: "15px",
        border: "1px solid #D4AF37", marginBottom: "30px", boxShadow: "0 10px 30px rgba(0,0,0,0.5)"
      }}>
        <div>
          <h1 style={{ color: "#D4AF37", margin: 0, fontSize: "2rem", letterSpacing: "3px", fontWeight: "bold", fontFamily: 'serif' }}>
            PERSONAL
          </h1>
          <p style={{ color: "#888", fontSize: "0.9rem", margin: "5px 0 0 0" }}>
            Gestión de Accesos Dynatos Market & Licorería
          </p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          style={{ 
            backgroundColor: "#D4AF37", color: "#000", border: "none", 
            padding: "14px 28px", borderRadius: "10px", cursor: "pointer", 
            fontWeight: "bold", display: "flex", alignItems: "center", gap: "10px",
            transition: "0.3s", fontSize: "0.9rem"
          }}
        >
          <FiUserPlus size={20} /> NUEVO EMPLEADO
        </button>
      </div>

      {/* TABLA DE USUARIOS */}
      <div style={{ 
        backgroundColor: "#111", borderRadius: "15px", border: "1px solid #222", 
        overflow: "hidden", boxShadow: "0 10px 30px rgba(0,0,0,0.3)" 
      }}>
        <table style={{ width: "100%", borderCollapse: "collapse", color: "#eee" }}>
          <thead>
            <tr style={{ backgroundColor: "#1a1a1a", color: "#D4AF37", textAlign: "left" }}>
              <th style={{ padding: "20px", borderBottom: "1px solid #222", fontSize: "0.8rem", letterSpacing: "1px" }}>EMPLEADO</th>
              <th style={{ padding: "20px", borderBottom: "1px solid #222", fontSize: "0.8rem", letterSpacing: "1px" }}>USUARIO</th>
              <th style={{ padding: "20px", borderBottom: "1px solid #222", fontSize: "0.8rem", letterSpacing: "1px" }}>ROL</th>
              <th style={{ padding: "20px", borderBottom: "1px solid #222", fontSize: "0.8rem", letterSpacing: "1px" }}>ESTADO</th>
              <th style={{ padding: "20px", borderBottom: "1px solid #222", textAlign: "center", fontSize: "0.8rem", letterSpacing: "1px" }}>ACCIONES</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} style={{ borderBottom: "1px solid #222", transition: "0.2s" }} onMouseOver={e => e.currentTarget.style.backgroundColor = "#161616"} onMouseOut={e => e.currentTarget.style.backgroundColor = "transparent"}>
                <td style={{ padding: "20px" }}>
                   <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div style={{ backgroundColor: "#000", padding: "8px", borderRadius: "50%", border: "1px solid #333", color: "#D4AF37" }}>
                        <FiUsers size={18} />
                      </div>
                      <span style={{ fontWeight: "bold" }}>{user.full_name}</span>
                   </div>
                </td>
                <td style={{ padding: "20px", color: "#888" }}>{user.username}</td>
                <td style={{ padding: "20px" }}>
                  <span style={{ 
                    padding: "5px 12px", borderRadius: "20px", fontSize: "0.75rem", fontWeight: "bold",
                    backgroundColor: user.role_name === "ADMIN" ? "#D4AF37" : "#333",
                    color: user.role_name === "ADMIN" ? "#000" : "#D4AF37",
                    display: "inline-flex", alignItems: "center", gap: "5px"
                  }}>
                    {user.role_name === "ADMIN" && <FiShield size={12} />}
                    {user.role_name || (user.role_id === 1 ? "ADMIN" : "CAJERO")}
                  </span>
                </td>
                <td style={{ padding: "20px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", color: user.is_active ? "#5c5" : "#f55", fontSize: "0.85rem", fontWeight: "bold" }}>
                    {user.is_active ? <FiUserCheck /> : <FiUserX />}
                    {user.is_active ? "Activo" : "Inactivo"}
                  </div>
                </td>
                <td style={{ padding: "20px", textAlign: "center" }}>
                  <button 
                    onClick={() => toggleStatus(user.id, user.is_active)}
                    style={{ 
                      padding: "8px 16px", cursor: "pointer", border: "1px solid", borderRadius: "8px", 
                      fontSize: "0.75rem", fontWeight: "bold", transition: "0.3s",
                      backgroundColor: "transparent",
                      color: user.is_active ? "#f55" : "#5c5",
                      borderColor: user.is_active ? "#f55" : "#5c5"
                    }}
                    onMouseOver={e => {
                      e.currentTarget.style.backgroundColor = user.is_active ? "#f55" : "#5c5";
                      e.currentTarget.style.color = "#000";
                    }}
                    onMouseOut={e => {
                      e.currentTarget.style.backgroundColor = "transparent";
                      e.currentTarget.style.color = user.is_active ? "#f55" : "#5c5";
                    }}
                  >
                    {user.is_active ? "DESACTIVAR" : "ACTIVAR"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL (DISEÑO PREMIUM) */}
      {showModal && (
        <div style={{ 
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: "rgba(0,0,0,0.9)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 2000,
          backdropFilter: "blur(5px)"
        }}>
          <div style={{ background: "#111", padding: "40px", borderRadius: "20px", width: "95%", maxWidth: "450px", border: "1px solid #D4AF37", boxShadow: "0 0 50px rgba(0,0,0,1)" }}>
            <h3 style={{ marginTop: 0, color: "#D4AF37", fontSize: "1.5rem", marginBottom: "25px", textAlign: "center", letterSpacing: "2px" }}>NUEVO EMPLEADO</h3>
            <form onSubmit={handleSubmit}>
              
              <div style={{ marginBottom: "20px" }}>
                <label style={{ color: "#D4AF37", fontSize: "0.75rem", fontWeight: "bold", display: "block", marginBottom: "8px" }}>NOMBRE COMPLETO</label>
                <input required value={formData.full_name} onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                  style={{ width: "100%", padding: "12px", background: "#000", border: "1px solid #333", borderRadius: "8px", color: "#fff", outline: "none" }} />
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={{ color: "#D4AF37", fontSize: "0.75rem", fontWeight: "bold", display: "block", marginBottom: "8px" }}>USUARIO (LOGIN)</label>
                <input required value={formData.username} onChange={(e) => setFormData({...formData, username: e.target.value})}
                  style={{ width: "100%", padding: "12px", background: "#000", border: "1px solid #333", borderRadius: "8px", color: "#fff", outline: "none" }} />
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={{ color: "#D4AF37", fontSize: "0.75rem", fontWeight: "bold", display: "block", marginBottom: "8px" }}>CONTRASEÑA</label>
                <input type="password" required value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})}
                  style={{ width: "100%", padding: "12px", background: "#000", border: "1px solid #333", borderRadius: "8px", color: "#fff", outline: "none" }} />
              </div>

              <div style={{ marginBottom: "30px" }}>
                <label style={{ color: "#D4AF37", fontSize: "0.75rem", fontWeight: "bold", display: "block", marginBottom: "8px" }}>ROL DEL SISTEMA</label>
                <select value={formData.role_id} onChange={(e) => setFormData({...formData, role_id: e.target.value})}
                  style={{ width: "100%", padding: "12px", background: "#000", border: "1px solid #333", borderRadius: "8px", color: "#fff", outline: "none", cursor: "pointer" }}>
                  <option value="2">Cajero (Ventas)</option>
                  <option value="1">Administrador (Total)</option>
                </select>
              </div>

              <div style={{ display: "flex", gap: "15px" }}>
                <button type="button" onClick={() => setShowModal(false)}
                  style={{ flex: 1, padding: "14px", background: "transparent", color: "#666", border: "1px solid #333", borderRadius: "10px", cursor: "pointer", fontWeight: "bold" }}>
                  CANCELAR
                </button>
                <button type="submit" disabled={loading}
                  style={{ flex: 1, padding: "14px", background: "#D4AF37", color: "#000", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "bold" }}>
                  {loading ? "GUARDANDO..." : "GUARDAR"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
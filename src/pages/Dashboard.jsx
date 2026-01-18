import { useEffect, useState } from "react";
import api from "../api/api";
import { FiTrendingUp, FiDollarSign, FiAlertTriangle, FiX, FiBox } from "react-icons/fi";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalSales: 0,
    totalOrders: 0,
    lowStockCount: 0,
    lowStockItems: [], // Lista real de productos
    recentSales: []
  });

  const [showModal, setShowModal] = useState(false); // Para ver el stock bajo

  useEffect(() => {
    const loadStats = async () => {
      try {
        const res = await api.get("/reports/dashboard-stats");
        setStats(res.data);
      } catch (e) {
        console.error("Error cargando dashboard:", e);
      }
    };
    loadStats();
  }, []);

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", animation: "fadeIn 0.5s ease", position: "relative" }}>
      <h1 style={{ color: "#D4AF37", fontFamily: "serif", fontSize: "2rem", marginBottom: "30px" }}>PANEL GENERAL</h1>

      {/* TARJETAS SUPERIORES */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "20px", marginBottom: "40px" }}>
        
        {/* Ventas */}
        <div style={{ backgroundColor: "#111", padding: "25px", borderRadius: "15px", border: "1px solid #D4AF37", display: "flex", alignItems: "center", gap: "20px" }}>
          <div style={{ background: "rgba(212, 175, 55, 0.1)", padding: "15px", borderRadius: "50%" }}>
            <FiDollarSign size={30} color="#D4AF37" />
          </div>
          <div>
            <p style={{ color: "#888", margin: 0, fontSize: "0.9rem" }}>Ventas Hoy</p>
            <h2 style={{ color: "#fff", margin: 0, fontSize: "1.8rem" }}>${Number(stats.totalSales).toLocaleString()}</h2>
          </div>
        </div>

        {/* Pedidos */}
        <div style={{ backgroundColor: "#111", padding: "25px", borderRadius: "15px", border: "1px solid #333", display: "flex", alignItems: "center", gap: "20px" }}>
          <div style={{ background: "rgba(50, 205, 50, 0.1)", padding: "15px", borderRadius: "50%" }}>
            <FiTrendingUp size={30} color="#32CD32" />
          </div>
          <div>
            <p style={{ color: "#888", margin: 0, fontSize: "0.9rem" }}>Pedidos</p>
            <h2 style={{ color: "#fff", margin: 0, fontSize: "1.8rem" }}>{stats.totalOrders}</h2>
          </div>
        </div>

        {/* Stock Bajo (CLICKEABLE) */}
        <div 
          onClick={() => setShowModal(true)}
          style={{ 
            backgroundColor: "#111", padding: "25px", borderRadius: "15px", 
            border: "1px solid #333", display: "flex", alignItems: "center", gap: "20px",
            cursor: "pointer", transition: "0.2s" 
          }}
          onMouseOver={(e) => e.currentTarget.style.borderColor = "#ff4444"}
          onMouseOut={(e) => e.currentTarget.style.borderColor = "#333"}
        >
          <div style={{ background: "rgba(255, 68, 68, 0.1)", padding: "15px", borderRadius: "50%" }}>
            <FiAlertTriangle size={30} color="#ff4444" />
          </div>
          <div>
            <p style={{ color: "#888", margin: 0, fontSize: "0.9rem" }}>Stock Bajo (Ver)</p>
            <h2 style={{ color: "#fff", margin: 0, fontSize: "1.8rem" }}>{stats.lowStockCount} Items</h2>
          </div>
        </div>
      </div>

      {/* GRÁFICO (DATOS REALES) */}
      <div style={{ backgroundColor: "#111", padding: "30px", borderRadius: "15px", border: "1px solid #222" }}>
        <h3 style={{ color: "#D4AF37", marginBottom: "20px" }}>Rendimiento Diario (Tiempo Real)</h3>
        <div style={{ height: "300px", width: "100%" }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.recentSales}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
              <XAxis dataKey="hour" stroke="#666" tick={{fill: '#888'}} />
              <YAxis stroke="#666" tick={{fill: '#888'}} />
              <Tooltip 
                contentStyle={{ backgroundColor: "#000", border: "1px solid #D4AF37", color: "#fff" }} 
                formatter={(value) => [`$${value.toLocaleString()}`, "Venta"]}
              />
              <Bar dataKey="total" fill="#D4AF37" radius={[5, 5, 0, 0]} barSize={50} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* MODAL DE STOCK BAJO */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999 }}>
          <div style={{ background: "#111", border: "1px solid #ff4444", padding: "30px", borderRadius: "15px", width: "90%", maxWidth: "500px", position: "relative" }}>
            <button onClick={() => setShowModal(false)} style={{ position: "absolute", top: "15px", right: "15px", background: "none", border: "none", color: "#fff", cursor: "pointer" }}>
              <FiX size={24} />
            </button>
            
            <h2 style={{ color: "#ff4444", display: "flex", alignItems: "center", gap: "10px", marginTop: 0 }}>
              <FiAlertTriangle /> Alerta de Inventario
            </h2>
            <p style={{ color: "#888", marginBottom: "20px" }}>Estos productos tienen pocas unidades disponibles:</p>

            <div style={{ maxHeight: "300px", overflowY: "auto" }}>
              {stats.lowStockItems.length > 0 ? (
                <table style={{ width: "100%", borderCollapse: "collapse", color: "#eee" }}>
                  <thead>
                    <tr style={{ textAlign: "left", color: "#666", borderBottom: "1px solid #333" }}>
                      <th style={{ padding: "10px" }}>Producto</th>
                      <th style={{ padding: "10px", textAlign: "right" }}>Stock</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.lowStockItems.map(p => (
                      <tr key={p.id} style={{ borderBottom: "1px solid #222" }}>
                        <td style={{ padding: "10px" }}>{p.name}</td>
                        <td style={{ padding: "10px", textAlign: "right", fontWeight: "bold", color: "#ff4444" }}>
                          {p.current_stock}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p style={{ textAlign: "center", color: "#5c5", padding: "20px" }}>¡Todo en orden! No hay stock crítico.</p>
              )}
            </div>

            <button onClick={() => setShowModal(false)} style={{ width: "100%", marginTop: "20px", padding: "12px", background: "#333", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer" }}>
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
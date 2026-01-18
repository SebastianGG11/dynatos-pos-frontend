import { useEffect, useState } from "react";
import api from "../api/api";
import { FiTrendingUp, FiDollarSign, FiBox, FiAlertTriangle } from "react-icons/fi";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalSales: 0,
    totalOrders: 0,
    lowStockCount: 0,
    recentSales: []
  });

  useEffect(() => {
    // Simulamos carga si el backend no tiene el endpoint /stats aún
    const loadStats = async () => {
      try {
        const res = await api.get("/reports/dashboard-stats"); // Idealmente crear este endpoint
        setStats(res.data);
      } catch (e) {
        // Datos de ejemplo para que veas el diseño si falla la carga
        setStats({
          totalSales: 1540000,
          totalOrders: 24,
          lowStockCount: 5,
          recentSales: [
            { hour: '10am', total: 120000 },
            { hour: '11am', total: 80000 },
            { hour: '12pm', total: 350000 },
            { hour: '1pm', total: 210000 },
          ]
        });
      }
    };
    loadStats();
  }, []);

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", animation: "fadeIn 0.5s ease" }}>
      <h1 style={{ color: "#D4AF37", fontFamily: "serif", fontSize: "2rem", marginBottom: "30px" }}>PANEL GENERAL</h1>

      {/* TARJETAS SUPERIORES */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "20px", marginBottom: "40px" }}>
        
        <div style={{ backgroundColor: "#111", padding: "25px", borderRadius: "15px", border: "1px solid #D4AF37", display: "flex", alignItems: "center", gap: "20px" }}>
          <div style={{ background: "rgba(212, 175, 55, 0.1)", padding: "15px", borderRadius: "50%" }}>
            <FiDollarSign size={30} color="#D4AF37" />
          </div>
          <div>
            <p style={{ color: "#888", margin: 0, fontSize: "0.9rem" }}>Ventas Hoy</p>
            <h2 style={{ color: "#fff", margin: 0, fontSize: "1.8rem" }}>${stats.totalSales.toLocaleString()}</h2>
          </div>
        </div>

        <div style={{ backgroundColor: "#111", padding: "25px", borderRadius: "15px", border: "1px solid #333", display: "flex", alignItems: "center", gap: "20px" }}>
          <div style={{ background: "rgba(50, 205, 50, 0.1)", padding: "15px", borderRadius: "50%" }}>
            <FiTrendingUp size={30} color="#32CD32" />
          </div>
          <div>
            <p style={{ color: "#888", margin: 0, fontSize: "0.9rem" }}>Pedidos</p>
            <h2 style={{ color: "#fff", margin: 0, fontSize: "1.8rem" }}>{stats.totalOrders}</h2>
          </div>
        </div>

        <div style={{ backgroundColor: "#111", padding: "25px", borderRadius: "15px", border: "1px solid #333", display: "flex", alignItems: "center", gap: "20px" }}>
          <div style={{ background: "rgba(255, 68, 68, 0.1)", padding: "15px", borderRadius: "50%" }}>
            <FiAlertTriangle size={30} color="#ff4444" />
          </div>
          <div>
            <p style={{ color: "#888", margin: 0, fontSize: "0.9rem" }}>Stock Bajo</p>
            <h2 style={{ color: "#fff", margin: 0, fontSize: "1.8rem" }}>{stats.lowStockCount} Items</h2>
          </div>
        </div>
      </div>

      {/* GRÁFICO */}
      <div style={{ backgroundColor: "#111", padding: "30px", borderRadius: "15px", border: "1px solid #222" }}>
        <h3 style={{ color: "#D4AF37", marginBottom: "20px" }}>Rendimiento Diario</h3>
        <div style={{ height: "300px", width: "100%" }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.recentSales}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="hour" stroke="#666" />
              <YAxis stroke="#666" />
              <Tooltip contentStyle={{ backgroundColor: "#000", border: "1px solid #D4AF37", color: "#fff" }} />
              <Bar dataKey="total" fill="#D4AF37" radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
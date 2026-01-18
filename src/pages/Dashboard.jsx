import { useEffect, useState } from "react";
import api from "../api/api";
import { Link } from "react-router-dom";
import { FiBox, FiDollarSign, FiAlertTriangle, FiShoppingBag, FiUsers, FiPlusCircle, FiList, FiClock, FiCheckCircle } from "react-icons/fi";

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalMoney: 0,
    totalSalesCount: 0,
    totalProducts: 0,
    lowStockCount: 0,
    lowStockItems: [],
    lastTransactions: []
  });

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
    <div style={{ maxWidth: "1200px", margin: "0 auto", animation: "fadeIn 0.5s ease", padding: "20px" }}>
      
      {/* ENCABEZADO */}
      <div style={{ marginBottom: "30px", borderBottom: "1px solid #333", paddingBottom: "20px" }}>
        <h1 style={{ color: "#D4AF37", fontFamily: "serif", margin: 0, fontSize: "2rem" }}>CENTRO DE CONTROL</h1>
        <p style={{ color: "#666", marginTop: "5px" }}>Resumen operativo de Dynatos Market</p>
      </div>

      {/* 1. TARJETAS DE MÉTRICAS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "20px", marginBottom: "40px" }}>
        
        {/* Total Dinero */}
        <div style={{ background: "#111", padding: "25px", borderRadius: "15px", border: "1px solid #333", display: "flex", alignItems: "center", gap: "20px" }}>
          <div style={{ background: "rgba(212, 175, 55, 0.15)", padding: "15px", borderRadius: "12px" }}>
            <FiDollarSign size={28} color="#D4AF37" />
          </div>
          <div>
            <p style={{ color: "#888", margin: 0, fontSize: "0.85rem", textTransform: "uppercase" }}>Ventas Históricas</p>
            <h2 style={{ color: "#fff", margin: "5px 0 0 0", fontSize: "1.6rem" }}>${Number(stats.totalMoney).toLocaleString()}</h2>
          </div>
        </div>

        {/* Total Productos */}
        <div style={{ background: "#111", padding: "25px", borderRadius: "15px", border: "1px solid #333", display: "flex", alignItems: "center", gap: "20px" }}>
          <div style={{ background: "rgba(50, 205, 50, 0.15)", padding: "15px", borderRadius: "12px" }}>
            <FiBox size={28} color="#32CD32" />
          </div>
          <div>
            <p style={{ color: "#888", margin: 0, fontSize: "0.85rem", textTransform: "uppercase" }}>Productos Activos</p>
            <h2 style={{ color: "#fff", margin: "5px 0 0 0", fontSize: "1.6rem" }}>{stats.totalProducts}</h2>
          </div>
        </div>

        {/* Alerta Stock */}
        <div style={{ background: "#111", padding: "25px", borderRadius: "15px", border: "1px solid #333", display: "flex", alignItems: "center", gap: "20px" }}>
          <div style={{ background: stats.lowStockCount > 0 ? "rgba(255, 68, 68, 0.15)" : "rgba(100,100,100,0.1)", padding: "15px", borderRadius: "12px" }}>
            <FiAlertTriangle size={28} color={stats.lowStockCount > 0 ? "#ff4444" : "#666"} />
          </div>
          <div>
            <p style={{ color: "#888", margin: 0, fontSize: "0.85rem", textTransform: "uppercase" }}>Alerta Stock</p>
            <h2 style={{ color: stats.lowStockCount > 0 ? "#ff4444" : "#fff", margin: "5px 0 0 0", fontSize: "1.6rem" }}>
              {stats.lowStockCount} <span style={{ fontSize: "0.9rem", color: "#666" }}>Items</span>
            </h2>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", gap: "30px" }}>
        
        {/* 2. LISTA DE STOCK BAJO */}
        <div style={{ backgroundColor: "#111", borderRadius: "15px", border: "1px solid #333", overflow: "hidden", display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: "20px", borderBottom: "1px solid #222", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ color: "#fff", margin: 0, fontSize: "1rem", display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FiAlertTriangle color="#ff4444" /> Inventario Crítico
            </h3>
            <Link to="/admin/productos" style={{ color: "#D4AF37", fontSize: "0.8rem", textDecoration: "none" }}>Gestionar &rarr;</Link>
          </div>
          <div style={{ padding: "0", flex: 1, maxHeight: "300px", overflowY: "auto" }}>
            {stats.lowStockItems.length > 0 ? (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <tbody>
                  {stats.lowStockItems.map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: "1px solid #222" }}>
                      <td style={{ padding: "15px", color: "#ddd" }}>{item.name}</td>
                      <td style={{ padding: "15px", color: "#ff4444", fontWeight: "bold", textAlign: "right" }}>
                        {item.current_stock} Und.
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{ padding: "30px", textAlign: "center", color: "#666" }}>
                <FiCheckCircle size={40} style={{ marginBottom: "10px", opacity: 0.5, color: '#32CD32' }} />
                <p>¡Inventario saludable!</p>
              </div>
            )}
          </div>
        </div>

        {/* 3. COLUMNA DERECHA: ACCESOS Y ÚLTIMAS VENTAS REALES */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          
          {/* Accesos Rápidos */}
          <div style={{ backgroundColor: "#111", padding: "20px", borderRadius: "15px", border: "1px solid #333" }}>
            <h3 style={{ color: "#D4AF37", margin: "0 0 15px 0", fontSize: "1rem" }}>Acceso Rápido</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <Link to="/admin/productos" style={{ textDecoration: "none", background: "#222", padding: "12px", borderRadius: "8px", textAlign: "center", border: "1px solid #333", color: "#fff", fontSize: "0.9rem" }}>
                 <FiPlusCircle style={{ marginRight: '5px', verticalAlign: 'middle' }}/> Productos
              </Link>
              <Link to="/admin/ventas" style={{ textDecoration: "none", background: "#222", padding: "12px", borderRadius: "8px", textAlign: "center", border: "1px solid #333", color: "#fff", fontSize: "0.9rem" }}>
                 <FiList style={{ marginRight: '5px', verticalAlign: 'middle' }}/> Historial
              </Link>
              <Link to="/admin/usuarios" style={{ textDecoration: "none", background: "#222", padding: "12px", borderRadius: "8px", textAlign: "center", border: "1px solid #333", color: "#fff", fontSize: "0.9rem" }}>
                 <FiUsers style={{ marginRight: '5px', verticalAlign: 'middle' }}/> Usuarios
              </Link>
              <Link to="/admin/compras" style={{ textDecoration: "none", background: "#222", padding: "12px", borderRadius: "8px", textAlign: "center", border: "1px solid #333", color: "#fff", fontSize: "0.9rem" }}>
                 <FiShoppingBag style={{ marginRight: '5px', verticalAlign: 'middle' }}/> Compras
              </Link>
            </div>
          </div>

          {/* ÚLTIMAS VENTAS (AHORA SÍ REALES) */}
          <div style={{ backgroundColor: "#111", padding: "20px", borderRadius: "15px", border: "1px solid #333", flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
               <h3 style={{ color: "#fff", margin: 0, fontSize: "0.9rem", display: 'flex', alignItems: 'center', gap: '8px' }}>
                 <FiClock /> Actividad Reciente
               </h3>
               <span style={{ fontSize: '0.7rem', color: '#666', border: '1px solid #333', padding: '2px 6px', borderRadius: '4px' }}>COMPLETADAS</span>
            </div>
            
            {stats.lastTransactions.length > 0 ? (
              stats.lastTransactions.map(tx => (
                <div key={tx.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid #222", fontSize: "0.85rem" }}>
                  <div>
                    <span style={{ color: "#D4AF37", fontWeight: 'bold', display: 'block' }}>${Number(tx.total).toLocaleString()}</span>
                    <span style={{ color: "#666", fontSize: "0.75rem" }}>
                      {new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {tx.cajero}
                    </span>
                  </div>
                  <span style={{ color: "#444", fontSize: '0.8rem' }}>#{tx.id}</span>
                </div>
              ))
            ) : (
              <p style={{ color: "#666", fontSize: "0.8rem", textAlign: "center", padding: "20px" }}>No hay ventas recientes.</p>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
import { useState, useEffect } from "react";
import api from "../api/api";
import { FiDollarSign, FiTrendingUp, FiTrendingDown, FiPieChart, FiCalendar } from "react-icons/fi";

export default function AdminFinancials() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Por defecto: Mes actual
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => { fetchFinancials(); }, [startDate, endDate]);

  const fetchFinancials = async () => {
    setLoading(true);
    try {
      const res = await api.get("/reports/financials", { params: { startDate, endDate } });
      setData(res.data);
    } catch (error) { console.error("Error cargando finanzas:", error); } finally { setLoading(false); }
  };

  if (!data) return <div className="p-10 text-center text-white">Cargando contabilidad...</div>;

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "20px", animation: "fadeIn 0.5s" }}>
      
      {/* HEADER */}
      <div style={{ marginBottom: "30px", borderBottom: "1px solid #333", paddingBottom: "20px" }}>
        <h1 style={{ color: "#D4AF37", margin: 0, fontSize: "2rem", fontFamily: 'serif' }}>REPORTE FINANCIERO</h1>
        <p style={{ color: "#666", marginTop: "5px" }}>Análisis de rentabilidad y costos (Neto)</p>
      </div>

      {/* FILTROS */}
      <div style={{ display: "flex", gap: "20px", marginBottom: "30px", background: "#111", padding: "15px", borderRadius: "10px", alignItems: "center" }}>
        <FiCalendar color="#D4AF37" size={24} />
        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={{ background: "#222", border: "1px solid #444", color: "#fff", padding: "8px", borderRadius: "5px" }} />
        <span style={{ color: "#666" }}>a</span>
        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={{ background: "#222", border: "1px solid #444", color: "#fff", padding: "8px", borderRadius: "5px" }} />
        <button onClick={fetchFinancials} style={{ marginLeft: "auto", background: "#D4AF37", color: "#000", border: "none", padding: "8px 20px", borderRadius: "5px", fontWeight: "bold", cursor: "pointer" }}>ACTUALIZAR</button>
      </div>

      {/* TARJETAS PRINCIPALES */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px", marginBottom: "30px" }}>
        
        {/* INGRESOS NETOS */}
        <div style={{ background: "#1a1a1a", padding: "25px", borderRadius: "15px", borderLeft: "5px solid #2ecc71" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                <h3 style={{ margin: 0, color: "#aaa", fontSize: "0.9rem" }}>VENTAS NETAS (Sin Devoluciones)</h3>
                <FiTrendingUp color="#2ecc71" size={24} />
            </div>
            <p style={{ fontSize: "2rem", fontWeight: "bold", color: "#fff", margin: 0 }}>
                ${data.net_sales.toLocaleString()}
            </p>
            <p style={{ fontSize: "0.8rem", color: "#666", marginTop: "5px" }}>
                Bruto: ${data.gross_sales.toLocaleString()} | Dev: -${data.refunds.toLocaleString()}
            </p>
        </div>

        {/* COSTOS (COGS) */}
        <div style={{ background: "#1a1a1a", padding: "25px", borderRadius: "15px", borderLeft: "5px solid #e74c3c" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                <h3 style={{ margin: 0, color: "#aaa", fontSize: "0.9rem" }}>COSTO DE MERCANCÍA</h3>
                <FiTrendingDown color="#e74c3c" size={24} />
            </div>
            <p style={{ fontSize: "2rem", fontWeight: "bold", color: "#fff", margin: 0 }}>
                -${data.net_cost.toLocaleString()}
            </p>
            <p style={{ fontSize: "0.8rem", color: "#666", marginTop: "5px" }}>
                Costo real de los productos entregados
            </p>
        </div>

      </div>

      {/* LA GRAN TARJETA DE GANANCIA */}
      <div style={{ background: "linear-gradient(135deg, #111 0%, #222 100%)", padding: "40px", borderRadius: "20px", border: "1px solid #D4AF37", textAlign: "center", boxShadow: "0 10px 40px rgba(212, 175, 55, 0.1)" }}>
        <h2 style={{ color: "#D4AF37", margin: "0 0 10px 0", letterSpacing: "2px" }}>UTILIDAD NETA (GANANCIA)</h2>
        <div style={{ fontSize: "4rem", fontWeight: "bold", color: "#fff", textShadow: "0 0 20px rgba(255,255,255,0.2)" }}>
            ${data.net_profit.toLocaleString()}
        </div>
        <div style={{ display: "inline-block", background: "rgba(212, 175, 55, 0.2)", padding: "5px 15px", borderRadius: "20px", marginTop: "15px", color: "#D4AF37", fontWeight: "bold" }}>
            Margen de Ganancia: {data.margin_percent}%
        </div>
      </div>

    </div>
  );
}
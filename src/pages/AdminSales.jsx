import { useState, useEffect } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import { FiSearch, FiDownload, FiCalendar, FiDollarSign, FiUser, FiCreditCard } from "react-icons/fi";

export default function AdminSales() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  const API_URL = "https://dynatos-pos-backend-1.onrender.com/reports/sales";

  useEffect(() => {
    fetchSales();
  }, []);

  const fetchSales = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token'); 
      const res = await axios.get(API_URL, {
        params: { startDate, endDate },
        headers: { Authorization: `Bearer ${token}` }
      });
      setSales(res.data);
    } catch (error) {
      console.error("Error cargando ventas:", error);
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = () => {
    const dataToExport = sales.map(sale => ({
      ID: sale.id,
      Fecha: new Date(sale.created_at).toLocaleString(),
      Cajero: sale.cajero,
      Metodo_Pago: sale.payment_method,
      Total: sale.total
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Ventas");
    XLSX.writeFile(workbook, `Reporte_Dynatos_${startDate}_al_${endDate}.xlsx`);
  };

  const money = (n) => `$${Number(n).toLocaleString("es-CO")}`;

  return (
    <div style={{ maxWidth: "1250px", margin: "0 auto", animation: "fadeIn 0.5s ease" }}>
      
      {/* HEADER PREMIUM */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        backgroundColor: "#111", padding: "30px", borderRadius: "15px",
        border: "1px solid #D4AF37", marginBottom: "30px", boxShadow: "0 10px 30px rgba(0,0,0,0.5)"
      }}>
        <div>
          <h1 style={{ color: "#D4AF37", margin: 0, fontSize: "2rem", letterSpacing: "3px", fontWeight: "bold", fontFamily: 'serif' }}>
            HISTORIAL DE VENTAS
          </h1>
          <p style={{ color: "#888", fontSize: "0.9rem", margin: "5px 0 0 0" }}> Reportes y Auditoría Dynatos </p>
        </div>
        
        {/* BOTÓN EXCEL */}
        <button 
          onClick={exportToExcel}
          disabled={sales.length === 0}
          style={{ 
            padding: "14px 28px", 
            background: sales.length === 0 ? "#222" : "#D4AF37", 
            color: sales.length === 0 ? "#555" : "#000", 
            border: "none", borderRadius: "10px", cursor: sales.length === 0 ? "not-allowed" : "pointer",
            fontWeight: "bold", display: "flex", alignItems: "center", gap: "10px", transition: "0.3s"
          }}
        >
          <FiDownload size={20} /> EXPORTAR A EXCEL
        </button>
      </div>

      {/* FILTROS DE BÚSQUEDA */}
      <div style={{ 
        display: "flex", gap: "25px", alignItems: "center", marginBottom: "30px", flexWrap: "wrap",
        backgroundColor: "#111", padding: "20px 30px", borderRadius: "15px", border: "1px solid #222" 
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <FiCalendar style={{ color: "#D4AF37" }} />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <label style={{ color: "#D4AF37", fontSize: "10px", fontWeight: "bold", letterSpacing: "1px" }}>DESDE</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
              style={{ background: "transparent", border: "none", borderBottom: "1px solid #333", color: "#fff", outline: "none", padding: "5px 0" }} />
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <FiCalendar style={{ color: "#D4AF37" }} />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <label style={{ color: "#D4AF37", fontSize: "10px", fontWeight: "bold", letterSpacing: "1px" }}>HASTA</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
              style={{ background: "transparent", border: "none", borderBottom: "1px solid #333", color: "#fff", outline: "none", padding: "5px 0" }} />
          </div>
        </div>
        
        <button onClick={fetchSales} style={{ 
          padding: "12px 30px", background: "transparent", color: "#D4AF37", 
          border: "1px solid #D4AF37", borderRadius: "8px", cursor: "pointer", 
          display: "flex", alignItems: "center", gap: "8px", fontWeight: "bold", transition: "0.3s"
        }}
        onMouseOver={e => e.currentTarget.style.backgroundColor = "rgba(212,175,55,0.1)"}
        onMouseOut={e => e.currentTarget.style.backgroundColor = "transparent"}>
          <FiSearch /> APLICAR FILTRO
        </button>
      </div>

      {/* TABLA DE RESULTADOS */}
      <div style={{ backgroundColor: "#111", borderRadius: "15px", border: "1px solid #222", overflow: "hidden", boxShadow: "0 10px 30px rgba(0,0,0,0.3)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", color: "#eee" }}>
          <thead>
            <tr style={{ backgroundColor: "#1a1a1a", color: "#D4AF37", textAlign: "left" }}>
              <th style={{ padding: "20px", borderBottom: "1px solid #222", fontSize: "0.8rem", letterSpacing: "1px" }}>FOLIO</th>
              <th style={{ padding: "20px", borderBottom: "1px solid #222", fontSize: "0.8rem", letterSpacing: "1px" }}>FECHA Y HORA</th>
              <th style={{ padding: "20px", borderBottom: "1px solid #222", fontSize: "0.8rem", letterSpacing: "1px" }}>CAJERO</th>
              <th style={{ padding: "20px", borderBottom: "1px solid #222", fontSize: "0.8rem", letterSpacing: "1px" }}>MÉTODO</th>
              <th style={{ padding: "20px", borderBottom: "1px solid #222", textAlign: "right", fontSize: "0.8rem", letterSpacing: "1px" }}>TOTAL</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" style={{ padding: "50px", textAlign: "center", color: "#D4AF37", letterSpacing: "2px" }}>CARGANDO REGISTROS...</td></tr>
            ) : sales.map((sale) => (
              <tr key={sale.id} style={{ borderBottom: "1px solid #222", transition: "0.2s" }} onMouseOver={e => e.currentTarget.style.backgroundColor = "#161616"} onMouseOut={e => e.currentTarget.style.backgroundColor = "transparent"}>
                <td style={{ padding: "20px", color: "#666" }}>#{sale.id}</td>
                <td style={{ padding: "20px" }}>{new Date(sale.created_at).toLocaleString()}</td>
                <td style={{ padding: "20px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <FiUser size={14} style={{ color: "#D4AF37" }} />
                    <span style={{ fontWeight: "bold" }}>{sale.cajero}</span>
                  </div>
                </td>
                <td style={{ padding: "20px" }}>
                  <span style={{ 
                    padding: "4px 12px", borderRadius: "6px", fontSize: "0.75rem", fontWeight: "bold",
                    backgroundColor: sale.payment_method === "EFECTIVO" ? "rgba(92,184,92,0.1)" : "rgba(91,192,222,0.1)",
                    color: sale.payment_method === "EFECTIVO" ? "#5cb85c" : "#5bc0de",
                    border: sale.payment_method === "EFECTIVO" ? "1px solid #5cb85c" : "1px solid #5bc0de",
                    display: "inline-flex", alignItems: "center", gap: "5px"
                  }}>
                    <FiCreditCard size={12} />
                    {sale.payment_method || "N/A"}
                  </span>
                </td>
                <td style={{ padding: "20px", textAlign: "right", color: "#D4AF37", fontWeight: "bold", fontSize: "1.2rem" }}>
                  {money(sale.total)}
                </td>
              </tr>
            ))}
            {!loading && sales.length === 0 && (
              <tr><td colSpan="5" style={{ padding: "50px", textAlign: "center", color: "#555", fontSize: "0.9rem" }}>No se encontraron movimientos en el periodo seleccionado.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
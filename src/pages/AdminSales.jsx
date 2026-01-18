import { useState, useEffect } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import { FiSearch, FiDownload, FiCalendar, FiUser, FiCreditCard, FiPrinter, FiX } from "react-icons/fi";

export default function AdminSales() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  // Estado para la reimpresión
  const [selectedSale, setSelectedSale] = useState(null);
  const [isFetchingDetails, setIsFetchingDetails] = useState(false);

  const API_URL = "https://dynatos-pos-backend-1.onrender.com/reports/sales";

  useEffect(() => { fetchSales(); }, []);

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

  // 🖨️ Función para buscar detalles y disparar impresión
  const handleRePrint = async (sale) => {
    setIsFetchingDetails(true);
    try {
      const token = localStorage.getItem('token');
      // Buscamos los items de esta venta específica
      const res = await axios.get(`https://dynatos-pos-backend-1.onrender.com/sales/${sale.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSelectedSale({ ...sale, items: res.data.items });
      
      // Esperamos un instante a que el DOM se actualice con los datos y disparamos
      setTimeout(() => {
        window.print();
        setSelectedSale(null);
      }, 500);
    } catch (error) {
      alert("Error al recuperar detalles de la factura");
    } finally {
      setIsFetchingDetails(false);
    }
  };

  const money = (n) => `$${Number(n).toLocaleString("es-CO")}`;

  return (
    <div style={{ maxWidth: "1250px", margin: "0 auto", animation: "fadeIn 0.5s ease" }}>
      
      {/* 🧾 COMPONENTE DE TIRILLA (OCULTO, SOLO PARA IMPRESIÓN) */}
      <div style={{ display: "none" }}>
        {selectedSale && (
          <div id="reprint-receipt" style={{ width: "80mm", padding: "5mm", color: "#000", fontFamily: 'monospace', backgroundColor: '#fff' }}>
            <center>
              <h2 style={{ margin: 0 }}>DYNATOS</h2>
              <p style={{ margin: 0, fontSize: '12px' }}>MARKET & LICORERÍA</p>
              <p style={{ fontSize: '10px' }}>REIMPRESIÓN DE FACTURA</p>
            </center>
            <div style={{ marginTop: '10px', fontSize: '10px' }}>
              <p style={{ margin: 0 }}>FECHA: {new Date(selectedSale.created_at).toLocaleString()}</p>
              <p style={{ margin: 0 }}>CAJERO: {selectedSale.cajero}</p>
              <p style={{ margin: 0 }}>ORDEN: #{selectedSale.id}</p>
            </div>
            <hr style={{ border: '0.5px dashed #000', margin: '10px 0' }} />
            <table style={{ width: '100%', fontSize: '10px' }}>
              <tbody>
                {selectedSale.items?.map((item, idx) => (
                  <tr key={idx}>
                    <td>{item.name}</td>
                    <td align="center">x{item.quantity}</td>
                    <td align="right">${(item.quantity * item.unit_price).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <hr style={{ border: '0.5px dashed #000', margin: '10px 0' }} />
            <div style={{ textAlign: 'right', fontWeight: 'bold' }}>
              <p style={{ fontSize: '16px', margin: '5px 0' }}>TOTAL: {money(selectedSale.total)}</p>
            </div>
            <center style={{ marginTop: '20px', fontSize: '9px' }}>
              *** Copia Administrativa ***
            </center>
          </div>
        )}
      </div>

      <style>{`
        @media print {
          body * { visibility: hidden; }
          #reprint-receipt, #reprint-receipt * { visibility: visible; }
          #reprint-receipt { position: absolute; left: 0; top: 0; width: 100%; display: block !important; }
        }
      `}</style>

      {/* HEADER */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        backgroundColor: "#111", padding: "30px", borderRadius: "15px",
        border: "1px solid #D4AF37", marginBottom: "30px"
      }}>
        <h1 style={{ color: "#D4AF37", margin: 0, fontSize: "1.8rem", letterSpacing: "2px", fontFamily: 'serif' }}>HISTORIAL DE VENTAS</h1>
        <button onClick={() => {
            const worksheet = XLSX.utils.json_to_sheet(sales);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Ventas");
            XLSX.writeFile(workbook, "Reporte_Ventas_Dynatos.xlsx");
          }}
          disabled={sales.length === 0}
          style={{ background: "#D4AF37", color: "#000", border: "none", padding: "12px 24px", borderRadius: "10px", fontWeight: "bold", cursor: "pointer" }}>
          <FiDownload /> EXCEL
        </button>
      </div>

      {/* FILTROS */}
      <div style={{ display: "flex", gap: "20px", marginBottom: "30px", backgroundColor: "#111", padding: "20px", borderRadius: "15px", border: "1px solid #222" }}>
        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={{ background: "#000", border: "1px solid #333", color: "#fff", padding: "10px", borderRadius: "8px" }} />
        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={{ background: "#000", border: "1px solid #333", color: "#fff", padding: "10px", borderRadius: "8px" }} />
        <button onClick={fetchSales} style={{ background: "transparent", color: "#D4AF37", border: "1px solid #D4AF37", padding: "10px 20px", borderRadius: "8px", cursor: "pointer" }}><FiSearch /> FILTRAR</button>
      </div>

      {/* TABLA */}
      <div style={{ backgroundColor: "#111", borderRadius: "15px", border: "1px solid #222", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", color: "#eee" }}>
          <thead>
            <tr style={{ backgroundColor: "#1a1a1a", color: "#D4AF37", textAlign: "left" }}>
              <th style={{ padding: "20px" }}>FOLIO</th>
              <th style={{ padding: "20px" }}>FECHA</th>
              <th style={{ padding: "20px" }}>CAJERO</th>
              <th style={{ padding: "20px" }}>MÉTODO</th>
              <th style={{ padding: "20px", textAlign: "right" }}>TOTAL</th>
              <th style={{ padding: "20px", textAlign: "center" }}>FACTURA</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" style={{ padding: "50px", textAlign: "center", color: "#D4AF37" }}>CARGANDO...</td></tr>
            ) : sales.map((sale) => (
              <tr key={sale.id} style={{ borderBottom: "1px solid #222" }}>
                <td style={{ padding: "20px", color: "#666" }}>#{sale.id}</td>
                <td style={{ padding: "20px" }}>{new Date(sale.created_at).toLocaleString()}</td>
                <td style={{ padding: "20px" }}>{sale.cajero}</td>
                <td style={{ padding: "20px" }}>{sale.payment_method}</td>
                <td style={{ padding: "20px", textAlign: "right", color: "#D4AF37", fontWeight: "bold" }}>{money(sale.total)}</td>
                <td style={{ padding: "20px", textAlign: "center" }}>
                  <button 
                    onClick={() => handleRePrint(sale)}
                    disabled={isFetchingDetails}
                    style={{ background: "none", border: "none", color: "#D4AF37", cursor: "pointer" }}
                    title="Reimprimir Factura"
                  >
                    <FiPrinter size={20} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
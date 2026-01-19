import { useState, useEffect } from "react";
import api from "../api/api";
import { FiSearch, FiDownload, FiAlertTriangle, FiCalendar } from "react-icons/fi";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

export default function AdminReturns() {
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => { fetchReturns(); }, [startDate, endDate]);

  const fetchReturns = async () => {
    setLoading(true);
    try {
      const res = await api.get("/sales/returns-report", { params: { startDate, endDate } });
      setReturns(res.data || []);
    } catch (error) { console.error("Error cargando devoluciones:", error); } finally { setLoading(false); }
  };

  // EXCEL DE DEVOLUCIONES
  const exportReturnsExcel = async () => {
    if (returns.length === 0) { alert("No hay datos para exportar"); return; }
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Devoluciones");
    
    sheet.columns = [
      { header: 'ID DEV', key: 'return_number', width: 15 },
      { header: 'FECHA', key: 'created_at', width: 20 },
      { header: 'VENTA ORIGEN', key: 'sale_number', width: 15 },
      { header: 'PRODUCTO', key: 'product_name', width: 30 },
      { header: 'CANT', key: 'quantity', width: 10 },
      { header: 'MOTIVO', key: 'reason', width: 30 },
      { header: 'RESPONSABLE', key: 'responsible', width: 20 },
      { header: 'DINERO DEVUELTO', key: 'refund_amount', width: 20 },
    ];

    let totalDevuelto = 0;
    returns.forEach(ret => {
      totalDevuelto += Number(ret.refund_amount);
      sheet.addRow({
        return_number: ret.return_number,
        created_at: new Date(ret.created_at).toLocaleString(),
        sale_number: ret.sale_number,
        product_name: ret.product_name,
        quantity: ret.quantity,
        reason: ret.reason,
        responsible: ret.responsible,
        refund_amount: Number(ret.refund_amount)
      });
    });

    sheet.addRow(['', '', '', '', '', '', 'TOTAL:', totalDevuelto]);

    // Estilos Rojos para resaltar que son pérdidas
    sheet.eachRow((row, rowNumber) => {
        row.eachCell((cell) => {
            if (rowNumber === 1) {
                cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF990000' } }; // Rojo oscuro
            } else {
                cell.border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
            }
        });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `Reporte_Devoluciones_${startDate}.xlsx`);
  };

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", animation: "fadeIn 0.5s ease", padding: "20px" }}>
      
      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "#330000", padding: "25px 35px", borderRadius: "15px", border: "1px solid #ff4444", marginBottom: "30px" }}>
        <div>
          <h1 style={{ color: "#ff4444", margin: 0, fontSize: "1.8rem", fontFamily: 'serif', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FiAlertTriangle /> AUDITORÍA DE DEVOLUCIONES
          </h1>
          <p style={{ color: "#ffaaaa", fontSize: "0.8rem", margin: "5px 0 0 0" }}>Registro histórico de productos devueltos y motivos</p>
        </div>
        <button onClick={exportReturnsExcel} style={{ background: "#ff4444", color: "#fff", border: "none", padding: "12px 25px", borderRadius: "10px", fontWeight: "bold", cursor: "pointer", display: "flex", alignItems: "center", gap: "10px" }}>
          <FiDownload size={20} /> DESCARGAR REPORTE
        </button>
      </div>

      {/* FILTROS */}
      <div style={{ display: "flex", gap: "20px", marginBottom: "30px", backgroundColor: "#111", padding: "20px", borderRadius: "15px", border: "1px solid #222", alignItems: "flex-end" }}>
        <div><label style={{ color: '#aaa', fontSize: '0.7rem' }}>DESDE</label><input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={{ background: "#000", border: "1px solid #333", color: "#fff", padding: "10px", borderRadius: "8px", display: 'block' }} /></div>
        <div><label style={{ color: '#aaa', fontSize: '0.7rem' }}>HASTA</label><input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={{ background: "#000", border: "1px solid #333", color: "#fff", padding: "10px", borderRadius: "8px", display: 'block' }} /></div>
        <button onClick={fetchReturns} style={{ background: "transparent", color: "#fff", border: "1px solid #555", padding: "10px 25px", borderRadius: "8px", cursor: "pointer", fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}><FiSearch /> FILTRAR</button>
      </div>

      {/* TABLA */}
      <div style={{ backgroundColor: "#111", borderRadius: "15px", border: "1px solid #222", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", color: "#eee" }}>
          <thead>
            <tr style={{ backgroundColor: "#1a0000", color: "#ff4444", textAlign: "left", fontSize: "0.9rem" }}>
              <th style={{ padding: "20px" }}>ID DEV</th>
              <th style={{ padding: "20px" }}>FECHA</th>
              <th style={{ padding: "20px" }}>VENTA ORIGEN</th>
              <th style={{ padding: "20px" }}>PRODUCTO</th>
              <th style={{ padding: "20px" }}>MOTIVO</th>
              <th style={{ padding: "20px" }}>RESPONSABLE</th>
              <th style={{ padding: "20px", textAlign: "right" }}>DINERO REEMBOLSADO</th>
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan="7" style={{ padding: "50px", textAlign: "center" }}>Buscando registros...</td></tr> : returns.length === 0 ? <tr><td colSpan="7" style={{ padding: "50px", textAlign: "center", color: "#666" }}>No hay devoluciones en este periodo.</td></tr> : returns.map((ret) => (
              <tr key={ret.return_id} style={{ borderBottom: "1px solid #222", fontSize: "0.9rem" }}>
                <td style={{ padding: "20px", color: "#ff4444", fontWeight: "bold" }}>{ret.return_number}</td>
                <td style={{ padding: "20px", color: "#888" }}>{new Date(ret.created_at).toLocaleString()}</td>
                <td style={{ padding: "20px", color: "#aaa" }}>{ret.sale_number}</td>
                <td style={{ padding: "20px" }}>
                   <span style={{ color: '#fff' }}>{ret.product_name}</span>
                   <span style={{ marginLeft: '10px', background: '#333', padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem' }}>x{ret.quantity}</span>
                </td>
                <td style={{ padding: "20px", color: "#ccc", fontStyle: "italic" }}>"{ret.reason}"</td>
                <td style={{ padding: "20px", color: "#888" }}>{ret.responsible}</td>
                <td style={{ padding: "20px", textAlign: "right", color: "#ff4444", fontWeight: "bold" }}>- ${Number(ret.refund_amount).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
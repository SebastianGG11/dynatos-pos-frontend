import { useState, useEffect } from "react";
import api from "../api/api";
import { FiSearch, FiDownload, FiChevronDown, FiChevronUp, FiRotateCcw } from "react-icons/fi"; // Quité FiPrinter
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

export default function AdminSales() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Estado para manejar qué fila está expandida
  const [expandedSaleId, setExpandedSaleId] = useState(null);
  const [saleDetails, setSaleDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => { fetchSales(); }, [startDate, endDate]);

  const fetchSales = async () => {
    setLoading(true);
    try {
      const res = await api.get("/reports/sales", { params: { startDate, endDate } });
      setSales(res.data || []);
    } catch (error) { console.error("Error historial:", error); } finally { setLoading(false); }
  };

  const toggleDetails = async (saleId) => {
    if (expandedSaleId === saleId) {
      setExpandedSaleId(null);
      setSaleDetails(null);
      return;
    }
    setExpandedSaleId(saleId);
    setLoadingDetails(true);
    setSaleDetails(null);

    try {
      const res = await api.get(`/sales/${saleId}`);
      setSaleDetails(res.data);
    } catch (error) {
      console.error("Error cargando detalles", error);
      alert("No se pudo cargar el detalle.");
    } finally {
      setLoadingDetails(false);
    }
  };

  const calculateTax = (total) => {
    const totalNum = Number(total || 0);
    const valorImpuesto = totalNum - (totalNum / 1.19);
    const baseGravable = totalNum - valorImpuesto;
    return { baseGravable, valorImpuesto };
  };

  // EXCEL PREMIUM
  const exportPremiumExcel = async () => {
    if (sales.length === 0) { alert("No hay datos"); return; }
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Dynatos POS';
    
    const salesByMonth = sales.reduce((acc, sale) => {
      const date = new Date(sale.created_at);
      const monthName = date.toLocaleString('es-CO', { month: 'long', year: 'numeric' });
      const key = monthName.charAt(0).toUpperCase() + monthName.slice(1);
      if (!acc[key]) acc[key] = [];
      acc[key].push(sale);
      return acc;
    }, {});

    for (const [monthName, monthSales] of Object.entries(salesByMonth)) {
      const sheet = workbook.addWorksheet(monthName);
      sheet.columns = [
        { header: 'FOLIO', key: 'id', width: 12 },
        { header: 'FECHA Y HORA', key: 'created_at', width: 25 },
        { header: 'CAJERO', key: 'cajero', width: 25 },
        { header: 'MÉTODO PAGO', key: 'method', width: 20 },
        { header: 'TOTAL VENTA', key: 'total', width: 20 },
      ];
      let totalMes = 0;
      monthSales.forEach(sale => {
        totalMes += Number(sale.total);
        sheet.addRow({
          id: sale.id, created_at: new Date(sale.created_at).toLocaleString(),
          cajero: sale.cajero, method: sale.payment_method, total: Number(sale.total)
        });
      });
      sheet.addRow(['', '', '', 'TOTAL MES:', totalMes]);
      sheet.eachRow((row, rowNumber) => {
        row.eachCell((cell, colNumber) => {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF000000' } };
          cell.border = { top: {style:'thin', color: {argb:'FF333333'}}, left: {style:'thin', color: {argb:'FF333333'}}, bottom: {style:'thin', color: {argb:'FF333333'}}, right: {style:'thin', color: {argb:'FF333333'}} };
          if (rowNumber === 1) { cell.font = { name: 'Arial', color: { argb: 'FFD4AF37' }, bold: true, size: 12 }; cell.alignment = { horizontal: 'center' }; }
          else if (rowNumber === sheet.rowCount) { if (colNumber >= 4) { cell.font = { name: 'Arial', color: { argb: 'FFD4AF37' }, bold: true, size: 14 }; if (colNumber===5) cell.numFmt = '"$"#,##0'; } }
          else { cell.font = { name: 'Arial', color: { argb: 'FFFFFFFF' }, size: 11 }; if (colNumber === 5) { cell.font = { color: { argb: 'FFD4AF37' }, bold: true }; cell.numFmt = '"$"#,##0'; } }
        });
        row.height = 25;
      });
    }
    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `Reporte_Dynatos_Black.xlsx`);
  };

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", animation: "fadeIn 0.5s ease", padding: "20px" }}>
      
      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "#111", padding: "25px 35px", borderRadius: "15px", border: "1px solid #D4AF37", marginBottom: "30px", boxShadow: "0 10px 30px rgba(0,0,0,0.5)" }}>
        <div>
          <h1 style={{ color: "#D4AF37", margin: 0, fontSize: "1.8rem", letterSpacing: "2px", fontFamily: 'serif' }}>HISTORIAL DE VENTAS</h1>
          <p style={{ color: "#555", fontSize: "0.8rem", margin: "5px 0 0 0" }}>Desglose de Facturación y Devoluciones</p>
        </div>
        <button onClick={exportPremiumExcel} style={{ background: "#D4AF37", color: "#000", border: "none", padding: "12px 25px", borderRadius: "10px", fontWeight: "bold", cursor: "pointer", display: "flex", alignItems: "center", gap: "10px" }}>
          <FiDownload size={20} /> REPORTE LUXURY
        </button>
      </div>

      {/* FILTROS */}
      <div style={{ display: "flex", gap: "20px", marginBottom: "30px", backgroundColor: "#111", padding: "20px", borderRadius: "15px", border: "1px solid #222", alignItems: "flex-end" }}>
        <div><label style={{ color: '#D4AF37', fontSize: '0.7rem' }}>DESDE</label><input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={{ background: "#000", border: "1px solid #333", color: "#fff", padding: "10px", borderRadius: "8px", display: 'block' }} /></div>
        <div><label style={{ color: '#D4AF37', fontSize: '0.7rem' }}>HASTA</label><input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={{ background: "#000", border: "1px solid #333", color: "#fff", padding: "10px", borderRadius: "8px", display: 'block' }} /></div>
        <button onClick={fetchSales} style={{ background: "transparent", color: "#D4AF37", border: "1px solid #D4AF37", padding: "10px 25px", borderRadius: "8px", cursor: "pointer", fontWeight: 'bold' }}><FiSearch /> BUSCAR</button>
      </div>

      {/* TABLA PRINCIPAL */}
      <div style={{ backgroundColor: "#111", borderRadius: "15px", border: "1px solid #222", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", color: "#eee" }}>
          <thead><tr style={{ backgroundColor: "#1a1a1a", color: "#D4AF37", textAlign: "left" }}>
            <th style={{ padding: "20px" }}>FOLIO</th>
            <th style={{ padding: "20px" }}>FECHA</th>
            <th style={{ padding: "20px" }}>CAJERO</th>
            <th style={{ padding: "20px" }}>MÉTODO</th>
            <th style={{ padding: "20px", textAlign: "right" }}>TOTAL</th>
            <th style={{ padding: "20px", textAlign: "center" }}>DETALLE</th>
          </tr></thead>
          <tbody>
            {loading ? <tr><td colSpan="6" style={{ padding: "50px", textAlign: "center" }}>Cargando...</td></tr> : sales.map((sale) => (
              <>
                {/* FILA PRINCIPAL */}
                <tr key={sale.id} style={{ borderBottom: "1px solid #222", background: expandedSaleId === sale.id ? "#1a1a1a" : "transparent" }}>
                  <td style={{ padding: "20px", color: "#666" }}>#{sale.id}</td>
                  <td style={{ padding: "20px" }}>{new Date(sale.created_at).toLocaleString()}</td>
                  <td style={{ padding: "20px" }}>{sale.cajero}</td>
                  <td style={{ padding: "20px" }}><span style={{border:'1px solid #333', padding:'4px 8px', borderRadius:'4px', fontSize:'0.8rem'}}>{sale.payment_method}</span></td>
                  <td style={{ padding: "20px", textAlign: "right", color: "#D4AF37", fontWeight: "bold" }}>${Number(sale.total).toLocaleString()}</td>
                  <td style={{ padding: "20px", textAlign: "center" }}>
                    <button 
                      onClick={() => toggleDetails(sale.id)} 
                      style={{ background: "none", border: "none", color: "#D4AF37", cursor: "pointer", display: 'flex', alignItems: 'center', gap: '5px', margin: '0 auto' }}
                    >
                      {expandedSaleId === sale.id ? <FiChevronUp size={20} /> : <FiChevronDown size={20} />} Ver
                    </button>
                  </td>
                </tr>

                {/* FILA EXPANDIBLE (ACORDEÓN) */}
                {expandedSaleId === sale.id && (
                  <tr>
                    <td colSpan="6" style={{ padding: "0", background: "#0a0a0a" }}>
                      <div style={{ padding: "25px", borderBottom: "1px solid #D4AF37", animation: "fadeIn 0.3s" }}>
                        
                        {loadingDetails ? (
                          <p style={{ color: "#888", textAlign: "center" }}>Cargando productos...</p>
                        ) : saleDetails ? (
                          <div style={{ display: "flex", gap: "30px", flexWrap: "wrap" }}>
                            
                            {/* COLUMNA 1: LISTA PRODUCTOS */}
                            <div style={{ flex: 2, minWidth: "300px" }}>
                              <h4 style={{ color: "#fff", marginTop: 0, borderBottom: '1px solid #333', paddingBottom: '10px' }}>Productos Vendidos</h4>
                              <table style={{ width: "100%", fontSize: "0.9rem", color: "#ccc" }}>
                                <thead>
                                  <tr style={{ color: "#666", textAlign: 'left' }}><th>Cant.</th><th>Producto</th><th style={{ textAlign: 'right' }}>Subtotal</th></tr>
                                </thead>
                                <tbody>
                                  {saleDetails.items.map((item, idx) => (
                                    <tr key={idx} style={{ borderBottom: '1px solid #222' }}>
                                      <td style={{ padding: "8px 0" }}>x{item.quantity}</td>
                                      <td style={{ padding: "8px 0", color: "#eee" }}>{item.name || item.product_name || "Producto sin nombre"}</td>
                                      <td style={{ padding: "8px 0", textAlign: "right", color: "#D4AF37" }}>${Number(item.total_price || (item.quantity * item.unit_price)).toLocaleString()}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>

                            {/* COLUMNA 2: RESUMEN Y ACCIONES */}
                            <div style={{ flex: 1, minWidth: "250px", background: "#111", padding: "20px", borderRadius: "10px", border: "1px solid #333" }}>
                              <h4 style={{ color: "#D4AF37", marginTop: 0 }}>Resumen Financiero</h4>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '0.9rem', color: '#888' }}>
                                <span>Base Gravable:</span>
                                <span>${calculateTax(saleDetails.total).baseGravable.toLocaleString(undefined, {maximumFractionDigits:0})}</span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', fontSize: '0.9rem', color: '#888' }}>
                                <span>IC / Impoconsumo:</span>
                                <span>${calculateTax(saleDetails.total).valorImpuesto.toLocaleString(undefined, {maximumFractionDigits:0})}</span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', color: '#fff', fontWeight: 'bold', borderTop: '1px solid #333', paddingTop: '10px' }}>
                                <span>TOTAL PAGADO:</span>
                                <span style={{ color: '#D4AF37' }}>${Number(saleDetails.total).toLocaleString()}</span>
                              </div>

                              {/* BOTÓN DE DEVOLUCIÓN */}
                              <div style={{ marginTop: "25px" }}>
                                <button 
                                  onClick={() => alert("Próximamente: Módulo de Devoluciones")} 
                                  style={{ width: '100%', padding: "12px", background: "#330000", border: "1px solid #ff4444", color: "#ff4444", borderRadius: "5px", cursor: "pointer", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: 'bold' }}
                                >
                                  <FiRotateCcw /> SOLICITAR DEVOLUCIÓN
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <p style={{ color: "red" }}>Error cargando datos.</p>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
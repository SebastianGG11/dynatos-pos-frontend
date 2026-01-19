import { useState, useEffect } from "react";
import api from "../api/api";
import { FiSearch, FiDownload, FiChevronDown, FiChevronUp, FiRotateCcw, FiX, FiAlertCircle } from "react-icons/fi";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

export default function AdminSales() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [expandedSaleId, setExpandedSaleId] = useState(null);
  const [saleDetails, setSaleDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // ESTADOS MODAL DEVOLUCIÓN
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnItem, setReturnItem] = useState(null);
  const [returnQty, setReturnQty] = useState(1);
  const [returnReason, setReturnReason] = useState("");
  const [isProcessingReturn, setIsProcessingReturn] = useState(false);

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
    } catch (error) { alert("No se pudo cargar el detalle."); } finally { setLoadingDetails(false); }
  };

  // --- LÓGICA DEVOLUCIÓN ---
  const openReturnModal = () => {
    if (!saleDetails) return;
    setShowReturnModal(true);
    setReturnItem(saleDetails.items[0]);
    setReturnQty(1);
    setReturnReason("");
  };

  const handleProcessReturn = async () => {
    if (!returnItem) return alert("Selecciona un producto");
    if (returnQty <= 0 || returnQty > returnItem.quantity) return alert("Cantidad inválida");
    if (!returnReason.trim()) return alert("Escribe una razón");

    if (!window.confirm(`¿Confirmar devolución de ${returnQty}x ${returnItem.product_name || returnItem.name}?`)) return;

    setIsProcessingReturn(true);
    try {
      const amountToReturn = (Number(returnItem.unit_price) * returnQty);
      await api.post('/sales/return', {
        sale_id: saleDetails.id,
        product_id: returnItem.product_id,
        quantity: returnQty,
        reason: returnReason,
        amount_to_return: amountToReturn
      });
      alert("✅ Devolución exitosa.");
      setShowReturnModal(false);
      fetchSales(); 
      setExpandedSaleId(null);
    } catch (error) {
      alert("Error: " + (error.response?.data?.message || "Error interno"));
    } finally {
      setIsProcessingReturn(false);
    }
  };

  const calculateTax = (total) => {
    const totalNum = Number(total || 0);
    const valorImpuesto = totalNum - (totalNum / 1.19);
    const baseGravable = totalNum - valorImpuesto;
    return { baseGravable, valorImpuesto };
  };

  // EXCEL CON DEVOLUCIONES
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
        { header: 'FOLIO', key: 'id', width: 10 },
        { header: 'FECHA', key: 'created_at', width: 20 },
        { header: 'CAJERO', key: 'cajero', width: 20 },
        { header: 'MÉTODO', key: 'method', width: 15 },
        { header: 'VENTA ORIGINAL', key: 'original', width: 15 },
        { header: 'DEVOLUCIÓN', key: 'returned', width: 15 },
        { header: 'TOTAL REAL', key: 'total', width: 15 },
      ];
      
      let granTotal = 0;
      monthSales.forEach(sale => {
        const original = Number(sale.original_total);
        const returned = Number(sale.returned_total || 0);
        const final = original - returned;
        granTotal += final;

        sheet.addRow({
          id: sale.id, created_at: new Date(sale.created_at).toLocaleString(),
          cajero: sale.cajero, method: sale.payment_method,
          original: original,
          returned: returned > 0 ? -returned : 0, // En negativo para Excel
          total: final
        });
      });
      
      sheet.addRow(['', '', '', '', '', 'TOTAL MES:', granTotal]);

      // Estilos
      sheet.eachRow((row, rowNumber) => {
        row.eachCell((cell, colNumber) => {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF000000' } };
          cell.border = { top: {style:'thin', color: {argb:'FF333333'}}, left: {style:'thin', color: {argb:'FF333333'}}, bottom: {style:'thin', color: {argb:'FF333333'}}, right: {style:'thin', color: {argb:'FF333333'}} };
          
          if (rowNumber === 1) { 
             cell.font = { name: 'Arial', color: { argb: 'FFD4AF37' }, bold: true }; 
             cell.alignment = { horizontal: 'center' };
          } else {
             cell.font = { name: 'Arial', color: { argb: 'FFFFFFFF' }, size: 11 };
             // Columna de Devoluciones en ROJO
             if(colNumber === 6 && cell.value !== 0) cell.font = { color: { argb: 'FFFF4444' }, bold: true };
             // Columna Total en DORADO
             if(colNumber === 7) { cell.font = { color: { argb: 'FFD4AF37' }, bold: true }; cell.numFmt = '"$"#,##0'; }
             if(colNumber >= 5 && colNumber <= 6) cell.numFmt = '"$"#,##0';
          }
        });
        row.height = 25;
      });
    }
    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `Reporte_Dynatos_Real.xlsx`);
  };

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", animation: "fadeIn 0.5s ease", padding: "20px" }}>
      
      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "#111", padding: "25px 35px", borderRadius: "15px", border: "1px solid #D4AF37", marginBottom: "30px" }}>
        <div>
          <h1 style={{ color: "#D4AF37", margin: 0, fontSize: "1.8rem", fontFamily: 'serif' }}>HISTORIAL DE VENTAS</h1>
          <p style={{ color: "#888", fontSize: "0.8rem", margin: "5px 0 0 0" }}>Control de ventas y devoluciones</p>
        </div>
        <button onClick={exportPremiumExcel} style={{ background: "#D4AF37", color: "#000", border: "none", padding: "12px 25px", borderRadius: "10px", fontWeight: "bold", cursor: "pointer", display: "flex", alignItems: "center", gap: "10px" }}>
          <FiDownload size={20} /> EXCEL (NETO)
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
            {loading ? <tr><td colSpan="6" style={{ padding: "50px", textAlign: "center" }}>Cargando...</td></tr> : sales.map((sale) => {
              const original = Number(sale.original_total);
              const returned = Number(sale.returned_total || 0);
              const hasReturn = returned > 0;
              const finalTotal = original - returned;

              return (
                <>
                  <tr key={sale.id} style={{ borderBottom: "1px solid #222", background: expandedSaleId === sale.id ? "#1a1a1a" : "transparent" }}>
                    <td style={{ padding: "20px", color: "#666" }}>#{sale.id}</td>
                    <td style={{ padding: "20px" }}>{new Date(sale.created_at).toLocaleString()}</td>
                    <td style={{ padding: "20px" }}>{sale.cajero}</td>
                    <td style={{ padding: "20px" }}><span style={{border:'1px solid #333', padding:'4px 8px', borderRadius:'4px', fontSize:'0.8rem'}}>{sale.payment_method}</span></td>
                    
                    {/* COLUMNA TOTAL INTELIGENTE */}
                    <td style={{ padding: "20px", textAlign: "right" }}>
                      {hasReturn ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                          <span style={{ textDecoration: 'line-through', color: '#666', fontSize: '0.8rem' }}>${original.toLocaleString()}</span>
                          <span style={{ color: '#ff4444', fontSize: '0.8rem' }}>- ${returned.toLocaleString()} (DEV)</span>
                          <span style={{ color: '#D4AF37', fontWeight: 'bold' }}>${finalTotal.toLocaleString()}</span>
                        </div>
                      ) : (
                        <span style={{ color: "#D4AF37", fontWeight: "bold" }}>${original.toLocaleString()}</span>
                      )}
                    </td>

                    <td style={{ padding: "20px", textAlign: "center" }}>
                      <button onClick={() => toggleDetails(sale.id)} style={{ background: "none", border: "none", color: hasReturn ? "#ff4444" : "#D4AF37", cursor: "pointer", display: 'flex', alignItems: 'center', gap: '5px', margin: '0 auto' }}>
                        {hasReturn && <FiAlertCircle />}
                        {expandedSaleId === sale.id ? <FiChevronUp size={20} /> : <FiChevronDown size={20} />}
                      </button>
                    </td>
                  </tr>

                  {/* DESGLOSE */}
                  {expandedSaleId === sale.id && (
                    <tr>
                      <td colSpan="6" style={{ padding: "0", background: "#0a0a0a" }}>
                        <div style={{ padding: "25px", borderBottom: "1px solid #D4AF37", animation: "fadeIn 0.3s" }}>
                          {loadingDetails ? <p>Cargando...</p> : saleDetails ? (
                            <div style={{ display: "flex", gap: "30px", flexWrap: "wrap" }}>
                              <div style={{ flex: 2, minWidth: "300px" }}>
                                <h4 style={{ color: "#fff", marginTop: 0, borderBottom: '1px solid #333', paddingBottom: '10px' }}>Productos</h4>
                                <table style={{ width: "100%", fontSize: "0.9rem", color: "#ccc" }}>
                                  <tbody>
                                    {saleDetails.items.map((item, idx) => (
                                      <tr key={idx} style={{ borderBottom: '1px solid #222' }}>
                                        <td style={{ padding: "8px 0" }}>x{item.quantity}</td>
                                        <td style={{ padding: "8px 0" }}>{item.product_name || item.name}</td>
                                        <td style={{ padding: "8px 0", textAlign: "right", color: "#D4AF37" }}>${Number(item.total_price || (item.quantity * item.unit_price)).toLocaleString()}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                              <div style={{ flex: 1, minWidth: "250px", background: "#111", padding: "20px", borderRadius: "10px", border: "1px solid #333" }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', color: '#fff', fontWeight: 'bold' }}>
                                  <span>TOTAL PAGADO:</span>
                                  <span style={{ color: '#D4AF37' }}>${Number(saleDetails.total).toLocaleString()}</span>
                                </div>
                                <div style={{ marginTop: "25px" }}>
                                  <button onClick={openReturnModal} style={{ width: '100%', padding: "12px", background: "#330000", border: "1px solid #ff4444", color: "#ff4444", borderRadius: "5px", cursor: "pointer", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: 'bold' }}>
                                    <FiRotateCcw /> SOLICITAR DEVOLUCIÓN
                                  </button>
                                </div>
                              </div>
                            </div>
                          ) : <p style={{ color: "red" }}>Error cargando datos.</p>}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* MODAL DE DEVOLUCIÓN */}
      {showReturnModal && saleDetails && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#111', padding: '30px', borderRadius: '15px', border: '1px solid #D4AF37', width: '90%', maxWidth: '500px', position: 'relative' }}>
            <button onClick={() => setShowReturnModal(false)} style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', color: '#666', cursor: 'pointer' }}><FiX size={24} /></button>
            <h2 style={{ color: '#D4AF37', marginTop: 0 }}>Procesar Devolución</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
              <div>
                <label style={{ color: '#fff', display: 'block', marginBottom: '5px' }}>Producto:</label>
                <select style={{ width: '100%', padding: '12px', background: '#222', color: '#fff' }} onChange={(e) => { const selected = saleDetails.items.find(i => i.product_id === Number(e.target.value)); setReturnItem(selected); setReturnQty(1); }} value={returnItem?.product_id}>
                  {saleDetails.items.map(item => <option key={item.product_id} value={item.product_id}>{item.product_name || item.name} (x{item.quantity})</option>)}
                </select>
              </div>
              <div>
                <label style={{ color: '#fff', display: 'block', marginBottom: '5px' }}>Cantidad (Máx: {returnItem?.quantity}):</label>
                <input type="number" min="1" max={returnItem?.quantity} value={returnQty} onChange={(e) => setReturnQty(Number(e.target.value))} style={{ width: '100%', padding: '12px', background: '#222', color: '#fff' }} />
              </div>
              <div>
                <label style={{ color: '#fff', display: 'block', marginBottom: '5px' }}>Motivo:</label>
                <input type="text" placeholder="Razón..." value={returnReason} onChange={(e) => setReturnReason(e.target.value)} style={{ width: '100%', padding: '12px', background: '#222', color: '#fff' }} />
              </div>
              <div style={{ background: 'rgba(212, 175, 55, 0.1)', padding: '15px', border: '1px solid #D4AF37', color: '#D4AF37', fontWeight: 'bold' }}>
                Reembolso: ${(Number(returnItem?.unit_price || 0) * returnQty).toLocaleString()}
              </div>
              <button onClick={handleProcessReturn} disabled={isProcessingReturn} style={{ width: '100%', padding: '15px', background: '#D4AF37', color: '#000', border: 'none', fontWeight: 'bold', cursor: 'pointer', opacity: isProcessingReturn ? 0.5 : 1 }}>CONFIRMAR</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
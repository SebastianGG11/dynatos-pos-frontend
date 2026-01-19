import { useState, useEffect } from "react";
import api from "../api/api";
import { FiSearch, FiDownload, FiChevronDown, FiChevronUp, FiRotateCcw, FiX, FiCheckCircle } from "react-icons/fi";
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

  // ESTADOS PARA EL MODAL DE DEVOLUCIÓN
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnItem, setReturnItem] = useState(null); // Producto seleccionado para devolver
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
    } catch (error) {
      alert("No se pudo cargar el detalle.");
    } finally {
      setLoadingDetails(false);
    }
  };

  const openReturnModal = () => {
    if (!saleDetails) return;
    setShowReturnModal(true);
    setReturnItem(saleDetails.items[0]); // Seleccionar el primero por defecto
    setReturnQty(1);
    setReturnReason("");
  };

  const handleProcessReturn = async () => {
    if (!returnItem) return alert("Selecciona un producto");
    if (returnQty <= 0 || returnQty > returnItem.quantity) return alert("Cantidad inválida");
    if (!returnReason.trim()) return alert("Escribe una razón para la devolución");

    if (!window.confirm(`¿Estás seguro de devolver ${returnQty}x ${returnItem.product_name || item.name}? \n\nEsta acción devolverá el producto al stock y restará el dinero de la caja.`)) {
      return;
    }

    setIsProcessingReturn(true);
    try {
      // Calculamos cuánto dinero devolver (proporcional al precio unitario real pagado)
      const amountToReturn = (Number(returnItem.unit_price) * returnQty);

      await api.post('/sales/return', {
        sale_id: saleDetails.id,
        product_id: returnItem.product_id,
        quantity: returnQty,
        reason: returnReason,
        amount_to_return: amountToReturn
      });

      alert("✅ Devolución procesada con éxito. El stock ha sido actualizado.");
      setShowReturnModal(false);
      fetchSales(); // Recargar lista
      setExpandedSaleId(null); // Cerrar detalle
    } catch (error) {
      console.error(error);
      alert("Error procesando devolución: " + (error.response?.data?.message || "Error interno"));
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
                                      <td style={{ padding: "8px 0", color: "#eee" }}>{item.product_name || item.name || "Producto"}</td>
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

                              {/* BOTÓN DE DEVOLUCIÓN (AHORA ABRE MODAL) */}
                              <div style={{ marginTop: "25px" }}>
                                <button 
                                  onClick={openReturnModal}
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

      {/* ================= MODAL DE DEVOLUCIÓN ================= */}
      {showReturnModal && saleDetails && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, animation: 'fadeIn 0.2s' }}>
          <div style={{ backgroundColor: '#111', padding: '30px', borderRadius: '15px', border: '1px solid #D4AF37', width: '90%', maxWidth: '500px', position: 'relative' }}>
            
            <button onClick={() => setShowReturnModal(false)} style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', color: '#666', cursor: 'pointer' }}><FiX size={24} /></button>
            
            <h2 style={{ color: '#D4AF37', marginTop: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FiRotateCcw /> Procesar Devolución
            </h2>
            <p style={{ color: '#888', fontSize: '0.9rem', borderBottom: '1px solid #333', paddingBottom: '15px' }}>
              Venta #{saleDetails.id} • Cajero: {saleDetails.cajero}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
              
              {/* SELECTOR DE PRODUCTO */}
              <div>
                <label style={{ color: '#fff', fontSize: '0.85rem', display: 'block', marginBottom: '5px' }}>Producto a devolver:</label>
                <select 
                  style={{ width: '100%', padding: '12px', background: '#222', border: '1px solid #444', color: '#fff', borderRadius: '8px' }}
                  onChange={(e) => {
                    const selected = saleDetails.items.find(i => i.product_id === Number(e.target.value));
                    setReturnItem(selected);
                    setReturnQty(1); // Resetear cantidad
                  }}
                  value={returnItem?.product_id}
                >
                  {saleDetails.items.map(item => (
                    <option key={item.product_id} value={item.product_id}>
                      {item.product_name || item.name} (Comprados: {item.quantity})
                    </option>
                  ))}
                </select>
              </div>

              {/* CANTIDAD */}
              <div>
                <label style={{ color: '#fff', fontSize: '0.85rem', display: 'block', marginBottom: '5px' }}>Cantidad:</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input 
                    type="number" 
                    min="1" 
                    max={returnItem?.quantity} 
                    value={returnQty}
                    onChange={(e) => setReturnQty(Number(e.target.value))}
                    style={{ flex: 1, padding: '12px', background: '#222', border: '1px solid #444', color: '#fff', borderRadius: '8px' }}
                  />
                  <span style={{ color: '#666', fontSize: '0.8rem' }}>Máx: {returnItem?.quantity}</span>
                </div>
              </div>

              {/* RAZÓN */}
              <div>
                <label style={{ color: '#fff', fontSize: '0.85rem', display: 'block', marginBottom: '5px' }}>Motivo:</label>
                <input 
                  type="text" 
                  placeholder="Ej: Producto dañado, Vencido, Error en pedido..." 
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  style={{ width: '100%', padding: '12px', background: '#222', border: '1px solid #444', color: '#fff', borderRadius: '8px', boxSizing: 'border-box' }}
                />
              </div>

              {/* RESUMEN DINERO */}
              <div style={{ background: 'rgba(212, 175, 55, 0.1)', padding: '15px', borderRadius: '8px', border: '1px solid rgba(212, 175, 55, 0.3)', marginTop: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#D4AF37', fontWeight: 'bold' }}>
                  <span>Reembolso Total:</span>
                  <span>${(Number(returnItem?.unit_price || 0) * returnQty).toLocaleString()}</span>
                </div>
                <p style={{ margin: '5px 0 0 0', fontSize: '0.75rem', color: '#888' }}>
                  * Este valor se restará de la caja actual.
                </p>
              </div>

              <button 
                onClick={handleProcessReturn}
                disabled={isProcessingReturn}
                style={{ width: '100%', padding: '15px', background: '#D4AF37', color: '#000', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px', opacity: isProcessingReturn ? 0.5 : 1 }}
              >
                {isProcessingReturn ? 'Procesando...' : 'CONFIRMAR DEVOLUCIÓN'}
              </button>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
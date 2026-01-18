import { useState, useEffect } from "react";
import api from "../api/api";
import { FiSearch, FiDownload, FiPrinter } from "react-icons/fi";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

export default function AdminSales() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedSale, setSelectedSale] = useState(null);
  const [isFetching, setIsFetching] = useState(false);

  useEffect(() => { fetchSales(); }, [startDate, endDate]);

  const fetchSales = async () => {
    setLoading(true);
    try {
      const res = await api.get("/reports/sales", { params: { startDate, endDate } });
      setSales(res.data || []);
    } catch (error) { console.error("Error historial:", error); } finally { setLoading(false); }
  };

  // ==========================================
  // 🎨 EXCEL PREMIUM "DARK MODE" (NEGRO COMPLETO)
  // ==========================================
  const exportPremiumExcel = async () => {
    if (sales.length === 0) { alert("No hay datos para exportar"); return; }

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Dynatos POS';
    
    // Agrupar por Mes
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

      // Columnas
      sheet.columns = [
        { header: 'FOLIO', key: 'id', width: 12 },
        { header: 'FECHA Y HORA', key: 'created_at', width: 25 },
        { header: 'CAJERO', key: 'cajero', width: 25 },
        { header: 'MÉTODO PAGO', key: 'method', width: 20 },
        { header: 'TOTAL VENTA', key: 'total', width: 20 },
      ];

      // Agregar filas de datos
      let totalMes = 0;
      monthSales.forEach(sale => {
        totalMes += Number(sale.total);
        sheet.addRow({
          id: sale.id,
          created_at: new Date(sale.created_at).toLocaleString(),
          cajero: sale.cajero,
          method: sale.payment_method,
          total: Number(sale.total)
        });
      });

      // Fila de TOTAL
      sheet.addRow(['', '', '', 'TOTAL MES:', totalMes]);

      // 🖌️ APLICAR ESTILO "DARK MODE" A TODA LA HOJA
      sheet.eachRow((row, rowNumber) => {
        row.eachCell((cell, colNumber) => {
          // 1. Fondo NEGRO para todos
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF000000' } // Negro Puro
          };
          
          // 2. Bordes Sutiles (Gris Oscuro)
          cell.border = {
            top: { style: 'thin', color: { argb: 'FF333333' } },
            left: { style: 'thin', color: { argb: 'FF333333' } },
            bottom: { style: 'thin', color: { argb: 'FF333333' } },
            right: { style: 'thin', color: { argb: 'FF333333' } }
          };

          // 3. Estilos Específicos
          if (rowNumber === 1) {
            // ENCABEZADO: Texto Dorado y Negrita
            cell.font = { name: 'Arial', color: { argb: 'FFD4AF37' }, bold: true, size: 12 };
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
          } else if (rowNumber === sheet.rowCount) {
            // FILA FINAL (TOTAL): Texto Dorado
            if (colNumber >= 4) {
                cell.font = { name: 'Arial', color: { argb: 'FFD4AF37' }, bold: true, size: 14 };
                if (colNumber === 5) cell.numFmt = '"$"#,##0';
            }
          } else {
            // DATOS NORMALES: Texto Blanco
            cell.font = { name: 'Arial', color: { argb: 'FFFFFFFF' }, size: 11 };
            if (colNumber === 5) {
                cell.font = { color: { argb: 'FFD4AF37' }, bold: true }; // Columna Total en Dorado
                cell.numFmt = '"$"#,##0';
            }
          }
        });
        row.height = 25; // Filas más altas para elegancia
      });
    }

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `Reporte_Dynatos_Black.xlsx`);
  };

  // Función Impresión Corregida
  const handleRePrint = async (sale) => {
    setIsFetching(true);
    try {
      const res = await api.get(`/sales/${sale.id}`);
      setSelectedSale({ ...sale, items: res.data.items });
      setTimeout(() => { window.print(); setSelectedSale(null); }, 800);
    } catch (error) {
      if (error.response?.status === 404) {
        alert("⚠️ Falta actualizar el Backend.\n\nEl servidor no tiene la ruta '/sales/:id'. Por favor realiza el paso 1 de las instrucciones.");
      } else {
        alert("Error cargando detalles de la venta.");
      }
    } finally { setIsFetching(false); }
  };

  const calculateTax = (total) => {
    const totalNum = Number(total);
    const valorImpuesto = totalNum - (totalNum / 1.19);
    const baseGravable = totalNum - valorImpuesto;
    return { baseGravable, valorImpuesto };
  };

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", animation: "fadeIn 0.5s ease", padding: "20px" }}>
      
      {/* SECCIÓN IMPRESIÓN */}
      <div id="print-section" style={{ display: "none" }}>
        {selectedSale && (
          <div style={{ width: "80mm", padding: "5mm", color: "#000", fontFamily: 'monospace', backgroundColor: '#fff' }}>
            <center>
              <h2 style={{ margin: 0, fontSize: '16px' }}>DYNATOS</h2>
              <p style={{ margin: 0, fontSize: '12px' }}>MARKET & LICORERÍA</p>
              <p style={{ fontSize: '10px', marginTop: '5px' }}>REIMPRESIÓN / COPIA</p>
            </center>
            <div style={{ marginTop: '15px', fontSize: '11px' }}>
              <p style={{ margin: 0 }}>FECHA: {new Date(selectedSale.created_at).toLocaleString()}</p>
              <p style={{ margin: 0 }}>CAJERO: {selectedSale.cajero}</p>
              <p style={{ margin: 0 }}>ORDEN: #{selectedSale.id}</p>
            </div>
            <hr style={{ border: '0.5px dashed #000', margin: '10px 0' }} />
            <table style={{ width: '100%', fontSize: '11px' }}>
              <tbody>
                {selectedSale.items?.map((item, idx) => (
                  <tr key={idx}>
                    <td style={{ paddingRight: '5px' }}>{item.quantity} x {item.name}</td>
                    <td align="right" style={{ whiteSpace: 'nowrap' }}>${(item.quantity * item.unit_price).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <hr style={{ border: '0.5px dashed #000', margin: '10px 0' }} />
            <div style={{ textAlign: 'right', fontSize: '11px' }}>
              <p style={{ margin: 0 }}>BASE: ${calculateTax(selectedSale.total).baseGravable.toLocaleString(undefined, {maximumFractionDigits: 0})}</p>
              <p style={{ margin: 0 }}>IC / IMPOCONSUMO: ${calculateTax(selectedSale.total).valorImpuesto.toLocaleString(undefined, {maximumFractionDigits: 0})}</p>
              <p style={{ fontSize: '16px', margin: '5px 0', fontWeight: 'bold' }}>TOTAL: ${Number(selectedSale.total).toLocaleString()}</p>
            </div>
            <div style={{ borderTop: '1px solid #000', marginTop: '5px', paddingTop: '5px', fontSize: '10px' }}>
                <p style={{ margin: 0 }}>MÉTODO: {selectedSale.payment_method}</p>
            </div>
            <center style={{ marginTop: '25px', fontSize: '9px' }}>*** GRACIAS ***</center>
          </div>
        )}
      </div>
      <style>{`@media print { body * { visibility: hidden; } #print-section, #print-section * { visibility: visible; } #print-section { position: absolute; left: 0; top: 0; width: 100%; display: block !important; } }`}</style>

      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "#111", padding: "25px 35px", borderRadius: "15px", border: "1px solid #D4AF37", marginBottom: "30px", boxShadow: "0 10px 30px rgba(0,0,0,0.5)" }}>
        <div>
          <h1 style={{ color: "#D4AF37", margin: 0, fontSize: "1.8rem", letterSpacing: "2px", fontFamily: 'serif' }}>HISTORIAL DE VENTAS</h1>
          <p style={{ color: "#555", fontSize: "0.8rem", margin: "5px 0 0 0" }}>Control de Ingresos y Facturación</p>
        </div>
        <button onClick={exportPremiumExcel} style={{ background: "#D4AF37", color: "#000", border: "none", padding: "12px 25px", borderRadius: "10px", fontWeight: "bold", cursor: "pointer", display: "flex", alignItems: "center", gap: "10px", boxShadow: "0 4px 15px rgba(212, 175, 55, 0.3)" }}>
          <FiDownload size={20} /> DESCARGAR REPORTE LUXURY
        </button>
      </div>

      {/* FILTROS */}
      <div style={{ display: "flex", gap: "20px", marginBottom: "30px", backgroundColor: "#111", padding: "20px", borderRadius: "15px", border: "1px solid #222", alignItems: "flex-end" }}>
        <div><label style={{ color: '#D4AF37', fontSize: '0.7rem' }}>DESDE</label><input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={{ background: "#000", border: "1px solid #333", color: "#fff", padding: "10px", borderRadius: "8px", display: 'block' }} /></div>
        <div><label style={{ color: '#D4AF37', fontSize: '0.7rem' }}>HASTA</label><input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={{ background: "#000", border: "1px solid #333", color: "#fff", padding: "10px", borderRadius: "8px", display: 'block' }} /></div>
        <button onClick={fetchSales} style={{ background: "transparent", color: "#D4AF37", border: "1px solid #D4AF37", padding: "10px 25px", borderRadius: "8px", cursor: "pointer", fontWeight: 'bold' }}><FiSearch /> BUSCAR</button>
      </div>

      {/* TABLA */}
      <div style={{ backgroundColor: "#111", borderRadius: "15px", border: "1px solid #222", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", color: "#eee" }}>
          <thead><tr style={{ backgroundColor: "#1a1a1a", color: "#D4AF37", textAlign: "left" }}><th style={{ padding: "20px" }}>FOLIO</th><th style={{ padding: "20px" }}>FECHA</th><th style={{ padding: "20px" }}>CAJERO</th><th style={{ padding: "20px" }}>MÉTODO</th><th style={{ padding: "20px", textAlign: "right" }}>TOTAL</th><th style={{ padding: "20px", textAlign: "center" }}>FACTURA</th></tr></thead>
          <tbody>
            {loading ? <tr><td colSpan="6" style={{ padding: "50px", textAlign: "center" }}>Cargando...</td></tr> : sales.map((sale) => (
              <tr key={sale.id} style={{ borderBottom: "1px solid #222" }}>
                <td style={{ padding: "20px", color: "#666" }}>#{sale.id}</td>
                <td style={{ padding: "20px" }}>{new Date(sale.created_at).toLocaleString()}</td>
                <td style={{ padding: "20px" }}>{sale.cajero}</td>
                <td style={{ padding: "20px" }}>{sale.payment_method}</td>
                <td style={{ padding: "20px", textAlign: "right", color: "#D4AF37", fontWeight: "bold" }}>${Number(sale.total).toLocaleString()}</td>
                <td style={{ padding: "20px", textAlign: "center" }}>
                    <button onClick={() => handleRePrint(sale)} disabled={isFetching} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", transition: '0.2s' }} onMouseOver={e => e.currentTarget.style.color = "#D4AF37"} onMouseOut={e => e.currentTarget.style.color = "#fff"}>
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
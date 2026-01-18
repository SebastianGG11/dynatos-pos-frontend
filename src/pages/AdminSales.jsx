import { useState, useEffect } from "react";
import api from "../api/api";
import { FiSearch, FiDownload, FiPrinter } from "react-icons/fi";

// 📦 LIBRERÍAS PARA EL EXCEL DE LUJO
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

export default function AdminSales() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Por defecto traemos el mes actual completo (para no saturar)
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  // Estado para la reimpresión
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
  // 🎨 FUNCIÓN NUEVA: EXCEL PREMIUM (NEGRO/DORADO)
  // ==========================================
  const exportPremiumExcel = async () => {
    if (sales.length === 0) { alert("No hay datos para exportar"); return; }

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Dynatos POS';
    workbook.created = new Date();

    // 1. Agrupar ventas por MES (Ej: "Enero 2026")
    const salesByMonth = sales.reduce((acc, sale) => {
      const date = new Date(sale.created_at);
      const monthName = date.toLocaleString('es-CO', { month: 'long', year: 'numeric' });
      const key = monthName.charAt(0).toUpperCase() + monthName.slice(1); // Capitalizar
      if (!acc[key]) acc[key] = [];
      acc[key].push(sale);
      return acc;
    }, {});

    // 2. Crear una Pestaña (Hoja) por cada mes
    for (const [monthName, monthSales] of Object.entries(salesByMonth)) {
      const sheet = workbook.addWorksheet(monthName);

      // Definir Columnas
      sheet.columns = [
        { header: 'ID', key: 'id', width: 10 },
        { header: 'FECHA', key: 'created_at', width: 20 },
        { header: 'CAJERO', key: 'cajero', width: 25 },
        { header: 'MÉTODO', key: 'method', width: 15 },
        { header: 'TOTAL', key: 'total', width: 20 },
      ];

      // Estilo del Encabezado (NEGRO con letras DORADAS)
      const headerRow = sheet.getRow(1);
      headerRow.eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF000000' } // Negro
        };
        cell.font = {
          name: 'Arial',
          color: { argb: 'FFD4AF37' }, // Dorado
          bold: true
        };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      });

      // Agregar Filas
      let totalMes = 0;
      monthSales.forEach(sale => {
        totalMes += Number(sale.total);
        sheet.addRow({
          id: sale.id,
          created_at: new Date(sale.created_at).toLocaleString(),
          cajero: sale.cajero,
          method: sale.payment_method,
          total: Number(sale.total) // Numérico para que Excel sume
        });
      });

      // Fila de TOTAL DEL MES
      const totalRow = sheet.addRow(['', '', '', 'TOTAL MES:', totalMes]);
      totalRow.getCell(4).font = { bold: true };
      totalRow.getCell(4).alignment = { horizontal: 'right' };
      totalRow.getCell(5).font = { bold: true, color: { argb: 'FFD4AF37' } };
      totalRow.getCell(5).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF000000' } };
      totalRow.getCell(5).numFmt = '"$"#,##0'; // Formato moneda
    }

    // 3. Descargar Archivo
    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `Reporte_Dynatos_Lujo.xlsx`);
  };

  // ==========================================
  // 🖨️ FUNCIÓN DE IMPRESIÓN (REPARADA)
  // ==========================================
  const handleRePrint = async (sale) => {
    setIsFetching(true);
    try {
      console.log("Solicitando venta ID:", sale.id);
      const res = await api.get(`/sales/${sale.id}`);
      
      if (!res.data || !res.data.items) throw new Error("Datos incompletos");

      setSelectedSale({ ...sale, items: res.data.items });
      
      // Esperamos un poco más para asegurar renderizado
      setTimeout(() => {
        window.print();
        // Opcional: Limpiar después de imprimir. 
        // Si lo comentas, la factura se queda en el DOM invisible por si falla el print.
        setSelectedSale(null); 
      }, 800);

    } catch (error) {
      console.error(error);
      alert("Error: No se pudo cargar el detalle de la venta. \n\nVerifica que el Backend esté corriendo y tenga la ruta /sales/:id");
    } finally {
      setIsFetching(false);
    }
  };

  const calculateTax = (total) => {
    const totalNum = Number(total);
    const valorImpuesto = totalNum - (totalNum / 1.19);
    const baseGravable = totalNum - valorImpuesto;
    return { baseGravable, valorImpuesto };
  };

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", animation: "fadeIn 0.5s ease", padding: "20px" }}>
      
      {/* 🧾 SECCIÓN OCULTA PARA IMPRIMIR */}
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
        {/* BOTÓN EXCEL PREMIUM */}
        <button 
          onClick={exportPremiumExcel}
          style={{ background: "#D4AF37", color: "#000", border: "none", padding: "12px 25px", borderRadius: "10px", fontWeight: "bold", cursor: "pointer", display: "flex", alignItems: "center", gap: "10px", boxShadow: "0 4px 15px rgba(212, 175, 55, 0.3)" }}
        >
          <FiDownload size={20} /> DESCARGAR REPORTE MENSUAL
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
                    <button 
                        onClick={() => handleRePrint(sale)} 
                        disabled={isFetching}
                        title="Imprimir Copia"
                        style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", transition: '0.2s' }}
                        onMouseOver={e => e.currentTarget.style.color = "#D4AF37"}
                        onMouseOut={e => e.currentTarget.style.color = "#fff"}
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
import { useState, useEffect } from "react";
import api from "../api/api";
import { FiTrendingUp, FiTrendingDown, FiCalendar, FiDownload, FiPieChart, FiMinusCircle, FiShoppingCart, FiPackage, FiDollarSign } from "react-icons/fi";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

export default function AdminFinancials() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => { fetchFinancials(); }, [startDate, endDate]);

  const fetchFinancials = async () => {
    setLoading(true);
    try {
      const res = await api.get("/reports/financials", { params: { startDate, endDate } });
      setData(res.data);
    } catch (error) { 
      console.error("Error cargando finanzas:", error); 
    } finally { 
      setLoading(false); 
    }
  };

  const exportFinancialExcel = async () => {
    if (!data) return;
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Resumen Financiero");

    sheet.mergeCells('A1:D1');
    sheet.getCell('A1').value = 'REPORTE FINANCIERO - DYNATOS';
    sheet.getCell('A1').font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
    sheet.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF000000' } };
    sheet.getCell('A1').alignment = { horizontal: 'center' };

    sheet.mergeCells('A2:D2');
    sheet.getCell('A2').value = `Periodo: ${startDate} al ${endDate}`;
    sheet.getCell('A2').alignment = { horizontal: 'center' };

    sheet.addRow([]);

    sheet.getRow(4).values = ['CONCEPTO', '', '', 'VALOR'];
    sheet.getRow(4).font = { bold: true, color: { argb: 'FFD4AF37' } };
    sheet.getRow(4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF333333' } };

    const rows = [
      ['(+) VENTAS BRUTAS', '', '', Number(data.gross_sales)],
      ['(-) DEVOLUCIONES', '', '', Number(data.refunds) * -1],
      ['(=) VENTAS NETAS', '', '', Number(data.net_sales)],
      [],
      ['(-) COSTO DE MERCANCÍA (COGS)', '', '', Number(data.net_cost) * -1],
      ['(-) GASTOS OPERATIVOS', '', '', Number(data.expenses) * -1],
      [],
      ['(=) UTILIDAD NETA REAL', '', '', Number(data.net_profit)],
      [],
      ['📊 INVERSIÓN ACTUAL (INVENTARIO)', '', '', Number(data.current_investment)],
      ['📊 COMPRAS TOTALES (HISTÓRICO)', '', '', Number(data.total_purchases)],
    ];

    rows.forEach(r => {
      const row = sheet.addRow(r);
      row.getCell(4).numFmt = '"$"#,##0.00';
    });

    sheet.getColumn(1).width = 40;
    sheet.getColumn(4).width = 25;

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `Reporte_Financiero_${startDate}.xlsx`);
  };

  if (!data) return <div className="p-10 text-center text-white">Cargando contabilidad...</div>;

  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "20px", animation: "fadeIn 0.5s" }}>
      
      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px", borderBottom: "1px solid #333", paddingBottom: "20px" }}>
        <div>
          <h1 style={{ color: "#D4AF37", margin: 0, fontSize: "2rem", fontFamily: 'serif', display: 'flex', alignItems: 'center', gap: '10px' }}>
             <FiPieChart /> REPORTE FINANCIERO
          </h1>
          <p style={{ color: "#666", marginTop: "5px" }}>Análisis de rentabilidad y costos (Neto)</p>
        </div>
        <button onClick={exportFinancialExcel} style={{ background: "#2ecc71", color: "#000", border: "none", padding: "12px 25px", borderRadius: "10px", fontWeight: "bold", cursor: "pointer", display: "flex", alignItems: "center", gap: "10px", boxShadow: "0 4px 15px rgba(46, 204, 113, 0.3)" }}>
          <FiDownload size={20} /> DESCARGAR EXCEL
        </button>
      </div>

      {/* FILTROS */}
      <div style={{ display: "flex", gap: "20px", marginBottom: "30px", background: "#111", padding: "15px", borderRadius: "10px", alignItems: "center", border: "1px solid #222" }}>
        <FiCalendar color="#D4AF37" size={24} />
        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={{ background: "#000", border: "1px solid #333", color: "#fff", padding: "10px", borderRadius: "5px" }} />
        <span style={{ color: "#666" }}>a</span>
        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={{ background: "#000", border: "1px solid #333", color: "#fff", padding: "10px", borderRadius: "5px" }} />
        <button onClick={fetchFinancials} style={{ marginLeft: "auto", background: "transparent", border: "1px solid #D4AF37", color: "#D4AF37", padding: "8px 20px", borderRadius: "5px", fontWeight: "bold", cursor: "pointer" }}>ACTUALIZAR</button>
      </div>

      {/* TARJETAS PRINCIPALES */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "20px", marginBottom: "30px" }}>
        
        {/* VENTAS NETAS */}
        <div style={{ background: "#1a1a1a", padding: "25px", borderRadius: "15px", borderLeft: "5px solid #2ecc71" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                <h3 style={{ margin: 0, color: "#aaa", fontSize: "0.9rem" }}>VENTAS NETAS</h3>
                <FiTrendingUp color="#2ecc71" size={24} />
            </div>
            <p style={{ fontSize: "1.8rem", fontWeight: "bold", color: "#fff", margin: 0 }}>${data.net_sales.toLocaleString()}</p>
            <p style={{ fontSize: "0.75rem", color: "#666", marginTop: "5px" }}>Periodo seleccionado</p>
        </div>

        {/* COSTO MERCANCÍA */}
        <div style={{ background: "#1a1a1a", padding: "25px", borderRadius: "15px", borderLeft: "5px solid #e74c3c" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                <h3 style={{ margin: 0, color: "#aaa", fontSize: "0.9rem" }}>COSTO MERCANCÍA</h3>
                <FiTrendingDown color="#e74c3c" size={24} />
            </div>
            <p style={{ fontSize: "1.8rem", fontWeight: "bold", color: "#fff", margin: 0 }}>-${data.net_cost.toLocaleString()}</p>
            <p style={{ fontSize: "0.75rem", color: "#666", marginTop: "5px" }}>Periodo seleccionado</p>
        </div>

        {/* GASTOS OPERATIVOS */}
        <div style={{ background: "#1a1a1a", padding: "25px", borderRadius: "15px", borderLeft: "5px solid #ff6b6b" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                <h3 style={{ margin: 0, color: "#aaa", fontSize: "0.9rem" }}>GASTOS OPERATIVOS</h3>
                <FiMinusCircle color="#ff6b6b" size={24} />
            </div>
            <p style={{ fontSize: "1.8rem", fontWeight: "bold", color: "#fff", margin: 0 }}>-${data.expenses.toLocaleString()}</p>
            <p style={{ fontSize: "0.75rem", color: "#666", marginTop: "5px" }}>Luz, Nómina, etc.</p>
        </div>

        {/* 🔥 INVERSIÓN ACTUAL */}
        <div style={{ background: "#1a1a1a", padding: "25px", borderRadius: "15px", borderLeft: "5px solid #9b59b6", boxShadow: "0 4px 20px rgba(155, 89, 182, 0.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                <h3 style={{ margin: 0, color: "#aaa", fontSize: "0.9rem" }}>INVERSIÓN ACTUAL</h3>
                <FiPackage color="#9b59b6" size={24} />
            </div>
            <p style={{ fontSize: "1.8rem", fontWeight: "bold", color: "#fff", margin: 0 }}>${data.current_investment.toLocaleString()}</p>
            <p style={{ fontSize: "0.75rem", color: "#9b59b6", marginTop: "5px", fontWeight: "bold" }}>📦 Valor del inventario</p>
        </div>

        {/* 🔥 COMPRAS TOTALES */}
        <div style={{ background: "#1a1a1a", padding: "25px", borderRadius: "15px", borderLeft: "5px solid #3498db", boxShadow: "0 4px 20px rgba(52, 152, 219, 0.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                <h3 style={{ margin: 0, color: "#aaa", fontSize: "0.9rem" }}>COMPRAS TOTALES</h3>
                <FiShoppingCart color="#3498db" size={24} />
            </div>
            <p style={{ fontSize: "1.8rem", fontWeight: "bold", color: "#fff", margin: 0 }}>${data.total_purchases.toLocaleString()}</p>
            <p style={{ fontSize: "0.75rem", color: "#3498db", marginTop: "5px", fontWeight: "bold" }}>📊 Histórico completo</p>
        </div>

      </div>

      {/* GANANCIA NETA */}
      <div style={{ background: "linear-gradient(135deg, #000 0%, #1a1a1a 100%)", padding: "40px", borderRadius: "20px", border: "1px solid #D4AF37", textAlign: "center", boxShadow: "0 10px 40px rgba(212, 175, 55, 0.15)", marginBottom: "30px" }}>
        <h2 style={{ color: "#D4AF37", margin: "0 0 10px 0", letterSpacing: "3px", fontSize: "1rem" }}>UTILIDAD NETA REAL</h2>
        <div style={{ fontSize: "4.5rem", fontWeight: "bold", color: "#fff", textShadow: "0 0 20px rgba(255,255,255,0.1)" }}>
            ${data.net_profit.toLocaleString()}
        </div>
        <div style={{ display: "inline-block", background: "rgba(212, 175, 55, 0.2)", padding: "8px 20px", borderRadius: "30px", marginTop: "15px", color: "#D4AF37", fontWeight: "bold", border: "1px solid rgba(212, 175, 55, 0.3)" }}>
            Margen Real: {data.margin_percent}%
        </div>
      </div>

      {/* 🔥 SECCIÓN DE ANÁLISIS DE INVERSIÓN */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "30px", marginBottom: "30px" }}>
        
        {/* TOP 5 PRODUCTOS */}
        <div style={{ background: "#111", padding: "30px", borderRadius: "15px", border: "1px solid #222" }}>
          <h3 style={{ color: "#D4AF37", margin: "0 0 20px 0", display: "flex", alignItems: "center", gap: "10px" }}>
            <FiDollarSign /> TOP 5 INVERSIÓN POR PRODUCTO
          </h3>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", color: "#eee" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #333", color: "#888", fontSize: "0.85rem" }}>
                  <th style={{ padding: "10px", textAlign: "left" }}>PRODUCTO</th>
                  <th style={{ padding: "10px", textAlign: "center" }}>STOCK</th>
                  <th style={{ padding: "10px", textAlign: "right" }}>COSTO</th>
                  <th style={{ padding: "10px", textAlign: "right" }}>INVERSIÓN</th>
                </tr>
              </thead>
              <tbody>
                {data.top_products.map((product, idx) => (
                  <tr key={idx} style={{ borderBottom: "1px solid #222" }}>
                    <td style={{ padding: "15px", fontWeight: "bold" }}>{product.name}</td>
                    <td style={{ padding: "15px", textAlign: "center", color: "#888" }}>{product.stock}u</td>
                    <td style={{ padding: "15px", textAlign: "right", color: "#D4AF37" }}>${product.cost.toLocaleString()}</td>
                    <td style={{ padding: "15px", textAlign: "right", color: "#2ecc71", fontWeight: "bold" }}>${product.value.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* GRÁFICO DE DONA POR CATEGORÍA */}
        <div style={{ background: "#111", padding: "30px", borderRadius: "15px", border: "1px solid #222" }}>
          <h3 style={{ color: "#D4AF37", margin: "0 0 20px 0", display: "flex", alignItems: "center", gap: "10px" }}>
            <FiPieChart /> INVERSIÓN POR CATEGORÍA
          </h3>
          <DonutChart data={data.investment_by_category} />
        </div>

      </div>

    </div>
  );
}

// 🔥 COMPONENTE DE GRÁFICO DE DONA
function DonutChart({ data }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  
  const colors = ["#2ecc71", "#3498db", "#9b59b6", "#e74c3c", "#f39c12", "#1abc9c", "#34495e"];
  
  let currentAngle = -90;
  
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* SVG DONA */}
      <svg viewBox="0 0 200 200" style={{ maxWidth: "250px", margin: "0 auto" }}>
        {data.map((item, idx) => {
          const percentage = (item.value / total) * 100;
          const angle = (percentage / 100) * 360;
          const endAngle = currentAngle + angle;
          
          const startRad = (currentAngle * Math.PI) / 180;
          const endRad = (endAngle * Math.PI) / 180;
          
          const x1 = 100 + 80 * Math.cos(startRad);
          const y1 = 100 + 80 * Math.sin(startRad);
          const x2 = 100 + 80 * Math.cos(endRad);
          const y2 = 100 + 80 * Math.sin(endRad);
          
          const largeArc = angle > 180 ? 1 : 0;
          
          const pathData = [
            `M 100 100`,
            `L ${x1} ${y1}`,
            `A 80 80 0 ${largeArc} 1 ${x2} ${y2}`,
            `Z`
          ].join(' ');
          
          currentAngle = endAngle;
          
          return (
            <path
              key={idx}
              d={pathData}
              fill={colors[idx % colors.length]}
              opacity="0.9"
            />
          );
        })}
        
        {/* CÍRCULO INTERIOR (DONA) */}
        <circle cx="100" cy="100" r="50" fill="#111" />
        
        {/* TEXTO CENTRAL */}
        <text x="100" y="95" textAnchor="middle" fill="#D4AF37" fontSize="12" fontWeight="bold">TOTAL</text>
        <text x="100" y="110" textAnchor="middle" fill="#fff" fontSize="14" fontWeight="bold">
          ${(total / 1000).toFixed(0)}k
        </text>
      </svg>

      {/* LEYENDA */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {data.map((item, idx) => (
          <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.85rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ width: "12px", height: "12px", borderRadius: "2px", background: colors[idx % colors.length] }}></div>
              <span style={{ color: "#eee" }}>{item.category}</span>
            </div>
            <span style={{ color: "#D4AF37", fontWeight: "bold" }}>${item.value.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
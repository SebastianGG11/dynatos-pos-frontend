import { useEffect, useMemo, useState } from "react";
import api from "../api/api";
import CerrarCaja from "./CerrarCaja";
import { FiShoppingCart, FiUser, FiDollarSign, FiCreditCard } from "react-icons/fi";

export default function Venta({ cashDrawer, onCashClosed }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [cart, setCart] = useState([]);
  const [sale, setSale] = useState(null);
  const [preview, setPreview] = useState(null);
  const [cashReceived, setCashReceived] = useState("");
  const [showQRConfirm, setShowQRConfirm] = useState(false);
  const [showCloseCash, setShowCloseCash] = useState(false);
  const [receiptData, setReceiptData] = useState(null);

  // Nombre simple para evitar errores
  const nombreCajero = useMemo(() => {
    try {
      let raw = cashDrawer?.user_full_name || localStorage.getItem('user_data');
      if (typeof raw === 'string' && raw.includes("FULL_NAME")) {
         const parsed = JSON.parse(raw);
         return parsed.FULL_NAME;
      }
      return raw || "Cajero";
    } catch { return "Cajero"; }
  }, [cashDrawer]);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    try {
      const [catRes, prodRes] = await Promise.all([api.get("/categories"), api.get("/products")]);
      setCategories(catRes.data?.items ?? []);
      setProducts(prodRes.data?.items ?? []);
    } catch { console.error("Error datos"); }
  };

  const filteredProducts = selectedCategory === "ALL" ? products : products.filter(p => p.category_id === selectedCategory);

  const getAvailableStock = (product) => {
    const inCart = cart.find(i => i.id === product?.id)?.qty || 0;
    return Number(product?.current_stock || 0) - inCart;
  };

  const addProduct = (p) => {
    if (getAvailableStock(p) <= 0) return;
    setCart(prev => {
      const found = prev.find(item => item.id === p.id);
      return found ? prev.map(item => item.id === p.id ? { ...item, qty: item.qty + 1 } : item) : [...prev, { ...p, qty: 1 }];
    });
  };

  const increaseQty = (id) => setCart(prev => prev.map(p => p.id === id ? { ...p, qty: p.qty + 1 } : p));
  const decreaseQty = (id) => setCart(prev => prev.map(p => p.id === id ? { ...p, qty: p.qty - 1 } : p).filter(p => p.qty > 0));

  const clearCart = () => { 
    setCart([]); setSale(null); setPreview(null); setCashReceived(""); setReceiptData(null); 
  };

  useEffect(() => {
    if (cart.length === 0) { setPreview(null); return; }
    const fetchPreview = async () => {
      try {
        const res = await api.post("/sales", { cash_drawer_id: cashDrawer.id, customer_name: "PREVIEW", items: cart.map(i => ({ product_id: i.id, quantity: i.qty })), preview: true });
        setPreview(res.data.sale);
      } catch { setPreview(null); }
    };
    fetchPreview();
  }, [cart, cashDrawer?.id]);

  const total = preview?.total ?? cart.reduce((s, i) => s + (Number(i.sale_price) * i.qty), 0);
  const tasaIva = 0.19;
  const valorIva = total - (total / (1 + tasaIva));
  const baseGravable = total - valorIva;

  const finalizeTransaction = (method, received, change) => {
    setReceiptData({
      id: sale.id, date: new Date().toLocaleString(), cajero: nombreCajero,
      items: [...cart], subtotal: baseGravable, iva: valorIva, total: total,
      method, received, change
    });
    setTimeout(() => { window.print(); clearCart(); loadAll(); }, 500);
  };

  const createSale = async () => {
    try {
      const res = await api.post("/sales", { cash_drawer_id: cashDrawer.id, customer_name: "Cliente Mostrador", items: cart.map(i => ({ product_id: i.id, quantity: i.qty })) });
      setSale(res.data.sale);
    } catch { alert("Error creando venta"); }
  };

  const payCash = async () => {
    const received = Number(cashReceived);
    if (received < total) { alert("Monto insuficiente"); return; }
    try {
      await api.post("/payments/cash", { sale_id: sale.id, amount: total });
      finalizeTransaction("EFECTIVO", received, received - total);
    } catch { alert("Error en pago efectivo"); }
  };

  const confirmQRPayment = async () => {
    try {
      await api.post("/payments/qr", { sale_id: sale.id, amount: total, provider: "NEQUI" });
      setShowQRConfirm(false);
      finalizeTransaction("TRANSFERENCIA / QR", total, 0);
    } catch { alert("Error en pago QR"); }
  };

  return (
    <div style={{ display: "flex", height: "100vh", backgroundColor: "#000", overflow: "hidden" }}>
      {/* TIRILLA DE IMPRESIÓN */}
      <div id="print-area" style={{ display: "none" }}>
        {receiptData && (
          <div style={{ width: "80mm", padding: "5mm", fontFamily: 'monospace', backgroundColor: '#fff', fontSize: '11px', color: '#000' }}>
            <center><h2 style={{ margin: 0 }}>DYNATOS</h2><p>MARKET & LICORERÍA</p></center>
            <p>FECHA: {receiptData.date}<br/>ORDEN: #{receiptData.id}<br/>CAJERO: {receiptData.cajero}</p>
            <hr style={{ border: '0.5px dashed #000' }} />
            <table style={{ width: '100%' }}><tbody>{receiptData.items.map(i => (<tr key={i.id}><td>{i.qty} x {i.name.substring(0,15)}</td><td align="right">${(i.qty * i.sale_price).toLocaleString()}</td></tr>))}</tbody></table>
            <hr style={{ border: '0.5px dashed #000' }} />
            <div style={{ textAlign: 'right' }}>
              <p>SUBTOTAL: ${receiptData.subtotal.toLocaleString(undefined,{maximumFractionDigits:0})}</p>
              <p>IVA (19%): ${receiptData.iva.toLocaleString(undefined,{maximumFractionDigits:0})}</p>
              <h2 style={{ margin: '5px 0' }}>TOTAL: ${receiptData.total.toLocaleString()}</h2>
            </div>
            <div style={{ borderTop: '1px solid #000', marginTop: '5px' }}>
              <p>MÉTODO: {receiptData.method}</p>
              <p>RECIBIDO: ${receiptData.received.toLocaleString()}</p>
              <p>CAMBIO: ${receiptData.change.toLocaleString()}</p>
            </div>
            <center style={{ marginTop: '10px' }}>*** GRACIAS ***</center>
          </div>
        )}
      </div>
      <style>{`@media print { body * { visibility: hidden; } #print-area, #print-area * { visibility: visible; } #print-area { position: absolute; left: 0; top: 0; width: 100%; display: block !important; } }`}</style>

      {/* INTERFAZ */}
      <div style={{ width: "200px", borderRight: "1px solid #D4AF37", padding: "20px", display: "flex", flexDirection: "column" }}>
        <h3 style={{ color: "#D4AF37", fontSize: "0.8rem", marginBottom: "20px" }}>CATEGORÍAS</h3>
        <div style={{ flex: 1, overflowY: "auto" }}>
          <button onClick={() => setSelectedCategory("ALL")} style={{ width: "100%", padding: "10px", marginBottom: "5px", background: selectedCategory === "ALL" ? "#D4AF37" : "transparent", color: selectedCategory === "ALL" ? "#000" : "#fff", border: "1px solid #333", borderRadius: "8px", fontWeight: "bold" }}>TODAS</button>
          {categories.map(c => <button key={c.id} onClick={() => setSelectedCategory(c.id)} style={{ width: "100%", padding: "10px", marginBottom: "5px", background: selectedCategory === c.id ? "#D4AF37" : "transparent", color: selectedCategory === c.id ? "#000" : "#fff", border: "1px solid #333", borderRadius: "8px" }}>{c.name.toUpperCase()}</button>)}
        </div>
        <button onClick={() => setShowCloseCash(true)} style={{ padding: "12px", background: "#f44", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "bold" }}>CERRAR CAJA</button>
      </div>

      <div style={{ flex: 1, padding: "20px", overflowY: "auto" }}>
        <h1 style={{ color: "#D4AF37", marginBottom: "20px" }}>PRODUCTOS ({String(nombreCajero)})</h1>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "10px" }}>
          {filteredProducts.map(p => (
            <button key={p.id} onClick={() => addProduct(p)} disabled={getAvailableStock(p) <= 0} style={{ background: "#111", border: "1px solid #222", padding: "15px", borderRadius: "10px", textAlign: "left", color: "#fff" }}>
              <div style={{ fontWeight: "bold" }}>{p.name}</div>
              <div style={{ color: "#D4AF37" }}>${Number(p.sale_price).toLocaleString()}</div>
              <div style={{ fontSize: "0.7rem", color: "#666" }}>Stock: {getAvailableStock(p)}</div>
            </button>
          ))}
        </div>
      </div>

      <div style={{ width: "350px", borderLeft: "1px solid #222", display: "flex", flexDirection: "column", backgroundColor: "#111", padding: "20px" }}>
        <h2 style={{ color: "#D4AF37", display: "flex", alignItems: "center", gap: "10px" }}><FiShoppingCart /> CARRITO</h2>
        <div style={{ flex: 1, overflowY: "auto", margin: "20px 0" }}>
          {cart.map(i => (
            <div key={i.id} style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px", color: "#eee" }}>
              <div>{i.name} <span style={{ color: "#666", fontSize: "0.8rem" }}>x{i.qty}</span></div>
              <div style={{ display: "flex", gap: "5px" }}>
                <button onClick={() => decreaseQty(i.id)} style={{ background: "#333", color: "#fff", border: "none", width: "20px" }}>-</button>
                <button onClick={() => increaseQty(i.id)} style={{ background: "#333", color: "#fff", border: "none", width: "20px" }}>+</button>
              </div>
              <div>${(i.qty * i.sale_price).toLocaleString()}</div>
            </div>
          ))}
        </div>
        
        <div style={{ borderTop: "1px solid #333", paddingTop: "10px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "1.5rem", fontWeight: "bold", color: "#D4AF37", marginBottom: "15px" }}><span>TOTAL</span><span>${total.toLocaleString()}</span></div>
          {!sale ? (
            <button onClick={createSale} disabled={cart.length === 0} style={{ width: "100%", padding: "15px", background: "#D4AF37", border: "none", borderRadius: "8px", fontWeight: "bold" }}>PAGAR</button>
          ) : (
            <div>
              <input type="number" placeholder="DINERO RECIBIDO" value={cashReceived} onChange={e => setCashReceived(e.target.value)} style={{ width: "100%", padding: "10px", background: "#000", border: "1px solid #D4AF37", color: "#fff", textAlign: "center", fontSize: "1.2rem", marginBottom: "10px" }} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <button onClick={payCash} style={{ padding: "15px", background: "#D4AF37", border: "none", borderRadius: "8px", fontWeight: "bold" }}><FiDollarSign /> EFECTIVO</button>
                <button onClick={() => setShowQRConfirm(true)} style={{ padding: "15px", border: "1px solid #5c5", color: "#5c5", background: "transparent", borderRadius: "8px", fontWeight: "bold" }}><FiCreditCard /> QR</button>
              </div>
              <button onClick={() => setSale(null)} style={{ width: "100%", marginTop: "10px", color: "#888", background: "none", border: "none", textDecoration: "underline" }}>Cancelar</button>
            </div>
          )}
        </div>
      </div>

      {showQRConfirm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.9)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#111", padding: "30px", border: "1px solid #D4AF37", borderRadius: "15px", textAlign: "center" }}>
            <p style={{ color: "#fff", marginBottom: "20px" }}>¿Confirmas la transferencia?</p>
            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={() => setShowQRConfirm(false)} style={{ padding: "10px 20px", background: "#333", color: "#fff", border: "none", borderRadius: "5px" }}>Cancelar</button>
              <button onClick={confirmQRPayment} style={{ padding: "10px 20px", background: "#D4AF37", border: "none", borderRadius: "5px", fontWeight: "bold" }}>CONFIRMAR PAGO</button>
            </div>
          </div>
        </div>
      )}
      {showCloseCash && <CerrarCaja cashDrawer={cashDrawer} onClosed={() => { setShowCloseCash(false); onCashClosed(); }} />}
    </div>
  );
}
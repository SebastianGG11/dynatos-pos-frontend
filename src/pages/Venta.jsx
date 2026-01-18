import { useEffect, useMemo, useState } from "react";
import api from "../api/api";
import CerrarCaja from "./CerrarCaja";
import { FiShoppingCart, FiTrash2, FiPlus, FiMinus, FiCreditCard, FiDollarSign, FiUser, FiScissors } from "react-icons/fi";

export default function Venta({ cashDrawer, onCashClosed }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [cart, setCart] = useState([]);
  const [sale, setSale] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [cashReceived, setCashReceived] = useState("");
  const [showQRConfirm, setShowQRConfirm] = useState(false);
  const [showCloseCash, setShowCloseCash] = useState(false);

  // Obtener el nombre del cajero real desde el cashDrawer o el localStorage
  const nombreCajero = cashDrawer.user_full_name || localStorage.getItem('user_name') || "Cajero General";

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    try {
      const [catRes, prodRes] = await Promise.all([api.get("/categories"), api.get("/products")]);
      setCategories(catRes.data?.items ?? []);
      setProducts(prodRes.data?.items ?? []);
    } catch { console.error("Error cargando productos"); }
  };

  const filteredProducts = selectedCategory === "ALL" 
    ? products 
    : products.filter((p) => p.category_id === selectedCategory);

  const getAvailableStock = (product) => {
    const inCart = cart.find(i => i.id === product.id)?.qty || 0;
    return Number(product.current_stock) - inCart;
  };

  const addProduct = (product) => {
    if (getAvailableStock(product) <= 0) return;
    setCart((prev) => {
      const found = prev.find((p) => p.id === product.id);
      if (found) return prev.map((p) => p.id === product.id ? { ...p, qty: p.qty + 1 } : p);
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const increaseQty = (id) => {
    const prod = products.find(p => p.id === id);
    if (getAvailableStock(prod) <= 0) return;
    setCart(prev => prev.map(p => p.id === id ? { ...p, qty: p.qty + 1 } : p));
  };

  const decreaseQty = (id) => {
    setCart(prev => prev.map(p => p.id === id ? { ...p, qty: p.qty - 1 } : p).filter(p => p.qty > 0));
  };

  const clearCart = () => { setCart([]); setSale(null); setPreview(null); setCashReceived(""); };

  useEffect(() => {
    if (cart.length === 0) { setPreview(null); return; }
    const fetchPreview = async () => {
      setLoadingPreview(true);
      try {
        const res = await api.post("/sales", {
          cash_drawer_id: cashDrawer.id,
          customer_name: "PREVIEW",
          items: cart.map((i) => ({ product_id: i.id, quantity: i.qty })),
          preview: true,
        });
        setPreview(res.data.sale);
      } catch { setPreview(null); } finally { setLoadingPreview(false); }
    };
    fetchPreview();
  }, [cart, cashDrawer.id]);

  const subtotalNeto = cart.reduce((sum, i) => sum + Number(i.sale_price) * i.qty, 0);
  const totalConPromos = preview?.total ?? subtotalNeto;
  
  // Cálculo de IVA (Asumiendo 19% incluido en el precio)
  const tasaIva = 0.19;
  const valorIva = totalConPromos - (totalConPromos / (1 + tasaIva));
  const baseGravable = totalConPromos - valorIva;

  const finishSale = () => {
    window.print();
    clearCart();
    loadAll();
  };

  const createSale = async () => {
    if (cart.length === 0) return;
    try {
      const res = await api.post("/sales", {
        cash_drawer_id: cashDrawer.id,
        customer_name: "Cliente Mostrador",
        customer_document: "0",
        items: cart.map((i) => ({ product_id: i.id, quantity: i.qty })),
      });
      setSale(res.data.sale);
    } catch { alert("Error creando la venta"); }
  };

  const payCash = async () => {
    const received = Number(cashReceived);
    if (received < totalConPromos) { alert("Monto insuficiente"); return; }
    try {
      await api.post("/payments/cash", { sale_id: sale.id, amount: totalConPromos });
      alert(`Venta exitosa. Cambio: $${(received - totalConPromos).toLocaleString()}`);
      finishSale();
    } catch { alert("Error en el pago"); }
  };

  const confirmQRPayment = async () => {
    try {
      await api.post("/payments/qr", { sale_id: sale.id, amount: totalConPromos, provider: "NEQUI" });
      setShowQRConfirm(false);
      setTimeout(() => { finishSale(); }, 300);
    } catch { alert("Error confirmando pago QR"); }
  };

  return (
    <div style={{ display: "flex", height: "100vh", backgroundColor: "#000", overflow: "hidden" }}>
      
      {/* 🧾 FACTURA TIPO TIRILLA DISEÑADA */}
      <div id="factura-tirilla" style={{ display: "none" }}>
        <div style={{ width: "80mm", padding: "5mm", color: "#000", fontFamily: 'monospace', backgroundColor: '#fff' }}>
          <center>
            <h2 style={{ margin: 0 }}>DYNATOS</h2>
            <p style={{ margin: 0, fontSize: '12px' }}>MARKET & LICORERÍA</p>
          </center>
          <div style={{ marginTop: '10px', fontSize: '10px' }}>
            <p style={{ margin: 0 }}>FECHA: {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}</p>
            <p style={{ margin: 0 }}>CAJERO: {nombreCajero}</p>
            <p style={{ margin: 0 }}>ORDEN: #{sale?.id || '000'}</p>
          </div>
          <hr style={{ border: '0.5px dashed #000', margin: '10px 0' }} />
          <table style={{ width: '100%', fontSize: '10px' }}>
            <thead>
              <tr><th align="left">ITEM</th><th align="center">CT</th><th align="right">TOTAL</th></tr>
            </thead>
            <tbody>
              {cart.map(i => (
                <tr key={i.id}>
                  <td>{i.name.substring(0,20)}</td>
                  <td align="center">{i.qty}</td>
                  <td align="right">${(i.qty * i.sale_price).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <hr style={{ border: '0.5px dashed #000', margin: '10px 0' }} />
          <div style={{ textAlign: 'right', fontSize: '11px' }}>
            <p style={{ margin: 0 }}>BASE GRAVABLE: ${baseGravable.toLocaleString(undefined, {maximumFractionDigits: 0})}</p>
            <p style={{ margin: 0 }}>IVA (19%): ${valorIva.toLocaleString(undefined, {maximumFractionDigits: 0})}</p>
            <p style={{ fontSize: '16px', margin: '5px 0', fontWeight: 'bold' }}>TOTAL: ${totalConPromos.toLocaleString()}</p>
          </div>
          <center style={{ marginTop: '15px', fontSize: '9px' }}>
            *** DOCUMENTO INTERNO DE VENTA ***
          </center>
        </div>
      </div>

      <style>{`
        @media print {
          body * { visibility: hidden; }
          #factura-tirilla, #factura-tirilla * { visibility: visible; }
          #factura-tirilla { position: absolute; left: 0; top: 0; width: 100%; display: block !important; }
        }
      `}</style>

      {/* 1. SIDEBAR */}
      <div style={{ width: "200px", borderRight: "1px solid #D4AF37", padding: "20px", display: "flex", flexDirection: "column" }}>
        <h3 style={{ color: "#D4AF37", fontSize: "0.7rem", marginBottom: "20px", letterSpacing: '2px' }}>CATEGORÍAS</h3>
        <div style={{ flex: 1, overflowY: "auto" }}>
          <button onClick={() => setSelectedCategory("ALL")} style={{ width: "100%", padding: "12px", marginBottom: "10px", borderRadius: "8px", border: "1px solid #333", color: selectedCategory === "ALL" ? "#000" : "#fff", backgroundColor: selectedCategory === "ALL" ? "#D4AF37" : "transparent", fontWeight: "bold", cursor: 'pointer' }}>TODAS</button>
          {categories.map(c => (
            <button key={c.id} onClick={() => setSelectedCategory(c.id)} style={{ width: "100%", padding: "12px", marginBottom: "10px", borderRadius: "8px", border: "1px solid #333", color: selectedCategory === c.id ? "#000" : "#fff", backgroundColor: selectedCategory === c.id ? "#D4AF37" : "transparent", cursor: 'pointer' }}>{c.name.toUpperCase()}</button>
          ))}
        </div>
        <button onClick={() => setShowCloseCash(true)} style={{ padding: "12px", background: "#f44", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>CERRAR CAJA</button>
      </div>

      {/* 2. PRODUCTOS */}
      <div style={{ flex: 1, padding: "30px", overflowY: "auto" }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <h1 style={{ color: "#D4AF37", fontFamily: "serif", margin: 0, letterSpacing: "2px" }}>PRODUCTOS</h1>
          <div style={{ backgroundColor: '#111', padding: '10px 20px', borderRadius: '10px', border: '1px solid #333', display: 'flex', alignItems: 'center', gap: '10px' }}>
             <FiUser style={{ color: '#D4AF37' }} />
             <span style={{ color: '#fff', fontSize: '0.8rem', fontWeight: 'bold' }}>CAJA: {nombreCajero.toUpperCase()}</span>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "15px" }}>
          {filteredProducts.map(p => (
            <button key={p.id} onClick={() => addProduct(p)} disabled={getAvailableStock(p) <= 0} style={{ background: "#111", border: "1px solid #222", padding: "15px", borderRadius: "12px", textAlign: "left", cursor: "pointer", transition: "0.2s" }}>
              <div style={{ fontWeight: "bold", fontSize: "0.9rem", color: "#fff" }}>{p.name}</div>
              <div style={{ color: "#D4AF37", fontWeight: "bold", marginTop: "5px" }}>${Number(p.sale_price).toLocaleString()}</div>
              <div style={{ fontSize: "0.7rem", color: "#444", marginTop: "10px" }}>STOCK: {getAvailableStock(p)}</div>
            </button>
          ))}
        </div>
      </div>

      {/* 3. CARRITO */}
      <div style={{ width: "380px", borderLeft: "1px solid #222", display: "flex", flexDirection: "column", backgroundColor: "#111" }}>
        <div style={{ padding: "20px", borderBottom: "1px solid #222" }}>
          <h2 style={{ color: "#D4AF37", display: "flex", alignItems: "center", gap: "10px", margin: 0 }}><FiShoppingCart /> COMPRA</h2>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "20px" }}>
          {cart.map(i => (
            <div key={i.id} style={{ display: "flex", justifyContent: "space-between", marginBottom: "15px", fontSize: "0.9rem" }}>
              <div style={{ flex: 1, color: '#eee' }}>{i.name}</div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", margin: "0 10px", color: '#fff' }}>
                <button onClick={() => decreaseQty(i.id)} style={{ background: "#222", border: "none", color: "#fff", borderRadius: "4px", width: "24px", cursor: 'pointer' }}>-</button>
                <span>{i.qty}</span>
                <button onClick={() => increaseQty(i.id)} style={{ background: "#222", border: "none", color: "#fff", borderRadius: "4px", width: "24px", cursor: 'pointer' }}>+</button>
              </div>
              <div style={{ fontWeight: "bold", color: '#D4AF37' }}>${(i.qty * i.sale_price).toLocaleString()}</div>
            </div>
          ))}
        </div>

        <div style={{ padding: "20px", backgroundColor: "#0a0a0a", borderTop: "2px solid #D4AF37" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px", color: "#666", fontSize: '0.8rem' }}><span>BASE GRAVABLE</span><span>${baseGravable.toLocaleString(undefined, {maximumFractionDigits: 0})}</span></div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px", color: "#666", fontSize: '0.8rem' }}><span>IVA (19%)</span><span>${valorIva.toLocaleString(undefined, {maximumFractionDigits: 0})}</span></div>
          {promoDiscount > 0 && <div style={{ display: "flex", justifyContent: "space-between", color: "#5c5", fontSize: '0.8rem' }}><span>DESCUENTO</span><span>-${promoDiscount.toLocaleString()}</span></div>}
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "1.8rem", fontWeight: "bold", color: "#D4AF37", margin: "10px 0" }}><span>TOTAL</span><span>${totalConPromos.toLocaleString()}</span></div>

          {!sale ? (
            <button onClick={createSale} disabled={cart.length === 0} style={{ width: "100%", padding: "18px", background: "#D4AF37", border: "none", borderRadius: "10px", fontWeight: "bold", cursor: "pointer", fontSize: '1rem' }}>PAGAR AHORA</button>
          ) : (
            <div>
              <input type="number" placeholder="DINERO RECIBIDO" value={cashReceived} onChange={e => setCashReceived(e.target.value)} style={{ width: "100%", padding: "12px", background: "#000", border: "1px solid #D4AF37", color: "#fff", borderRadius: "8px", textAlign: "center", fontSize: "1.4rem", marginBottom: "15px", outline: 'none' }} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <button onClick={payCash} style={{ padding: "15px", background: "#D4AF37", color: "#000", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: 'pointer' }}><FiDollarSign /> EFECTIVO</button>
                <button onClick={() => setShowQRConfirm(true)} style={{ padding: "15px", border: "1px solid #5c5", color: "#5c5", background: "none", borderRadius: "8px", fontWeight: "bold", cursor: 'pointer' }}><FiCreditCard /> QR / NEQUI</button>
              </div>
              <button onClick={() => setSale(null)} style={{ width: "100%", marginTop: "15px", color: "#666", fontSize: "0.8rem", background: "none", border: "none", cursor: "pointer", textDecoration: 'underline' }}>Cancelar Pago</button>
            </div>
          )}
        </div>
      </div>

      {showQRConfirm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.9)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: 'blur(4px)' }}>
          <div style={{ background: "#111", padding: "40px", borderRadius: "20px", border: "1px solid #D4AF37", textAlign: "center", maxWidth: '350px' }}>
            <p style={{ color: "#fff", marginBottom: "30px", fontSize: '1.1rem' }}>¿El cliente ya realizó la transferencia?</p>
            <div style={{ display: "flex", gap: "15px" }}>
              <button onClick={() => setShowQRConfirm(false)} style={{ flex: 1, padding: "12px", background: "#222", color: "#888", border: "1px solid #333", borderRadius: "10px", cursor: 'pointer' }}>NO, VOLVER</button>
              <button onClick={confirmQRPayment} style={{ flex: 1, padding: "12px", background: "#D4AF37", color: "#000", border: "none", borderRadius: "10px", fontWeight: "bold", cursor: 'pointer' }}>SÍ, PAGADO</button>
            </div>
          </div>
        </div>
      )}

      {showCloseCash && (
        <CerrarCaja cashDrawer={cashDrawer} onClosed={() => { setShowCloseCash(false); onCashClosed(); }} />
      )}
    </div>
  );
}
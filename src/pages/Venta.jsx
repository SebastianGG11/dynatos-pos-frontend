import { useEffect, useMemo, useState } from "react";
import api from "../api/api";
import CerrarCaja from "./CerrarCaja";
import { FiShoppingCart, FiTrash2, FiPlus, FiMinus, FiCreditCard, FiDollarSign, FiX } from "react-icons/fi";

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

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    try {
      const [catRes, prodRes] = await Promise.all([api.get("/categories"), api.get("/products")]);
      setCategories(catRes.data?.items ?? []);
      setProducts(prodRes.data?.items ?? []);
    } catch { alert("Error cargando productos"); }
  };

  const categoryNameById = useMemo(() => {
    const map = new Map();
    categories.forEach(c => map.set(c.id, c.name ?? `Categoría ${c.id}`));
    return map;
  }, [categories]);

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

  const subtotal = cart.reduce((sum, i) => sum + Number(i.sale_price) * i.qty, 0);
  const promoDiscount = preview?.promo_discount_total ?? 0;
  const total = preview?.total ?? subtotal;

  const handlePrintAndClear = () => {
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
    if (received < total) { alert("Monto insuficiente"); return; }
    try {
      await api.post("/payments/cash", { sale_id: sale.id, amount: total });
      alert(`Venta exitosa. Cambio: $${(received - total).toLocaleString()}`);
      handlePrintAndClear();
    } catch { alert("Error en pago"); }
  };

  const confirmQRPayment = async () => {
    try {
      await api.post("/payments/qr", { sale_id: sale.id, amount: total, provider: "NEQUI" });
      handlePrintAndClear();
    } catch { alert("Error en pago"); }
  };

  return (
    <div style={{ display: "flex", height: "100vh", backgroundColor: "#000", overflow: "hidden" }}>
      
      {/* 🧾 TIRILLA DE VENTA (SOLO IMPRESIÓN) */}
      <div id="print-section" style={{ display: "none" }}>
        <div style={{ width: "80mm", padding: "10px", color: "#000", fontFamily: "monospace" }}>
          <center>
            <h2 style={{ margin: 0 }}>DYNATOS</h2>
            <p style={{ fontSize: "12px" }}>MARKET & LICORERÍA</p>
          </center>
          <hr />
          <p>FECHA: {new Date().toLocaleString()}</p>
          <p>CAJA: {cashDrawer.id}</p>
          <hr />
          {cart.map(i => (
            <div key={i.id} style={{ display: "flex", justifyContent: "space-between" }}>
              <span>{i.qty} x {i.name.substring(0,15)}</span>
              <span>${(i.qty * i.sale_price).toLocaleString()}</span>
            </div>
          ))}
          <hr />
          <div style={{ textAlign: "right", fontWeight: "bold", fontSize: "16px" }}>
            TOTAL: ${total.toLocaleString()}
          </div>
          <center style={{ marginTop: "20px", fontSize: "10px" }}>Gracias por su compra</center>
        </div>
      </div>

      <style>{`
        @media print {
          body * { display: none !important; }
          #print-section, #print-section * { display: block !important; }
          #print-section { position: absolute; left: 0; top: 0; width: 100%; }
        }
      `}</style>

      {/* 1. SIDEBAR CATEGORÍAS (Fijo) */}
      <div style={{ width: "200px", borderRight: "1px solid #D4AF37", padding: "20px", display: "flex", flexDirection: "column" }}>
        <h3 style={{ color: "#D4AF37", fontSize: "0.8rem", marginBottom: "20px" }}>CATEGORÍAS</h3>
        <div style={{ flex: 1, overflowY: "auto" }}>
          <button onClick={() => setSelectedCategory("ALL")} style={{ width: "100%", padding: "10px", marginBottom: "10px", borderRadius: "8px", border: "1px solid #333", color: selectedCategory === "ALL" ? "#000" : "#fff", backgroundColor: selectedCategory === "ALL" ? "#D4AF37" : "transparent", fontWeight: "bold" }}>TODAS</button>
          {categories.map(c => (
            <button key={c.id} onClick={() => setSelectedCategory(c.id)} style={{ width: "100%", padding: "10px", marginBottom: "10px", borderRadius: "8px", border: "1px solid #333", color: selectedCategory === c.id ? "#000" : "#fff", backgroundColor: selectedCategory === c.id ? "#D4AF37" : "transparent" }}>{c.name.toUpperCase()}</button>
          ))}
        </div>
        <button onClick={() => setShowCloseCash(true)} style={{ padding: "12px", background: "#f44", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>CERRAR CAJA</button>
      </div>

      {/* 2. GRILLA PRODUCTOS (Scroll independiente) */}
      <div style={{ flex: 1, padding: "30px", overflowY: "auto" }}>
        <h1 style={{ color: "#D4AF37", fontFamily: "serif", marginBottom: "30px", letterSpacing: "2px" }}>PRODUCTOS</h1>
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

      {/* 3. CARRITO Y PAGO (Fijo, sin scroll externo) */}
      <div style={{ width: "350px", borderLeft: "1px solid #222", display: "flex", flexDirection: "column", backgroundColor: "#111" }}>
        <div style={{ padding: "20px", borderBottom: "1px solid #222" }}>
          <h2 style={{ color: "#D4AF37", display: "flex", alignItems: "center", gap: "10px" }}><FiShoppingCart /> CARRITO</h2>
        </div>

        {/* Lista de productos con scroll interno */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px" }}>
          {cart.map(i => (
            <div key={i.id} style={{ display: "flex", justifyContent: "space-between", marginBottom: "15px", fontSize: "0.9rem" }}>
              <div style={{ flex: 1 }}>{i.name}</div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", margin: "0 10px" }}>
                <button onClick={() => decreaseQty(i.id)} style={{ background: "#222", border: "none", color: "#fff", borderRadius: "4px", width: "24px" }}>-</button>
                <span>{i.qty}</span>
                <button onClick={() => increaseQty(i.id)} style={{ background: "#222", border: "none", color: "#fff", borderRadius: "4px", width: "24px" }}>+</button>
              </div>
              <div style={{ fontWeight: "bold" }}>${(i.qty * i.sale_price).toLocaleString()}</div>
            </div>
          ))}
        </div>

        {/* ÁREA DE PAGO FIJA (Siempre visible) */}
        <div style={{ padding: "20px", backgroundColor: "#161616", borderTop: "2px solid #D4AF37" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px", color: "#888" }}><span>SUBTOTAL</span><span>${subtotal.toLocaleString()}</span></div>
          {promoDiscount > 0 && <div style={{ display: "flex", justifyContent: "space-between", color: "#5c5" }}><span>DESCUENTO</span><span>-${promoDiscount.toLocaleString()}</span></div>}
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "1.4rem", fontWeight: "bold", color: "#D4AF37", margin: "10px 0" }}><span>TOTAL</span><span>${total.toLocaleString()}</span></div>

          {!sale ? (
            <button onClick={createSale} disabled={cart.length === 0} style={{ width: "100%", padding: "15px", background: "#D4AF37", border: "none", borderRadius: "10px", fontWeight: "bold", cursor: "pointer" }}>REGISTRAR VENTA</button>
          ) : (
            <div>
              <input type="number" placeholder="DINERO RECIBIDO" value={cashReceived} onChange={e => setCashReceived(e.target.value)} style={{ width: "100%", padding: "12px", background: "#000", border: "1px solid #D4AF37", color: "#fff", borderRadius: "8px", textAlign: "center", fontSize: "1.2rem", marginBottom: "10px" }} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <button onClick={payCash} style={{ padding: "12px", background: "#D4AF37", color: "#000", border: "none", borderRadius: "8px", fontWeight: "bold" }}><FiDollarSign /> EFECTIVO</button>
                <button onClick={() => setShowQRConfirm(true)} style={{ padding: "12px", border: "1px solid #5c5", color: "#5c5", background: "none", borderRadius: "8px", fontWeight: "bold" }}><FiCreditCard /> QR</button>
              </div>
              <button onClick={() => setSale(null)} style={{ width: "100%", marginTop: "10px", color: "#666", fontSize: "0.8rem", background: "none", border: "none", cursor: "pointer" }}>Cancelar Pago</button>
            </div>
          )}
          <button onClick={clearCart} style={{ width: "100%", marginTop: "15px", color: "#f55", background: "none", border: "none", fontSize: "0.8rem", cursor: "pointer" }}>Limpiar Carrito</button>
        </div>
      </div>

      {showQRConfirm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ background: "#111", padding: "30px", borderRadius: "20px", border: "1px solid #D4AF37", textAlign: "center" }}>
            <p style={{ color: "#fff", marginBottom: "20px" }}>¿Confirmas el pago por Transferencia/QR?</p>
            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={() => setShowQRConfirm(false)} style={{ flex: 1, padding: "10px", background: "#333", color: "#fff", border: "none", borderRadius: "8px" }}>NO</button>
              <button onClick={confirmQRPayment} style={{ flex: 1, padding: "10px", background: "#D4AF37", border: "none", borderRadius: "8px", fontWeight: "bold" }}>SÍ, PAGADO</button>
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
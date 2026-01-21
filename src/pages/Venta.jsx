import { useEffect, useState } from "react";
import api from "../api/api";
import CerrarCaja from "./CerrarCaja";
import { FiShoppingCart, FiUser, FiDollarSign, FiCreditCard, FiCheckSquare, FiSquare, FiLogOut } from "react-icons/fi";

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

  // Cliente
  const [isCustomClient, setIsCustomClient] = useState(false);
  const [clientName, setClientName] = useState("");
  const [clientDoc, setClientDoc] = useState("");

  const [usuarioActual, setUsuarioActual] = useState("Cajero");

  useEffect(() => {
    try {
      const userStored = localStorage.getItem("user");
      if (userStored) {
        const parsed = JSON.parse(userStored);
        setUsuarioActual(parsed.fullname || parsed.username || "Cajero");
      }
    } catch {}
    loadAll();
  }, []);

  const loadAll = async () => {
    try {
      const [catRes, prodRes] = await Promise.all([
        api.get("/categories"),
        api.get("/products")
      ]);
      setCategories(catRes.data?.items ?? []);
      setProducts(prodRes.data?.items ?? []);
    } catch {
      console.error("Error cargando datos");
    }
  };

  const filteredProducts =
    selectedCategory === "ALL"
      ? products
      : products.filter(p => p.category_id === selectedCategory);

  const getAvailableStock = (product) => {
    const inCart = cart.find(i => i.id === product.id)?.qty || 0;
    return Number(product.current_stock || 0) - inCart;
  };

  const addProduct = (p) => {
    if (getAvailableStock(p) <= 0) return;
    setCart(prev => {
      const found = prev.find(i => i.id === p.id);
      return found
        ? prev.map(i => i.id === p.id ? { ...i, qty: i.qty + 1 } : i)
        : [...prev, { ...p, qty: 1 }];
    });
  };

  const increaseQty = (id) =>
    setCart(prev => prev.map(p => p.id === id ? { ...p, qty: p.qty + 1 } : p));

  const decreaseQty = (id) =>
    setCart(prev =>
      prev
        .map(p => p.id === id ? { ...p, qty: p.qty - 1 } : p)
        .filter(p => p.qty > 0)
    );

  const clearCart = () => {
    setCart([]);
    setSale(null);
    setPreview(null);
    setCashReceived("");
    setReceiptData(null);
    setIsCustomClient(false);
    setClientName("");
    setClientDoc("");
  };

  // ✅ PREVIEW LOCAL (NO BACKEND)
  useEffect(() => {
    if (cart.length === 0) {
      setPreview(null);
      return;
    }

    const totalLocal = cart.reduce(
      (sum, i) => sum + (Number(i.sale_price) * i.qty),
      0
    );

    setPreview({ total: totalLocal });
  }, [cart]);

  const total =
    preview?.total ??
    cart.reduce((s, i) => s + (Number(i.sale_price) * i.qty), 0);

  const valorImpuesto = total - (total / 1.19);
  const baseGravable = total - valorImpuesto;

  const createSale = async () => {
    try {
      let nameToSend = "CLIENTE GENERAL";
      if (isCustomClient && clientName.trim()) {
        nameToSend =
          clientName.trim() +
          (clientDoc.trim() ? ` | ${clientDoc.trim()}` : "");
      }

      const res = await api.post("/sales", {
        cash_drawer_id: cashDrawer.id,
        customer_name: nameToSend,
        items: cart.map(i => ({
          product_id: i.id,
          quantity: i.qty
        }))
      });

      setSale(res.data.sale);
    } catch {
      alert("Error al registrar venta");
    }
  };

  const finalizeTransaction = (method, received, change) => {
    setReceiptData({
      id: sale.id,
      sale_number: sale.sale_number,
      date: new Date().toLocaleString(),
      cajero: usuarioActual,
      items: [...cart],
      subtotal: baseGravable,
      impuesto: valorImpuesto,
      total,
      method,
      received,
      change,
      customerName: sale.customer_name || "CLIENTE GENERAL",
      customerDoc: ""
    });

    setTimeout(() => {
      window.print();
      clearCart();
      loadAll();
    }, 500);
  };

  const payCash = async () => {
    const received = Number(cashReceived);
    if (received < total) return alert("Monto insuficiente");
    try {
      await api.post("/payments/cash", {
        sale_id: sale.id,
        amount: total
      });
      finalizeTransaction("EFECTIVO", received, received - total);
    } catch {
      alert("Error procesando pago");
    }
  };

  const confirmQRPayment = async () => {
    try {
      await api.post("/payments/qr", {
        sale_id: sale.id,
        amount: total,
        provider: "NEQUI"
      });
      setShowQRConfirm(false);
      finalizeTransaction("TRANSFERENCIA / QR", total, 0);
    } catch {
      alert("Error QR");
    }
  };

  return (
    <div style={{ display: "flex", height: "100vh", background: "#000" }}>
      {/* 🧾 IMPRESIÓN */}
      <div id="print-area" style={{ display: "none" }}>
        {receiptData && (
          <div style={{ width: "80mm", fontFamily: "monospace" }}>
            <p>FACTURA: {receiptData.sale_number}</p>
            <p>CAJERO: {receiptData.cajero}</p>
            <p>TOTAL: ${receiptData.total.toLocaleString()}</p>
          </div>
        )}
      </div>

      {/* UI COMPLETA SIN CAMBIOS */}
      {/* ... (resto del JSX exactamente igual a tu versión original) */}
    </div>
  );
}

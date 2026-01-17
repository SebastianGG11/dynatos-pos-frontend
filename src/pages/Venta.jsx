import { useEffect, useMemo, useState } from "react";
import api from "../api/api";
import CerrarCaja from "./CerrarCaja";

export default function Venta({ cashDrawer, onCashClosed }) {
  // ===== DATA =====
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("ALL");

  // ===== SALE =====
  const [cart, setCart] = useState([]);
  const [sale, setSale] = useState(null);

  // 🔹 PREVIEW PROMOS
  const [preview, setPreview] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  // ===== PAYMENTS =====
  const [cashReceived, setCashReceived] = useState("");
  const [showQRConfirm, setShowQRConfirm] = useState(false);

  // ===== CLOSE CASH =====
  const [showCloseCash, setShowCloseCash] = useState(false);

  // =========================
  // LOAD INITIAL DATA
  // =========================
  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    try {
      const catRes = await api.get("/categories");
      setCategories(catRes.data?.items ?? []);

      const prodRes = await api.get("/products");
      setProducts(prodRes.data?.items ?? []);
    } catch {
      alert("Error cargando productos o categorías");
    }
  };

  // =========================
  // CATEGORY MAP
  // =========================
  const categoryNameById = useMemo(() => {
    const map = new Map();
    for (const c of categories) {
      map.set(c.id, c.name ?? `Categoría ${c.id}`);
    }
    return map;
  }, [categories]);

  // =========================
  // FILTER PRODUCTS
  // =========================
  const filteredProducts =
    selectedCategory === "ALL"
      ? products
      : products.filter((p) => p.category_id === selectedCategory);

  // =========================
  // STOCK HELPERS
  // =========================
  const qtyInCartByProductId = useMemo(() => {
    const map = new Map();
    for (const item of cart) map.set(item.id, item.qty);
    return map;
  }, [cart]);

  const getAvailableStock = (product) => {
    const inCart = qtyInCartByProductId.get(product.id) || 0;
    return Number(product.current_stock) - inCart;
  };

  // =========================
  // CART ACTIONS
  // =========================
  const addProduct = (product) => {
    if (getAvailableStock(product) <= 0) {
      alert("No hay stock disponible");
      return;
    }

    setCart((prev) => {
      const found = prev.find((p) => p.id === product.id);
      if (found) {
        return prev.map((p) =>
          p.id === product.id ? { ...p, qty: p.qty + 1 } : p
        );
      }
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const increaseQty = (id) => {
    setCart((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, qty: p.qty + 1 } : p
      )
    );
  };

  const decreaseQty = (id) => {
    setCart((prev) =>
      prev
        .map((p) =>
          p.id === id ? { ...p, qty: p.qty - 1 } : p
        )
        .filter((p) => p.qty > 0)
    );
  };

  const clearCart = () => {
    setCart([]);
    setSale(null);
    setPreview(null);
    setCashReceived("");
  };

  // =========================
  // PREVIEW PROMOTIONS
  // =========================
  useEffect(() => {
    if (cart.length === 0) {
      setPreview(null);
      return;
    }

    const fetchPreview = async () => {
      setLoadingPreview(true);
      try {
        const res = await api.post("/sales", {
          cash_drawer_id: cashDrawer.id,
          customer_name: "PREVIEW",
          customer_document: "0",
          items: cart.map((i) => ({
            product_id: i.id,
            quantity: i.qty,
          })),
          preview: true,
        });
        setPreview(res.data.sale);
      } catch {
        setPreview(null);
      } finally {
        setLoadingPreview(false);
      }
    };

    fetchPreview();
  }, [cart, cashDrawer.id]);

  // =========================
  // TOTALS
  // =========================
  const subtotal = cart.reduce(
    (sum, i) => sum + Number(i.sale_price) * i.qty,
    0
  );

  const promoDiscount = preview?.promo_discount_total ?? 0;
  const total = preview?.total ?? subtotal;

  // =========================
  // CREATE SALE
  // =========================
  const createSale = async () => {
    if (cart.length === 0) return;

    try {
      const res = await api.post("/sales", {
        cash_drawer_id: cashDrawer.id,
        customer_name: "Cliente mostrador",
        customer_document: "0",
        items: cart.map((i) => ({
          product_id: i.id,
          quantity: i.qty,
        })),
      });

      setSale(res.data.sale);
    } catch {
      alert("Error creando la venta");
    }
  };

  // =========================
  // PAY CASH
  // =========================
  const payCash = async () => {
    const received = Number(cashReceived);
    if (Number.isNaN(received) || received < total) {
      alert("Monto inválido");
      return;
    }

    try {
      await api.post("/payments/cash", {
        sale_id: sale.id,
        amount: total,
      });

      alert(`Cambio: $${(received - total).toLocaleString("es-CO")}`);
      clearCart();
      await loadAll();
    } catch {
      alert("Error en pago efectivo");
    }
  };

  // =========================
  // PAY QR
  // =========================
  const confirmQRPayment = async () => {
    try {
      await api.post("/payments/qr", {
        sale_id: sale.id,
        amount: total,
        provider: "NEQUI",
      });

      alert("Pago confirmado");
      clearCart();
      await loadAll();
    } catch {
      alert("Error en pago QR");
    }
  };

  // =========================
  // UI
  // =========================
  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* CATEGORIES */}
      <div className="w-1/4 p-4 bg-white border-r">
        <h2 className="font-semibold mb-3">Categorías</h2>

        <button
          onClick={() => setSelectedCategory("ALL")}
          className={`w-full mb-2 px-3 py-2 rounded ${
            selectedCategory === "ALL" ? "bg-black text-white" : "bg-gray-100"
          }`}
        >
          Todas
        </button>

        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelectedCategory(c.id)}
            className={`w-full mb-2 px-3 py-2 rounded ${
              selectedCategory === c.id ? "bg-black text-white" : "bg-gray-100"
            }`}
          >
            {categoryNameById.get(c.id)}
          </button>
        ))}

        <button
          className="mt-4 w-full bg-red-600 text-white py-2 rounded"
          onClick={() => setShowCloseCash(true)}
        >
          Cerrar caja
        </button>
      </div>

      {/* PRODUCTS */}
      <div className="w-2/4 p-6">
        <h1 className="text-xl font-semibold mb-4">Productos</h1>

        <div className="grid grid-cols-2 gap-4">
          {filteredProducts.map((p) => (
            <button
              key={p.id}
              onClick={() => addProduct(p)}
              disabled={getAvailableStock(p) <= 0}
              className="bg-white p-4 rounded shadow text-left"
            >
              <div className="font-semibold">{p.name}</div>
              <div>${Number(p.sale_price).toLocaleString("es-CO")}</div>
              <div className="text-xs text-gray-400">
                Stock: {getAvailableStock(p)}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* SALE */}
      <div className="w-1/4 bg-white p-6 border-l">
        <h2 className="font-semibold mb-4">Venta</h2>

        {cart.map((i) => (
          <div key={i.id} className="flex items-center justify-between mb-2">
            <span className="flex-1">{i.name}</span>

            <button onClick={() => decreaseQty(i.id)}>−</button>
            <span className="mx-2">{i.qty}</span>
            <button onClick={() => increaseQty(i.id)}>+</button>

            <span className="ml-3">
              ${(Number(i.sale_price) * i.qty).toLocaleString("es-CO")}
            </span>
          </div>
        ))}

        <div className="mt-4 text-sm">
          <div>Subtotal: ${subtotal.toLocaleString("es-CO")}</div>
          {promoDiscount > 0 && (
            <div className="text-green-700">
              Descuento promociones: -$
              {promoDiscount.toLocaleString("es-CO")}
            </div>
          )}
          <div className="font-bold mt-1">
            Total: ${total.toLocaleString("es-CO")}
          </div>
        </div>

        <button
          className="mt-2 w-full bg-red-500 text-white py-2 rounded"
          onClick={clearCart}
        >
          Limpiar carrito
        </button>

        {!sale && (
          <button
            className="mt-2 w-full bg-black text-white py-2 rounded"
            onClick={createSale}
            disabled={loadingPreview}
          >
            Registrar venta
          </button>
        )}

        {sale && (
          <>
            <input
              type="number"
              placeholder="Monto recibido"
              className="w-full border p-2 mt-3"
              value={cashReceived}
              onChange={(e) => setCashReceived(e.target.value)}
            />

            <button
              className="mt-2 w-full bg-black text-white py-2 rounded"
              onClick={payCash}
            >
              Pagar efectivo
            </button>

            <button
              className="mt-2 w-full bg-green-600 text-white py-2 rounded"
              onClick={() => setShowQRConfirm(true)}
            >
              Pago QR / Transferencia
            </button>
          </>
        )}
      </div>

      {showQRConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white p-6 rounded w-80">
            <p className="mb-4">¿Pago confirmado?</p>
            <div className="flex gap-2">
              <button
                className="flex-1 bg-gray-300 py-2 rounded"
                onClick={() => setShowQRConfirm(false)}
              >
                No
              </button>
              <button
                className="flex-1 bg-black text-white py-2 rounded"
                onClick={confirmQRPayment}
              >
                Sí
              </button>
            </div>
          </div>
        </div>
      )}

      {showCloseCash && (
        <CerrarCaja
          cashDrawer={cashDrawer}
          onClosed={() => {
            setShowCloseCash(false);
            onCashClosed();
          }}
        />
      )}
    </div>
  );
}

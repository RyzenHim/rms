import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { FiClock, FiCreditCard, FiGrid, FiMinus, FiPlus, FiSearch, FiShoppingCart, FiTrash2 } from "react-icons/fi";
import menuService from "../../services/menu_Service";
import themeService from "../../services/theme_Service";
import orderService from "../../services/order_Service";
import PublicMenuSections from "../../components/menu/PublicMenuSections";
import useResolvedColorMode from "../../hooks/useResolvedColorMode";
import { useAuth } from "../../context/AuthContext";

const Customer_Menu = () => {
  const { token, user } = useAuth();
  const [searchParams] = useSearchParams();
  const [theme, setTheme] = useState({
    name: "Feane Restaurant",
    menuHeading: "Order Tray",
    menuSubHeading: "Build your plate and place your table order.",
    primaryColor: "#ff8c3a",
    secondaryColor: "#ffd700",
    colorMode: "system",
    allowUserThemeToggle: true,
  });
  const [menuData, setMenuData] = useState({ categories: [], subCategories: [], items: [] });
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [subCategoryFilter, setSubCategoryFilter] = useState("");
  const [foodTypeFilter, setFoodTypeFilter] = useState("");
  const [sortBy, setSortBy] = useState("featured");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [checkout, setCheckout] = useState({
    tableNumber: searchParams.get("table") || "",
    qrToken: searchParams.get("qrToken") || "",
    customerName: user?.name || "",
    customerEmail: user?.email || "",
    customerPhone: "",
    notes: "",
  });
  const [cart, setCart] = useState([]);
  const { palette } = useResolvedColorMode(theme);
  const statusMeta = {
    placed: { bg: "bg-slate-100", text: "text-slate-700", label: "Placed" },
    received: { bg: "bg-blue-100", text: "text-blue-800", label: "Received" },
    preparing: { bg: "bg-amber-100", text: "text-amber-800", label: "Preparing" },
    done_preparing: { bg: "bg-emerald-100", text: "text-emerald-800", label: "Ready To Serve" },
    served: { bg: "bg-green-100", text: "text-green-800", label: "Served" },
    cancelled: { bg: "bg-rose-100", text: "text-rose-700", label: "Cancelled" },
  };

  const loadData = async () => {
    try {
      const [themeRes, menuRes, ordersRes] = await Promise.all([
        themeService.getActiveTheme(),
        menuService.getPublicMenu(),
        orderService.getOrders(token),
      ]);
      setTheme((prev) => ({ ...prev, ...themeRes.theme }));
      setMenuData({
        categories: menuRes.categories || [],
        subCategories: menuRes.subCategories || [],
        items: menuRes.items || [],
      });
      setOrders(ordersRes.orders || []);
    } catch (err) {
      setMessage(err?.response?.data?.message || "Failed to load customer menu");
    }
  };

  useEffect(() => {
    loadData();
    const timer = setInterval(loadData, 12000);
    return () => clearInterval(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const subCategoryOptions = useMemo(() => {
    if (!categoryFilter) return menuData.subCategories;
    return menuData.subCategories.filter((sub) => (sub.category?._id || sub.category) === categoryFilter);
  }, [menuData.subCategories, categoryFilter]);

  const cartTotals = useMemo(() => {
    const subTotal = cart.reduce((sum, item) => sum + Number(item.unitPrice || 0) * Number(item.quantity || 0), 0);
    const tax = Number((subTotal * 0.05).toFixed(2));
    const grandTotal = Number((subTotal + tax).toFixed(2));
    return { subTotal, tax, grandTotal };
  }, [cart]);

  const addToCart = (item) => {
    setCart((prev) => {
      const found = prev.find((x) => x.menuItem === item._id);
      if (found) {
        return prev.map((x) => (x.menuItem === item._id ? { ...x, quantity: x.quantity + 1 } : x));
      }
      return [
        ...prev,
        {
          menuItem: item._id,
          name: item.name,
          unitPrice: Number(item.price || 0),
          quantity: 1,
          notes: "",
          image: item.image,
        },
      ];
    });
  };

  const updateCartItem = (menuItem, patch) => {
    setCart((prev) => prev.map((item) => (item.menuItem === menuItem ? { ...item, ...patch } : item)));
  };

  const removeCartItem = (menuItem) => {
    setCart((prev) => prev.filter((item) => item.menuItem !== menuItem));
  };

  const checkoutOrder = async () => {
    setSubmitting(true);
    setMessage("");
    try {
      if (!checkout.tableNumber) {
        setMessage("Please enter table number");
        return;
      }
      if (!cart.length) {
        setMessage("Please add at least one item to your order tray");
        return;
      }

      await orderService.createOrder(token, {
        tableNumber: checkout.tableNumber,
        qrToken: checkout.qrToken,
        customerName: checkout.customerName,
        customerEmail: checkout.customerEmail,
        customerPhone: checkout.customerPhone,
        notes: checkout.notes,
        items: cart.map((item) => ({
          menuItem: item.menuItem,
          quantity: Number(item.quantity),
          notes: item.notes || "",
        })),
      });

      setCart([]);
      setCheckout((prev) => ({ ...prev, notes: "" }));
      setMessage("Order placed successfully. Track status below.");
      await loadData();
    } catch (err) {
      setMessage(err?.response?.data?.message || "Checkout failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen pb-10" style={{ backgroundColor: palette.pageBg, color: palette.text }}>
      <section
        className="mx-auto max-w-7xl rounded-b-[2rem] px-4 py-8 text-white md:px-8"
        style={{ background: `linear-gradient(120deg, ${theme.primaryColor} 0%, #0f172a 100%)` }}
      >
        <div className="space-y-3">
          <h1 className="heading-1 text-white">{theme.menuHeading}</h1>
          <p className="text-lg text-white/85">{theme.menuSubHeading}</p>
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-sm text-white/85">
            <FiGrid className="h-4 w-4" />
            {checkout.tableNumber ? `Table ${checkout.tableNumber} selected` : "No table selected yet"}
          </div>
        </div>
      </section>

      <section className="mx-auto mt-6 w-full max-w-[96rem] px-4 md:px-8">
        <div className="card-elevated space-y-4 p-6" style={{ backgroundColor: palette.panelBg }}>
          <div className="grid gap-3 md:grid-cols-5">
            <div className="relative">
              <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: palette.muted }} />
              <input
                type="text"
                placeholder="Search menu items"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-base pl-10"
                style={{ borderColor: palette.border, backgroundColor: palette.cardBg, color: palette.text }}
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setSubCategoryFilter("");
              }}
              className="input-base"
              style={{ borderColor: palette.border, backgroundColor: palette.cardBg, color: palette.text }}
            >
              <option value="">All Categories</option>
              {menuData.categories.map((category) => <option key={category._id} value={category._id}>{category.name}</option>)}
            </select>
            <select
              value={subCategoryFilter}
              onChange={(e) => setSubCategoryFilter(e.target.value)}
              className="input-base"
              style={{ borderColor: palette.border, backgroundColor: palette.cardBg, color: palette.text }}
            >
              <option value="">All Subcategories</option>
              {subCategoryOptions.map((subCategory) => <option key={subCategory._id} value={subCategory._id}>{subCategory.name}</option>)}
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="input-base"
              style={{ borderColor: palette.border, backgroundColor: palette.cardBg, color: palette.text }}
            >
              <option value="featured">Featured</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="newest">Newest</option>
            </select>
            <div className="flex rounded-xl border gap-1 p-1" style={{ borderColor: palette.border, backgroundColor: palette.cardBg }}>
              <button onClick={() => setFoodTypeFilter("")} className={`flex-1 rounded-lg px-2 py-2 text-xs font-bold transition-all ${foodTypeFilter === "" ? "text-white shadow-md" : ""}`} style={{ backgroundColor: foodTypeFilter === "" ? theme.primaryColor : "transparent", color: foodTypeFilter === "" ? "#fff" : palette.text }}>All</button>
              <button onClick={() => setFoodTypeFilter("veg")} className={`flex-1 rounded-lg px-2 py-2 text-xs font-bold transition-all ${foodTypeFilter === "veg" ? "text-white shadow-md" : ""}`} style={{ backgroundColor: foodTypeFilter === "veg" ? "#16a34a" : "transparent", color: foodTypeFilter === "veg" ? "#fff" : palette.text }}>Veg</button>
              <button onClick={() => setFoodTypeFilter("non_veg")} className={`flex-1 rounded-lg px-2 py-2 text-xs font-bold transition-all ${foodTypeFilter === "non_veg" ? "text-white shadow-md" : ""}`} style={{ backgroundColor: foodTypeFilter === "non_veg" ? "#dc2626" : "transparent", color: foodTypeFilter === "non_veg" ? "#fff" : palette.text }}>Non-Veg</button>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto mt-6 grid w-full max-w-[96rem] gap-6 px-4 md:px-8 xl:grid-cols-[1fr_380px]">
        <div>
          <PublicMenuSections
            categories={menuData.categories}
            subCategories={menuData.subCategories}
            items={menuData.items}
            primaryColor={theme.primaryColor}
            isCustomerView
            search={search}
            selectedCategory={categoryFilter}
            selectedSubCategory={subCategoryFilter}
            selectedFoodType={foodTypeFilter}
            sortBy={sortBy}
            palette={palette}
            onAddToCart={addToCart}
          />
        </div>

        <aside className="space-y-4 xl:sticky xl:top-24 xl:h-fit">
          <section className="card-elevated overflow-hidden p-0" style={{ backgroundColor: palette.panelBg }}>
            <div className="bg-gradient-to-r p-5" style={{ background: `linear-gradient(135deg, ${theme.primaryColor} 0%, #10b981 100%)` }}>
              <h3 className="inline-flex items-center gap-2 heading-4 text-white"><FiShoppingCart className="h-5 w-5" />Order Tray ({cart.length})</h3>
            </div>
            <div className="max-h-[280px] space-y-2 overflow-auto p-5">
              {cart.map((item) => (
                <div key={item.menuItem} className="card-base space-y-3 border-l-4 p-4" style={{ borderColor: theme.primaryColor }}>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-bold" style={{ color: palette.text }}>{item.name}</p>
                      <p className="text-xs font-semibold" style={{ color: theme.primaryColor }}>Rs {Number(item.unitPrice).toFixed(2)} each</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 rounded-lg p-1" style={{ backgroundColor: palette.pageBg }}>
                      <button onClick={() => updateCartItem(item.menuItem, { quantity: Math.max(1, item.quantity - 1) })} className="btn-icon text-sm"><FiMinus className="h-3.5 w-3.5" /></button>
                      <span className="w-6 text-center font-bold">{item.quantity}</span>
                      <button onClick={() => updateCartItem(item.menuItem, { quantity: item.quantity + 1 })} className="btn-icon text-sm"><FiPlus className="h-3.5 w-3.5" /></button>
                    </div>
                    <button onClick={() => removeCartItem(item.menuItem)} className="inline-flex items-center gap-1 rounded-lg bg-red-600 px-2 py-1 text-xs font-semibold text-white hover:bg-red-700">
                      <FiTrash2 className="h-3 w-3" />Remove
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="Special request"
                    value={item.notes}
                    onChange={(e) => updateCartItem(item.menuItem, { notes: e.target.value })}
                    className="input-base w-full text-xs"
                  />
                </div>
              ))}
              {!cart.length ? <p className="py-8 text-center text-sm" style={{ color: palette.muted }}>Order tray is empty. Add items from menu.</p> : null}
            </div>

            <div className="space-y-2 border-t p-5" style={{ borderColor: palette.border, backgroundColor: palette.cardBg }}>
              <div className="flex justify-between text-sm">
                <span style={{ color: palette.muted }}>Subtotal:</span>
                <span className="font-semibold">Rs {cartTotals.subTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ color: palette.muted }}>Tax (5%):</span>
                <span className="font-semibold">Rs {cartTotals.tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t pt-2 text-base" style={{ borderColor: palette.border }}>
                <span className="font-bold">Total:</span>
                <span className="heading-4" style={{ color: theme.primaryColor }}>Rs {cartTotals.grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </section>

          <section className="card-elevated space-y-4 p-5" style={{ backgroundColor: palette.panelBg }}>
            <h3 className="inline-flex items-center gap-2 heading-4" style={{ color: palette.text }}><FiCreditCard className="h-5 w-5" />Checkout</h3>
            <div className="form-group">
              <label className="form-label">Table Number *</label>
              <input
                type="text"
                placeholder="e.g., T01"
                value={checkout.tableNumber}
                onChange={(e) => setCheckout((prev) => ({ ...prev, tableNumber: e.target.value }))}
                className="input-base"
                readOnly={Boolean(checkout.qrToken)}
              />
              {checkout.qrToken ? (
                <p className="text-xs text-emerald-700 mt-1">Table locked by scanned QR token.</p>
              ) : null}
            </div>
            <div className="form-group">
              <label className="form-label">Your Name *</label>
              <input type="text" value={checkout.customerName} onChange={(e) => setCheckout((prev) => ({ ...prev, customerName: e.target.value }))} className="input-base" />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input type="email" value={checkout.customerEmail} onChange={(e) => setCheckout((prev) => ({ ...prev, customerEmail: e.target.value }))} className="input-base" />
            </div>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input type="tel" value={checkout.customerPhone} onChange={(e) => setCheckout((prev) => ({ ...prev, customerPhone: e.target.value }))} className="input-base" />
            </div>
            <div className="form-group">
              <label className="form-label">Special Requests</label>
              <textarea placeholder="Less spicy, no onions, extra sauce" value={checkout.notes} onChange={(e) => setCheckout((prev) => ({ ...prev, notes: e.target.value }))} className="input-base" rows={2} />
            </div>
            {message && <div className={message.includes("successfully") ? "alert-success" : "alert-error"}>{message}</div>}
            <button onClick={checkoutOrder} disabled={submitting} className="btn-primary w-full">
              {submitting ? "Placing order..." : "Checkout and Place Order"}
            </button>
          </section>

          <section className="card-elevated space-y-4 p-5" style={{ backgroundColor: palette.panelBg }}>
            <div className="flex items-center justify-between">
              <h3 className="inline-flex items-center gap-2 heading-4" style={{ color: palette.text }}><FiClock className="h-5 w-5" />Live Orders ({orders.length})</h3>
            </div>
            <div className="max-h-[220px] space-y-2 overflow-auto">
              {orders.map((order) => {
                const colors = statusMeta[order.status] || statusMeta.placed;
                return (
                  <article key={order._id} className={`${colors.bg} space-y-1 rounded-lg p-3 text-xs`}>
                    <div className="flex items-start justify-between">
                      <p className="font-bold">{order.orderNumber}</p>
                      <span className={`${colors.text} rounded-full px-2 py-0.5 text-xs font-bold`}>{colors.label}</span>
                    </div>
                    <p className="text-slate-700">Table {order.tableNumber}</p>
                    <p className="line-clamp-1 text-slate-700">{order.items?.map((x) => `${x.name} x ${x.quantity}`).join(", ")}</p>
                  </article>
                );
              })}
              {!orders.length ? <p className="py-6 text-center text-sm" style={{ color: palette.muted }}>No orders placed yet</p> : null}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
};

export default Customer_Menu;

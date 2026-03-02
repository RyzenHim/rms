import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
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
    name: "Emerald Bistro",
    menuHeading: "Order Tray",
    menuSubHeading: "Build your plate and place your table order.",
    primaryColor: "#0b6b49",
    secondaryColor: "#ffd54f",
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
    customerName: user?.name || "",
    customerEmail: user?.email || "",
    customerPhone: "",
    notes: "",
  });
  const [cart, setCart] = useState([]);
  const { palette } = useResolvedColorMode(theme);

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
        className="mx-auto max-w-7xl rounded-b-[2rem] px-4 py-6 text-white md:px-8"
        style={{ background: `linear-gradient(120deg, ${theme.primaryColor} 0%, #0f172a 100%)` }}
      >
        <h1 className="text-3xl font-black">{theme.menuHeading}</h1>
        <p className="mt-1 text-sm text-white/85">{theme.menuSubHeading}</p>
        <p className="mt-2 text-sm text-white/80">
          QR table mode: {checkout.tableNumber ? `Table ${checkout.tableNumber}` : "No table selected"}
        </p>
      </section>

      <section className="mx-auto mt-6 max-w-7xl px-4 md:px-8">
        <div className="rounded-2xl p-4 shadow-sm" style={{ border: `1px solid ${palette.border}`, backgroundColor: palette.panelBg }}>
          <div className="grid gap-3 md:grid-cols-5">
            <input type="text" placeholder="Search menu..." value={search} onChange={(e) => setSearch(e.target.value)} className="rounded-xl border px-3 py-2 text-sm" style={{ borderColor: palette.border, backgroundColor: palette.cardBg, color: palette.text }} />
            <select value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setSubCategoryFilter(""); }} className="rounded-xl border px-3 py-2 text-sm" style={{ borderColor: palette.border, backgroundColor: palette.cardBg, color: palette.text }}>
              <option value="">All Categories</option>{menuData.categories.map((category) => <option key={category._id} value={category._id}>{category.name}</option>)}
            </select>
            <select value={subCategoryFilter} onChange={(e) => setSubCategoryFilter(e.target.value)} className="rounded-xl border px-3 py-2 text-sm" style={{ borderColor: palette.border, backgroundColor: palette.cardBg, color: palette.text }}>
              <option value="">All Sub-Categories</option>{subCategoryOptions.map((subCategory) => <option key={subCategory._id} value={subCategory._id}>{subCategory.name}</option>)}
            </select>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="rounded-xl border px-3 py-2 text-sm" style={{ borderColor: palette.border, backgroundColor: palette.cardBg, color: palette.text }}>
              <option value="featured">Featured First</option><option value="price-asc">Price: Low to High</option><option value="price-desc">Price: High to Low</option><option value="newest">Newest First</option>
            </select>
            <div className="flex rounded-xl border p-1" style={{ borderColor: palette.border, backgroundColor: palette.cardBg }}>
              <button onClick={() => setFoodTypeFilter("")} className={`flex-1 rounded-lg px-3 py-1.5 text-sm font-semibold ${foodTypeFilter === "" ? "text-white" : ""}`} style={{ backgroundColor: foodTypeFilter === "" ? theme.primaryColor : "transparent", color: foodTypeFilter === "" ? "#fff" : palette.text }}>All</button>
              <button onClick={() => setFoodTypeFilter("veg")} className={`flex-1 rounded-lg px-3 py-1.5 text-sm font-semibold ${foodTypeFilter === "veg" ? "text-white" : ""}`} style={{ backgroundColor: foodTypeFilter === "veg" ? "#16a34a" : "transparent", color: foodTypeFilter === "veg" ? "#fff" : palette.text }}>Veg</button>
              <button onClick={() => setFoodTypeFilter("non_veg")} className={`flex-1 rounded-lg px-3 py-1.5 text-sm font-semibold ${foodTypeFilter === "non_veg" ? "text-white" : ""}`} style={{ backgroundColor: foodTypeFilter === "non_veg" ? "#dc2626" : "transparent", color: foodTypeFilter === "non_veg" ? "#fff" : palette.text }}>Non-Veg</button>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto mt-6 grid max-w-7xl gap-6 px-4 md:px-8 lg:grid-cols-[1fr_360px]">
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

        <aside className="space-y-4">
          <section className="rounded-2xl border border-slate-200 bg-white p-4">
            <h3 className="text-xl font-black text-slate-900">Order Tray</h3>
            <div className="mt-3 space-y-2">
              {cart.map((item) => (
                <div key={item.menuItem} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="font-semibold text-slate-900">{item.name}</p>
                  <p className="text-xs text-slate-500">${Number(item.unitPrice).toFixed(2)} each</p>
                  <div className="mt-2 flex items-center gap-2">
                    <button onClick={() => updateCartItem(item.menuItem, { quantity: Math.max(1, item.quantity - 1) })} className="rounded border border-slate-300 px-2 py-1 text-xs">-</button>
                    <span className="text-sm font-semibold">{item.quantity}</span>
                    <button onClick={() => updateCartItem(item.menuItem, { quantity: item.quantity + 1 })} className="rounded border border-slate-300 px-2 py-1 text-xs">+</button>
                    <button onClick={() => removeCartItem(item.menuItem)} className="ml-auto rounded bg-red-600 px-2 py-1 text-xs text-white">Delete</button>
                  </div>
                  <input
                    type="text"
                    placeholder="Item note (spicy/less oil)"
                    value={item.notes}
                    onChange={(e) => updateCartItem(item.menuItem, { notes: e.target.value })}
                    className="mt-2 w-full rounded border border-slate-300 px-2 py-1 text-xs"
                  />
                </div>
              ))}
              {!cart.length ? <p className="text-sm text-slate-500">Order tray is empty.</p> : null}
            </div>

            <div className="mt-4 rounded-xl bg-slate-50 p-3 text-sm">
              <p>Subtotal: ${cartTotals.subTotal.toFixed(2)}</p>
              <p>Tax: ${cartTotals.tax.toFixed(2)}</p>
              <p className="mt-1 font-black">Total: ${cartTotals.grandTotal.toFixed(2)}</p>
            </div>

            <div className="mt-4 space-y-2">
              <input type="text" placeholder="Table Number" value={checkout.tableNumber} onChange={(e) => setCheckout((prev) => ({ ...prev, tableNumber: e.target.value }))} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" />
              <input type="text" placeholder="Customer Name" value={checkout.customerName} onChange={(e) => setCheckout((prev) => ({ ...prev, customerName: e.target.value }))} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" />
              <input type="email" placeholder="Customer Email" value={checkout.customerEmail} onChange={(e) => setCheckout((prev) => ({ ...prev, customerEmail: e.target.value }))} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" />
              <input type="text" placeholder="Customer Phone" value={checkout.customerPhone} onChange={(e) => setCheckout((prev) => ({ ...prev, customerPhone: e.target.value }))} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" />
              <textarea placeholder="Order notes" value={checkout.notes} onChange={(e) => setCheckout((prev) => ({ ...prev, notes: e.target.value }))} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" rows={2} />
            </div>
            <button onClick={checkoutOrder} disabled={submitting} className="mt-3 w-full rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
              {submitting ? "Placing..." : "Checkout & Place Order"}
            </button>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4">
            <h3 className="text-lg font-black text-slate-900">Order Progress</h3>
            {message ? <p className="mt-1 text-xs text-slate-600">{message}</p> : null}
            <div className="mt-3 max-h-[22rem] space-y-2 overflow-auto">
              {orders.map((order) => (
                <article key={order._id} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs">
                  <p className="font-bold text-slate-900">{order.orderNumber}</p>
                  <p>Table {order.tableNumber} | Status: {order.status}</p>
                  <p className="text-slate-600">{order.items?.map((x) => `${x.name} x${x.quantity}`).join(", ")}</p>
                </article>
              ))}
              {!orders.length ? <p className="text-sm text-slate-500">No orders yet.</p> : null}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
};

export default Customer_Menu;

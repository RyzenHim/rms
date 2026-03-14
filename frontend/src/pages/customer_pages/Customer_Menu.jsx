import { useEffect, useMemo, useState } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { FiClock, FiCreditCard, FiGlobe, FiHome, FiGrid, FiMinus, FiPlus, FiSearch, FiShoppingCart, FiTrash2, FiZap } from "react-icons/fi";
import menuService from "../../services/menu_Service";
import themeService from "../../services/theme_Service";
import orderService from "../../services/order_Service";
import authService from "../../services/auth_Service";
import api from "../../services/api";
import PublicMenuSections from "../../components/menu/PublicMenuSections";
import MenuItemQuickViewModal from "../../components/menu/MenuItemQuickViewModal";
import useResolvedColorMode from "../../hooks/useResolvedColorMode";
import useOrderTray from "../../hooks/useOrderTray";
import { useAuth } from "../../context/AuthContext";

const formatAddressForOrder = (address) => {
  if (!address) return "";
  return [
    address.street,
    address.area,
    address.landmark,
    address.city,
    address.state,
    address.pincode,
    address.country,
  ]
    .filter(Boolean)
    .join(", ");
};

const formatAddressLabel = (address) => {
  if (!address) return "";
  const tag = address.label === "other" ? address.customLabel || "Other" : address.label;
  return `${tag} - ${address.street || ""}, ${address.city || ""}`.replace(/,\s*$/, "");
};

const Customer_Menu = () => {
  const { token, user } = useAuth();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
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
  const [selectedItem, setSelectedItem] = useState(null);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [useSelectedAsDefault, setUseSelectedAsDefault] = useState(false);
  const [dineInTables, setDineInTables] = useState([]);
  const [checkout, setCheckout] = useState({
    tableNumber: searchParams.get("table") || "",
    qrToken: searchParams.get("qrToken") || "",
    deliveryAddress: "",
    customerName: user?.name || "",
    customerEmail: user?.email || "",
    customerPhone: "",
    notes: "",
  });
  const [orderMode] = useState(searchParams.get("qrToken") ? "dine_in" : "online");
  const { cart, setCart, clearCart, itemCount } = useOrderTray();
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
      const [themeRes, menuRes, ordersRes, addressesRes, tablesRes] = await Promise.all([
        themeService.getActiveTheme(),
        menuService.getPublicMenu(),
        orderService.getOrders(token),
        authService.getAddresses(token).catch(() => ({ addresses: [] })),
        api.get("/tables").catch(() => ({ data: { tables: [] } })),
      ]);
      setTheme((prev) => ({ ...prev, ...themeRes.theme }));
      setMenuData({
        categories: menuRes.categories || [],
        subCategories: menuRes.subCategories || [],
        items: menuRes.items || [],
      });
      setOrders(ordersRes.orders || []);

      const incomingAddresses = addressesRes.addresses || [];
      setSavedAddresses(incomingAddresses);
      setDineInTables((tablesRes.data?.tables || []).filter((t) => t.isActive && t.status !== "maintenance" && t.status !== "occupied"));

      const defaultAddress = incomingAddresses.find((addr) => addr.isDefault) || incomingAddresses[0] || null;
      setSelectedAddressId((prev) => prev || defaultAddress?.id || "");
      setCheckout((prev) => {
        const next = { ...prev };
        if (!next.customerPhone && defaultAddress?.phone) next.customerPhone = defaultAddress.phone;
        if (!next.customerName && defaultAddress?.fullName) next.customerName = defaultAddress.fullName;
        if (orderMode === "online" && !next.deliveryAddress && defaultAddress) {
          next.deliveryAddress = formatAddressForOrder(defaultAddress);
        }
        return next;
      });
    } catch (err) {
      setMessage(err?.response?.data?.message || "Failed to load customer menu");
    }
  };

  useEffect(() => {
    loadData();
    const timer = setInterval(loadData, 12000);
    return () => clearInterval(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (orderMode !== "online" || checkout.deliveryAddress) return;
    const selected = savedAddresses.find((addr) => addr.id === selectedAddressId);
    const fallback = selected || savedAddresses.find((addr) => addr.isDefault) || savedAddresses[0];
    if (!fallback) return;
    setSelectedAddressId((prev) => prev || fallback.id);
    setCheckout((prev) => ({
      ...prev,
      deliveryAddress: prev.deliveryAddress || formatAddressForOrder(fallback),
      customerName: prev.customerName || fallback.fullName || "",
      customerPhone: prev.customerPhone || fallback.phone || "",
    }));
  }, [orderMode, savedAddresses, selectedAddressId, checkout.deliveryAddress]);

  useEffect(() => {
    if (location.hash !== "#order-tray") return;
    const traySection = document.getElementById("order-tray");
    traySection?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [location.hash]);

  useEffect(() => {
    const categorySlug = searchParams.get("category");
    const subCategorySlug = searchParams.get("subCategory");
    const itemSlug = searchParams.get("item");

    if (categorySlug && menuData.categories.length) {
      const matchedCategory = menuData.categories.find((category) => category.slug === categorySlug);
      if (matchedCategory) setCategoryFilter(matchedCategory._id);
    }

    if (subCategorySlug && menuData.subCategories.length) {
      const matchedSubCategory = menuData.subCategories.find((subCategory) => subCategory.slug === subCategorySlug);
      if (matchedSubCategory) setSubCategoryFilter(matchedSubCategory._id);
    }

    if (itemSlug && menuData.items.length) {
      const matchedItem = menuData.items.find((item) => item.slug === itemSlug);
      if (matchedItem) setSelectedItem(matchedItem);
    }
  }, [searchParams, menuData.categories, menuData.subCategories, menuData.items]);

  const subCategoryOptions = useMemo(() => {
    if (!categoryFilter) return menuData.subCategories;
    return menuData.subCategories.filter((sub) => (sub.category?._id || sub.category) === categoryFilter);
  }, [menuData.subCategories, categoryFilter]);

  const selectedSavedAddress = useMemo(
    () => savedAddresses.find((addr) => addr.id === selectedAddressId) || null,
    [savedAddresses, selectedAddressId]
  );

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
      if (!cart.length) {
        setMessage("Please add at least one item to your order tray");
        return;
      }
      if (orderMode === "dine_in" && !checkout.tableNumber) {
        setMessage("Please select a table for dine-in");
        return;
      }
      if (orderMode === "online" && !checkout.customerPhone && !checkout.customerEmail) {
        setMessage("Please provide phone or email for online order");
        return;
      }
      if (orderMode === "online" && !String(checkout.deliveryAddress || "").trim()) {
        setMessage("Please select or enter a delivery address for online order");
        return;
      }
      if (orderMode === "online" && useSelectedAsDefault && selectedAddressId && !selectedSavedAddress?.isDefault) {
        const defaultRes = await authService.setDefaultAddress(token, selectedAddressId);
        if (defaultRes?.addresses) {
          setSavedAddresses(defaultRes.addresses);
        }
      }

      await orderService.createOrder(token, {
        serviceType: orderMode,
        tableNumber: orderMode === "dine_in" ? checkout.tableNumber : "ONLINE",
        qrToken: orderMode === "dine_in" ? checkout.qrToken : "",
        customerName: checkout.customerName,
        customerEmail: checkout.customerEmail,
        customerPhone: checkout.customerPhone,
        deliveryAddress: orderMode === "online" ? checkout.deliveryAddress : "",
        notes: checkout.notes,
        items: cart.map((item) => ({
          menuItem: item.menuItem,
          quantity: Number(item.quantity),
          notes: item.notes || "",
        })),
      });

      clearCart();
      setCheckout((prev) => ({ ...prev, notes: "" }));
      setUseSelectedAsDefault(false);
      setMessage("Order placed successfully. Track status below.");
      await loadData();
    } catch (err) {
      setMessage(err?.response?.data?.message || "Checkout failed");
    } finally {
      setSubmitting(false);
    }
  };

  const onSavedAddressChange = (addressId) => {
    setSelectedAddressId(addressId);
    setUseSelectedAsDefault(false);
    const selected = savedAddresses.find((addr) => addr.id === addressId);
    if (!selected) return;

    setCheckout((prev) => ({
      ...prev,
      deliveryAddress: formatAddressForOrder(selected),
      customerName: prev.customerName || selected.fullName || "",
      customerPhone: prev.customerPhone || selected.phone || "",
    }));
  };

  const openItemQuickView = (item) => {
    setSelectedItem(item);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("item", item.slug);
    setSearchParams(nextParams, { replace: true });
  };

  return (
    <div className="min-h-screen pb-10" style={{ backgroundColor: palette.pageBg, color: palette.text }}>
      <section className="mx-auto mt-3 w-full max-w-[112rem] px-3 md:px-5">
        <div className="card-elevated space-y-3 p-3.5 md:p-4" style={{ backgroundColor: palette.panelBg, boxShadow: palette.glassShadow }}>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em]" style={{ color: palette.muted }}>Fast Ordering</p>
              <h1 className="mt-1.5 text-2xl font-black tracking-tight" style={{ color: palette.text }}>
                Build your tray with precision
              </h1>
              <p className="mt-1.5 max-w-2xl text-xs leading-5" style={{ color: palette.muted }}>
                Search, compare, review dishes, and place table or online orders from one compact workspace.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em]" style={{ borderColor: palette.border, backgroundColor: palette.cardBg, color: palette.text }}>
              <FiZap className="h-3.5 w-3.5" />
              Live Tray Sync
            </div>
          </div>
          <div className="grid gap-2 md:grid-cols-[1.35fr_1fr_1fr_0.85fr_0.85fr]">
            <div className="relative">
              <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: palette.muted }} />
              <input
                type="text"
                placeholder="Search menu items"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-10 w-full rounded-lg border pl-10 pr-2 text-sm"
                style={{ borderColor: palette.border, backgroundColor: palette.cardBg, color: palette.text }}
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setSubCategoryFilter("");
              }}
              className="h-10 rounded-lg border px-2 text-sm"
              style={{ borderColor: palette.border, backgroundColor: palette.cardBg, color: palette.text }}
            >
              <option value="">All Categories</option>
              {menuData.categories.map((category) => <option key={category._id} value={category._id}>{category.name}</option>)}
            </select>
            <select
              value={subCategoryFilter}
              onChange={(e) => setSubCategoryFilter(e.target.value)}
              className="h-10 rounded-lg border px-2 text-sm"
              style={{ borderColor: palette.border, backgroundColor: palette.cardBg, color: palette.text }}
            >
              <option value="">All Subcategories</option>
              {subCategoryOptions.map((subCategory) => <option key={subCategory._id} value={subCategory._id}>{subCategory.name}</option>)}
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="h-10 rounded-lg border px-2 text-sm"
              style={{ borderColor: palette.border, backgroundColor: palette.cardBg, color: palette.text }}
            >
              <option value="featured">Featured</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="newest">Newest</option>
            </select>
            <div className="flex h-10 rounded-lg border gap-1 p-1" style={{ borderColor: palette.border, backgroundColor: palette.cardBg }}>
              <button onClick={() => setFoodTypeFilter("")} className={`flex-1 rounded-md px-2 py-1 text-xs font-bold transition-all ${foodTypeFilter === "" ? "text-white shadow-md" : ""}`} style={{ backgroundColor: foodTypeFilter === "" ? theme.primaryColor : "transparent", color: foodTypeFilter === "" ? "#fff" : palette.text }}>All</button>
              <button onClick={() => setFoodTypeFilter("veg")} className={`flex-1 rounded-md px-2 py-1 text-xs font-bold transition-all ${foodTypeFilter === "veg" ? "text-white shadow-md" : ""}`} style={{ backgroundColor: foodTypeFilter === "veg" ? "#16a34a" : "transparent", color: foodTypeFilter === "veg" ? "#fff" : palette.text }}>Veg</button>
              <button onClick={() => setFoodTypeFilter("non_veg")} className={`flex-1 rounded-md px-2 py-1 text-xs font-bold transition-all ${foodTypeFilter === "non_veg" ? "text-white shadow-md" : ""}`} style={{ backgroundColor: foodTypeFilter === "non_veg" ? "#dc2626" : "transparent", color: foodTypeFilter === "non_veg" ? "#fff" : palette.text }}>Non-Veg</button>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto mt-4 grid w-full max-w-[90rem] gap-4 px-4 md:px-8 xl:grid-cols-[1fr_360px]">
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
            onItemTap={openItemQuickView}
          />
        </div>

        <aside id="order-tray" className="space-y-3 scroll-mt-24 xl:sticky xl:top-24 self-start">
          <section className="card-elevated overflow-hidden p-0" style={{ backgroundColor: palette.panelBg, boxShadow: palette.glassShadow }}>
            <div className="border-b px-4 py-3" style={{ borderColor: palette.border }}>
              <div className="flex items-center justify-between">
                <h3 className="inline-flex items-center gap-2 text-sm font-extrabold" style={{ color: palette.text }}>
                  <FiShoppingCart className="h-4 w-4" />
                  Order Tray
                </h3>
                <span className="rounded-full px-2 py-0.5 text-xs font-bold" style={{ backgroundColor: palette.pageBg, color: palette.text }}>{itemCount} items</span>
              </div>
            </div>
            <div className="max-h-[300px] space-y-2 overflow-auto p-3">
              {cart.map((item) => (
                <div key={item.menuItem} className="rounded-xl border p-2.5" style={{ borderColor: palette.border, backgroundColor: palette.cardBg }}>
                  <div className="flex items-start gap-2.5">
                    <img
                      src={item.image || "https://via.placeholder.com/64x64?text=Dish"}
                      alt={item.name}
                      className="h-12 w-12 rounded-lg object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="line-clamp-2 text-xs font-bold leading-4" style={{ color: palette.text }}>{item.name}</p>
                        <button onClick={() => removeCartItem(item.menuItem)} className="inline-flex items-center rounded-md bg-red-600 p-1 text-white hover:bg-red-700">
                          <FiTrash2 className="h-3 w-3" />
                        </button>
                      </div>
                      <p className="mt-0.5 text-[11px] font-semibold" style={{ color: theme.primaryColor }}>Rs {Number(item.unitPrice).toFixed(2)} each</p>
                      <div className="mt-1.5 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1 rounded-lg px-1 py-0.5" style={{ backgroundColor: palette.pageBg }}>
                          <button onClick={() => updateCartItem(item.menuItem, { quantity: Math.max(1, item.quantity - 1) })} className="inline-flex rounded p-1 text-slate-700 hover:bg-slate-200">
                            <FiMinus className="h-3 w-3" />
                          </button>
                          <span className="w-5 text-center text-xs font-bold">{item.quantity}</span>
                          <button onClick={() => updateCartItem(item.menuItem, { quantity: item.quantity + 1 })} className="inline-flex rounded p-1 text-slate-700 hover:bg-slate-200">
                            <FiPlus className="h-3 w-3" />
                          </button>
                        </div>
                        <p className="text-xs font-bold" style={{ color: palette.text }}>
                          Rs {(Number(item.unitPrice || 0) * Number(item.quantity || 0)).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                  <input
                    type="text"
                    placeholder="Special request"
                    value={item.notes}
                    onChange={(e) => updateCartItem(item.menuItem, { notes: e.target.value })}
                    className="mt-2 h-8 w-full rounded-lg border px-2 text-[11px]"
                    style={{ borderColor: palette.border, backgroundColor: palette.pageBg, color: palette.text }}
                  />
                </div>
              ))}
              {!cart.length ? <p className="py-6 text-center text-xs" style={{ color: palette.muted }}>Order tray is empty. Add items from menu.</p> : null}
            </div>

            <div className="space-y-1.5 border-t px-4 py-3" style={{ borderColor: palette.border, backgroundColor: palette.cardBg }}>
              <div className="flex justify-between text-xs">
                <span style={{ color: palette.muted }}>Subtotal:</span>
                <span className="font-semibold">Rs {cartTotals.subTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span style={{ color: palette.muted }}>Tax (5%):</span>
                <span className="font-semibold">Rs {cartTotals.tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t pt-2 text-sm" style={{ borderColor: palette.border }}>
                <span className="font-bold">Total:</span>
                <span className="text-base font-black" style={{ color: theme.primaryColor }}>Rs {cartTotals.grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </section>

          <section className="card-elevated space-y-3 p-4" style={{ backgroundColor: palette.panelBg, boxShadow: palette.glassShadow }}>
            <h3 className="inline-flex items-center gap-2 text-sm font-extrabold" style={{ color: palette.text }}>
              <FiCreditCard className="h-4 w-4" />
              Quick Checkout
            </h3>
            <div
              className="rounded-lg border px-3 py-2 text-xs font-semibold"
              style={{ borderColor: palette.border, backgroundColor: palette.cardBg, color: palette.text }}
            >
              {checkout.qrToken ? (
                <span className="inline-flex items-center gap-2">
                  <FiHome className="h-3.5 w-3.5" />
                  Dine-in order for Table {checkout.tableNumber || "—"} (via QR)
                </span>
              ) : (
                <span className="inline-flex items-center gap-2">
                  <FiGlobe className="h-3.5 w-3.5" />
                  Online order (home delivery / takeaway)
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <label className="text-[11px] font-semibold" style={{ color: palette.muted }}>
                {orderMode === "dine_in" ? "Select Table *" : "Order Type"}
              </label>
              <label className="text-[11px] font-semibold" style={{ color: palette.muted }}>
                Your Name *
              </label>

              {orderMode === "dine_in" && checkout.qrToken ? (
                <input
                  type="text"
                  value={checkout.tableNumber ? `Table ${checkout.tableNumber}` : "Table from QR"}
                  readOnly
                  className="h-9 rounded-lg border px-2.5 text-xs"
                  style={{ borderColor: palette.border, backgroundColor: palette.cardBg, color: palette.text }}
                />
              ) : orderMode === "dine_in" ? (
                <select
                  value={checkout.tableNumber}
                  onChange={(e) =>
                    setCheckout((prev) => ({
                      ...prev,
                      tableNumber: e.target.value,
                    }))
                  }
                  className="h-9 rounded-lg border px-2.5 text-xs"
                  style={{ borderColor: palette.border, backgroundColor: palette.cardBg, color: palette.text }}
                >
                  <option value="">Select table</option>
                  {dineInTables.map((table) => (
                    <option key={table._id} value={table.tableNumber}>
                      {`Table ${table.tableNumber} • ${table.capacity} guests • ${table.location}`}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value="Online order"
                  readOnly
                  className="h-9 rounded-lg border px-2.5 text-xs"
                  style={{ borderColor: palette.border, backgroundColor: palette.cardBg, color: palette.text }}
                />
              )}

              <input
                type="text"
                value={checkout.customerName}
                onChange={(e) => setCheckout((prev) => ({ ...prev, customerName: e.target.value }))}
                className="h-9 rounded-lg border px-2.5 text-xs"
                style={{ borderColor: palette.border, backgroundColor: palette.cardBg, color: palette.text }}
              />
            </div>
            {orderMode === "dine_in" && checkout.qrToken ? <p className="text-[11px] text-emerald-700">Table locked by scanned QR token.</p> : null}
            {orderMode === "dine_in" && !checkout.qrToken ? (
              <p className="text-[11px] text-amber-700">For customer dine-in, scan table QR before checkout.</p>
            ) : null}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-[11px] font-semibold" style={{ color: palette.muted }}>Email</label>
                <input
                  type="email"
                  value={checkout.customerEmail}
                  onChange={(e) => setCheckout((prev) => ({ ...prev, customerEmail: e.target.value }))}
                  className="h-9 w-full rounded-lg border px-2.5 text-xs"
                  style={{ borderColor: palette.border, backgroundColor: palette.cardBg, color: palette.text }}
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-semibold" style={{ color: palette.muted }}>Phone</label>
                <input
                  type="tel"
                  value={checkout.customerPhone}
                  onChange={(e) => setCheckout((prev) => ({ ...prev, customerPhone: e.target.value }))}
                  className="h-9 w-full rounded-lg border px-2.5 text-xs"
                  style={{ borderColor: palette.border, backgroundColor: palette.cardBg, color: palette.text }}
                />
              </div>
            </div>
            {orderMode === "online" ? (
              <div>
                {savedAddresses.length ? (
                  <div className="mb-2">
                    <label className="mb-1 block text-[11px] font-semibold" style={{ color: palette.muted }}>
                      Saved Addresses
                    </label>
                    <select
                      value={selectedAddressId}
                      onChange={(e) => onSavedAddressChange(e.target.value)}
                      className="h-9 w-full rounded-lg border px-2.5 text-xs"
                      style={{ borderColor: palette.border, backgroundColor: palette.cardBg, color: palette.text }}
                    >
                      <option value="">Select saved address</option>
                      {savedAddresses.map((address) => (
                        <option key={address.id} value={address.id}>
                          {formatAddressLabel(address)}{address.isDefault ? " (Default)" : ""}
                        </option>
                      ))}
                    </select>
                    <p className="mt-1 text-[11px]" style={{ color: palette.muted }}>
                      Manage addresses from Profile page.
                    </p>
                    {selectedAddressId && selectedSavedAddress && !selectedSavedAddress.isDefault ? (
                      <label className="mt-2 inline-flex items-center gap-2 text-[11px] font-semibold" style={{ color: palette.text }}>
                        <input
                          type="checkbox"
                          checked={useSelectedAsDefault}
                          onChange={(e) => setUseSelectedAsDefault(e.target.checked)}
                        />
                        Use selected address as default
                      </label>
                    ) : null}
                    {selectedAddressId && selectedSavedAddress?.isDefault ? (
                      <p className="mt-2 text-[11px] font-semibold text-emerald-700">Selected address is already default.</p>
                    ) : null}
                  </div>
                ) : null}
                <label className="mb-1 block text-[11px] font-semibold" style={{ color: palette.muted }}>Delivery Address</label>
                <textarea
                  placeholder="House no, street, city..."
                  value={checkout.deliveryAddress}
                  onChange={(e) => setCheckout((prev) => ({ ...prev, deliveryAddress: e.target.value }))}
                  className="h-14 w-full rounded-lg border px-2.5 py-2 text-xs"
                  style={{ borderColor: palette.border, backgroundColor: palette.cardBg, color: palette.text }}
                />
              </div>
            ) : null}
            <div>
              <label className="mb-1 block text-[11px] font-semibold" style={{ color: palette.muted }}>Special Requests</label>
              <textarea
                placeholder="Less spicy, no onions..."
                value={checkout.notes}
                onChange={(e) => setCheckout((prev) => ({ ...prev, notes: e.target.value }))}
                className="h-16 w-full rounded-lg border px-2.5 py-2 text-xs"
                style={{ borderColor: palette.border, backgroundColor: palette.cardBg, color: palette.text }}
              />
            </div>
            {message && <div className={message.includes("successfully") ? "alert-success" : "alert-error"}>{message}</div>}
            <button
              onClick={checkoutOrder}
              disabled={submitting}
              className="w-full rounded-lg py-2 text-xs font-bold text-white"
              style={{ backgroundColor: theme.primaryColor }}
            >
              {submitting ? "Placing order..." : "Checkout and Place Order"}
            </button>
          </section>

          <section className="card-elevated space-y-3 p-4" style={{ backgroundColor: palette.panelBg, boxShadow: palette.glassShadow }}>
            <div className="flex items-center justify-between">
              <h3 className="inline-flex items-center gap-2 text-sm font-extrabold" style={{ color: palette.text }}>
                <FiClock className="h-4 w-4" />
                Live Orders ({orders.length})
              </h3>
            </div>
            <div className="max-h-[190px] space-y-1.5 overflow-auto">
              {orders.map((order) => {
                const colors = statusMeta[order.status] || statusMeta.placed;
                return (
                  <article key={order._id} className={`${colors.bg} rounded-lg p-2 text-[11px]`}>
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate font-bold">{order.orderNumber}</p>
                      <span className={`${colors.text} whitespace-nowrap rounded-full px-1.5 py-0.5 text-[10px] font-bold`}>{colors.label}</span>
                    </div>
                    <p className="mt-0.5 text-slate-700">
                      {order.serviceType === "online" ? "Online" : `Table ${order.tableNumber}`}
                    </p>
                    <p className="line-clamp-1 text-slate-700">{order.items?.map((x) => `${x.name} x ${x.quantity}`).join(", ")}</p>
                  </article>
                );
              })}
              {!orders.length ? <p className="py-5 text-center text-xs" style={{ color: palette.muted }}>No orders placed yet</p> : null}
            </div>
          </section>
        </aside>
      </div>

      <MenuItemQuickViewModal
        item={selectedItem}
        isOpen={Boolean(selectedItem)}
        onClose={() => {
          setSelectedItem(null);
          const nextParams = new URLSearchParams(searchParams);
          nextParams.delete("item");
          setSearchParams(nextParams, { replace: true });
        }}
        palette={palette}
        theme={theme}
        onAddToCart={addToCart}
      />
    </div>
  );
};

export default Customer_Menu;

import { useEffect, useMemo, useState } from "react";
import { FiArchive, FiBarChart2, FiBox, FiCalendar, FiCamera, FiChevronDown, FiChevronRight, FiDatabase, FiGrid, FiLayers, FiPackage } from "react-icons/fi";
import inventoryService from "../../services/inventory_Service";
import menuService from "../../services/menu_Service";
import orderService from "../../services/order_Service";
import InventoryDashboardView from "./inventory/InventoryDashboardView";
import InventoryItemsView from "./inventory/InventoryItemsView";
import { InventoryCategoriesView, InventoryUnitsView } from "./inventory/InventoryCatalogView";
import InventoryScannerView from "./inventory/InventoryScannerView";
import InventoryPlannerView from "./inventory/InventoryPlannerView";
import InventoryHistoryView from "./inventory/InventoryHistoryView";
import { InventoryPurchaseOrdersView, InventorySuppliersView } from "./inventory/InventoryProcurementView";
import InventoryFinanceView from "./inventory/InventoryFinanceView";
import { categoryRestockIdeas, createDraft, defaultCoursePortionFactor, getInventoryNameSimilarity, inferCourse, initialCategoryForm, initialExpenseForm, initialItemForm, initialPurchaseOrderForm, initialStockRequestForm, initialSupplierForm, initialUnitForm, navGroups, normalizePartyType, parseDraftsFromScan, partyDemandMultipliers, partyTypes, plannerProfiles, serviceStyleMultipliers, serviceStyles, singularizeWord, titleize, toNumber } from "./inventory/inventoryUtils";
import { useAuth } from "../../context/AuthContext";

const iconMap = {
  grid: FiGrid,
  package: FiPackage,
  layers: FiLayers,
  box: FiBox,
  camera: FiCamera,
  calendar: FiCalendar,
  bar: FiBarChart2,
  archive: FiArchive,
  database: FiDatabase,
};

const normalizeInventoryMatchValue = (value = "") => singularizeWord(value);

const AdminInventory = () => {
  const { token, user, getPrimaryRole } = useAuth();
  const primaryRole = getPrimaryRole(user?.roles || []);
  const canManageInventory = ["admin", "manager"].includes(primaryRole);
  const canAdjustStock = ["admin", "manager", "kitchen"].includes(primaryRole);
  const canRecordPayments = ["admin", "manager", "cashier"].includes(primaryRole);
  const canRequestStock = ["admin", "manager", "kitchen"].includes(primaryRole);
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState(null);
  const [categories, setCategories] = useState([]);
  const [units, setUnits] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [orders, setOrders] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [stockRequests, setStockRequests] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [purchaseSummary, setPurchaseSummary] = useState({ totalOrders: 0, totalValue: 0, totalPaid: 0, totalDue: 0 });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [filterCategory, setFilterCategory] = useState("all");
  const [activeView, setActiveView] = useState("dashboard");
  const [openMenus, setOpenMenus] = useState({ overview: true, catalog: true, future: false });
  const [showItemForm, setShowItemForm] = useState(false);
  const [editingItemId, setEditingItemId] = useState(null);
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [editingUnitId, setEditingUnitId] = useState(null);
  const [editingSupplierId, setEditingSupplierId] = useState(null);
  const [editingExpenseId, setEditingExpenseId] = useState(null);
  const [itemForm, setItemForm] = useState(initialItemForm);
  const [categoryForm, setCategoryForm] = useState(initialCategoryForm);
  const [unitForm, setUnitForm] = useState(initialUnitForm);
  const [supplierForm, setSupplierForm] = useState(initialSupplierForm);
  const [expenseForm, setExpenseForm] = useState(initialExpenseForm);
  const [purchaseOrderForm, setPurchaseOrderForm] = useState(initialPurchaseOrderForm);
  const [stockRequestForm, setStockRequestForm] = useState(initialStockRequestForm);
  const [drafts, setDrafts] = useState([]);
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanText, setScanText] = useState("");
  const [selectedImageName, setSelectedImageName] = useState("");
  const [plannerForm, setPlannerForm] = useState({
    partyType: partyTypes[0],
    partyTypeOptions: partyTypes,
    serviceStyle: serviceStyles[0],
    serviceStyleOptions: serviceStyles,
    attendants: 50,
    guestSplitMode: "percentage",
    vegValue: 60,
    bufferPercent: 10,
    repeatRate: 10,
    notes: "",
    selectedItems: [],
  });
  const [financeFilters, setFinanceFilters] = useState(() => {
    const now = new Date();
    const isoDate = now.toISOString().slice(0, 10);
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    return {
      selectedDate: isoDate,
      selectedMonth: monthKey,
    };
  });

  const activeCategories = useMemo(() => categories.filter((category) => category.isActive !== false), [categories]);
  const activeUnits = useMemo(() => units.filter((unit) => unit.isActive !== false), [units]);
  const activeSuppliers = useMemo(() => suppliers.filter((supplier) => supplier.isActive !== false), [suppliers]);

  useEffect(() => {
    if (!token) return;
    refreshAll();
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const menuDrivenPartyTypes = Array.from(
      new Set(
        menuItems
          .flatMap((item) => item.suitablePartyTypes || [])
          .map((partyType) => normalizePartyType(partyType))
          .filter(Boolean)
      )
    );
    const nextPartyTypeOptions = Array.from(new Set([...partyTypes, ...menuDrivenPartyTypes]));

    setPlannerForm((prev) => ({
      ...prev,
      partyTypeOptions: nextPartyTypeOptions,
      partyType: nextPartyTypeOptions.includes(prev.partyType) ? prev.partyType : nextPartyTypeOptions[0] || partyTypes[0],
    }));
  }, [menuItems]);

  useEffect(() => {
    setPurchaseOrderForm((prev) => ({
      ...prev,
      supplier: prev.supplier || suppliers[0]?._id || "",
    }));
  }, [suppliers]);

  const filteredItems = useMemo(() => {
    if (filterCategory === "all") return items;
    return items.filter((item) => item.category === filterCategory);
  }, [filterCategory, items]);

  const summaryCards = useMemo(
    () => [
      { label: "Live Items", value: items.length, iconName: "package", tone: "from-sky-500 to-cyan-400" },
      { label: "Low Stock", value: stats?.lowStockItems || 0, iconName: "bar", tone: "from-rose-500 to-orange-400" },
      { label: "Inventory Value", value: `Rs ${Number(stats?.totalValue || 0).toLocaleString()}`, iconName: "database", tone: "from-emerald-500 to-teal-400" },
      { label: "Categories", value: activeCategories.length, iconName: "layers", tone: "from-violet-500 to-fuchsia-400" },
      { label: "Draft Items", value: drafts.length, iconName: "camera", tone: "from-amber-500 to-yellow-400" },
    ],
    [activeCategories.length, drafts.length, items.length, stats]
  );

  const categoryChartData = useMemo(() => {
    const grouped = items.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(grouped).map(([name, value]) => ({ name: titleize(name), value }));
  }, [items]);

  const stockHealthData = useMemo(() => {
    const summary = items.reduce(
      (acc, item) => {
        if (item.currentStock < item.minimumThreshold) acc.low += 1;
        else if (item.currentStock >= item.maximumStock) acc.full += 1;
        else acc.healthy += 1;
        return acc;
      },
      { low: 0, healthy: 0, full: 0 }
    );

    return [
      { name: "Low", value: summary.low },
      { name: "Healthy", value: summary.healthy },
      { name: "Full", value: summary.full },
    ];
  }, [items]);

  const topValueItems = useMemo(
    () =>
      [...items]
        .map((item) => ({ name: item.name, value: Number(item.currentStock || 0) * Number(item.unitCost || 0) }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 6),
    [items]
  );

  const servedFinancialOrders = useMemo(() => {
    const menuMap = new Map(menuItems.map((item) => [String(item._id), item]));

    return orders
      .filter((order) => order.status === "served")
      .map((order) => {
        let ingredientCost = 0;
        let recipeMappedCount = 0;
        let totalOrderItems = 0;

        (order.items || []).forEach((orderItem) => {
          totalOrderItems += Number(orderItem.quantity || 0);
          const menuItem = menuMap.get(String(orderItem.menuItem?._id || orderItem.menuItem));
          if (!menuItem?.recipeIngredients?.length) return;
          recipeMappedCount += Number(orderItem.quantity || 0);

          menuItem.recipeIngredients.forEach((ingredient) => {
            const inventoryItem = ingredient.inventoryItem;
            ingredientCost += Number(ingredient.quantity || 0) * Number(orderItem.quantity || 0) * Number(inventoryItem?.unitCost || 0);
          });
        });

        const revenue = Number(order.grandTotal || 0);
        const netRevenue = Number(order.subTotal || 0);
        const profit = revenue - ingredientCost;
        const createdAt = new Date(order.createdAt);
        return {
          id: order._id,
          orderNumber: order.orderNumber,
          createdAt,
          dateKey: createdAt.toISOString().slice(0, 10),
          monthKey: `${createdAt.getFullYear()}-${String(createdAt.getMonth() + 1).padStart(2, "0")}`,
          serviceType: order.serviceType || "dine_in",
          paymentStatus: order.paymentStatus || "pending",
          revenue,
          netRevenue,
          ingredientCost,
          profit,
          coverage: totalOrderItems ? Math.round((recipeMappedCount / totalOrderItems) * 100) : 0,
          itemCount: totalOrderItems,
        };
      })
      .sort((left, right) => right.createdAt - left.createdAt);
  }, [menuItems, orders]);

  const financeMetrics = useMemo(() => {
    const summarize = (entries = []) => {
      const revenue = entries.reduce((sum, entry) => sum + entry.revenue, 0);
      const netRevenue = entries.reduce((sum, entry) => sum + entry.netRevenue, 0);
      const ingredientCost = entries.reduce((sum, entry) => sum + entry.ingredientCost, 0);
      const profit = entries.reduce((sum, entry) => sum + entry.profit, 0);
      const orderCount = entries.length;
      const paidCount = entries.filter((entry) => entry.paymentStatus === "paid").length;
      const averageOrderValue = orderCount ? revenue / orderCount : 0;
      const recipeCoverage = orderCount ? Math.round(entries.reduce((sum, entry) => sum + entry.coverage, 0) / orderCount) : 0;
      return {
        revenue,
        netRevenue,
        ingredientCost,
        profit,
        orderCount,
        paidCount,
        averageOrderValue,
        marginPercent: revenue > 0 ? (profit / revenue) * 100 : 0,
        recipeCoverage,
      };
    };

    const now = new Date();
    const todayKey = now.toISOString().slice(0, 10);
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const selectedDateOrders = servedFinancialOrders.filter((entry) => entry.dateKey === financeFilters.selectedDate);
    const selectedMonthOrders = servedFinancialOrders.filter((entry) => entry.monthKey === financeFilters.selectedMonth);
    const todayOrders = servedFinancialOrders.filter((entry) => entry.dateKey === todayKey);
    const monthOrders = servedFinancialOrders.filter((entry) => entry.monthKey === monthKey);

    const last7DaysMap = new Map();
    for (let offset = 6; offset >= 0; offset -= 1) {
      const day = new Date(now);
      day.setDate(now.getDate() - offset);
      const key = day.toISOString().slice(0, 10);
      last7DaysMap.set(key, {
        label: day.toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
        revenue: 0,
        profit: 0,
      });
    }
    servedFinancialOrders.forEach((entry) => {
      const bucket = last7DaysMap.get(entry.dateKey);
      if (!bucket) return;
      bucket.revenue += entry.revenue;
      bucket.profit += entry.profit;
    });

    const monthTrendMap = new Map();
    for (let offset = 5; offset >= 0; offset -= 1) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - offset, 1);
      const key = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, "0")}`;
      monthTrendMap.set(key, {
        label: monthDate.toLocaleDateString("en-IN", { month: "short", year: "2-digit" }),
        revenue: 0,
        profit: 0,
      });
    }
    servedFinancialOrders.forEach((entry) => {
      const bucket = monthTrendMap.get(entry.monthKey);
      if (!bucket) return;
      bucket.revenue += entry.revenue;
      bucket.profit += entry.profit;
    });

    const serviceMix = Object.entries(
      servedFinancialOrders.reduce((acc, entry) => {
        acc[entry.serviceType] = (acc[entry.serviceType] || 0) + entry.revenue;
        return acc;
      }, {})
    ).map(([name, value]) => ({ name: titleize(name.replaceAll("_", " ")), value }));

    const paymentMix = Object.entries(
      servedFinancialOrders.reduce((acc, entry) => {
        acc[entry.paymentStatus] = (acc[entry.paymentStatus] || 0) + 1;
        return acc;
      }, {})
    ).map(([name, value]) => ({ name: titleize(name), value }));

    const topProfitOrders = [...servedFinancialOrders]
      .sort((left, right) => right.profit - left.profit)
      .slice(0, 5);

    const expenseEntries = expenses
      .map((expense) => {
        const expenseDate = new Date(expense.expenseDate || expense.createdAt || Date.now());
        return {
          ...expense,
          amount: Number(expense.amount || 0),
          dateKey: expenseDate.toISOString().slice(0, 10),
          monthKey: `${expenseDate.getFullYear()}-${String(expenseDate.getMonth() + 1).padStart(2, "0")}`,
        };
      })
      .sort((left, right) => new Date(right.expenseDate || right.createdAt) - new Date(left.expenseDate || left.createdAt));

    const wastageEntries = transactions
      .filter((transaction) => transaction.source === "wastage")
      .map((transaction) => {
        const createdAt = new Date(transaction.createdAt);
        return {
          id: transaction._id,
          itemName: transaction.inventoryItem?.name || "Inventory item",
          quantity: Number(transaction.quantity || 0),
          unit: transaction.inventoryItem?.unit || "",
          reason: transaction.reason || "Inventory wastage",
          createdAt: transaction.createdAt,
          dateKey: createdAt.toISOString().slice(0, 10),
          monthKey: `${createdAt.getFullYear()}-${String(createdAt.getMonth() + 1).padStart(2, "0")}`,
          cost: Number(transaction.quantity || 0) * Number(transaction.inventoryItem?.unitCost || 0),
        };
      })
      .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt));

    const sumAmounts = (entries = [], key = "amount") => entries.reduce((sum, entry) => sum + Number(entry[key] || 0), 0);

    const selectedDateExpenses = expenseEntries.filter((entry) => entry.dateKey === financeFilters.selectedDate);
    const selectedMonthExpenses = expenseEntries.filter((entry) => entry.monthKey === financeFilters.selectedMonth);
    const todayExpenses = expenseEntries.filter((entry) => entry.dateKey === todayKey);
    const currentMonthExpenses = expenseEntries.filter((entry) => entry.monthKey === monthKey);

    const selectedDateWastage = wastageEntries.filter((entry) => entry.dateKey === financeFilters.selectedDate);
    const selectedMonthWastage = wastageEntries.filter((entry) => entry.monthKey === financeFilters.selectedMonth);
    const todayWastage = wastageEntries.filter((entry) => entry.dateKey === todayKey);
    const currentMonthWastage = wastageEntries.filter((entry) => entry.monthKey === monthKey);

    const menuMap = new Map(menuItems.map((item) => [String(item._id), item]));
    const categoryProfitMap = new Map();
    const menuItemProfitMap = new Map();

    orders
      .filter((order) => order.status === "served")
      .forEach((order) => {
        (order.items || []).forEach((orderItem) => {
          const menuItem = menuMap.get(String(orderItem.menuItem?._id || orderItem.menuItem));
          const revenue = Number(orderItem.totalPrice || 0);
          let totalCost = 0;

          if (menuItem?.recipeIngredients?.length) {
            menuItem.recipeIngredients.forEach((ingredient) => {
              const inventoryItem = ingredient.inventoryItem;
              const cost = Number(ingredient.quantity || 0) * Number(orderItem.quantity || 0) * Number(inventoryItem?.unitCost || 0);
              totalCost += cost;

              const categoryName = titleize(inventoryItem?.category || "Other");
              const categoryEntry = categoryProfitMap.get(categoryName) || { name: categoryName, revenue: 0, cost: 0, profit: 0 };
              categoryEntry.revenue += revenue / Math.max(menuItem.recipeIngredients.length, 1);
              categoryEntry.cost += cost;
              categoryEntry.profit = categoryEntry.revenue - categoryEntry.cost;
              categoryProfitMap.set(categoryName, categoryEntry);
            });
          } else {
            const categoryName = titleize(menuItem?.category?.name || "Unmapped");
            const categoryEntry = categoryProfitMap.get(categoryName) || { name: categoryName, revenue: 0, cost: 0, profit: 0 };
            categoryEntry.revenue += revenue;
            categoryEntry.profit = categoryEntry.revenue - categoryEntry.cost;
            categoryProfitMap.set(categoryName, categoryEntry);
          }

          const menuItemKey = String(orderItem.menuItem?._id || orderItem.menuItem || orderItem.name);
          const menuEntry = menuItemProfitMap.get(menuItemKey) || {
            id: menuItemKey,
            name: orderItem.name,
            quantity: 0,
            revenue: 0,
            cost: 0,
            profit: 0,
          };
          menuEntry.quantity += Number(orderItem.quantity || 0);
          menuEntry.revenue += revenue;
          menuEntry.cost += totalCost;
          menuEntry.profit = menuEntry.revenue - menuEntry.cost;
          menuItemProfitMap.set(menuItemKey, menuEntry);
        });
      });

    const selectedMonthPurchases = purchaseOrders
      .filter((order) => String(order.createdAt || "").slice(0, 7) === financeFilters.selectedMonth)
      .reduce((sum, order) => sum + Number(order.subtotal || 0), 0);
    const selectedMonthPayments = purchaseOrders
      .filter((order) => String(order.createdAt || "").slice(0, 7) === financeFilters.selectedMonth)
      .reduce((sum, order) => sum + Number(order.totalPaid || 0), 0);

    const selectedDateSummary = summarize(selectedDateOrders);
    const todaySummary = summarize(todayOrders);
    const currentMonthSummary = summarize(monthOrders);
    const selectedMonthSummary = summarize(selectedMonthOrders);

    return {
      today: todaySummary,
      selectedDate: selectedDateSummary,
      currentMonth: currentMonthSummary,
      selectedMonth: selectedMonthSummary,
      todayExpenseTotal: sumAmounts(todayExpenses),
      todayWastageCost: sumAmounts(todayWastage, "cost"),
      selectedDateExpenseTotal: sumAmounts(selectedDateExpenses),
      selectedDateWastageCost: sumAmounts(selectedDateWastage, "cost"),
      currentMonthExpenseTotal: sumAmounts(currentMonthExpenses),
      currentMonthWastageCost: sumAmounts(currentMonthWastage, "cost"),
      selectedMonthExpenseTotal: sumAmounts(selectedMonthExpenses),
      selectedMonthWastageCost: sumAmounts(selectedMonthWastage, "cost"),
      dailyTrend: Array.from(last7DaysMap.values()).map((entry) => ({
        ...entry,
        revenue: Number(entry.revenue.toFixed(2)),
        profit: Number(entry.profit.toFixed(2)),
      })),
      monthlyTrend: Array.from(monthTrendMap.values()).map((entry) => ({
        ...entry,
        revenue: Number(entry.revenue.toFixed(2)),
        profit: Number(entry.profit.toFixed(2)),
      })),
      serviceMix,
      paymentMix,
      topProfitOrders,
      recentServedOrders: servedFinancialOrders.slice(0, 8),
      expenses: expenseEntries.slice(0, 12),
      wastageEntries: wastageEntries.slice(0, 12),
      purchaseVsSales: {
        selectedMonthSales: selectedMonthSummary.revenue,
        selectedMonthPurchases,
        selectedMonthPayments,
      },
      categoryProfitRanking: Array.from(categoryProfitMap.values()).sort((left, right) => right.profit - left.profit).slice(0, 8),
      menuItemProfitRanking: Array.from(menuItemProfitMap.values()).sort((left, right) => right.profit - left.profit).slice(0, 10),
      dailyClosing: {
        date: financeFilters.selectedDate,
        revenue: selectedDateSummary.revenue,
        ingredientCost: selectedDateSummary.ingredientCost,
        grossProfit: selectedDateSummary.profit,
        extraExpenses: sumAmounts(selectedDateExpenses),
        wastageCost: sumAmounts(selectedDateWastage, "cost"),
        netProfit: selectedDateSummary.profit - sumAmounts(selectedDateExpenses) - sumAmounts(selectedDateWastage, "cost"),
        servedOrders: selectedDateSummary.orderCount,
        paidOrders: selectedDateSummary.paidCount,
      },
    };
  }, [expenses, financeFilters.selectedDate, financeFilters.selectedMonth, menuItems, orders, purchaseOrders, servedFinancialOrders, transactions]);

  const categoryValueData = useMemo(() => {
    const grouped = items.reduce((acc, item) => {
      const key = item.category || "other";
      acc[key] = (acc[key] || 0) + Number(item.currentStock || 0) * Number(item.unitCost || 0);
      return acc;
    }, {});

    return Object.entries(grouped)
      .map(([name, value]) => ({ name: titleize(name), value: Number(value.toFixed(2)) }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [items]);

  const lowStockItems = useMemo(
    () => items.filter((item) => item.currentStock < item.minimumThreshold).slice(0, 8),
    [items]
  );

  const topMovingItems = useMemo(() => {
    const movement = transactions.reduce((acc, transaction) => {
      const inventoryItem = transaction.inventoryItem;
      const inventoryId = String(inventoryItem?._id || transaction.inventoryItemId || "");
      if (!inventoryId) return acc;

      if (!acc[inventoryId]) {
        acc[inventoryId] = {
          id: inventoryId,
          name: inventoryItem?.name || transaction.itemName || "Unknown Item",
          unit: inventoryItem?.unit || transaction.unit || "",
          moved: 0,
          inQuantity: 0,
          outQuantity: 0,
          eventCount: 0,
        };
      }

      const quantity = Number(transaction.quantity || 0);
      acc[inventoryId].moved += Math.abs(quantity);
      acc[inventoryId].eventCount += 1;
      if (transaction.direction === "in") acc[inventoryId].inQuantity += quantity;
      if (transaction.direction === "out") acc[inventoryId].outQuantity += quantity;
      return acc;
    }, {});

    return Object.values(movement)
      .sort((a, b) => b.moved - a.moved)
      .slice(0, 6);
  }, [transactions]);

  const recentTransactions = useMemo(
    () =>
      transactions.slice(0, 8).map((transaction) => ({
        id: transaction._id,
        itemName: transaction.inventoryItem?.name || transaction.itemName || "Inventory item",
        direction: transaction.direction,
        quantity: Number(transaction.quantity || 0),
        unit: transaction.inventoryItem?.unit || transaction.unit || "",
        source: transaction.source || "manual",
        reason: transaction.reason || "",
        createdAt: transaction.createdAt,
        resultingStock: transaction.resultingStock,
      })),
    [transactions]
  );

  const procurementInsights = useMemo(() => {
    const activeSuppliersCount = suppliers.filter((supplier) => supplier.isActive !== false).length;
    const openOrders = purchaseOrders.filter((order) => ["draft", "ordered", "partially_received"].includes(order.status));
    const overduePayments = purchaseOrders.filter((order) => Number(order.balanceDue || 0) > 0);
    const pendingReceipts = purchaseOrders.filter(
      (order) => (order.items || []).some((item) => Number(item.orderedQuantity || 0) > Number(item.receivedQuantity || 0))
    );

    const recentOrders = [...purchaseOrders]
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .slice(0, 5)
      .map((order) => ({
        id: order._id,
        orderNumber: order.purchaseOrderNumber,
        supplierName: order.supplier?.name || "Supplier",
        status: order.status,
        totalAmount: Number(order.totalAmount || 0),
        balanceDue: Number(order.balanceDue || 0),
        itemCount: (order.items || []).length,
      }));

    const supplierExposure = suppliers
      .map((supplier) => {
        const supplierOrders = purchaseOrders.filter((order) => String(order.supplier?._id || order.supplier) === String(supplier._id));
        const totalOrdered = supplierOrders.reduce((sum, order) => sum + Number(order.totalAmount || 0), 0);
        const totalPaid = supplierOrders.reduce((sum, order) => sum + Number(order.totalPaid || 0), 0);
        const outstanding = supplierOrders.reduce((sum, order) => sum + Number(order.balanceDue || 0), 0);
        return {
          id: supplier._id,
          name: supplier.name,
          totalOrdered,
          totalPaid,
          outstanding,
          orders: supplierOrders.length,
        };
      })
      .filter((supplier) => supplier.orders > 0)
      .sort((a, b) => b.outstanding - a.outstanding)
      .slice(0, 5);

    return {
      activeSuppliersCount,
      openOrdersCount: openOrders.length,
      overduePaymentsCount: overduePayments.length,
      pendingReceiptsCount: pendingReceipts.length,
      totalOrders: Number(purchaseSummary.totalOrders || 0),
      totalValue: Number(purchaseSummary.totalValue || 0),
      totalPaid: Number(purchaseSummary.totalPaid || 0),
      totalDue: Number(purchaseSummary.totalDue || 0),
      recentOrders,
      supplierExposure,
    };
  }, [purchaseOrders, purchaseSummary, suppliers]);

  const dashboardAlerts = useMemo(() => {
    const alerts = [];
    if (lowStockItems.length) alerts.push(`${lowStockItems.length} item${lowStockItems.length > 1 ? "s are" : " is"} below minimum stock.`);
    if (drafts.length) alerts.push(`${drafts.length} scanner draft${drafts.length > 1 ? "s are" : " is"} waiting to be saved.`);
    if (procurementInsights.totalDue > 0) alerts.push(`Rs ${procurementInsights.totalDue.toLocaleString()} is still pending across purchase orders.`);
    if (procurementInsights.pendingReceiptsCount) alerts.push(`${procurementInsights.pendingReceiptsCount} purchase order${procurementInsights.pendingReceiptsCount > 1 ? "s have" : " has"} stock pending receipt.`);
    if (!alerts.length) alerts.push("Inventory operations look stable right now with no urgent dashboard alerts.");
    return alerts;
  }, [drafts.length, lowStockItems.length, procurementInsights.pendingReceiptsCount, procurementInsights.totalDue]);

  const menuOptions = useMemo(() => {
    const enriched = menuItems.map((item) => ({ ...item, courseLabel: titleize(inferCourse(item)) }));
    return {
      starters: enriched.filter((item) => inferCourse(item) === "starter"),
      mains: enriched.filter((item) => inferCourse(item) === "main"),
      beverages: enriched.filter((item) => inferCourse(item) === "beverage"),
      desserts: enriched.filter((item) => inferCourse(item) === "dessert"),
    };
  }, [menuItems]);

  const plannerResult = useMemo(() => {
    const attendants = Math.max(0, Number(plannerForm.attendants || 0));
    const vegGuests =
      plannerForm.guestSplitMode === "percentage"
        ? Math.round((attendants * Math.min(100, Math.max(0, plannerForm.vegValue))) / 100)
        : Math.min(attendants, Math.max(0, Number(plannerForm.vegValue || 0)));
    const nonVegGuests = Math.max(0, attendants - vegGuests);
    const selectedMenu = menuItems
      .filter((item) => plannerForm.selectedItems.includes(item._id))
      .map((item) => ({ ...item, courseLabel: titleize(inferCourse(item)) }));
    const partyMultiplier = partyDemandMultipliers[plannerForm.partyType] || partyDemandMultipliers.default;
    const serviceMultiplier = serviceStyleMultipliers[plannerForm.serviceStyle] || 1;
    const bufferMultiplier = 1 + Number(plannerForm.bufferPercent || 0) / 100;
    const repeatMultiplier = 1 + Number(plannerForm.repeatRate || 0) / 100;
    const overallMultiplier = partyMultiplier * serviceMultiplier * bufferMultiplier * repeatMultiplier;
    const withBuffer = attendants * overallMultiplier;
    const byCourse = selectedMenu.reduce((acc, item) => {
      const course = inferCourse(item);
      const bucket = `${course}-${course === "starter" || course === "main" ? item.foodType : "all"}`;
      acc[bucket] = acc[bucket] || [];
      acc[bucket].push(item);
      return acc;
    }, {});
    const requiredByCategory = {};
    const requiredByIngredient = new Map();

    const addDemand = (guestCount, course, type, selectedItemsForGroup = []) => {
      const profile = plannerProfiles[course]?.[type] || plannerProfiles[course]?.all;
      if (!selectedItemsForGroup.length || !guestCount) return;
      const share = guestCount / selectedItemsForGroup.length;

      selectedItemsForGroup.forEach((menuItem) => {
        const menuItemFactor = Number(menuItem.planningPortionFactor || defaultCoursePortionFactor[course] || 1);
        if (Array.isArray(menuItem.recipeIngredients) && menuItem.recipeIngredients.length) {
          menuItem.recipeIngredients.forEach((ingredient) => {
            const inventoryItem = ingredient.inventoryItem;
            if (!inventoryItem?._id) return;
            const consumedQuantity = share * Number(ingredient.quantity || 0) * menuItemFactor;
            requiredByIngredient.set(String(inventoryItem._id), {
              inventoryItem,
              quantity: (requiredByIngredient.get(String(inventoryItem._id))?.quantity || 0) + consumedQuantity,
            });
            requiredByCategory[inventoryItem.category] = (requiredByCategory[inventoryItem.category] || 0) + consumedQuantity;
          });
          return;
        }

        if (!profile) return;
        Object.entries(profile).forEach(([category, factor]) => {
          requiredByCategory[category] = (requiredByCategory[category] || 0) + share * factor * menuItemFactor;
        });
      });
    };

    addDemand(vegGuests * overallMultiplier, "starter", "veg", byCourse["starter-veg"] || []);
    addDemand(nonVegGuests * overallMultiplier, "starter", "non_veg", byCourse["starter-non_veg"] || []);
    addDemand(vegGuests * overallMultiplier, "main", "veg", byCourse["main-veg"] || []);
    addDemand(nonVegGuests * overallMultiplier, "main", "non_veg", byCourse["main-non_veg"] || []);
    addDemand(withBuffer, "beverage", "all", byCourse["beverage-all"] || []);
    addDemand(withBuffer, "dessert", "all", byCourse["dessert-all"] || []);

    const availableByCategory = items.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + Math.max(0, Number(item.currentStock || 0));
      return acc;
    }, {});

    const ingredientChecks = Array.from(requiredByIngredient.values()).map(({ inventoryItem, quantity }) => {
      const available = Number(inventoryItem.currentStock || 0);
      const shortfall = Math.max(0, quantity - available);
      return {
        id: inventoryItem._id,
        name: inventoryItem.name,
        category: inventoryItem.category,
        unit: inventoryItem.unit,
        required: quantity,
        available,
        shortfall,
      };
    });

    const categoriesCheck = Object.entries(requiredByCategory).map(([category, required]) => {
      const available = availableByCategory[category] || 0;
      const shortfall = Math.max(0, required - available);
      const ingredientShortages = ingredientChecks.filter((entry) => entry.category === category && entry.shortfall > 0);
      const lowItems = items
        .filter((item) => item.category === category)
        .sort((a, b) => (a.currentStock - a.minimumThreshold) - (b.currentStock - b.minimumThreshold))
        .slice(0, 3)
        .map((item) => item.name);
      const suggestionBase = categoryRestockIdeas[category] || categoryRestockIdeas.other;
      const suggestion = ingredientShortages.length
        ? `Increase ${ingredientShortages.map((entry) => `${entry.name} (${entry.shortfall.toFixed(1)} ${entry.unit})`).join(", ")}.`
        : lowItems.length
        ? `Top up ${lowItems.join(", ")} first. If stock is still tight, add ${suggestionBase.slice(0, 2).join(" and ")}.`
        : `Consider adding ${suggestionBase.slice(0, 3).join(", ")} for this event.`;

      return {
        category,
        required,
        available,
        shortfall,
        status: shortfall > 0 ? "short" : "ok",
        suggestion,
      };
    });

    const shortages = categoriesCheck.filter((entry) => entry.shortfall > 0);
    const recommendations = [];
    const mappedSelectionCount = selectedMenu.filter((item) => item.recipeIngredients?.length).length;
    const recommendedSelections = menuItems
      .filter((item) => (item.suitablePartyTypes || []).includes(plannerForm.partyType))
      .slice(0, 8);
    if (!selectedMenu.length) recommendations.push("Select starters, mains, beverages, or desserts to generate event demand.");
    if (!shortages.length && selectedMenu.length) recommendations.push("Current live stock looks broadly sufficient for the selected party setup with the chosen safety buffer.");
    if (shortages.length) recommendations.push(`Focus your restock on ${shortages.map((entry) => titleize(entry.category)).join(", ")} before confirming this party menu.`);
    if (ingredientChecks.length) recommendations.push("Recipe-based ingredient checks are active for the menu items that already have ingredient mappings.");
    if (!ingredientChecks.length && selectedMenu.length) recommendations.push("Some selected menu items still rely on heuristic planning because recipe ingredients have not been mapped yet.");
    if (mappedSelectionCount > 0 && selectedMenu.length) recommendations.push(`${mappedSelectionCount} of ${selectedMenu.length} selected menu items are using mapped ingredients for accurate party planning.`);
    if ((byCourse["starter-veg"]?.length || 0) + (byCourse["starter-non_veg"]?.length || 0) === 0) recommendations.push("Add at least one starter selection so the planner can estimate appetizer demand.");
    if ((byCourse["main-veg"]?.length || 0) + (byCourse["main-non_veg"]?.length || 0) === 0) recommendations.push("Choose one or more main-course items to get a meaningful meal-stock prediction.");
    if (nonVegGuests > vegGuests) recommendations.push("Because non-veg guests are the majority, keep extra protein stock beyond the normal threshold.");
    if (recommendedSelections.length && !selectedMenu.some((item) => (item.suitablePartyTypes || []).includes(plannerForm.partyType))) recommendations.push(`Consider adding some ${plannerForm.partyType.toLowerCase()}-friendly menu items that are already tagged in Menu Manager.`);
    if (plannerForm.notes.trim()) recommendations.push(`Planner note considered: ${plannerForm.notes.trim()}`);

    return {
      guestCounts: { veg: vegGuests, nonVeg: nonVegGuests },
      selectedMenu,
      categories: categoriesCheck,
      ingredientChecks,
      topShortages: ingredientChecks.filter((entry) => entry.shortfall > 0).sort((a, b) => b.shortfall - a.shortfall).slice(0, 6),
      recommendedSelections,
      recipeCoverage: selectedMenu.length ? Math.round((mappedSelectionCount / selectedMenu.length) * 100) : 0,
      multiplier: overallMultiplier,
      recommendations,
      isSufficient: shortages.length === 0 && selectedMenu.length > 0,
      summaryText: selectedMenu.length
        ? `${selectedMenu.length} menu item${selectedMenu.length > 1 ? "s" : ""} selected. The planner is using current stock levels, party size, guest split, ${plannerForm.serviceStyle.toLowerCase()} service, a ${plannerForm.repeatRate}% repeat-serving factor, and a ${plannerForm.bufferPercent}% safety margin.`
        : "No menu selections yet, so the planner is waiting for your course choices before estimating stock demand.",
    };
  }, [items, menuItems, plannerForm]);

  const loadInventory = async () => {
    const data = await inventoryService.getInventory(token);
    setItems(data?.items || []);
    setStats(data?.stats || null);
    if (data?.metadata?.categories?.length) setCategories(data.metadata.categories);
    if (data?.metadata?.units?.length) setUnits(data.metadata.units);
  };

  const loadMetadata = async () => {
    const data = await inventoryService.getMetadata(token);
    setCategories(data?.categories || []);
    setUnits(data?.units || []);
    setItemForm((prev) => ({
      ...prev,
      category: prev.category || data?.categories?.[0]?.name || "",
      unit: prev.unit || data?.units?.[0]?.code || "",
    }));
  };

  const loadMenuItems = async () => {
    const data = await menuService.getPlannerMenuData(token);
    setMenuItems(data?.items || []);
  };

  const loadTransactions = async () => {
    const data = await inventoryService.getTransactions(token, { limit: 40 });
    setTransactions(data?.transactions || []);
  };

  const loadOrders = async () => {
    const data = await orderService.getOrders(token);
    setOrders(data?.orders || []);
  };

  const loadExpenses = async () => {
    const data = await inventoryService.getExpenses(token);
    setExpenses(data?.expenses || []);
  };

  const loadStockRequests = async () => {
    const data = await inventoryService.getStockRequests(token);
    setStockRequests(data?.stockRequests || []);
  };

  const loadSuppliers = async () => {
    const data = await inventoryService.getSuppliers(token);
    setSuppliers(data?.suppliers || []);
  };

  const loadPurchaseOrders = async () => {
    const data = await inventoryService.getPurchaseOrders(token);
    setPurchaseOrders(data?.purchaseOrders || []);
    setPurchaseSummary(data?.summary || { totalOrders: 0, totalValue: 0, totalPaid: 0, totalDue: 0 });
  };

  const refreshAll = async () => {
    setLoading(true);
    try {
      await Promise.all([loadInventory(), loadMetadata(), loadMenuItems(), loadTransactions(), loadSuppliers(), loadPurchaseOrders(), loadOrders(), loadExpenses(), loadStockRequests()]);
    } catch (err) {
      setMessage({ type: "error", text: err?.response?.data?.message || "Failed to load inventory workspace" });
    } finally {
      setLoading(false);
    }
  };

  const resetItemForm = () => {
    setItemForm({
      ...initialItemForm,
      category: activeCategories[0]?.name || "",
      unit: activeUnits[0]?.code || "",
    });
    setEditingItemId(null);
  };

  const resetCategoryForm = () => {
    setCategoryForm(initialCategoryForm);
    setEditingCategoryId(null);
  };

  const resetUnitForm = () => {
    setUnitForm(initialUnitForm);
    setEditingUnitId(null);
  };

  const resetSupplierForm = () => {
    setSupplierForm(initialSupplierForm);
    setEditingSupplierId(null);
  };

  const resetExpenseForm = () => {
    setExpenseForm({
      ...initialExpenseForm,
      expenseDate: new Date().toISOString().slice(0, 10),
    });
    setEditingExpenseId(null);
  };

  const resetStockRequestForm = () => {
    setStockRequestForm(initialStockRequestForm);
  };

  const resetPurchaseOrderForm = () => {
    setPurchaseOrderForm({
      ...initialPurchaseOrderForm,
      supplier: suppliers[0]?._id || "",
    });
  };

  const getStockStatus = (item) => {
    if (item.currentStock < item.minimumThreshold) {
      return { label: "Low Stock", className: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300" };
    }
    if (item.currentStock >= item.maximumStock) {
      return { label: "Full", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300" };
    }
    return { label: "Healthy", className: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300" };
  };

  const handleItemSubmit = async (event) => {
    event.preventDefault();
    if (!canManageInventory) {
      setMessage({ type: "error", text: "Only admin or manager accounts can create live inventory records" });
      return;
    }
    setSubmitting(true);
    try {
      if (editingItemId) await inventoryService.updateItem(token, editingItemId, itemForm);
      else await inventoryService.createItem(token, itemForm);
      setMessage({ type: "success", text: `Inventory item ${editingItemId ? "updated" : "created"} successfully` });
      resetItemForm();
      setShowItemForm(false);
      await refreshAll();
    } catch (err) {
      setMessage({ type: "error", text: err?.response?.data?.message || "Failed to save inventory item" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCategorySubmit = async (event) => {
    event.preventDefault();
    if (!canManageInventory) {
      setMessage({ type: "error", text: "Only admin or manager accounts can manage categories" });
      return;
    }
    setSubmitting(true);
    try {
      if (editingCategoryId) {
        await inventoryService.updateCategory(token, editingCategoryId, {
          ...categoryForm,
          previousName: categories.find((category) => category._id === editingCategoryId)?.name || "",
        });
      } else {
        await inventoryService.createCategory(token, categoryForm);
      }
      setMessage({ type: "success", text: `Category ${editingCategoryId ? "updated" : "created"} successfully` });
      resetCategoryForm();
      await refreshAll();
    } catch (err) {
      setMessage({ type: "error", text: err?.response?.data?.message || "Failed to save category" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUnitSubmit = async (event) => {
    event.preventDefault();
    if (!canManageInventory) {
      setMessage({ type: "error", text: "Only admin or manager accounts can manage units" });
      return;
    }
    setSubmitting(true);
    try {
      if (editingUnitId) {
        await inventoryService.updateUnit(token, editingUnitId, {
          ...unitForm,
          previousCode: units.find((unit) => unit._id === editingUnitId)?.code || "",
        });
      } else {
        await inventoryService.createUnit(token, unitForm);
      }
      setMessage({ type: "success", text: `Unit ${editingUnitId ? "updated" : "created"} successfully` });
      resetUnitForm();
      await refreshAll();
    } catch (err) {
      setMessage({ type: "error", text: err?.response?.data?.message || "Failed to save unit" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSupplierSubmit = async (event) => {
    event.preventDefault();
    if (!canManageInventory) {
      setMessage({ type: "error", text: "Only admin or manager accounts can manage suppliers" });
      return;
    }
    setSubmitting(true);
    try {
      if (editingSupplierId) await inventoryService.updateSupplier(token, editingSupplierId, supplierForm);
      else await inventoryService.createSupplier(token, supplierForm);
      setMessage({ type: "success", text: `Supplier ${editingSupplierId ? "updated" : "created"} successfully` });
      resetSupplierForm();
      await refreshAll();
    } catch (err) {
      setMessage({ type: "error", text: err?.response?.data?.message || "Failed to save supplier" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleExpenseSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      if (editingExpenseId) await inventoryService.updateExpense(token, editingExpenseId, expenseForm);
      else await inventoryService.createExpense(token, expenseForm);
      setMessage({ type: "success", text: `Expense ${editingExpenseId ? "updated" : "created"} successfully` });
      resetExpenseForm();
      await refreshAll();
    } catch (err) {
      setMessage({ type: "error", text: err?.response?.data?.message || "Failed to save expense" });
    } finally {
      setSubmitting(false);
    }
  };

  const addStockRequestLine = () =>
    setStockRequestForm((prev) => ({
      ...prev,
      items: [...prev.items, { inventoryItem: "", requestedQuantity: "", notes: "" }],
    }));

  const updateStockRequestLine = (index, key, value) =>
    setStockRequestForm((prev) => ({
      ...prev,
      items: prev.items.map((line, lineIndex) => (lineIndex === index ? { ...line, [key]: value } : line)),
    }));

  const removeStockRequestLine = (index) =>
    setStockRequestForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, lineIndex) => lineIndex !== index),
    }));

  const handleStockRequestSubmit = async (event) => {
    event.preventDefault();
    if (!canRequestStock) {
      setMessage({ type: "error", text: "You do not have permission to create stock requests" });
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        priority: stockRequestForm.priority,
        justification: stockRequestForm.justification,
        items: stockRequestForm.items
          .filter((line) => line.inventoryItem && line.requestedQuantity !== "")
          .map((line) => ({
            inventoryItem: line.inventoryItem,
            requestedQuantity: Number(line.requestedQuantity),
            notes: line.notes || "",
          })),
      };
      await inventoryService.createStockRequest(token, payload);
      setMessage({ type: "success", text: "Stock request created successfully" });
      resetStockRequestForm();
      await refreshAll();
    } catch (err) {
      setMessage({ type: "error", text: err?.response?.data?.message || "Failed to create stock request" });
    } finally {
      setSubmitting(false);
    }
  };

  const approveStockRequest = async (request) => {
    if (!canManageInventory) {
      setMessage({ type: "error", text: "Only admin or manager accounts can approve stock requests" });
      return;
    }

    const supplierPrompt = window.prompt(
      `Enter supplier name for ${request.requestNumber}.\nAvailable: ${suppliers.map((supplier) => supplier.name).join(", ")}`,
      suppliers[0]?.name || ""
    );
    if (!supplierPrompt) return;
    const supplier = suppliers.find((entry) => entry.name.toLowerCase() === supplierPrompt.trim().toLowerCase());
    if (!supplier) {
      setMessage({ type: "error", text: "Supplier name did not match an active supplier" });
      return;
    }

    const approvalItems = [];
    for (const item of request.items || []) {
      const orderedQuantityInput = window.prompt(`Approved quantity for ${item.itemName} (${item.requestedQuantity} ${item.unit} requested):`, String(item.requestedQuantity));
      if (orderedQuantityInput === null) return;
      const unitPriceInput = window.prompt(`Unit price for ${item.itemName}:`, "0");
      if (unitPriceInput === null) return;
      approvalItems.push({
        inventoryItem: item.inventoryItem,
        orderedQuantity: Number(orderedQuantityInput),
        unitPrice: Number(unitPriceInput),
        notes: item.notes || "",
      });
    }

    const managerNote = window.prompt("Manager note for approval:", "") || "";
    try {
      await inventoryService.approveStockRequest(token, request._id, {
        supplier: supplier._id,
        items: approvalItems,
        managerNote,
        notes: managerNote,
      });
      setMessage({ type: "success", text: `Stock request ${request.requestNumber} approved and converted to purchase order` });
      await refreshAll();
    } catch (err) {
      setMessage({ type: "error", text: err?.response?.data?.message || "Failed to approve stock request" });
    }
  };

  const rejectStockRequest = async (request) => {
    if (!canManageInventory) {
      setMessage({ type: "error", text: "Only admin or manager accounts can reject stock requests" });
      return;
    }
    const managerNote = window.prompt(`Reason for rejecting ${request.requestNumber}:`, "") || "";
    try {
      await inventoryService.rejectStockRequest(token, request._id, { managerNote });
      setMessage({ type: "success", text: `Stock request ${request.requestNumber} rejected` });
      await refreshAll();
    } catch (err) {
      setMessage({ type: "error", text: err?.response?.data?.message || "Failed to reject stock request" });
    }
  };

  const handleEditExpense = (expense) => {
    setEditingExpenseId(expense._id);
    setExpenseForm({
      title: expense.title || "",
      category: expense.category || "Utilities",
      amount: expense.amount ?? "",
      expenseDate: String(expense.expenseDate || "").slice(0, 10),
      notes: expense.notes || "",
    });
    setActiveView("finance");
  };

  const handleDeleteExpense = async (id) => {
    if (!window.confirm("Delete this expense?")) return;
    try {
      await inventoryService.deleteExpense(token, id);
      setMessage({ type: "success", text: "Expense deleted successfully" });
      await refreshAll();
    } catch (err) {
      setMessage({ type: "error", text: err?.response?.data?.message || "Failed to delete expense" });
    }
  };

  const handleRecordWastage = async ({ inventoryItemId, quantity, reason, notes }) => {
    await inventoryService.recordWastage(token, inventoryItemId, { quantity, reason, notes });
    setMessage({ type: "success", text: "Wastage recorded and stock updated successfully" });
    await refreshAll();
  };

  const addPurchaseOrderLine = () =>
    setPurchaseOrderForm((prev) => ({
      ...prev,
      items: [...prev.items, { inventoryItem: "", orderedQuantity: "", unitPrice: "", notes: "" }],
    }));

  const updatePurchaseOrderLine = (index, key, value) =>
    setPurchaseOrderForm((prev) => ({
      ...prev,
      items: prev.items.map((line, lineIndex) => (lineIndex === index ? { ...line, [key]: value } : line)),
    }));

  const removePurchaseOrderLine = (index) =>
    setPurchaseOrderForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, lineIndex) => lineIndex !== index),
    }));

  const handlePurchaseOrderSubmit = async (event) => {
    event.preventDefault();
    if (!canManageInventory) {
      setMessage({ type: "error", text: "Only admin or manager accounts can create purchase orders" });
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        supplier: purchaseOrderForm.supplier,
        status: purchaseOrderForm.status,
        notes: purchaseOrderForm.notes,
        expectedDeliveryDate: purchaseOrderForm.expectedDeliveryDate || null,
        totalPaid: purchaseOrderForm.totalPaid === "" ? 0 : Number(purchaseOrderForm.totalPaid),
        paymentMethod: purchaseOrderForm.paymentMethod,
        paymentNote: purchaseOrderForm.paymentNote,
        items: purchaseOrderForm.items
          .filter((line) => line.inventoryItem && line.orderedQuantity !== "" && line.unitPrice !== "")
          .map((line) => ({
            inventoryItem: line.inventoryItem,
            orderedQuantity: Number(line.orderedQuantity),
            unitPrice: Number(line.unitPrice),
            notes: line.notes || "",
          })),
      };
      await inventoryService.createPurchaseOrder(token, payload);
      setMessage({ type: "success", text: "Purchase order created successfully" });
      resetPurchaseOrderForm();
      await refreshAll();
    } catch (err) {
      setMessage({ type: "error", text: err?.response?.data?.message || "Failed to create purchase order" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditItem = (item) => {
    setEditingItemId(item._id);
    setItemForm({
      ...item,
      category: item.category || activeCategories[0]?.name || "",
      unit: item.unit || activeUnits[0]?.code || "",
      currentStock: toNumber(item.currentStock),
      minimumThreshold: toNumber(item.minimumThreshold, 10),
      maximumStock: toNumber(item.maximumStock, 100),
      unitCost: toNumber(item.unitCost),
    });
    setShowItemForm(true);
    setActiveView("items");
  };

  const handleDeleteItem = async (id) => {
    if (!canManageInventory) {
      setMessage({ type: "error", text: "Only admin or manager accounts can delete inventory items" });
      return;
    }
    if (!window.confirm("Delete this inventory item?")) return;
    try {
      await inventoryService.deleteItem(token, id);
      setMessage({ type: "success", text: "Inventory item deleted successfully" });
      await refreshAll();
    } catch (err) {
      setMessage({ type: "error", text: err?.response?.data?.message || "Failed to delete inventory item" });
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!canManageInventory) {
      setMessage({ type: "error", text: "Only admin or manager accounts can manage categories" });
      return;
    }
    if (!window.confirm("Delete this category?")) return;
    try {
      await inventoryService.deleteCategory(token, id);
      setMessage({ type: "success", text: "Category deleted successfully" });
      await refreshAll();
    } catch (err) {
      setMessage({ type: "error", text: err?.response?.data?.message || "Failed to delete category" });
    }
  };

  const handleDeleteUnit = async (id) => {
    if (!canManageInventory) {
      setMessage({ type: "error", text: "Only admin or manager accounts can manage units" });
      return;
    }
    if (!window.confirm("Delete this unit?")) return;
    try {
      await inventoryService.deleteUnit(token, id);
      setMessage({ type: "success", text: "Unit deleted successfully" });
      await refreshAll();
    } catch (err) {
      setMessage({ type: "error", text: err?.response?.data?.message || "Failed to delete unit" });
    }
  };

  const handleEditSupplier = (supplier) => {
    setEditingSupplierId(supplier._id);
    setSupplierForm({
      name: supplier.name || "",
      contactPerson: supplier.contactPerson || "",
      email: supplier.email || "",
      phone: supplier.phone || "",
      address: supplier.address || "",
      taxId: supplier.taxId || "",
      notes: supplier.notes || "",
      isActive: supplier.isActive !== false,
    });
    setActiveView("suppliers");
  };

  const handleDeleteSupplier = async (id) => {
    if (!canManageInventory) {
      setMessage({ type: "error", text: "Only admin or manager accounts can manage suppliers" });
      return;
    }
    if (!window.confirm("Delete or deactivate this supplier?")) return;
    try {
      await inventoryService.deleteSupplier(token, id);
      setMessage({ type: "success", text: "Supplier deleted or deactivated successfully" });
      await refreshAll();
    } catch (err) {
      setMessage({ type: "error", text: err?.response?.data?.message || "Failed to delete supplier" });
    }
  };

  const recordPurchasePayment = async (order) => {
    if (!canRecordPayments) {
      setMessage({ type: "error", text: "You do not have permission to record purchase payments" });
      return;
    }
    const amountInput = window.prompt(`Enter payment amount for ${order.purchaseOrderNumber}:`, String(order.balanceDue || 0));
    if (!amountInput) return;
    const amount = Number(amountInput);
    if (!Number.isFinite(amount) || amount <= 0) {
      setMessage({ type: "error", text: "Enter a valid positive payment amount" });
      return;
    }
    const method = window.prompt("Payment method (cash, bank_transfer, upi, card, other):", "other") || "other";
    const note = window.prompt("Payment note:", "") || "";
    try {
      await inventoryService.recordPurchasePayment(token, order._id, { amount, method, note });
      setMessage({ type: "success", text: `Payment recorded for ${order.purchaseOrderNumber}` });
      await refreshAll();
    } catch (err) {
      setMessage({ type: "error", text: err?.response?.data?.message || "Failed to record payment" });
    }
  };

  const receivePurchaseOrder = async (order) => {
    if (!canManageInventory) {
      setMessage({ type: "error", text: "Only admin or manager accounts can receive purchase stock" });
      return;
    }
    const receivableItems = (order.items || []).filter((item) => Number(item.orderedQuantity || 0) > Number(item.receivedQuantity || 0));
    if (!receivableItems.length) {
      setMessage({ type: "success", text: "This purchase order is already fully received" });
      return;
    }

    const updates = [];
    for (const item of receivableItems) {
      const remaining = Number(item.orderedQuantity || 0) - Number(item.receivedQuantity || 0);
      const input = window.prompt(`Receive quantity for ${item.itemName} (${remaining} ${item.unit} pending):`, String(remaining));
      if (input === null) continue;
      const quantityReceived = Number(input);
      if (!Number.isFinite(quantityReceived) || quantityReceived <= 0) continue;
      updates.push({
        inventoryItem: item.inventoryItem,
        quantityReceived,
        notes: `Received from ${order.purchaseOrderNumber}`,
      });
    }

    if (!updates.length) return;

    try {
      await inventoryService.receivePurchaseOrderItems(token, order._id, { items: updates });
      setMessage({ type: "success", text: `Stock received for ${order.purchaseOrderNumber}` });
      await refreshAll();
    } catch (err) {
      setMessage({ type: "error", text: err?.response?.data?.message || "Failed to receive purchase order stock" });
    }
  };

  const handleDeletePurchaseOrder = async (id) => {
    if (!canManageInventory) {
      setMessage({ type: "error", text: "Only admin or manager accounts can delete purchase orders" });
      return;
    }
    if (!window.confirm("Delete this purchase order?")) return;
    try {
      await inventoryService.deletePurchaseOrder(token, id);
      setMessage({ type: "success", text: "Purchase order deleted successfully" });
      await refreshAll();
    } catch (err) {
      setMessage({ type: "error", text: err?.response?.data?.message || "Failed to delete purchase order" });
    }
  };

  const updateStock = async (id, type) => {
    if (!canAdjustStock) {
      setMessage({ type: "error", text: "You do not have permission to adjust live stock" });
      return;
    }
    const quantityInput = window.prompt(`Enter quantity to ${type}:`, "1");
    if (!quantityInput) return;
    const quantity = parseInt(quantityInput, 10);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      setMessage({ type: "error", text: "Please enter a valid positive quantity" });
      return;
    }
    const reason = window.prompt(`Reason for this ${type === "add" ? "restock" : "usage"}:`, type === "add" ? "Manual restock" : "Kitchen usage") || "";
    const notes = window.prompt("Optional notes for stock history:", "") || "";
    try {
      await inventoryService.updateStock(token, id, { quantity, type, reason, notes });
      setMessage({ type: "success", text: `Stock ${type}ed successfully` });
      await refreshAll();
    } catch (err) {
      setMessage({ type: "error", text: err?.response?.data?.message || "Failed to update stock" });
    }
  };

  const handleScanImage = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setSelectedImageName(file.name);
    setScanning(true);
    setScanProgress(0);
    setScanText("");
    setActiveView("scanner");
    try {
      const { default: Tesseract } = await import("tesseract.js");
      const result = await Tesseract.recognize(file, "eng", {
        logger: (entry) => {
          if (entry.status === "recognizing text") setScanProgress(Math.round(entry.progress * 100));
        },
      });
      const extractedText = result?.data?.text || "";
      const parsedDrafts = parseDraftsFromScan(extractedText, activeCategories, activeUnits);
      setScanText(extractedText);
      setDrafts((prev) => [...parsedDrafts, ...prev]);
      setMessage({
        type: parsedDrafts.length ? "success" : "error",
        text: parsedDrafts.length
          ? `${parsedDrafts.length} draft item${parsedDrafts.length > 1 ? "s" : ""} created from scan`
          : "Text was read, but no draft rows could be structured automatically. You can still add items manually below.",
      });
    } catch (err) {
      setMessage({ type: "error", text: err?.message || "Image scan failed" });
    } finally {
      setScanning(false);
    }
  };

  const addManualDraft = () => {
    setDrafts((prev) => [createDraft({ category: activeCategories[0]?.name || "", unit: activeUnits[0]?.code || "" }), ...prev]);
    setActiveView("scanner");
  };

  const updateDraft = (draftId, field, value) => {
    setDrafts((prev) =>
      prev.map((draft) =>
        draft.draftId === draftId
          ? { ...draft, [field]: ["currentStock", "minimumThreshold", "maximumStock", "unitCost"].includes(field) ? toNumber(value) : value }
          : draft
      )
    );
  };

  const removeDraft = (draftId) => setDrafts((prev) => prev.filter((draft) => draft.draftId !== draftId));

  const getMatchingCandidates = (draft) =>
    items
      .map((item) => {
        const sameCategory = normalizeInventoryMatchValue(item.category) === normalizeInventoryMatchValue(draft.category);
        const sameUnit = normalizeInventoryMatchValue(item.unit) === normalizeInventoryMatchValue(draft.unit);
        const nameScore = getInventoryNameSimilarity(item.name, draft.name);
        const exactName = normalizeInventoryMatchValue(item.name) === normalizeInventoryMatchValue(draft.name);
        const totalScore =
          (exactName ? 1 : nameScore) +
          (sameCategory ? 0.2 : 0) +
          (sameUnit ? 0.2 : 0);

        return {
          item,
          exactName,
          sameCategory,
          sameUnit,
          nameScore,
          totalScore: Number(totalScore.toFixed(2)),
        };
      })
      .filter((candidate) => candidate.exactName || (candidate.nameScore >= 0.72 && (candidate.sameCategory || candidate.sameUnit)))
      .sort((left, right) => right.totalScore - left.totalScore);

  const findMatchingInventoryItem = (draft) => getMatchingCandidates(draft)[0]?.item || null;

  const saveDraftToInventory = async (draft) => {
    const matchingItem = findMatchingInventoryItem(draft);
    const stockQuantity = Math.max(0, toNumber(draft.currentStock));

    if (matchingItem) {
      if (stockQuantity > 0) {
        await inventoryService.updateStock(token, matchingItem._id, {
          quantity: stockQuantity,
          type: "add",
          reason: "Scanner draft stock merge",
          notes: `Merged from ${draft.source === "scan" ? "OCR scan" : "manual scanner draft"}`,
        });
      }

      await inventoryService.updateItem(token, matchingItem._id, {
        description: draft.description || matchingItem.description || "",
        category: draft.category,
        unit: draft.unit,
        minimumThreshold: Math.max(1, toNumber(draft.minimumThreshold, matchingItem.minimumThreshold || 10)),
        maximumStock: Math.max(1, toNumber(draft.maximumStock, matchingItem.maximumStock || 100)),
        unitCost: Math.max(0, toNumber(draft.unitCost, matchingItem.unitCost || 0)),
        supplier: draft.supplier || matchingItem.supplier || "",
        location: draft.location || matchingItem.location || "",
      });

      return { mode: "updated", itemName: matchingItem.name };
    }

    await inventoryService.createItem(token, {
      name: draft.name,
      description: draft.description,
      category: draft.category,
      unit: draft.unit,
      currentStock: stockQuantity,
      minimumThreshold: Math.max(1, toNumber(draft.minimumThreshold, 10)),
      maximumStock: Math.max(1, toNumber(draft.maximumStock, 100)),
      unitCost: Math.max(0, toNumber(draft.unitCost)),
      supplier: draft.supplier,
      location: draft.location,
    });

    return { mode: "created", itemName: draft.name };
  };

  const saveDraft = async (draftId) => {
    if (!canManageInventory) {
      setMessage({ type: "error", text: "Only admin or manager accounts can save drafts into the database" });
      return;
    }
    const draft = drafts.find((entry) => entry.draftId === draftId);
    if (!draft) return;
    if (!draft.name || !draft.category || !draft.unit) {
      setMessage({ type: "error", text: "Draft needs name, category, and unit before saving" });
      return;
    }
    try {
      const result = await saveDraftToInventory(draft);
      setDrafts((prev) => prev.filter((entry) => entry.draftId !== draftId));
      setMessage({
        type: "success",
        text: result.mode === "updated" ? `Draft merged into existing item: ${result.itemName}` : "Draft saved to inventory database",
      });
      await refreshAll();
    } catch (err) {
      setMessage({ type: "error", text: err?.response?.data?.message || "Failed to save draft" });
    }
  };

  const saveAllDrafts = async () => {
    if (!canManageInventory) {
      setMessage({ type: "error", text: "Only admin or manager accounts can save drafts into the database" });
      return;
    }
    if (!drafts.length) return;
    setSubmitting(true);
    try {
      let createdCount = 0;
      let updatedCount = 0;
      for (const draft of drafts) {
        if (!draft.name || !draft.category || !draft.unit) continue;
        const result = await saveDraftToInventory(draft);
        if (result.mode === "updated") updatedCount += 1;
        if (result.mode === "created") createdCount += 1;
      }
      setDrafts([]);
      setMessage({
        type: "success",
        text: `Draft sync complete: ${createdCount} created, ${updatedCount} stock-updated`,
      });
      await refreshAll();
    } catch (err) {
      setMessage({ type: "error", text: err?.response?.data?.message || "Failed while saving draft items" });
    } finally {
      setSubmitting(false);
    }
  };

  const renderContent = () => {
    if (loading) {
      return <p className="py-20 text-center text-sm font-semibold text-slate-600 dark:text-slate-300">Loading inventory workspace...</p>;
    }
    if (activeView === "dashboard") {
      return <InventoryDashboardView summaryCards={summaryCards} categoryChartData={categoryChartData} topValueItems={topValueItems} categoryValueData={categoryValueData} stockHealthData={stockHealthData} lowStockItems={lowStockItems} draftsCount={drafts.length} recentTransactions={recentTransactions} topMovingItems={topMovingItems} procurementInsights={procurementInsights} dashboardAlerts={dashboardAlerts} financeMetrics={financeMetrics} financeFilters={financeFilters} setFinanceFilters={setFinanceFilters} onOpenScanner={() => setActiveView("scanner")} onOpenAddItem={() => { setActiveView("items"); setShowItemForm(true); }} onOpenItems={() => setActiveView("items")} onOpenFinance={() => setActiveView("finance")} canManageInventory={canManageInventory} />;
    }
    if (activeView === "finance") {
      return <InventoryFinanceView financeMetrics={financeMetrics} financeFilters={financeFilters} setFinanceFilters={setFinanceFilters} expenseForm={expenseForm} setExpenseForm={setExpenseForm} editingExpenseId={editingExpenseId} submitting={submitting} handleExpenseSubmit={handleExpenseSubmit} resetExpenseForm={resetExpenseForm} onEditExpense={handleEditExpense} onDeleteExpense={handleDeleteExpense} inventoryItems={items} onRecordWastage={handleRecordWastage} />;
    }
    if (activeView === "items") {
      return <InventoryItemsView showItemForm={showItemForm} setShowItemForm={setShowItemForm} editingItemId={editingItemId} itemForm={itemForm} setItemForm={setItemForm} activeCategories={activeCategories} activeUnits={activeUnits} suppliers={activeSuppliers} submitting={submitting} handleItemSubmit={handleItemSubmit} resetItemForm={resetItemForm} filterCategory={filterCategory} setFilterCategory={setFilterCategory} filteredItems={filteredItems} updateStock={updateStock} handleEditItem={handleEditItem} handleDeleteItem={handleDeleteItem} getStockStatus={getStockStatus} canManageInventory={canManageInventory} canAdjustStock={canAdjustStock} />;
    }
    if (activeView === "planner") {
      return <InventoryPlannerView plannerForm={plannerForm} setPlannerForm={setPlannerForm} menuOptions={menuOptions} plannerResult={plannerResult} togglePlannerSelection={(itemId) => setPlannerForm((prev) => ({ ...prev, selectedItems: prev.selectedItems.includes(itemId) ? prev.selectedItems.filter((id) => id !== itemId) : [...prev.selectedItems, itemId] }))} canManageInventory={canManageInventory} />;
    }
    if (activeView === "stock-history") {
      return <InventoryHistoryView transactions={transactions} />;
    }
    if (activeView === "categories") {
      return <InventoryCategoriesView editingCategoryId={editingCategoryId} categoryForm={categoryForm} setCategoryForm={setCategoryForm} submitting={submitting} handleCategorySubmit={handleCategorySubmit} resetCategoryForm={resetCategoryForm} categories={categories} activeCategories={activeCategories} setEditingCategoryId={setEditingCategoryId} handleDeleteCategory={handleDeleteCategory} canManageInventory={canManageInventory} />;
    }
    if (activeView === "units") {
      return <InventoryUnitsView editingUnitId={editingUnitId} unitForm={unitForm} setUnitForm={setUnitForm} submitting={submitting} handleUnitSubmit={handleUnitSubmit} resetUnitForm={resetUnitForm} units={units} activeUnits={activeUnits} setEditingUnitId={setEditingUnitId} handleDeleteUnit={handleDeleteUnit} canManageInventory={canManageInventory} />;
    }
    if (activeView === "suppliers") {
      return <InventorySuppliersView supplierForm={supplierForm} setSupplierForm={setSupplierForm} editingSupplierId={editingSupplierId} handleSupplierSubmit={handleSupplierSubmit} resetSupplierForm={resetSupplierForm} suppliers={suppliers} canManageInventory={canManageInventory} canRecordPayments={canRecordPayments} submitting={submitting} onEditSupplier={handleEditSupplier} onDeleteSupplier={handleDeleteSupplier} />;
    }
    if (activeView === "purchase-orders") {
      return <InventoryPurchaseOrdersView stockRequestForm={stockRequestForm} setStockRequestForm={setStockRequestForm} stockRequests={stockRequests} purchaseOrderForm={purchaseOrderForm} setPurchaseOrderForm={setPurchaseOrderForm} suppliers={suppliers} items={items} purchaseOrders={purchaseOrders} purchaseSummary={purchaseSummary} canManageInventory={canManageInventory} canRecordPayments={canRecordPayments} canRequestStock={canRequestStock} primaryRole={primaryRole} submitting={submitting} handleStockRequestSubmit={handleStockRequestSubmit} addStockRequestLine={addStockRequestLine} updateStockRequestLine={updateStockRequestLine} removeStockRequestLine={removeStockRequestLine} approveStockRequest={approveStockRequest} rejectStockRequest={rejectStockRequest} handlePurchaseOrderSubmit={handlePurchaseOrderSubmit} addPurchaseOrderLine={addPurchaseOrderLine} updatePurchaseOrderLine={updatePurchaseOrderLine} removePurchaseOrderLine={removePurchaseOrderLine} recordPayment={recordPurchasePayment} receiveOrderStock={receivePurchaseOrder} deletePurchaseOrder={handleDeletePurchaseOrder} />;
    }
    if (activeView === "scanner") {
      return <InventoryScannerView scanning={scanning} selectedImageName={selectedImageName} scanProgress={scanProgress} handleScanImage={handleScanImage} addManualDraft={addManualDraft} saveAllDrafts={saveAllDrafts} drafts={drafts} submitting={submitting} updateDraft={updateDraft} activeCategories={activeCategories} activeUnits={activeUnits} saveDraft={saveDraft} removeDraft={removeDraft} scanText={scanText} canManageInventory={canManageInventory} getMatchingItem={findMatchingInventoryItem} getMatchingCandidates={getMatchingCandidates} />;
    }
    return (
      <section className="card-elevated p-8">
        <h3 className="text-2xl font-black text-slate-900 dark:text-slate-50">Coming Soon</h3>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">This menu entry is wired into the inventory module, so we can implement it next without redesigning the navigation.</p>
      </section>
    );
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="card-elevated h-fit p-4">
        <div className="rounded-[1.5rem] bg-gradient-to-br from-slate-900 via-sky-900 to-cyan-700 p-5 text-white shadow-xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/70">Inventory Module</p>
          <h2 className="mt-2 text-2xl font-black">Dashboard First</h2>
          <p className="mt-2 text-sm leading-6 text-white/80">The inventory button now lands here, and the internal menus below control the rest of the workspace.</p>
        </div>

        <div className="mt-5 space-y-3">
          {navGroups.map((group) => {
            const isOpen = openMenus[group.id];
            return (
              <section key={group.id} className="glass-subtle rounded-[1.4rem] p-3">
                <button type="button" onClick={() => setOpenMenus((prev) => ({ ...prev, [group.id]: !prev[group.id] }))} className="flex w-full items-center justify-between gap-3 px-2 py-2 text-left">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{group.title}</p>
                  {isOpen ? <FiChevronDown className="h-4 w-4 text-slate-500" /> : <FiChevronRight className="h-4 w-4 text-slate-500" />}
                </button>

                {isOpen ? (
                  <div className="mt-2 space-y-2">
                    {group.items.map((item) => {
                      const Icon = iconMap[item.icon] || FiGrid;
                      const isActive = activeView === item.id;
                      return (
                        <button key={item.id} type="button" disabled={item.disabled} onClick={() => !item.disabled && setActiveView(item.id)} className={`flex w-full items-center justify-between rounded-[1rem] px-3 py-3 text-sm font-semibold transition ${item.disabled ? "cursor-not-allowed opacity-60" : ""} ${isActive ? "bg-sky-500 text-white shadow-lg" : "text-slate-700 hover:bg-white/50 dark:text-slate-200 dark:hover:bg-slate-800/30"}`}>
                          <span className="inline-flex items-center gap-3">
                            <Icon className="h-4 w-4" />
                            {item.label}
                          </span>
                          {item.disabled ? <span className="text-[10px] font-bold uppercase tracking-[0.18em]">Soon</span> : null}
                        </button>
                      );
                    })}
                  </div>
                ) : null}
              </section>
            );
          })}
        </div>
      </aside>

      <section className="min-w-0 space-y-6">
        {message.text ? <div className={message.type === "error" ? "alert-error" : "alert-success"}>{message.text}</div> : null}
        {renderContent()}
      </section>
    </div>
  );
};

export default AdminInventory;

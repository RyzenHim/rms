import { useEffect, useMemo, useState } from "react";
import { FiArchive, FiBarChart2, FiBox, FiCalendar, FiCamera, FiChevronDown, FiChevronRight, FiDatabase, FiGrid, FiLayers, FiPackage } from "react-icons/fi";
import inventoryService from "../../services/inventory_Service";
import menuService from "../../services/menu_Service";
import InventoryDashboardView from "./inventory/InventoryDashboardView";
import InventoryItemsView from "./inventory/InventoryItemsView";
import { InventoryCategoriesView, InventoryUnitsView } from "./inventory/InventoryCatalogView";
import InventoryScannerView from "./inventory/InventoryScannerView";
import InventoryPlannerView from "./inventory/InventoryPlannerView";
import { categoryRestockIdeas, createDraft, inferCourse, initialCategoryForm, initialItemForm, initialUnitForm, navGroups, parseDraftsFromScan, partyTypes, plannerProfiles, titleize, toNumber } from "./inventory/inventoryUtils";
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

const AdminInventory = () => {
  const { token, user, getPrimaryRole } = useAuth();
  const primaryRole = getPrimaryRole(user?.roles || []);
  const canManageInventory = ["admin", "manager"].includes(primaryRole);
  const canAdjustStock = ["admin", "manager", "kitchen"].includes(primaryRole);
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState(null);
  const [categories, setCategories] = useState([]);
  const [units, setUnits] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
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
  const [itemForm, setItemForm] = useState(initialItemForm);
  const [categoryForm, setCategoryForm] = useState(initialCategoryForm);
  const [unitForm, setUnitForm] = useState(initialUnitForm);
  const [drafts, setDrafts] = useState([]);
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanText, setScanText] = useState("");
  const [selectedImageName, setSelectedImageName] = useState("");
  const [plannerForm, setPlannerForm] = useState({
    partyType: partyTypes[0],
    partyTypeOptions: partyTypes,
    attendants: 50,
    guestSplitMode: "percentage",
    vegValue: 60,
    bufferPercent: 10,
    notes: "",
    selectedItems: [],
  });

  const activeCategories = useMemo(() => categories.filter((category) => category.isActive !== false), [categories]);
  const activeUnits = useMemo(() => units.filter((unit) => unit.isActive !== false), [units]);

  useEffect(() => {
    if (!token) return;
    refreshAll();
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const lowStockItems = useMemo(
    () => items.filter((item) => item.currentStock < item.minimumThreshold).slice(0, 8),
    [items]
  );

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
    const withBuffer = attendants * (1 + Number(plannerForm.bufferPercent || 0) / 100);
    const selectedMenu = menuItems.filter((item) => plannerForm.selectedItems.includes(item._id));
    const byCourse = selectedMenu.reduce((acc, item) => {
      const course = inferCourse(item);
      const bucket = `${course}-${course === "starter" || course === "main" ? item.foodType : "all"}`;
      acc[bucket] = acc[bucket] || [];
      acc[bucket].push(item);
      return acc;
    }, {});
    const requiredByCategory = {};

    const addDemand = (guestCount, course, type, selectedCount) => {
      const profile = plannerProfiles[course]?.[type] || plannerProfiles[course]?.all;
      if (!profile || !selectedCount || !guestCount) return;
      const share = guestCount / selectedCount;
      Object.entries(profile).forEach(([category, factor]) => {
        requiredByCategory[category] = (requiredByCategory[category] || 0) + share * factor;
      });
    };

    addDemand(vegGuests * (1 + Number(plannerForm.bufferPercent || 0) / 100), "starter", "veg", byCourse["starter-veg"]?.length || 0);
    addDemand(nonVegGuests * (1 + Number(plannerForm.bufferPercent || 0) / 100), "starter", "non_veg", byCourse["starter-non_veg"]?.length || 0);
    addDemand(vegGuests * (1 + Number(plannerForm.bufferPercent || 0) / 100), "main", "veg", byCourse["main-veg"]?.length || 0);
    addDemand(nonVegGuests * (1 + Number(plannerForm.bufferPercent || 0) / 100), "main", "non_veg", byCourse["main-non_veg"]?.length || 0);
    addDemand(withBuffer, "beverage", "all", byCourse["beverage-all"]?.length || 0);
    addDemand(withBuffer, "dessert", "all", byCourse["dessert-all"]?.length || 0);

    const availableByCategory = items.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + Math.max(0, Number(item.currentStock || 0));
      return acc;
    }, {});

    const categoriesCheck = Object.entries(requiredByCategory).map(([category, required]) => {
      const available = availableByCategory[category] || 0;
      const shortfall = Math.max(0, required - available);
      const lowItems = items
        .filter((item) => item.category === category)
        .sort((a, b) => (a.currentStock - a.minimumThreshold) - (b.currentStock - b.minimumThreshold))
        .slice(0, 3)
        .map((item) => item.name);
      const suggestionBase = categoryRestockIdeas[category] || categoryRestockIdeas.other;
      const suggestion = lowItems.length
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
    if (!selectedMenu.length) recommendations.push("Select starters, mains, beverages, or desserts to generate event demand.");
    if (!shortages.length && selectedMenu.length) recommendations.push("Current live stock looks broadly sufficient for the selected party setup with the chosen safety buffer.");
    if (shortages.length) recommendations.push(`Focus your restock on ${shortages.map((entry) => titleize(entry.category)).join(", ")} before confirming this party menu.`);
    if ((byCourse["starter-veg"]?.length || 0) + (byCourse["starter-non_veg"]?.length || 0) === 0) recommendations.push("Add at least one starter selection so the planner can estimate appetizer demand.");
    if ((byCourse["main-veg"]?.length || 0) + (byCourse["main-non_veg"]?.length || 0) === 0) recommendations.push("Choose one or more main-course items to get a meaningful meal-stock prediction.");
    if (nonVegGuests > vegGuests) recommendations.push("Because non-veg guests are the majority, keep extra protein stock beyond the normal threshold.");
    if (plannerForm.notes.trim()) recommendations.push(`Planner note considered: ${plannerForm.notes.trim()}`);

    return {
      guestCounts: { veg: vegGuests, nonVeg: nonVegGuests },
      selectedMenu,
      categories: categoriesCheck,
      recommendations,
      isSufficient: shortages.length === 0 && selectedMenu.length > 0,
      summaryText: selectedMenu.length
        ? `${selectedMenu.length} menu item${selectedMenu.length > 1 ? "s" : ""} selected. The planner is using current stock levels, party size, guest split, and a ${plannerForm.bufferPercent}% safety margin.`
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
    const cached = menuService.getCachedPublicMenu();
    if (cached?.items?.length) {
      setMenuItems(cached.items);
    }
    const data = await menuService.getPublicMenu();
    setMenuItems(data?.items || []);
  };

  const refreshAll = async () => {
    setLoading(true);
    try {
      await Promise.all([loadInventory(), loadMetadata(), loadMenuItems()]);
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
    try {
      await inventoryService.updateStock(token, id, { quantity, type });
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
      await inventoryService.createItem(token, {
        name: draft.name,
        description: draft.description,
        category: draft.category,
        unit: draft.unit,
        currentStock: toNumber(draft.currentStock),
        minimumThreshold: Math.max(1, toNumber(draft.minimumThreshold, 10)),
        maximumStock: Math.max(1, toNumber(draft.maximumStock, 100)),
        unitCost: Math.max(0, toNumber(draft.unitCost)),
        supplier: draft.supplier,
        location: draft.location,
      });
      setDrafts((prev) => prev.filter((entry) => entry.draftId !== draftId));
      setMessage({ type: "success", text: "Draft saved to inventory database" });
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
      for (const draft of drafts) {
        if (!draft.name || !draft.category || !draft.unit) continue;
        await inventoryService.createItem(token, {
          name: draft.name,
          description: draft.description,
          category: draft.category,
          unit: draft.unit,
          currentStock: toNumber(draft.currentStock),
          minimumThreshold: Math.max(1, toNumber(draft.minimumThreshold, 10)),
          maximumStock: Math.max(1, toNumber(draft.maximumStock, 100)),
          unitCost: Math.max(0, toNumber(draft.unitCost)),
          supplier: draft.supplier,
          location: draft.location,
        });
      }
      setDrafts([]);
      setMessage({ type: "success", text: "All valid draft items were saved to the database" });
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
      return <InventoryDashboardView summaryCards={summaryCards} categoryChartData={categoryChartData} topValueItems={topValueItems} stockHealthData={stockHealthData} lowStockItems={lowStockItems} draftsCount={drafts.length} onOpenScanner={() => setActiveView("scanner")} onOpenAddItem={() => { setActiveView("items"); setShowItemForm(true); }} onOpenItems={() => setActiveView("items")} canManageInventory={canManageInventory} />;
    }
    if (activeView === "items") {
      return <InventoryItemsView showItemForm={showItemForm} setShowItemForm={setShowItemForm} editingItemId={editingItemId} itemForm={itemForm} setItemForm={setItemForm} activeCategories={activeCategories} activeUnits={activeUnits} submitting={submitting} handleItemSubmit={handleItemSubmit} resetItemForm={resetItemForm} filterCategory={filterCategory} setFilterCategory={setFilterCategory} filteredItems={filteredItems} updateStock={updateStock} handleEditItem={handleEditItem} handleDeleteItem={handleDeleteItem} getStockStatus={getStockStatus} canManageInventory={canManageInventory} canAdjustStock={canAdjustStock} />;
    }
    if (activeView === "planner") {
      return <InventoryPlannerView plannerForm={plannerForm} setPlannerForm={setPlannerForm} menuOptions={menuOptions} plannerResult={plannerResult} togglePlannerSelection={(itemId) => setPlannerForm((prev) => ({ ...prev, selectedItems: prev.selectedItems.includes(itemId) ? prev.selectedItems.filter((id) => id !== itemId) : [...prev.selectedItems, itemId] }))} canManageInventory={canManageInventory} />;
    }
    if (activeView === "categories") {
      return <InventoryCategoriesView editingCategoryId={editingCategoryId} categoryForm={categoryForm} setCategoryForm={setCategoryForm} submitting={submitting} handleCategorySubmit={handleCategorySubmit} resetCategoryForm={resetCategoryForm} categories={categories} activeCategories={activeCategories} setEditingCategoryId={setEditingCategoryId} handleDeleteCategory={handleDeleteCategory} canManageInventory={canManageInventory} />;
    }
    if (activeView === "units") {
      return <InventoryUnitsView editingUnitId={editingUnitId} unitForm={unitForm} setUnitForm={setUnitForm} submitting={submitting} handleUnitSubmit={handleUnitSubmit} resetUnitForm={resetUnitForm} units={units} activeUnits={activeUnits} setEditingUnitId={setEditingUnitId} handleDeleteUnit={handleDeleteUnit} canManageInventory={canManageInventory} />;
    }
    if (activeView === "scanner") {
      return <InventoryScannerView scanning={scanning} selectedImageName={selectedImageName} scanProgress={scanProgress} handleScanImage={handleScanImage} addManualDraft={addManualDraft} saveAllDrafts={saveAllDrafts} drafts={drafts} submitting={submitting} updateDraft={updateDraft} activeCategories={activeCategories} activeUnits={activeUnits} saveDraft={saveDraft} removeDraft={removeDraft} scanText={scanText} canManageInventory={canManageInventory} />;
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

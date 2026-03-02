import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import menuService from "../../services/menu_Service";

const emptyCategoryForm = { name: "", description: "", image: "", sortOrder: 0, isActive: true };
const emptySubCategoryForm = {
  name: "",
  category: "",
  heading: "",
  subHeading: "",
  description: "",
  image: "",
  sortOrder: 0,
  isActive: true,
};
const emptyItemForm = {
  name: "",
  heading: "",
  subHeading: "",
  description: "",
  shortDescription: "",
  category: "",
  subCategory: "",
  foodType: "non_veg",
  image: "",
  price: "",
  compareAtPrice: "",
  discountLabel: "",
  prepTimeMinutes: 20,
  spiceLevel: "none",
  stockStatus: "in_stock",
  isFeatured: false,
  isActive: true,
  portions: [{ label: "", quantityText: "", price: "" }],
};


const AdminMenuManager = () => {
  const { token } = useAuth();
  const [message, setMessage] = useState({ type: "", text: "" });
  const [loading, setLoading] = useState(false);
  const [categorySaving, setCategorySaving] = useState(false);
  const [subCategorySaving, setSubCategorySaving] = useState(false);
  const [itemSaving, setItemSaving] = useState(false);
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [pdfMeta, setPdfMeta] = useState(null);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [categoryForm, setCategoryForm] = useState(emptyCategoryForm);
  const [subCategoryForm, setSubCategoryForm] = useState(emptySubCategoryForm);
  const [itemForm, setItemForm] = useState(emptyItemForm);
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [editingSubCategoryId, setEditingSubCategoryId] = useState(null);
  const [editingItemId, setEditingItemId] = useState(null);
  const [itemSearch, setItemSearch] = useState("");

  const activeCategories = useMemo(() => categories.filter((c) => c.isActive), [categories]);
  const filteredSubCategories = useMemo(() => {
    if (!itemForm.category) return subCategories;
    return subCategories.filter((subCategory) => subCategory.category?._id === itemForm.category);
  }, [subCategories, itemForm.category]);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await menuService.getAdminMenuData(token);
      setCategories(data.categories || []);
      setSubCategories(data.subCategories || []);
      setItems(data.items || []);
      setPdfMeta(data.menuPdf || null);
    } catch (err) {
      setMessage({ type: "error", text: err?.response?.data?.message || "Unable to load menu management data" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fileToBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const onPdfChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      setMessage({ type: "error", text: "Please select a valid PDF file" });
      return;
    }
    setUploadingPdf(true);
    try {
      const base64 = await fileToBase64(file);
      const res = await menuService.updateMenuPdf(token, base64);
      setPdfMeta(res.menuPdf || null);
      setMessage({ type: "success", text: "Menu PDF updated successfully" });
    } catch (err) {
      setMessage({ type: "error", text: err?.response?.data?.message || "Menu PDF update failed" });
    } finally {
      setUploadingPdf(false);
    }
  };

  const resetCategoryForm = () => {
    setCategoryForm(emptyCategoryForm);
    setEditingCategoryId(null);
  };
  const resetSubCategoryForm = () => {
    setSubCategoryForm(emptySubCategoryForm);
    setEditingSubCategoryId(null);
  };
  const resetItemForm = () => {
    setItemForm(emptyItemForm);
    setEditingItemId(null);
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    if (categorySaving) return;
    setCategorySaving(true);
    try {
      if (editingCategoryId) await menuService.updateCategory(token, editingCategoryId, categoryForm);
      else await menuService.createCategory(token, categoryForm);
      setMessage({ type: "success", text: editingCategoryId ? "Category updated" : "Category created" });
      resetCategoryForm();
      await loadData();
    } catch (err) {
      setMessage({ type: "error", text: err?.response?.data?.message || "Category save failed" });
    } finally {
      setCategorySaving(false);
    }
  };

  const handleSubCategorySubmit = async (e) => {
    e.preventDefault();
    if (subCategorySaving) return;
    setSubCategorySaving(true);
    try {
      if (editingSubCategoryId) await menuService.updateSubCategory(token, editingSubCategoryId, subCategoryForm);
      else await menuService.createSubCategory(token, subCategoryForm);
      setMessage({ type: "success", text: editingSubCategoryId ? "Sub-category updated" : "Sub-category created" });
      resetSubCategoryForm();
      await loadData();
    } catch (err) {
      setMessage({ type: "error", text: err?.response?.data?.message || "Sub-category save failed" });
    } finally {
      setSubCategorySaving(false);
    }
  };

  const handleItemSubmit = async (e) => {
    e.preventDefault();
    if (itemSaving) return;
    setItemSaving(true);
    try {
      const payload = {
        ...itemForm,
        price: itemForm.price === "" ? "" : Number(itemForm.price),
        compareAtPrice: itemForm.compareAtPrice === "" ? "" : Number(itemForm.compareAtPrice),
        prepTimeMinutes: itemForm.prepTimeMinutes === "" ? 20 : Number(itemForm.prepTimeMinutes),
        portions: itemForm.portions.filter((p) => p.label && p.price !== "").map((p) => ({ ...p, price: Number(p.price) })),
      };
      if (editingItemId) await menuService.updateMenuItem(token, editingItemId, payload);
      else await menuService.createMenuItem(token, payload);
      setMessage({ type: "success", text: editingItemId ? "Menu item updated" : "Menu item created" });
      resetItemForm();
      await loadData();
    } catch (err) {
      setMessage({ type: "error", text: err?.response?.data?.message || "Menu item save failed" });
    } finally {
      setItemSaving(false);
    }
  };

  const onDeleteCategory = async (id) => {
    try {
      await menuService.deleteCategory(token, id);
      setMessage({ type: "success", text: "Category deleted" });
      await loadData();
    } catch (err) {
      setMessage({ type: "error", text: err?.response?.data?.message || "Category delete failed" });
    }
  };
  const onDeleteSubCategory = async (id) => {
    try {
      await menuService.deleteSubCategory(token, id);
      setMessage({ type: "success", text: "Sub-category deleted" });
      await loadData();
    } catch (err) {
      setMessage({ type: "error", text: err?.response?.data?.message || "Sub-category delete failed" });
    }
  };
  const onDeleteItem = async (id) => {
    try {
      await menuService.deleteMenuItem(token, id);
      setMessage({ type: "success", text: "Menu item deleted" });
      await loadData();
    } catch (err) {
      setMessage({ type: "error", text: err?.response?.data?.message || "Menu item delete failed" });
    }
  };

  const onCategoryEdit = (category) => {
    setEditingCategoryId(category._id);
    setCategoryForm({
      name: category.name || "",
      description: category.description || "",
      image: category.image || "",
      sortOrder: category.sortOrder || 0,
      isActive: Boolean(category.isActive),
    });
  };
  const onSubCategoryEdit = (subCategory) => {
    setEditingSubCategoryId(subCategory._id);
    setSubCategoryForm({
      name: subCategory.name || "",
      category: subCategory.category?._id || "",
      heading: subCategory.heading || "",
      subHeading: subCategory.subHeading || "",
      description: subCategory.description || "",
      image: subCategory.image || "",
      sortOrder: subCategory.sortOrder || 0,
      isActive: Boolean(subCategory.isActive),
    });
  };
  const onItemEdit = (item) => {
    setEditingItemId(item._id);
    setItemForm({
      name: item.name || "",
      heading: item.heading || "",
      subHeading: item.subHeading || "",
      description: item.description || "",
      shortDescription: item.shortDescription || "",
      category: item.category?._id || "",
      subCategory: item.subCategory?._id || "",
      foodType: item.foodType || "non_veg",
      image: item.image || "",
      price: item.price ?? "",
      compareAtPrice: item.compareAtPrice ?? "",
      discountLabel: item.discountLabel || "",
      prepTimeMinutes: item.prepTimeMinutes ?? 20,
      spiceLevel: item.spiceLevel || "none",
      stockStatus: item.stockStatus || "in_stock",
      isFeatured: Boolean(item.isFeatured),
      isActive: Boolean(item.isActive),
      portions:
        item.portions?.length > 0
          ? item.portions.map((p) => ({ label: p.label || "", quantityText: p.quantityText || "", price: p.price ?? "" }))
          : [{ label: "", quantityText: "", price: "" }],
    });
  };

  const updatePortion = (index, key, value) => {
    setItemForm((prev) => ({
      ...prev,
      portions: prev.portions.map((portion, i) => (i === index ? { ...portion, [key]: value } : portion)),
    }));
  };
  const addPortion = () => setItemForm((prev) => ({ ...prev, portions: [...prev.portions, { label: "", quantityText: "", price: "" }] }));
  const removePortion = (index) => setItemForm((prev) => ({ ...prev, portions: prev.portions.filter((_, i) => i !== index) }));


  const filteredItems = items.filter((item) => {
    const haystack = `${item.name || ""} ${item.category?.name || ""} ${item.subCategory?.name || ""} ${item.foodType || ""}`.toLowerCase();
    return haystack.includes(itemSearch.toLowerCase());
  });

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-black text-slate-900">Menu Studio</h2>
        <p className="mt-1 text-sm text-slate-600">Full CRUD for category, sub-category, veg/non-veg items, portions and PDF menu.</p>
        {message.text ? (
          <p className={`mt-2 rounded-xl px-3 py-2 text-sm font-medium ${message.type === "error" ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>
            {message.text}
          </p>
        ) : null}
      </div>

      <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <h3 className="text-lg font-bold text-slate-900">Menu PDF</h3>
        {pdfMeta ? (
          <a href={pdfMeta.url} target="_blank" rel="noreferrer" className="mt-1 inline-block text-sm font-semibold text-emerald-700 underline">
            Open current PDF: {pdfMeta.name}
          </a>
        ) : (
          <p className="text-sm text-slate-600">No PDF found yet.</p>
        )}
        <div className="mt-3">
          <label className="block text-sm font-medium text-slate-700">Replace PDF (Admin)</label>
          <input type="file" accept="application/pdf" onChange={onPdfChange} className="mt-1 block w-full text-sm" />
          {uploadingPdf ? <p className="mt-1 text-xs text-slate-500">Uploading...</p> : null}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <article className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-4 shadow-sm">
          <h3 className="text-xl font-bold text-slate-900">{editingCategoryId ? "Edit Category" : "Create Category"}</h3>
          <form onSubmit={handleCategorySubmit} className="mt-4 grid gap-3">
            <input type="text" placeholder="Category Name" value={categoryForm.name} onChange={(e) => setCategoryForm((p) => ({ ...p, name: e.target.value }))} className="rounded-xl border border-slate-300 px-3 py-2" required />
            <input type="text" placeholder="Image URL" value={categoryForm.image} onChange={(e) => setCategoryForm((p) => ({ ...p, image: e.target.value }))} className="rounded-xl border border-slate-300 px-3 py-2" />
            <textarea placeholder="Description" value={categoryForm.description} onChange={(e) => setCategoryForm((p) => ({ ...p, description: e.target.value }))} className="rounded-xl border border-slate-300 px-3 py-2" rows={2} />
            <div className="grid gap-3 sm:grid-cols-2">
              <input type="number" placeholder="Sort Order" value={categoryForm.sortOrder} onChange={(e) => setCategoryForm((p) => ({ ...p, sortOrder: e.target.value }))} className="rounded-xl border border-slate-300 px-3 py-2" />
              <label className="flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-sm"><input type="checkbox" checked={categoryForm.isActive} onChange={(e) => setCategoryForm((p) => ({ ...p, isActive: e.target.checked }))} />Active category</label>
            </div>
            <div className="flex gap-2">
              <button disabled={categorySaving} className="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">{categorySaving ? "Saving..." : editingCategoryId ? "Update Category" : "Create Category"}</button>
              {editingCategoryId ? <button type="button" onClick={resetCategoryForm} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold">Cancel</button> : null}
            </div>
          </form>
        </article>
        <article className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="text-xl font-bold text-slate-900">Category List</h3>
          <div className="mt-3 max-h-[23rem] space-y-2 overflow-auto pr-1">
            {categories.map((category) => (
              <div key={category._id} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
                <p className="font-bold text-slate-900">{category.name}</p><p className="text-xs text-slate-500">{category.description || "No description"}</p>
                <div className="mt-2 flex gap-2">
                  <button onClick={() => onCategoryEdit(category)} className="rounded-lg bg-slate-800 px-3 py-1 text-xs font-semibold text-white">Edit</button>
                  <button onClick={() => onDeleteCategory(category._id)} className="rounded-lg bg-red-600 px-3 py-1 text-xs font-semibold text-white">Delete</button>
                </div>
              </div>
            ))}
            {!categories.length && !loading ? <p className="text-sm text-slate-500">No categories yet.</p> : null}
          </div>
        </article>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <article className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-4 shadow-sm">
          <h3 className="text-xl font-bold text-slate-900">{editingSubCategoryId ? "Edit Sub-Category" : "Create Sub-Category"}</h3>
          <form onSubmit={handleSubCategorySubmit} className="mt-4 grid gap-3">
            <input type="text" placeholder="Sub-Category Name" value={subCategoryForm.name} onChange={(e) => setSubCategoryForm((p) => ({ ...p, name: e.target.value }))} className="rounded-xl border border-slate-300 px-3 py-2" required />
            <select value={subCategoryForm.category} onChange={(e) => setSubCategoryForm((p) => ({ ...p, category: e.target.value }))} className="rounded-xl border border-slate-300 px-3 py-2" required>
              <option value="">Select Parent Category</option>{activeCategories.map((category) => <option key={category._id} value={category._id}>{category.name}</option>)}
            </select>
            <div className="grid gap-3 sm:grid-cols-2">
              <input type="text" placeholder="Heading" value={subCategoryForm.heading} onChange={(e) => setSubCategoryForm((p) => ({ ...p, heading: e.target.value }))} className="rounded-xl border border-slate-300 px-3 py-2" />
              <input type="text" placeholder="Sub Heading" value={subCategoryForm.subHeading} onChange={(e) => setSubCategoryForm((p) => ({ ...p, subHeading: e.target.value }))} className="rounded-xl border border-slate-300 px-3 py-2" />
            </div>
            <textarea placeholder="Description" value={subCategoryForm.description} onChange={(e) => setSubCategoryForm((p) => ({ ...p, description: e.target.value }))} className="rounded-xl border border-slate-300 px-3 py-2" rows={2} />
            <div className="grid gap-3 sm:grid-cols-2">
              <input type="text" placeholder="Image URL" value={subCategoryForm.image} onChange={(e) => setSubCategoryForm((p) => ({ ...p, image: e.target.value }))} className="rounded-xl border border-slate-300 px-3 py-2" />
              <input type="number" placeholder="Sort Order" value={subCategoryForm.sortOrder} onChange={(e) => setSubCategoryForm((p) => ({ ...p, sortOrder: e.target.value }))} className="rounded-xl border border-slate-300 px-3 py-2" />
            </div>
            <label className="flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-sm"><input type="checkbox" checked={subCategoryForm.isActive} onChange={(e) => setSubCategoryForm((p) => ({ ...p, isActive: e.target.checked }))} />Active sub-category</label>
            <div className="flex gap-2">
              <button disabled={subCategorySaving} className="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">{subCategorySaving ? "Saving..." : editingSubCategoryId ? "Update Sub-Category" : "Create Sub-Category"}</button>
              {editingSubCategoryId ? <button type="button" onClick={resetSubCategoryForm} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold">Cancel</button> : null}
            </div>
          </form>
        </article>
        <article className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="text-xl font-bold text-slate-900">Sub-Category List</h3>
          <div className="mt-3 max-h-[23rem] space-y-2 overflow-auto pr-1">
            {subCategories.map((subCategory) => (
              <div key={subCategory._id} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
                <p className="font-bold text-slate-900">{subCategory.name}</p><p className="text-xs text-slate-500">{subCategory.category?.name}</p>
                <div className="mt-2 flex gap-2">
                  <button onClick={() => onSubCategoryEdit(subCategory)} className="rounded-lg bg-slate-800 px-3 py-1 text-xs font-semibold text-white">Edit</button>
                  <button onClick={() => onDeleteSubCategory(subCategory._id)} className="rounded-lg bg-red-600 px-3 py-1 text-xs font-semibold text-white">Delete</button>
                </div>
              </div>
            ))}
            {!subCategories.length && !loading ? <p className="text-sm text-slate-500">No sub-categories yet.</p> : null}
          </div>
        </article>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <article className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-4 shadow-sm">
          <h3 className="text-xl font-bold text-slate-900">{editingItemId ? "Edit Menu Item" : "Create Menu Item"}</h3>
          <form onSubmit={handleItemSubmit} className="mt-4 grid gap-3">
            <input type="text" placeholder="Item Name" value={itemForm.name} onChange={(e) => setItemForm((p) => ({ ...p, name: e.target.value }))} className="rounded-xl border border-slate-300 px-3 py-2" required />
            <div className="grid gap-3 sm:grid-cols-2">
              <input type="text" placeholder="Heading" value={itemForm.heading} onChange={(e) => setItemForm((p) => ({ ...p, heading: e.target.value }))} className="rounded-xl border border-slate-300 px-3 py-2" />
              <input type="text" placeholder="Sub Heading" value={itemForm.subHeading} onChange={(e) => setItemForm((p) => ({ ...p, subHeading: e.target.value }))} className="rounded-xl border border-slate-300 px-3 py-2" />
            </div>
            <textarea placeholder="Description" value={itemForm.description} onChange={(e) => setItemForm((p) => ({ ...p, description: e.target.value }))} className="rounded-xl border border-slate-300 px-3 py-2" rows={2} required />
            <input type="text" placeholder="Short Description" value={itemForm.shortDescription} onChange={(e) => setItemForm((p) => ({ ...p, shortDescription: e.target.value }))} className="rounded-xl border border-slate-300 px-3 py-2" />
            <div className="grid gap-3 sm:grid-cols-3">
              <select value={itemForm.category} onChange={(e) => setItemForm((p) => ({ ...p, category: e.target.value, subCategory: "" }))} className="rounded-xl border border-slate-300 px-3 py-2" required>
                <option value="">Select Category</option>{activeCategories.map((category) => <option key={category._id} value={category._id}>{category.name}</option>)}
              </select>
              <select value={itemForm.subCategory} onChange={(e) => setItemForm((p) => ({ ...p, subCategory: e.target.value }))} className="rounded-xl border border-slate-300 px-3 py-2">
                <option value="">Sub-Category (optional)</option>{filteredSubCategories.map((subCategory) => <option key={subCategory._id} value={subCategory._id}>{subCategory.name}</option>)}
              </select>
              <select value={itemForm.foodType} onChange={(e) => setItemForm((p) => ({ ...p, foodType: e.target.value }))} className="rounded-xl border border-slate-300 px-3 py-2">
                <option value="veg">Veg</option><option value="non_veg">Non-Veg</option>
              </select>
            </div>
            <input type="text" placeholder="Image URL" value={itemForm.image} onChange={(e) => setItemForm((p) => ({ ...p, image: e.target.value }))} className="rounded-xl border border-slate-300 px-3 py-2" />
            <div className="grid gap-3 sm:grid-cols-2">
              <input type="number" step="0.01" min="0" placeholder="Base Price" value={itemForm.price} onChange={(e) => setItemForm((p) => ({ ...p, price: e.target.value }))} className="rounded-xl border border-slate-300 px-3 py-2" required />
              <input type="number" step="0.01" min="0" placeholder="Compare At Price" value={itemForm.compareAtPrice} onChange={(e) => setItemForm((p) => ({ ...p, compareAtPrice: e.target.value }))} className="rounded-xl border border-slate-300 px-3 py-2" />
            </div>
            <input type="text" placeholder="Discount Label" value={itemForm.discountLabel} onChange={(e) => setItemForm((p) => ({ ...p, discountLabel: e.target.value }))} className="rounded-xl border border-slate-300 px-3 py-2" />
            <div className="rounded-2xl border border-slate-200 p-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-bold text-slate-800">Portion-wise Pricing</p>
                <button type="button" onClick={addPortion} className="rounded-lg border border-slate-300 px-2 py-1 text-xs font-semibold">Add Portion</button>
              </div>
              <div className="space-y-2">
                {itemForm.portions.map((portion, index) => (
                  <div key={`${portion.label}-${index}`} className="grid gap-2 sm:grid-cols-[1fr_1fr_100px_70px]">
                    <input type="text" placeholder="Label" value={portion.label} onChange={(e) => updatePortion(index, "label", e.target.value)} className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm" />
                    <input type="text" placeholder="Qty text" value={portion.quantityText} onChange={(e) => updatePortion(index, "quantityText", e.target.value)} className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm" />
                    <input type="number" step="0.01" min="0" placeholder="Price" value={portion.price} onChange={(e) => updatePortion(index, "price", e.target.value)} className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm" />
                    <button type="button" onClick={() => removePortion(index)} className="rounded-lg bg-red-600 px-2 py-1.5 text-xs font-semibold text-white">Remove</button>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <input type="number" min="1" placeholder="Prep Time (mins)" value={itemForm.prepTimeMinutes} onChange={(e) => setItemForm((p) => ({ ...p, prepTimeMinutes: e.target.value }))} className="rounded-xl border border-slate-300 px-3 py-2" />
              <select value={itemForm.spiceLevel} onChange={(e) => setItemForm((p) => ({ ...p, spiceLevel: e.target.value }))} className="rounded-xl border border-slate-300 px-3 py-2">{["none", "mild", "medium", "hot", "extra_hot"].map((level) => <option key={level} value={level}>{level}</option>)}</select>
              <select value={itemForm.stockStatus} onChange={(e) => setItemForm((p) => ({ ...p, stockStatus: e.target.value }))} className="rounded-xl border border-slate-300 px-3 py-2">{["in_stock", "low_stock", "out_of_stock"].map((status) => <option key={status} value={status}>{status}</option>)}</select>
            </div>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={itemForm.isFeatured} onChange={(e) => setItemForm((p) => ({ ...p, isFeatured: e.target.checked }))} />Featured</label>
              <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={itemForm.isActive} onChange={(e) => setItemForm((p) => ({ ...p, isActive: e.target.checked }))} />Active</label>
            </div>
            <div className="flex gap-2">
              <button disabled={itemSaving} className="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">{itemSaving ? "Saving..." : editingItemId ? "Update Item" : "Create Item"}</button>
              {editingItemId ? <button type="button" onClick={resetItemForm} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold">Cancel</button> : null}
            </div>
          </form>
        </article>
        <article className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-xl font-bold text-slate-900">Menu Item List</h3>
            <input
              type="text"
              value={itemSearch}
              onChange={(e) => setItemSearch(e.target.value)}
              placeholder="Search items..."
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm sm:w-64"
            />
          </div>
          <div className="mt-3 max-h-[48rem] space-y-2 overflow-auto pr-1">
            {filteredItems.map((item) => (
              <div key={item._id} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
                <p className="font-bold text-slate-900">{item.name}</p>
                <p className="text-xs text-slate-500">{item.category?.name} {item.subCategory?.name ? `> ${item.subCategory?.name}` : ""} | {(item.foodType || "non_veg").replace("_", "-")}</p>
                <p className="text-xs text-slate-600">{item.shortDescription || item.description}</p>
                <p className="mt-1 text-xs text-slate-500">Base: ${Number(item.price || 0).toFixed(2)} | Portions: {item.portions?.length || 0}</p>
                <div className="mt-2 flex gap-2">
                  <button onClick={() => onItemEdit(item)} className="rounded-lg bg-slate-800 px-3 py-1 text-xs font-semibold text-white">Edit</button>
                  <button onClick={() => onDeleteItem(item._id)} className="rounded-lg bg-red-600 px-3 py-1 text-xs font-semibold text-white">Delete</button>
                </div>
              </div>
            ))}
            {!filteredItems.length && !loading ? <p className="text-sm text-slate-500">No menu items yet.</p> : null}
          </div>
        </article>
      </section>
    </div>
  );
};

export default AdminMenuManager;

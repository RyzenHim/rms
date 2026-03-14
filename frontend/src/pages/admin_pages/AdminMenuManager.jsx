import { useEffect, useMemo, useState } from "react";
import { FiChevronDown, FiChevronUp, FiFileText, FiFolder, FiLayers, FiPackage, FiSearch } from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import menuService from "../../services/menu_Service";

const emptyCategoryForm = { name: "", description: "", image: "", sortOrder: 0, isActive: true };
const emptySubCategoryForm = { name: "", category: "", heading: "", subHeading: "", description: "", image: "", sortOrder: 0, isActive: true };
const emptyItemForm = {
  name: "", heading: "", subHeading: "", description: "", shortDescription: "", category: "", subCategory: "", foodType: "non_veg",
  image: "", price: "", compareAtPrice: "", discountLabel: "", prepTimeMinutes: 20, spiceLevel: "none", stockStatus: "in_stock",
  isFeatured: false, isActive: true, portions: [{ label: "", quantityText: "", price: "" }],
};

const Section = ({ title, description, icon: Icon, open, onToggle, children }) => (
  <section className="card-elevated overflow-hidden p-0">
    <button onClick={onToggle} className="flex w-full items-center justify-between gap-4 p-5 text-left">
      <div className="flex items-start gap-4">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-cyan-400 text-white shadow-lg">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-xl font-black text-slate-900 dark:text-slate-50">{title}</h3>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{description}</p>
        </div>
      </div>
      <span className="glass-pill inline-flex rounded-full p-2 text-slate-700 dark:text-slate-200">{open ? <FiChevronUp className="h-4 w-4" /> : <FiChevronDown className="h-4 w-4" />}</span>
    </button>
    {open ? <div className="border-t border-slate-200/60 px-5 pb-5 pt-4 dark:border-slate-700/60">{children}</div> : null}
  </section>
);

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
  const [open, setOpen] = useState({ pdf: false, categoryForm: false, categoryList: false, subForm: false, subList: false, itemForm: true, itemList: true });

  const activeCategories = useMemo(() => categories.filter((c) => c.isActive), [categories]);
  const filteredSubCategories = useMemo(() => (!itemForm.category ? subCategories : subCategories.filter((s) => s.category?._id === itemForm.category)), [subCategories, itemForm.category]);
  const filteredItems = useMemo(() => {
    const search = itemSearch.toLowerCase();
    return items.filter((item) => `${item.name || ""} ${item.category?.name || ""} ${item.subCategory?.name || ""} ${item.foodType || ""}`.toLowerCase().includes(search));
  }, [itemSearch, items]);

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

  const fileToBase64 = (file) => new Promise((resolve, reject) => {
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

  const resetCategoryForm = () => { setCategoryForm(emptyCategoryForm); setEditingCategoryId(null); };
  const resetSubCategoryForm = () => { setSubCategoryForm(emptySubCategoryForm); setEditingSubCategoryId(null); };
  const resetItemForm = () => { setItemForm(emptyItemForm); setEditingItemId(null); };

  const handleCategorySubmit = async (event) => {
    event.preventDefault();
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

  const handleSubCategorySubmit = async (event) => {
    event.preventDefault();
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

  const handleItemSubmit = async (event) => {
    event.preventDefault();
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

  const onCategoryEdit = (category) => {
    setEditingCategoryId(category._id);
    setCategoryForm({ name: category.name || "", description: category.description || "", image: category.image || "", sortOrder: category.sortOrder || 0, isActive: Boolean(category.isActive) });
    setOpen((prev) => ({ ...prev, categoryForm: true }));
  };
  const onSubCategoryEdit = (subCategory) => {
    setEditingSubCategoryId(subCategory._id);
    setSubCategoryForm({ name: subCategory.name || "", category: subCategory.category?._id || "", heading: subCategory.heading || "", subHeading: subCategory.subHeading || "", description: subCategory.description || "", image: subCategory.image || "", sortOrder: subCategory.sortOrder || 0, isActive: Boolean(subCategory.isActive) });
    setOpen((prev) => ({ ...prev, subForm: true }));
  };
  const onItemEdit = (item) => {
    setEditingItemId(item._id);
    setItemForm({
      name: item.name || "", heading: item.heading || "", subHeading: item.subHeading || "", description: item.description || "", shortDescription: item.shortDescription || "",
      category: item.category?._id || "", subCategory: item.subCategory?._id || "", foodType: item.foodType || "non_veg", image: item.image || "", price: item.price ?? "",
      compareAtPrice: item.compareAtPrice ?? "", discountLabel: item.discountLabel || "", prepTimeMinutes: item.prepTimeMinutes ?? 20, spiceLevel: item.spiceLevel || "none",
      stockStatus: item.stockStatus || "in_stock", isFeatured: Boolean(item.isFeatured), isActive: Boolean(item.isActive),
      portions: item.portions?.length ? item.portions.map((p) => ({ label: p.label || "", quantityText: p.quantityText || "", price: p.price ?? "" })) : [{ label: "", quantityText: "", price: "" }],
    });
    setOpen((prev) => ({ ...prev, itemForm: true }));
  };

  const onDeleteCategory = async (id) => { try { await menuService.deleteCategory(token, id); setMessage({ type: "success", text: "Category deleted" }); await loadData(); } catch (err) { setMessage({ type: "error", text: err?.response?.data?.message || "Category delete failed" }); } };
  const onDeleteSubCategory = async (id) => { try { await menuService.deleteSubCategory(token, id); setMessage({ type: "success", text: "Sub-category deleted" }); await loadData(); } catch (err) { setMessage({ type: "error", text: err?.response?.data?.message || "Sub-category delete failed" }); } };
  const onDeleteItem = async (id) => { try { await menuService.deleteMenuItem(token, id); setMessage({ type: "success", text: "Menu item deleted" }); await loadData(); } catch (err) { setMessage({ type: "error", text: err?.response?.data?.message || "Menu item delete failed" }); } };
  const updatePortion = (index, key, value) => setItemForm((prev) => ({ ...prev, portions: prev.portions.map((p, i) => (i === index ? { ...p, [key]: value } : p)) }));
  const addPortion = () => setItemForm((prev) => ({ ...prev, portions: [...prev.portions, { label: "", quantityText: "", price: "" }] }));
  const removePortion = (index) => setItemForm((prev) => ({ ...prev, portions: prev.portions.filter((_, i) => i !== index) }));

  return (
    <div className="space-y-6">
      <section className="glass-panel rounded-[2rem] p-6 md:p-8">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <span className="glass-pill inline-flex rounded-full px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-700 dark:text-slate-200">Menu Studio</span>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900 dark:text-slate-50 md:text-4xl">Admin Menu Manager</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">Collapsed sections, cleaner spacing, and theme-matched lists instead of one long expanded admin page.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { label: "Categories", value: categories.length, icon: FiFolder },
              { label: "Sections", value: subCategories.length, icon: FiLayers },
              { label: "Items", value: items.length, icon: FiPackage },
            ].map((card) => {
              const Icon = card.icon;
              return <div key={card.label} className="glass-subtle rounded-[1.4rem] p-4"><Icon className="h-5 w-5 text-sky-500" /><p className="mt-3 text-2xl font-black text-slate-900 dark:text-slate-50">{card.value}</p><p className="text-sm text-slate-600 dark:text-slate-300">{card.label}</p></div>;
            })}
          </div>
        </div>
        {message.text ? <div className={`mt-5 ${message.type === "error" ? "alert-error" : "alert-success"}`}>{message.text}</div> : null}
      </section>

      <Section title="Menu PDF" description="Hidden until needed." icon={FiFileText} open={open.pdf} onToggle={() => setOpen((prev) => ({ ...prev, pdf: !prev.pdf }))}>
        {pdfMeta ? <a href={pdfMeta.url} target="_blank" rel="noreferrer" className="inline-flex rounded-full bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">Open current PDF: {pdfMeta.name}</a> : <p className="text-sm text-slate-600 dark:text-slate-300">No PDF found yet.</p>}
        <div className="mt-4"><label className="form-label">Replace PDF</label><input type="file" accept="application/pdf" onChange={onPdfChange} className="input-base cursor-pointer py-3" />{uploadingPdf ? <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Uploading...</p> : null}</div>
      </Section>

      <div className="grid gap-6 xl:grid-cols-2">
        <Section title={editingCategoryId ? "Edit Category" : "Create Category"} description="Opens only when you need to edit." icon={FiFolder} open={open.categoryForm} onToggle={() => setOpen((prev) => ({ ...prev, categoryForm: !prev.categoryForm }))}>
          <form onSubmit={handleCategorySubmit} className="grid gap-3">
            <input type="text" placeholder="Category Name" value={categoryForm.name} onChange={(e) => setCategoryForm((prev) => ({ ...prev, name: e.target.value }))} className="input-base" required />
            <input type="text" placeholder="Image URL" value={categoryForm.image} onChange={(e) => setCategoryForm((prev) => ({ ...prev, image: e.target.value }))} className="input-base" />
            <textarea placeholder="Description" value={categoryForm.description} onChange={(e) => setCategoryForm((prev) => ({ ...prev, description: e.target.value }))} className="input-base min-h-[5rem]" rows={2} />
            <div className="grid gap-3 sm:grid-cols-2">
              <input type="number" placeholder="Sort Order" value={categoryForm.sortOrder} onChange={(e) => setCategoryForm((prev) => ({ ...prev, sortOrder: e.target.value }))} className="input-base" />
              <label className="glass-subtle flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-200"><input type="checkbox" checked={categoryForm.isActive} onChange={(e) => setCategoryForm((prev) => ({ ...prev, isActive: e.target.checked }))} />Active category</label>
            </div>
            <div className="flex gap-3">{editingCategoryId ? <button type="button" onClick={resetCategoryForm} className="btn-outline">Cancel</button> : null}<button disabled={categorySaving} className="btn-primary">{categorySaving ? "Saving..." : editingCategoryId ? "Update Category" : "Create Category"}</button></div>
          </form>
        </Section>

        <Section title="Category List" description="Expandable list." icon={FiSearch} open={open.categoryList} onToggle={() => setOpen((prev) => ({ ...prev, categoryList: !prev.categoryList }))}>
          <div className="space-y-3">{categories.map((category) => <article key={category._id} className="glass-subtle rounded-[1.3rem] p-4"><p className="text-base font-black text-slate-900 dark:text-slate-50">{category.name}</p><p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{category.description || "No description"}</p><div className="mt-3 flex gap-2"><button onClick={() => onCategoryEdit(category)} className="glass-pill rounded-full px-4 py-1.5 text-xs font-bold text-sky-700 dark:text-sky-300">Edit</button><button onClick={() => onDeleteCategory(category._id)} className="glass-pill rounded-full px-4 py-1.5 text-xs font-bold text-rose-700 dark:text-rose-300">Delete</button></div></article>)}{!categories.length && !loading ? <p className="text-sm text-slate-500 dark:text-slate-400">No categories yet.</p> : null}</div>
        </Section>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Section title={editingSubCategoryId ? "Edit Sub-Category" : "Create Sub-Category"} description="Consistent theme and spacing." icon={FiLayers} open={open.subForm} onToggle={() => setOpen((prev) => ({ ...prev, subForm: !prev.subForm }))}>
          <form onSubmit={handleSubCategorySubmit} className="grid gap-3">
            <input type="text" placeholder="Sub-Category Name" value={subCategoryForm.name} onChange={(e) => setSubCategoryForm((prev) => ({ ...prev, name: e.target.value }))} className="input-base" required />
            <select value={subCategoryForm.category} onChange={(e) => setSubCategoryForm((prev) => ({ ...prev, category: e.target.value }))} className="input-base" required><option value="">Select Parent Category</option>{activeCategories.map((category) => <option key={category._id} value={category._id}>{category.name}</option>)}</select>
            <div className="grid gap-3 sm:grid-cols-2"><input type="text" placeholder="Heading" value={subCategoryForm.heading} onChange={(e) => setSubCategoryForm((prev) => ({ ...prev, heading: e.target.value }))} className="input-base" /><input type="text" placeholder="Sub Heading" value={subCategoryForm.subHeading} onChange={(e) => setSubCategoryForm((prev) => ({ ...prev, subHeading: e.target.value }))} className="input-base" /></div>
            <textarea placeholder="Description" value={subCategoryForm.description} onChange={(e) => setSubCategoryForm((prev) => ({ ...prev, description: e.target.value }))} className="input-base min-h-[5rem]" rows={2} />
            <div className="grid gap-3 sm:grid-cols-2"><input type="text" placeholder="Image URL" value={subCategoryForm.image} onChange={(e) => setSubCategoryForm((prev) => ({ ...prev, image: e.target.value }))} className="input-base" /><input type="number" placeholder="Sort Order" value={subCategoryForm.sortOrder} onChange={(e) => setSubCategoryForm((prev) => ({ ...prev, sortOrder: e.target.value }))} className="input-base" /></div>
            <label className="glass-subtle flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-200"><input type="checkbox" checked={subCategoryForm.isActive} onChange={(e) => setSubCategoryForm((prev) => ({ ...prev, isActive: e.target.checked }))} />Active sub-category</label>
            <div className="flex gap-3">{editingSubCategoryId ? <button type="button" onClick={resetSubCategoryForm} className="btn-outline">Cancel</button> : null}<button disabled={subCategorySaving} className="btn-primary">{subCategorySaving ? "Saving..." : editingSubCategoryId ? "Update Sub-Category" : "Create Sub-Category"}</button></div>
          </form>
        </Section>

        <Section title="Sub-Category List" description="Expandable list." icon={FiSearch} open={open.subList} onToggle={() => setOpen((prev) => ({ ...prev, subList: !prev.subList }))}>
          <div className="space-y-3">{subCategories.map((subCategory) => <article key={subCategory._id} className="glass-subtle rounded-[1.3rem] p-4"><p className="text-base font-black text-slate-900 dark:text-slate-50">{subCategory.name}</p><p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{subCategory.category?.name}</p><div className="mt-3 flex gap-2"><button onClick={() => onSubCategoryEdit(subCategory)} className="glass-pill rounded-full px-4 py-1.5 text-xs font-bold text-sky-700 dark:text-sky-300">Edit</button><button onClick={() => onDeleteSubCategory(subCategory._id)} className="glass-pill rounded-full px-4 py-1.5 text-xs font-bold text-rose-700 dark:text-rose-300">Delete</button></div></article>)}{!subCategories.length && !loading ? <p className="text-sm text-slate-500 dark:text-slate-400">No sub-categories yet.</p> : null}</div>
        </Section>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Section title={editingItemId ? "Edit Menu Item" : "Create Menu Item"} description="Main item editor." icon={FiPackage} open={open.itemForm} onToggle={() => setOpen((prev) => ({ ...prev, itemForm: !prev.itemForm }))}>
          <form onSubmit={handleItemSubmit} className="grid gap-3">
            <input type="text" placeholder="Item Name" value={itemForm.name} onChange={(e) => setItemForm((prev) => ({ ...prev, name: e.target.value }))} className="input-base" required />
            <div className="grid gap-3 sm:grid-cols-2"><input type="text" placeholder="Heading" value={itemForm.heading} onChange={(e) => setItemForm((prev) => ({ ...prev, heading: e.target.value }))} className="input-base" /><input type="text" placeholder="Sub Heading" value={itemForm.subHeading} onChange={(e) => setItemForm((prev) => ({ ...prev, subHeading: e.target.value }))} className="input-base" /></div>
            <textarea placeholder="Description" value={itemForm.description} onChange={(e) => setItemForm((prev) => ({ ...prev, description: e.target.value }))} className="input-base min-h-[5rem]" rows={2} required />
            <input type="text" placeholder="Short Description" value={itemForm.shortDescription} onChange={(e) => setItemForm((prev) => ({ ...prev, shortDescription: e.target.value }))} className="input-base" />
            <div className="grid gap-3 sm:grid-cols-3"><select value={itemForm.category} onChange={(e) => setItemForm((prev) => ({ ...prev, category: e.target.value, subCategory: "" }))} className="input-base" required><option value="">Select Category</option>{activeCategories.map((category) => <option key={category._id} value={category._id}>{category.name}</option>)}</select><select value={itemForm.subCategory} onChange={(e) => setItemForm((prev) => ({ ...prev, subCategory: e.target.value }))} className="input-base"><option value="">Sub-Category (optional)</option>{filteredSubCategories.map((subCategory) => <option key={subCategory._id} value={subCategory._id}>{subCategory.name}</option>)}</select><select value={itemForm.foodType} onChange={(e) => setItemForm((prev) => ({ ...prev, foodType: e.target.value }))} className="input-base"><option value="veg">Veg</option><option value="non_veg">Non-Veg</option></select></div>
            <input type="text" placeholder="Image URL" value={itemForm.image} onChange={(e) => setItemForm((prev) => ({ ...prev, image: e.target.value }))} className="input-base" />
            <div className="grid gap-3 sm:grid-cols-2"><input type="number" step="0.01" min="0" placeholder="Base Price" value={itemForm.price} onChange={(e) => setItemForm((prev) => ({ ...prev, price: e.target.value }))} className="input-base" required /><input type="number" step="0.01" min="0" placeholder="Compare At Price" value={itemForm.compareAtPrice} onChange={(e) => setItemForm((prev) => ({ ...prev, compareAtPrice: e.target.value }))} className="input-base" /></div>
            <input type="text" placeholder="Discount Label" value={itemForm.discountLabel} onChange={(e) => setItemForm((prev) => ({ ...prev, discountLabel: e.target.value }))} className="input-base" />
            <div className="glass-subtle rounded-[1.4rem] p-4"><div className="mb-3 flex items-center justify-between"><p className="text-sm font-black text-slate-900 dark:text-slate-50">Portions</p><button type="button" onClick={addPortion} className="glass-pill rounded-full px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200">Add Portion</button></div><div className="space-y-2">{itemForm.portions.map((portion, index) => <div key={`${portion.label}-${index}`} className="grid gap-2 lg:grid-cols-[1fr_1fr_120px_86px]"><input type="text" placeholder="Label" value={portion.label} onChange={(e) => updatePortion(index, "label", e.target.value)} className="input-base text-sm" /><input type="text" placeholder="Qty text" value={portion.quantityText} onChange={(e) => updatePortion(index, "quantityText", e.target.value)} className="input-base text-sm" /><input type="number" step="0.01" min="0" placeholder="Price" value={portion.price} onChange={(e) => updatePortion(index, "price", e.target.value)} className="input-base text-sm" /><button type="button" onClick={() => removePortion(index)} className="btn-danger text-xs">Remove</button></div>)}</div></div>
            <div className="grid gap-3 sm:grid-cols-3"><input type="number" min="1" placeholder="Prep Time (mins)" value={itemForm.prepTimeMinutes} onChange={(e) => setItemForm((prev) => ({ ...prev, prepTimeMinutes: e.target.value }))} className="input-base" /><select value={itemForm.spiceLevel} onChange={(e) => setItemForm((prev) => ({ ...prev, spiceLevel: e.target.value }))} className="input-base">{["none", "mild", "medium", "hot", "extra_hot"].map((level) => <option key={level} value={level}>{level}</option>)}</select><select value={itemForm.stockStatus} onChange={(e) => setItemForm((prev) => ({ ...prev, stockStatus: e.target.value }))} className="input-base">{["in_stock", "low_stock", "out_of_stock"].map((status) => <option key={status} value={status}>{status}</option>)}</select></div>
            <div className="flex flex-wrap gap-4"><label className="glass-subtle flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-200"><input type="checkbox" checked={itemForm.isFeatured} onChange={(e) => setItemForm((prev) => ({ ...prev, isFeatured: e.target.checked }))} />Featured</label><label className="glass-subtle flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-200"><input type="checkbox" checked={itemForm.isActive} onChange={(e) => setItemForm((prev) => ({ ...prev, isActive: e.target.checked }))} />Active</label></div>
            <div className="flex gap-3">{editingItemId ? <button type="button" onClick={resetItemForm} className="btn-outline">Cancel</button> : null}<button disabled={itemSaving} className="btn-primary">{itemSaving ? "Saving..." : editingItemId ? "Update Item" : "Create Item"}</button></div>
          </form>
        </Section>

        <Section title="Menu Item List" description="Searchable and collapsible." icon={FiSearch} open={open.itemList} onToggle={() => setOpen((prev) => ({ ...prev, itemList: !prev.itemList }))}>
          <div className="relative"><FiSearch className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input type="text" value={itemSearch} onChange={(e) => setItemSearch(e.target.value)} placeholder="Search items..." className="input-base pl-11" /></div>
          <div className="mt-4 space-y-3">{filteredItems.map((item) => <article key={item._id} className="glass-subtle rounded-[1.3rem] p-4"><p className="text-base font-black text-slate-900 dark:text-slate-50">{item.name}</p><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{item.category?.name} {item.subCategory?.name ? `> ${item.subCategory?.name}` : ""} | {(item.foodType || "non_veg").replace("_", "-")}</p><p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{item.shortDescription || item.description}</p><p className="mt-2 text-xs font-semibold text-slate-500 dark:text-slate-400">Base: Rs {Number(item.price || 0).toFixed(2)} • Portions: {item.portions?.length || 0}</p><div className="mt-3 flex gap-2"><button onClick={() => onItemEdit(item)} className="glass-pill rounded-full px-4 py-1.5 text-xs font-bold text-sky-700 dark:text-sky-300">Edit</button><button onClick={() => onDeleteItem(item._id)} className="glass-pill rounded-full px-4 py-1.5 text-xs font-bold text-rose-700 dark:text-rose-300">Delete</button></div></article>)}{!filteredItems.length && !loading ? <p className="text-sm text-slate-500 dark:text-slate-400">No menu items yet.</p> : null}</div>
        </Section>
      </div>
    </div>
  );
};

export default AdminMenuManager;

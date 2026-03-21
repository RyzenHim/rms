import { FiBox, FiLayers } from "react-icons/fi";
import { normalizeValue, titleize } from "./inventoryUtils";

export const InventoryCategoriesView = ({ editingCategoryId, categoryForm, setCategoryForm, submitting, handleCategorySubmit, resetCategoryForm, categories, activeCategories, setEditingCategoryId, handleDeleteCategory, canManageInventory }) => (
  <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
    <article className="card-elevated p-6">
      <div className="flex items-center gap-3">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-400 text-white shadow-lg">
          <FiLayers className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-2xl font-black text-slate-900 dark:text-slate-50">{editingCategoryId ? "Edit Category" : "Create Category"}</h3>
          <p className="text-sm text-slate-600 dark:text-slate-300">Manage reusable category records for live items and scan drafts.</p>
        </div>
      </div>

      <form onSubmit={handleCategorySubmit} className="mt-5 space-y-4">
        <input type="text" placeholder="Category Name" value={categoryForm.name} onChange={(event) => setCategoryForm((prev) => ({ ...prev, name: normalizeValue(event.target.value) }))} className="input-base" required />
        <textarea placeholder="Description" value={categoryForm.description} onChange={(event) => setCategoryForm((prev) => ({ ...prev, description: event.target.value }))} className="input-base min-h-[6rem]" rows={3} />
        <input type="number" placeholder="Sort Order" value={categoryForm.sortOrder} onChange={(event) => setCategoryForm((prev) => ({ ...prev, sortOrder: Number(event.target.value || 0) }))} className="input-base" />
        <div className="flex flex-wrap gap-3">
          <button type="submit" disabled={submitting || !canManageInventory} className="btn-primary">{canManageInventory ? (submitting ? "Saving..." : editingCategoryId ? "Update Category" : "Create Category") : "Admin/Manager Only"}</button>
          <button type="button" onClick={resetCategoryForm} className="btn-outline">Reset</button>
        </div>
      </form>
    </article>

    <article className="card-elevated p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-black text-slate-900 dark:text-slate-50">Category Library</h3>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">These categories are used by both saved rows and unsaved scan drafts.</p>
        </div>
        <span className="glass-pill rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-slate-700 dark:text-slate-200">{activeCategories.length} active</span>
      </div>

      <div className="mt-5 space-y-3">
        {categories.map((category) => (
          <article key={category._id} className="glass-subtle rounded-[1.3rem] p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-base font-black text-slate-900 dark:text-slate-50">{titleize(category.name)}</p>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{category.description || "No description added yet."}</p>
              </div>
              <div className="flex gap-2">
                {canManageInventory ? <button type="button" onClick={() => { setEditingCategoryId(category._id); setCategoryForm({ name: category.name, description: category.description || "", sortOrder: category.sortOrder || 0 }); }} className="glass-pill rounded-full px-4 py-1.5 text-xs font-bold text-sky-700 dark:text-sky-300">Edit</button> : null}
                {canManageInventory ? <button type="button" onClick={() => handleDeleteCategory(category._id)} className="glass-pill rounded-full px-4 py-1.5 text-xs font-bold text-rose-700 dark:text-rose-300">Delete</button> : null}
              </div>
            </div>
          </article>
        ))}
      </div>
    </article>
  </section>
);

export const InventoryUnitsView = ({ editingUnitId, unitForm, setUnitForm, submitting, handleUnitSubmit, resetUnitForm, units, activeUnits, setEditingUnitId, handleDeleteUnit, canManageInventory }) => (
  <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
    <article className="card-elevated p-6">
      <div className="flex items-center gap-3">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-yellow-400 text-white shadow-lg">
          <FiBox className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-2xl font-black text-slate-900 dark:text-slate-50">{editingUnitId ? "Edit Unit" : "Create Unit"}</h3>
          <p className="text-sm text-slate-600 dark:text-slate-300">Manage reusable measurement units for the whole inventory module.</p>
        </div>
      </div>

      <form onSubmit={handleUnitSubmit} className="mt-5 space-y-4">
        <input type="text" placeholder="Unit Name" value={unitForm.name} onChange={(event) => setUnitForm((prev) => ({ ...prev, name: event.target.value }))} className="input-base" required />
        <input type="text" placeholder="Unit Code (example: kg)" value={unitForm.code} onChange={(event) => setUnitForm((prev) => ({ ...prev, code: normalizeValue(event.target.value) }))} className="input-base" required />
        <input type="number" placeholder="Sort Order" value={unitForm.sortOrder} onChange={(event) => setUnitForm((prev) => ({ ...prev, sortOrder: Number(event.target.value || 0) }))} className="input-base" />
        <div className="flex flex-wrap gap-3">
          <button type="submit" disabled={submitting || !canManageInventory} className="btn-primary">{canManageInventory ? (submitting ? "Saving..." : editingUnitId ? "Update Unit" : "Create Unit") : "Admin/Manager Only"}</button>
          <button type="button" onClick={resetUnitForm} className="btn-outline">Reset</button>
        </div>
      </form>
    </article>

    <article className="card-elevated p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-black text-slate-900 dark:text-slate-50">Unit Library</h3>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Scanner drafts also read from these units when trying to structure OCR results.</p>
        </div>
        <span className="glass-pill rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-slate-700 dark:text-slate-200">{activeUnits.length} active</span>
      </div>

      <div className="mt-5 space-y-3">
        {units.map((unit) => (
          <article key={unit._id} className="glass-subtle rounded-[1.3rem] p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-base font-black text-slate-900 dark:text-slate-50">{unit.name}</p>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Code: {unit.code}</p>
              </div>
              <div className="flex gap-2">
                {canManageInventory ? <button type="button" onClick={() => { setEditingUnitId(unit._id); setUnitForm({ name: unit.name, code: unit.code, sortOrder: unit.sortOrder || 0 }); }} className="glass-pill rounded-full px-4 py-1.5 text-xs font-bold text-sky-700 dark:text-sky-300">Edit</button> : null}
                {canManageInventory ? <button type="button" onClick={() => handleDeleteUnit(unit._id)} className="glass-pill rounded-full px-4 py-1.5 text-xs font-bold text-rose-700 dark:text-rose-300">Delete</button> : null}
              </div>
            </div>
          </article>
        ))}
      </div>
    </article>
  </section>
);

import { FiEdit3, FiPlus } from "react-icons/fi";
import { titleize } from "./inventoryUtils";

const InventoryItemsView = ({
  showItemForm,
  setShowItemForm,
  editingItemId,
  itemForm,
  setItemForm,
  activeCategories,
  activeUnits,
  suppliers,
  submitting,
  handleItemSubmit,
  resetItemForm,
  filterCategory,
  setFilterCategory,
  filteredItems,
  updateStock,
  handleEditItem,
  handleDeleteItem,
  getStockStatus,
  canManageInventory,
  canAdjustStock,
}) => (
  <div className="space-y-6">
    <section className="glass-panel rounded-[2rem] p-6 md:p-8">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <span className="glass-pill inline-flex rounded-full px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-700 dark:text-slate-200">
            Live Inventory
          </span>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900 dark:text-slate-50 md:text-4xl">Items Workspace</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">
            Live rows are saved directly to the database. Scanner drafts stay separate until you explicitly save them.
          </p>
        </div>
        <button onClick={() => setShowItemForm((prev) => !prev)} disabled={!canManageInventory} className="btn-primary inline-flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-60">
          <FiPlus className="h-4 w-4" />
          {canManageInventory ? (showItemForm ? "Close Item Form" : "Add Inventory Item") : "Admin/Manager Only"}
        </button>
      </div>
    </section>

    {showItemForm ? (
      <section className="card-elevated animate-fade-in-up p-6 md:p-8 space-y-5">
        <div className="flex items-center gap-3">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-cyan-400 text-white shadow-lg">
            <FiEdit3 className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-slate-50">{editingItemId ? "Edit Inventory Item" : "Add Inventory Item"}</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300">Create or update database-backed inventory rows.</p>
          </div>
        </div>

        <form onSubmit={handleItemSubmit} className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <label className="space-y-2">
              <span className="form-label">Item Name</span>
              <input type="text" placeholder="Enter item name" value={itemForm.name} onChange={(event) => setItemForm((prev) => ({ ...prev, name: event.target.value }))} className="input-base" required />
            </label>
            <label className="space-y-2">
              <span className="form-label">Category</span>
              <select value={itemForm.category} onChange={(event) => setItemForm((prev) => ({ ...prev, category: event.target.value }))} className="input-base" required>
                <option value="">Select category</option>
                {activeCategories.map((category) => (
                  <option key={category._id} value={category.name}>
                    {titleize(category.name)}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-2">
              <span className="form-label">Unit</span>
              <select value={itemForm.unit} onChange={(event) => setItemForm((prev) => ({ ...prev, unit: event.target.value }))} className="input-base" required>
                <option value="">Select unit</option>
                {activeUnits.map((unit) => (
                  <option key={unit._id} value={unit.code}>
                    {unit.name} ({unit.code})
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-2">
              <span className="form-label">Current Stock</span>
              <input type="number" placeholder="Enter current stock" value={itemForm.currentStock} onChange={(event) => setItemForm((prev) => ({ ...prev, currentStock: Number(event.target.value || 0) }))} className="input-base" required />
            </label>
            <label className="space-y-2">
              <span className="form-label">Minimum Threshold</span>
              <input type="number" placeholder="Enter minimum threshold" value={itemForm.minimumThreshold} onChange={(event) => setItemForm((prev) => ({ ...prev, minimumThreshold: Number(event.target.value || 0) }))} className="input-base" required />
            </label>
            <label className="space-y-2">
              <span className="form-label">Maximum Stock</span>
              <input type="number" placeholder="Enter maximum stock" value={itemForm.maximumStock} onChange={(event) => setItemForm((prev) => ({ ...prev, maximumStock: Number(event.target.value || 0) }))} className="input-base" required />
            </label>
            <label className="space-y-2">
              <span className="form-label">Unit Cost (Rs)</span>
              <input type="number" placeholder="Enter unit cost" value={itemForm.unitCost} onChange={(event) => setItemForm((prev) => ({ ...prev, unitCost: Number(event.target.value || 0) }))} className="input-base" step="0.01" required />
            </label>
            <label className="space-y-2">
              <span className="form-label">Supplier</span>
              <select value={itemForm.supplier} onChange={(event) => setItemForm((prev) => ({ ...prev, supplier: event.target.value }))} className="input-base">
                <option value="">No supplier linked</option>
                {suppliers.map((supplier) => (
                  <option key={supplier._id} value={supplier.name}>
                    {supplier.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-2">
              <span className="form-label">Storage Location</span>
              <input type="text" placeholder="Enter storage location" value={itemForm.location} onChange={(event) => setItemForm((prev) => ({ ...prev, location: event.target.value }))} className="input-base" />
            </label>
            <label className="space-y-2 md:col-span-2 xl:col-span-3">
              <span className="form-label">Description</span>
              <textarea placeholder="Add item description" value={itemForm.description} onChange={(event) => setItemForm((prev) => ({ ...prev, description: event.target.value }))} className="input-base min-h-[6rem]" rows={3} />
            </label>
          </div>

          <div className="flex flex-wrap gap-3">
            <button type="submit" disabled={submitting} className="btn-primary">{submitting ? "Saving..." : editingItemId ? "Update Item" : "Add Item"}</button>
            <button type="button" onClick={() => { setShowItemForm(false); resetItemForm(); }} className="btn-outline">Cancel</button>
          </div>
        </form>
      </section>
    ) : null}

    <section className="card-elevated animate-fade-in-up p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h3 className="text-xl font-black text-slate-900 dark:text-slate-50">Inventory Items</h3>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Filter live stock rows by category and manage quantities from here.</p>
        </div>
        <div className="w-full md:w-72">
          <label className="form-label">Filter by Category</label>
          <select value={filterCategory} onChange={(event) => setFilterCategory(event.target.value)} className="input-base">
            <option value="all">All Categories</option>
            {activeCategories.map((category) => (
              <option key={category._id} value={category.name}>
                {titleize(category.name)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[58rem] text-sm">
          <thead>
            <tr className="border-b border-slate-200/60 text-left text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:border-slate-700/60 dark:text-slate-400">
              <th className="px-4 py-3">Item</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Value</th>
              <th className="px-4 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map((item) => {
              const status = getStockStatus(item);
              return (
                <tr key={item._id} className="border-b border-slate-200/40 transition-colors hover:bg-white/20 dark:border-slate-700/40 dark:hover:bg-slate-900/10">
                  <td className="px-4 py-4">
                    <p className="font-semibold text-slate-900 dark:text-slate-50">{item.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{item.supplier || "No supplier"}</p>
                  </td>
                  <td className="px-4 py-4 capitalize text-slate-600 dark:text-slate-300">{titleize(item.category)}</td>
                  <td className="px-4 py-4">
                    <p className="font-semibold text-slate-900 dark:text-slate-50">{item.currentStock} {item.unit}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Min {item.minimumThreshold} / Max {item.maximumStock}</p>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${status.className}`}>{status.label}</span>
                  </td>
                  <td className="px-4 py-4 font-semibold text-slate-900 dark:text-slate-50">Rs {(Number(item.currentStock || 0) * Number(item.unitCost || 0)).toLocaleString()}</td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap justify-center gap-2">
                      {canAdjustStock ? <button onClick={() => updateStock(item._id, "add")} className="glass-pill rounded-full px-3 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300">Add</button> : null}
                      {canAdjustStock ? <button onClick={() => updateStock(item._id, "subtract")} className="glass-pill rounded-full px-3 py-1 text-xs font-bold text-amber-700 dark:text-amber-300">Use</button> : null}
                      {canManageInventory ? <button onClick={() => handleEditItem(item)} className="glass-pill rounded-full px-3 py-1 text-xs font-bold text-sky-700 dark:text-sky-300">Edit</button> : null}
                      {canManageInventory ? <button onClick={() => handleDeleteItem(item._id)} className="glass-pill rounded-full px-3 py-1 text-xs font-bold text-rose-700 dark:text-rose-300">Delete</button> : null}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  </div>
);

export default InventoryItemsView;

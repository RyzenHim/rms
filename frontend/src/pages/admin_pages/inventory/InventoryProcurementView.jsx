import { FiArchive, FiCreditCard, FiDatabase, FiPackage, FiTruck } from "react-icons/fi";

export const InventorySuppliersView = ({
  supplierForm,
  setSupplierForm,
  editingSupplierId,
  handleSupplierSubmit,
  resetSupplierForm,
  suppliers,
  canManageInventory,
  canRecordPayments,
  submitting,
  onEditSupplier,
  onDeleteSupplier,
}) => (
  <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
    <article className="card-elevated p-6">
      <div className="flex items-center gap-3">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-sky-400 text-white shadow-lg">
          <FiDatabase className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-2xl font-black text-slate-900 dark:text-slate-50">{editingSupplierId ? "Edit Supplier" : "Create Supplier"}</h3>
          <p className="text-sm text-slate-600 dark:text-slate-300">Maintain supplier records used for inventory purchasing and payment tracking.</p>
        </div>
      </div>

      <form onSubmit={handleSupplierSubmit} className="mt-5 grid gap-4">
        <label className="space-y-2">
          <span className="form-label">Supplier Name</span>
          <input value={supplierForm.name} onChange={(event) => setSupplierForm((prev) => ({ ...prev, name: event.target.value }))} className="input-base" placeholder="Enter supplier name" required />
        </label>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="form-label">Contact Person</span>
            <input value={supplierForm.contactPerson} onChange={(event) => setSupplierForm((prev) => ({ ...prev, contactPerson: event.target.value }))} className="input-base" placeholder="Enter contact person" />
          </label>
          <label className="space-y-2">
            <span className="form-label">Phone</span>
            <input value={supplierForm.phone} onChange={(event) => setSupplierForm((prev) => ({ ...prev, phone: event.target.value }))} className="input-base" placeholder="Enter phone number" />
          </label>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="form-label">Email</span>
            <input type="email" value={supplierForm.email} onChange={(event) => setSupplierForm((prev) => ({ ...prev, email: event.target.value }))} className="input-base" placeholder="Enter supplier email" />
          </label>
          <label className="space-y-2">
            <span className="form-label">Tax ID</span>
            <input value={supplierForm.taxId} onChange={(event) => setSupplierForm((prev) => ({ ...prev, taxId: event.target.value }))} className="input-base" placeholder="Enter GST or tax ID" />
          </label>
        </div>
        <label className="space-y-2">
          <span className="form-label">Address</span>
          <textarea value={supplierForm.address} onChange={(event) => setSupplierForm((prev) => ({ ...prev, address: event.target.value }))} className="input-base min-h-[5rem]" placeholder="Enter supplier address" rows={3} />
        </label>
        <label className="space-y-2">
          <span className="form-label">Notes</span>
          <textarea value={supplierForm.notes} onChange={(event) => setSupplierForm((prev) => ({ ...prev, notes: event.target.value }))} className="input-base min-h-[5rem]" placeholder="Add notes about supplier terms or delivery" rows={3} />
        </label>
        <label className="glass-subtle flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
          <input type="checkbox" checked={supplierForm.isActive} onChange={(event) => setSupplierForm((prev) => ({ ...prev, isActive: event.target.checked }))} />
          Active supplier
        </label>
        <div className="flex flex-wrap gap-3">
          <button disabled={!canManageInventory || submitting} className="btn-primary">{canManageInventory ? (submitting ? "Saving..." : editingSupplierId ? "Update Supplier" : "Create Supplier") : "Admin/Manager Only"}</button>
          <button type="button" onClick={resetSupplierForm} className="btn-outline">Reset</button>
        </div>
      </form>
    </article>

    <article className="card-elevated p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-black text-slate-900 dark:text-slate-50">Supplier Directory</h3>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Track contacts and reuse them in purchase orders.</p>
        </div>
        <span className="glass-pill rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-slate-700 dark:text-slate-200">{suppliers.length} suppliers</span>
      </div>

      <div className="mt-5 space-y-3">
        {suppliers.map((supplier) => (
          <article key={supplier._id} className="glass-subtle rounded-[1.3rem] p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-base font-black text-slate-900 dark:text-slate-50">{supplier.name}</p>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{supplier.contactPerson || "No contact person"} | {supplier.phone || "No phone"}</p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{supplier.email || "No email"} | {supplier.taxId || "No tax ID"}</p>
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{supplier.notes || supplier.address || "No supplier notes yet."}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {canManageInventory ? <button type="button" onClick={() => onEditSupplier(supplier)} className="glass-pill rounded-full px-4 py-1.5 text-xs font-bold text-sky-700 dark:text-sky-300">Edit</button> : null}
                {canManageInventory ? <button type="button" onClick={() => onDeleteSupplier(supplier._id)} className="glass-pill rounded-full px-4 py-1.5 text-xs font-bold text-rose-700 dark:text-rose-300">Delete</button> : null}
                {!canManageInventory && canRecordPayments ? <span className="glass-pill rounded-full px-4 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-300">View Only</span> : null}
              </div>
            </div>
          </article>
        ))}
        {!suppliers.length ? <p className="text-sm text-slate-500 dark:text-slate-400">No suppliers added yet.</p> : null}
      </div>
    </article>
  </section>
);

export const InventoryPurchaseOrdersView = ({
  purchaseOrderForm,
  setPurchaseOrderForm,
  suppliers,
  items,
  purchaseOrders,
  purchaseSummary,
  canManageInventory,
  canRecordPayments,
  submitting,
  handlePurchaseOrderSubmit,
  addPurchaseOrderLine,
  updatePurchaseOrderLine,
  removePurchaseOrderLine,
  recordPayment,
  receiveOrderStock,
  deletePurchaseOrder,
}) => (
  <div className="space-y-6">
    <section className="glass-panel rounded-[2rem] p-6 md:p-8">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <span className="glass-pill inline-flex rounded-full px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-700 dark:text-slate-200">
            Procurement
          </span>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900 dark:text-slate-50 md:text-4xl">Purchase Orders</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">
            Raise purchase orders, record supplier payments, and receive stock directly into inventory.
          </p>
        </div>
      </div>
    </section>

    <section className="grid gap-4 md:grid-cols-4">
      <div className="glass-subtle rounded-[1.3rem] p-4"><p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Orders</p><p className="mt-3 text-2xl font-black text-slate-900 dark:text-slate-50">{purchaseSummary.totalOrders || 0}</p></div>
      <div className="glass-subtle rounded-[1.3rem] p-4"><p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Total Value</p><p className="mt-3 text-2xl font-black text-slate-900 dark:text-slate-50">Rs {Number(purchaseSummary.totalValue || 0).toLocaleString()}</p></div>
      <div className="glass-subtle rounded-[1.3rem] p-4"><p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Paid</p><p className="mt-3 text-2xl font-black text-emerald-600 dark:text-emerald-300">Rs {Number(purchaseSummary.totalPaid || 0).toLocaleString()}</p></div>
      <div className="glass-subtle rounded-[1.3rem] p-4"><p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Due</p><p className="mt-3 text-2xl font-black text-rose-600 dark:text-rose-300">Rs {Number(purchaseSummary.totalDue || 0).toLocaleString()}</p></div>
    </section>

    <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <article className="card-elevated p-6">
        <div className="flex items-center gap-3">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-400 text-white shadow-lg">
            <FiArchive className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-slate-50">Create Purchase Order</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300">Select a supplier and inventory items to order.</p>
          </div>
        </div>

        <form onSubmit={handlePurchaseOrderSubmit} className="mt-5 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="form-label">Supplier</span>
              <select value={purchaseOrderForm.supplier} onChange={(event) => setPurchaseOrderForm((prev) => ({ ...prev, supplier: event.target.value }))} className="input-base" required>
                <option value="">Select supplier</option>
                {suppliers.filter((supplier) => supplier.isActive !== false).map((supplier) => <option key={supplier._id} value={supplier._id}>{supplier.name}</option>)}
              </select>
            </label>
            <label className="space-y-2">
              <span className="form-label">Expected Delivery Date</span>
              <input type="date" value={purchaseOrderForm.expectedDeliveryDate} onChange={(event) => setPurchaseOrderForm((prev) => ({ ...prev, expectedDeliveryDate: event.target.value }))} className="input-base" />
            </label>
          </div>
          <label className="space-y-2">
            <span className="form-label">Order Notes</span>
            <textarea value={purchaseOrderForm.notes} onChange={(event) => setPurchaseOrderForm((prev) => ({ ...prev, notes: event.target.value }))} className="input-base min-h-[5rem]" placeholder="Add order notes or supplier instructions" rows={3} />
          </label>

          <div className="glass-subtle rounded-[1.4rem] p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-black text-slate-900 dark:text-slate-50">Order Lines</p>
              <button type="button" onClick={addPurchaseOrderLine} className="glass-pill rounded-full px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200">Add Line</button>
            </div>
            <div className="space-y-3">
              {purchaseOrderForm.items.map((line, index) => (
                <div key={`line-${index}`} className="grid gap-3 rounded-[1rem] border border-white/30 p-3 dark:border-white/10 lg:grid-cols-[1.3fr_120px_120px_1fr_88px]">
                  <label className="space-y-2">
                    <span className="form-label">Inventory Item</span>
                    <select value={line.inventoryItem} onChange={(event) => updatePurchaseOrderLine(index, "inventoryItem", event.target.value)} className="input-base text-sm">
                      <option value="">Select item</option>
                      {items.map((item) => <option key={item._id} value={item._id}>{item.name} ({item.unit})</option>)}
                    </select>
                  </label>
                  <label className="space-y-2">
                    <span className="form-label">Qty</span>
                    <input type="number" min="0.001" step="0.001" value={line.orderedQuantity} onChange={(event) => updatePurchaseOrderLine(index, "orderedQuantity", event.target.value)} className="input-base text-sm" placeholder="Qty" />
                  </label>
                  <label className="space-y-2">
                    <span className="form-label">Rate</span>
                    <input type="number" min="0" step="0.01" value={line.unitPrice} onChange={(event) => updatePurchaseOrderLine(index, "unitPrice", event.target.value)} className="input-base text-sm" placeholder="Rate" />
                  </label>
                  <label className="space-y-2">
                    <span className="form-label">Notes</span>
                    <input value={line.notes} onChange={(event) => updatePurchaseOrderLine(index, "notes", event.target.value)} className="input-base text-sm" placeholder="Line notes" />
                  </label>
                  <button type="button" onClick={() => removePurchaseOrderLine(index)} className="btn-danger mt-7 text-xs">Remove</button>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <label className="space-y-2">
              <span className="form-label">Initial Payment</span>
              <input type="number" min="0" step="0.01" value={purchaseOrderForm.totalPaid} onChange={(event) => setPurchaseOrderForm((prev) => ({ ...prev, totalPaid: event.target.value }))} className="input-base" placeholder="Enter initial payment" />
            </label>
            <label className="space-y-2">
              <span className="form-label">Payment Method</span>
              <select value={purchaseOrderForm.paymentMethod} onChange={(event) => setPurchaseOrderForm((prev) => ({ ...prev, paymentMethod: event.target.value }))} className="input-base">
                <option value="other">Other</option>
                <option value="cash">Cash</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="upi">UPI</option>
                <option value="card">Card</option>
              </select>
            </label>
            <label className="space-y-2">
              <span className="form-label">Payment Note</span>
              <input value={purchaseOrderForm.paymentNote} onChange={(event) => setPurchaseOrderForm((prev) => ({ ...prev, paymentNote: event.target.value }))} className="input-base" placeholder="Initial payment note" />
            </label>
          </div>

          <button disabled={!canManageInventory || submitting} className="btn-primary">{canManageInventory ? (submitting ? "Saving..." : "Create Purchase Order") : "Admin/Manager Only"}</button>
        </form>
      </article>

      <article className="card-elevated p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-black text-slate-900 dark:text-slate-50">Purchase Orders</h3>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Receive stock and record supplier payments from here.</p>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          {purchaseOrders.map((order) => (
            <article key={order._id} className="glass-subtle rounded-[1.3rem] p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-base font-black text-slate-900 dark:text-slate-50">{order.purchaseOrderNumber}</p>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{order.supplier?.name || "Unknown supplier"} | {order.status.replace(/_/g, " ")}</p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Total: Rs {Number(order.subtotal || 0).toLocaleString()} | Paid: Rs {Number(order.totalPaid || 0).toLocaleString()} | Due: Rs {Number(order.balanceDue || 0).toLocaleString()}</p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Payment status: {order.paymentStatus}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {canRecordPayments ? <button type="button" onClick={() => recordPayment(order)} className="glass-pill inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300"><FiCreditCard className="h-3.5 w-3.5" />Payment</button> : null}
                  {canManageInventory ? <button type="button" onClick={() => receiveOrderStock(order)} className="glass-pill inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold text-sky-700 dark:text-sky-300"><FiTruck className="h-3.5 w-3.5" />Receive</button> : null}
                  {canManageInventory ? <button type="button" onClick={() => deletePurchaseOrder(order._id)} className="glass-pill inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold text-rose-700 dark:text-rose-300"><FiPackage className="h-3.5 w-3.5" />Delete</button> : null}
                </div>
              </div>
              <div className="mt-3 space-y-2">
                {order.items?.slice(0, 3).map((item) => (
                  <p key={`${order._id}-${item.inventoryItem}`} className="text-xs text-slate-500 dark:text-slate-400">
                    {item.itemName}: ordered {Number(item.orderedQuantity || 0)} {item.unit}, received {Number(item.receivedQuantity || 0)} {item.unit}, rate Rs {Number(item.unitPrice || 0).toFixed(2)}
                  </p>
                ))}
                {order.items?.length > 3 ? <p className="text-xs text-slate-500 dark:text-slate-400">+ {order.items.length - 3} more lines</p> : null}
              </div>
            </article>
          ))}
          {!purchaseOrders.length ? <p className="text-sm text-slate-500 dark:text-slate-400">No purchase orders yet.</p> : null}
        </div>
      </article>
    </section>
  </div>
);

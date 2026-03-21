import { FiCamera, FiPlus, FiSave, FiUploadCloud } from "react-icons/fi";
import { titleize } from "./inventoryUtils";

const InventoryScannerView = ({
  scanning,
  selectedImageName,
  scanProgress,
  handleScanImage,
  addManualDraft,
  saveAllDrafts,
  drafts,
  submitting,
  updateDraft,
  activeCategories,
  activeUnits,
  saveDraft,
  removeDraft,
  scanText,
  canManageInventory,
}) => (
  <div className="space-y-6">
    <section className="glass-panel rounded-[2rem] p-6 md:p-8">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <span className="glass-pill inline-flex rounded-full px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-700 dark:text-slate-200">
            OCR Draft Lab
          </span>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900 dark:text-slate-50 md:text-4xl">Scanner Drafts</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">
            Upload a photo, let OCR extract text, review the draft rows here, and only save to the database when you are happy with them.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <label className="btn-primary inline-flex cursor-pointer items-center gap-2">
            <FiUploadCloud className="h-4 w-4" />
            Upload & Scan
            <input type="file" accept="image/*" className="hidden" onChange={handleScanImage} />
          </label>
          <button onClick={addManualDraft} className="btn-outline inline-flex items-center gap-2">
            <FiPlus className="h-4 w-4" />
            Add Manual Draft
          </button>
        </div>
      </div>

      {scanning ? (
        <div className="mt-5 rounded-[1.5rem] border border-sky-200/70 bg-sky-50/80 p-4 dark:border-sky-500/30 dark:bg-sky-500/10">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Scanning {selectedImageName || "image"}...</p>
            <span className="text-sm font-black text-sky-700 dark:text-sky-300">{scanProgress}%</span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
            <div className="h-full rounded-full bg-gradient-to-r from-sky-500 to-cyan-400" style={{ width: `${scanProgress}%` }} />
          </div>
        </div>
      ) : null}
    </section>

    <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <article className="card-elevated p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-black text-slate-900 dark:text-slate-50">Draft Queue</h3>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">These rows live only in the UI until you save them.</p>
          </div>
          <button onClick={saveAllDrafts} disabled={!drafts.length || submitting || !canManageInventory} className="btn-primary inline-flex items-center gap-2">
            <FiSave className="h-4 w-4" />
            {canManageInventory ? "Save All Drafts" : "Admin/Manager Only"}
          </button>
        </div>

        <div className="mt-5 space-y-4">
          {drafts.map((draft) => (
            <article key={draft.draftId} className="glass-subtle rounded-[1.4rem] p-4">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-black text-slate-900 dark:text-slate-50">{draft.name || "Untitled Draft"}</p>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{draft.source === "scan" ? "Scanned draft" : "Manual draft"}</p>
                </div>
                <div className="flex gap-2">
                  {canManageInventory ? <button type="button" onClick={() => saveDraft(draft.draftId)} className="glass-pill rounded-full px-4 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300">Save</button> : null}
                  <button type="button" onClick={() => removeDraft(draft.draftId)} className="glass-pill rounded-full px-4 py-1.5 text-xs font-bold text-rose-700 dark:text-rose-300">Remove</button>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                <label className="space-y-2">
                  <span className="form-label">Item Name</span>
                  <input type="text" value={draft.name} onChange={(event) => updateDraft(draft.draftId, "name", event.target.value)} placeholder="Enter item name" className="input-base" />
                </label>
                <label className="space-y-2">
                  <span className="form-label">Category</span>
                  <select value={draft.category} onChange={(event) => updateDraft(draft.draftId, "category", event.target.value)} className="input-base">
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
                  <select value={draft.unit} onChange={(event) => updateDraft(draft.draftId, "unit", event.target.value)} className="input-base">
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
                  <input type="number" value={draft.currentStock} onChange={(event) => updateDraft(draft.draftId, "currentStock", event.target.value)} placeholder="Enter current stock" className="input-base" />
                </label>
                <label className="space-y-2">
                  <span className="form-label">Minimum Threshold</span>
                  <input type="number" value={draft.minimumThreshold} onChange={(event) => updateDraft(draft.draftId, "minimumThreshold", event.target.value)} placeholder="Enter minimum threshold" className="input-base" />
                </label>
                <label className="space-y-2">
                  <span className="form-label">Maximum Stock</span>
                  <input type="number" value={draft.maximumStock} onChange={(event) => updateDraft(draft.draftId, "maximumStock", event.target.value)} placeholder="Enter maximum stock" className="input-base" />
                </label>
                <label className="space-y-2">
                  <span className="form-label">Unit Cost</span>
                  <input type="number" value={draft.unitCost} onChange={(event) => updateDraft(draft.draftId, "unitCost", event.target.value)} placeholder="Enter unit cost" className="input-base" />
                </label>
                <label className="space-y-2">
                  <span className="form-label">Supplier</span>
                  <input type="text" value={draft.supplier} onChange={(event) => updateDraft(draft.draftId, "supplier", event.target.value)} placeholder="Enter supplier name" className="input-base" />
                </label>
                <label className="space-y-2">
                  <span className="form-label">Location</span>
                  <input type="text" value={draft.location} onChange={(event) => updateDraft(draft.draftId, "location", event.target.value)} placeholder="Enter storage location" className="input-base" />
                </label>
                <label className="space-y-2 md:col-span-2 xl:col-span-3">
                  <span className="form-label">Description</span>
                  <textarea value={draft.description} onChange={(event) => updateDraft(draft.draftId, "description", event.target.value)} placeholder="Add description" className="input-base min-h-[5rem]" rows={3} />
                </label>
              </div>

              {draft.rawText ? <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">OCR source: {draft.rawText}</p> : null}
            </article>
          ))}

          {!drafts.length ? <p className="text-sm text-slate-500 dark:text-slate-400">No drafts yet. Upload a photo or add a manual draft item.</p> : null}
        </div>
      </article>

      <article className="card-elevated p-6">
        <div className="flex items-center gap-3">
          <FiCamera className="h-5 w-5 text-sky-500" />
          <h3 className="text-xl font-black text-slate-900 dark:text-slate-50">Scan Output</h3>
        </div>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Raw OCR text stays visible here so you can compare what was detected with the draft rows.</p>
        <div className="mt-5 min-h-[24rem] rounded-[1.5rem] border border-slate-200/70 bg-slate-50/80 p-4 text-sm leading-6 text-slate-700 dark:border-slate-700/60 dark:bg-slate-900/20 dark:text-slate-200">
          {scanText || "No OCR text yet. Upload an image to populate this panel."}
        </div>
      </article>
    </section>
  </div>
);

export default InventoryScannerView;

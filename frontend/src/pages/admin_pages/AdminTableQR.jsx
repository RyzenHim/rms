import { useMemo, useState } from "react";

const tableRange = Array.from({ length: 20 }, (_, i) => `T${String(i + 1).padStart(2, "0")}`);

const AdminTableQR = () => {
  const [baseUrl, setBaseUrl] = useState("http://localhost:5173/customer/menu");

  const tableLinks = useMemo(
    () =>
      tableRange.map((table) => {
        const url = `${baseUrl}?table=${encodeURIComponent(table)}`;
        const qrRef = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(url)}`;
        return { table, url, qrRef };
      }),
    [baseUrl],
  );

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <h2 className="heading-1">🏷️ Table QR Manager</h2>
        <p className="text-lg text-slate-600">
          Generate and print QR codes for each table. Customers scan to open the menu with their table automatically selected.
        </p>
      </div>

      <div className="card-elevated p-6">
        <div className="form-group">
          <label className="form-label">Customer Menu Base URL</label>
          <p className="form-hint mb-3">This URL will be embedded in the QR codes. Modify the domain if deploying to production.</p>
          <input
            type="url"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            className="input-base w-full"
            placeholder="https://yoursite.com/customer/menu"
          />
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="heading-3">📋 All Table QR Codes</h3>
          <span className="badge-info px-3 py-1 rounded-full text-sm">{tableRange.length} Tables</span>
        </div>
        
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {tableLinks.map((entry) => (
            <article key={entry.table} className="card-elevated p-5 text-center space-y-4 hover-lift group">
              <div className="heading-4 text-slate-900">🪑 {entry.table}</div>
              
              <div className="bg-white p-4 rounded-lg border-2 border-slate-200 group-hover:border-emerald-300 transition-colors">
                <img 
                  src={entry.qrRef} 
                  alt={`QR for ${entry.table}`} 
                  className="h-40 w-40 mx-auto rounded border border-slate-200" 
                />
              </div>
              
              <div className="space-y-2 text-xs">
                <a 
                  href={entry.url} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="block truncate text-emerald-700 underline font-semibold hover:text-emerald-900"
                >
                  {entry.url}
                </a>
                <div className="flex gap-2">
                  <a
                    href={entry.qrRef}
                    download={`table-${entry.table}-qr.png`}
                    className="btn-small btn-primary flex-1 text-xs"
                  >
                    📥 Download
                  </a>
                  <button
                    onClick={() => window.print()}
                    className="btn-small btn-outline flex-1 text-xs"
                  >
                    🖨️ Print
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>

      <div className="alert-info p-5 space-y-3">
        <p className="font-bold">💡 Pro Tips:</p>
        <ul className="space-y-2 text-sm list-disc list-inside text-slate-700">
          <li>Print QR codes on adhesive stickers or laminated cards</li>
          <li>Mount them on tables or table tents for easy scanning</li>
          <li>Use the download function to save QR codes locally</li>
          <li>Update the base URL if your domain changes</li>
          <li>Test QR codes before mass printing</li>
        </ul>
      </div>
    </div>
  );
};

export default AdminTableQR;

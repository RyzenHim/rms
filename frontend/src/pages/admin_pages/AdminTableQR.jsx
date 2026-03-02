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
    <div className="space-y-5">
      <div>
        <h2 className="text-3xl font-black text-slate-900">Table QR Manager</h2>
        <p className="mt-1 text-sm text-slate-600">
          Print these QR codes on tables. Scanning opens customer menu with table number prefilled.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <label className="block text-sm font-semibold text-slate-700">Customer Menu Base URL</label>
        <input
          type="text"
          value={baseUrl}
          onChange={(e) => setBaseUrl(e.target.value)}
          className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tableLinks.map((entry) => (
          <article key={entry.table} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-lg font-black text-slate-900">Table {entry.table}</p>
            <img src={entry.qrRef} alt={`QR for ${entry.table}`} className="mt-3 h-40 w-40 rounded-lg border border-slate-200" />
            <a href={entry.url} target="_blank" rel="noreferrer" className="mt-3 block truncate text-xs font-semibold text-emerald-700 underline">
              {entry.url}
            </a>
          </article>
        ))}
      </div>
    </div>
  );
};

export default AdminTableQR;

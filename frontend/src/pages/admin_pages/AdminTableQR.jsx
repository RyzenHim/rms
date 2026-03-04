import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import api, { withAuth } from "../../services/api";

const AdminTableQR = () => {
  const { token } = useAuth();
  const [baseUrl, setBaseUrl] = useState("http://localhost:5173/customer/menu");
  const [tableLinks, setTableLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const loadQrLinks = async () => {
    try {
      setLoading(true);
      setMessage("");
      const { data } = await api.get(`/tables/qr-links?baseUrl=${encodeURIComponent(baseUrl)}`, withAuth(token));
      setTableLinks(data?.tableLinks || []);
    } catch (err) {
      setTableLinks([]);
      setMessage(err?.response?.data?.message || "Failed to generate table QR links");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    loadQrLinks();
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <h2 className="heading-1"> Table QR Manager</h2>
        <p className="text-lg text-slate-600">
          Generate signed QR codes from real tables in Table Management. Customers scan to open the menu with validated table identity.
        </p>
      </div>

      <div className="card-elevated p-6 space-y-4">
        <div className="form-group">
          <label className="form-label">Customer Menu Base URL</label>
          <p className="form-hint mb-3">This URL will be embedded in the QR codes. Use your production domain when deployed.</p>
          <input
            type="url"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            className="input-base w-full"
            placeholder="https://yoursite.com/customer/menu"
          />
        </div>
        <div className="flex gap-3">
          <button onClick={loadQrLinks} className="btn-primary" disabled={loading || !token}>
            {loading ? "Generating..." : "Generate QR Codes"}
          </button>
          <button onClick={() => window.print()} className="btn-outline">
            Print All
          </button>
        </div>
      </div>

      {message ? <div className="alert-error p-4">{message}</div> : null}

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="heading-3"> All Table QR Codes</h3>
          <span className="badge-info px-3 py-1 rounded-full text-sm">{tableLinks.length} Tables</span>
        </div>

        {loading ? (
          <div className="text-sm text-slate-600">Loading QR codes...</div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {tableLinks.map((entry) => (
              <article key={entry.id} className="card-elevated p-5 text-center space-y-4 hover-lift group">
                <div className="heading-4 text-slate-900">{entry.tableNumber}</div>

                <div className="bg-white p-4 rounded-lg border-2 border-slate-200 group-hover:border-emerald-300 transition-colors">
                  <img src={entry.qrRef} alt={`QR for ${entry.tableNumber}`} className="h-40 w-40 mx-auto rounded border border-slate-200" />
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
                      download={`table-${entry.tableNumber}-qr.png`}
                      className="btn-small btn-primary flex-1 text-xs"
                    >
                      Download
                    </a>
                    <button onClick={() => window.print()} className="btn-small btn-outline flex-1 text-xs">
                      Print
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      <div className="alert-info p-5 space-y-3">
        <p className="font-bold">Pro Tips:</p>
        <ul className="space-y-2 text-sm list-disc list-inside text-slate-700">
          <li>Create tables first in Table Management so QR list stays accurate</li>
          <li>Each QR contains a signed token; tampered URLs are rejected at checkout</li>
          <li>Print on laminated cards or table tents and verify one scan per table</li>
          <li>Regenerate if your frontend domain changes</li>
        </ul>
      </div>
    </div>
  );
};

export default AdminTableQR;

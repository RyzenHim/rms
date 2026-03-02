import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import employeeService from "../../services/employee_Service";

const emptyForm = {
  name: "",
  email: "",
  password: "",
  role: "waiter",
  employeeCode: "",
  department: "",
  phone: "",
  emergencyContactName: "",
  emergencyContactPhone: "",
  address: "",
  experienceYears: "",
  gender: "",
  bloodGroup: "",
  dateOfBirth: "",
  idProofType: "",
  idProofNumber: "",
  salary: "",
  shift: "morning",
  joiningDate: "",
  isActive: true,
};

const AdminEmployees = () => {
  const { token } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");

  const loadEmployees = async () => {
    try {
      const res = await employeeService.getEmployees(token);
      setEmployees(res.employees || []);
    } catch (err) {
      setMessage({ type: "error", text: err?.response?.data?.message || "Failed to load employees" });
    }
  };

  useEffect(() => {
    loadEmployees();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const onSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    const payload = {
      ...form,
      experienceYears: form.experienceYears === "" ? 0 : Number(form.experienceYears),
      salary: form.salary === "" ? "" : Number(form.salary),
      dateOfBirth: form.dateOfBirth || "",
      joiningDate: form.joiningDate || "",
    };
    try {
      if (editingId) {
        delete payload.password;
        await employeeService.updateEmployee(token, editingId, payload);
        setMessage({ type: "success", text: "Employee updated" });
      } else {
        await employeeService.createEmployee(token, payload);
        setMessage({ type: "success", text: "Employee created" });
      }
      setForm(emptyForm);
      setEditingId(null);
      await loadEmployees();
    } catch (err) {
      setMessage({ type: "error", text: err?.response?.data?.message || "Employee save failed" });
    } finally {
      setSubmitting(false);
    }
  };

  const onEdit = (employee) => {
    setEditingId(employee.id);
    setForm({
      name: employee.name || "",
      email: employee.email || "",
      password: "",
      role: employee.role || "waiter",
      employeeCode: employee.employeeCode || "",
      department: employee.department || "",
      phone: employee.phone || "",
      emergencyContactName: employee.emergencyContactName || "",
      emergencyContactPhone: employee.emergencyContactPhone || "",
      address: employee.address || "",
      experienceYears: employee.experienceYears ?? "",
      gender: employee.gender || "",
      bloodGroup: employee.bloodGroup || "",
      dateOfBirth: employee.dateOfBirth ? String(employee.dateOfBirth).slice(0, 10) : "",
      idProofType: employee.idProofType || "",
      idProofNumber: employee.idProofNumber || "",
      salary: employee.salary ?? "",
      shift: employee.shift || "morning",
      joiningDate: employee.joiningDate ? String(employee.joiningDate).slice(0, 10) : "",
      isActive: Boolean(employee.isActive),
    });
  };

  const onDelete = async (id) => {
    try {
      await employeeService.deleteEmployee(token, id);
      setMessage({ type: "success", text: "Employee deleted" });
      await loadEmployees();
    } catch (err) {
      setMessage({ type: "error", text: err?.response?.data?.message || "Employee delete failed" });
    }
  };

  const filteredEmployees = employees.filter((employee) => {
    const haystack = `${employee.name || ""} ${employee.email || ""} ${employee.role || ""} ${employee.department || ""}`.toLowerCase();
    return haystack.includes(search.toLowerCase());
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-black text-slate-900">Employee Management</h2>
        <p className="mt-1 text-sm text-slate-600">Create and manage employee profiles with role, contacts, shift and payroll details.</p>
        {message.text ? (
          <p className={`mt-2 rounded-xl px-3 py-2 text-sm font-medium ${message.type === "error" ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>
            {message.text}
          </p>
        ) : null}
      </div>

      <section className="grid gap-6 lg:grid-cols-2">
        <form onSubmit={onSubmit} className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-4 shadow-sm">
          <h3 className="text-xl font-bold text-slate-900">{editingId ? "Edit Employee" : "Create Employee"}</h3>
          <div className="mt-4 grid gap-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <input type="text" placeholder="Name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} className="rounded-xl border border-slate-300 px-3 py-2" required />
              <input type="email" placeholder="Email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} className="rounded-xl border border-slate-300 px-3 py-2" required />
            </div>
            {!editingId ? (
              <input type="password" placeholder="Password" value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} className="rounded-xl border border-slate-300 px-3 py-2" required />
            ) : null}

            <div className="grid gap-3 sm:grid-cols-3">
              <select value={form.role} onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))} className="rounded-xl border border-slate-300 px-3 py-2">
                {["admin", "manager", "kitchen", "cashier", "waiter"].map((role) => <option key={role} value={role}>{role}</option>)}
              </select>
              <input type="text" placeholder="Employee Code" value={form.employeeCode} onChange={(e) => setForm((p) => ({ ...p, employeeCode: e.target.value }))} className="rounded-xl border border-slate-300 px-3 py-2" />
              <input type="text" placeholder="Department" value={form.department} onChange={(e) => setForm((p) => ({ ...p, department: e.target.value }))} className="rounded-xl border border-slate-300 px-3 py-2" />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <input type="text" placeholder="Phone" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} className="rounded-xl border border-slate-300 px-3 py-2" />
              <input type="number" min="0" placeholder="Experience Years" value={form.experienceYears} onChange={(e) => setForm((p) => ({ ...p, experienceYears: e.target.value }))} className="rounded-xl border border-slate-300 px-3 py-2" />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <input type="text" placeholder="Emergency Contact Name" value={form.emergencyContactName} onChange={(e) => setForm((p) => ({ ...p, emergencyContactName: e.target.value }))} className="rounded-xl border border-slate-300 px-3 py-2" />
              <input type="text" placeholder="Emergency Contact Phone" value={form.emergencyContactPhone} onChange={(e) => setForm((p) => ({ ...p, emergencyContactPhone: e.target.value }))} className="rounded-xl border border-slate-300 px-3 py-2" />
            </div>

            <textarea placeholder="Address" value={form.address} onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))} className="rounded-xl border border-slate-300 px-3 py-2" rows={2} />

            <div className="grid gap-3 sm:grid-cols-3">
              <select value={form.gender} onChange={(e) => setForm((p) => ({ ...p, gender: e.target.value }))} className="rounded-xl border border-slate-300 px-3 py-2">
                <option value="">Gender</option><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option>
              </select>
              <input type="text" placeholder="Blood Group" value={form.bloodGroup} onChange={(e) => setForm((p) => ({ ...p, bloodGroup: e.target.value }))} className="rounded-xl border border-slate-300 px-3 py-2" />
              <input type="date" value={form.dateOfBirth} onChange={(e) => setForm((p) => ({ ...p, dateOfBirth: e.target.value }))} className="rounded-xl border border-slate-300 px-3 py-2" />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <input type="text" placeholder="ID Proof Type" value={form.idProofType} onChange={(e) => setForm((p) => ({ ...p, idProofType: e.target.value }))} className="rounded-xl border border-slate-300 px-3 py-2" />
              <input type="text" placeholder="ID Proof Number" value={form.idProofNumber} onChange={(e) => setForm((p) => ({ ...p, idProofNumber: e.target.value }))} className="rounded-xl border border-slate-300 px-3 py-2" />
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <input type="number" min="0" placeholder="Salary" value={form.salary} onChange={(e) => setForm((p) => ({ ...p, salary: e.target.value }))} className="rounded-xl border border-slate-300 px-3 py-2" />
              <select value={form.shift} onChange={(e) => setForm((p) => ({ ...p, shift: e.target.value }))} className="rounded-xl border border-slate-300 px-3 py-2">
                {["morning", "evening", "night"].map((shift) => <option key={shift} value={shift}>{shift}</option>)}
              </select>
              <input type="date" value={form.joiningDate} onChange={(e) => setForm((p) => ({ ...p, joiningDate: e.target.value }))} className="rounded-xl border border-slate-300 px-3 py-2" />
            </div>

            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))} />
              Active employee
            </label>

            <div className="flex gap-2">
              <button disabled={submitting} className="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">{submitting ? "Saving..." : editingId ? "Update Employee" : "Create Employee"}</button>
              {editingId ? (
                <button type="button" onClick={() => { setEditingId(null); setForm(emptyForm); }} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold">
                  Cancel
                </button>
              ) : null}
            </div>
          </div>
        </form>

        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-xl font-bold text-slate-900">Employees</h3>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search employee..."
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm sm:w-64"
            />
          </div>
          <div className="mt-4 max-h-[36rem] space-y-2 overflow-auto pr-1">
            {filteredEmployees.map((employee) => (
              <div key={employee.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
                <p className="font-bold text-slate-900">{employee.name}</p>
                <p className="text-slate-600">{employee.email}</p>
                <p className="text-xs text-slate-500">{employee.role} | {employee.department || "no dept"} | {employee.shift || "no shift"}</p>
                <p className="text-xs text-slate-500">{employee.phone || "no phone"} | {employee.employeeCode || "no code"}</p>
                <div className="mt-2 flex gap-2">
                  <button onClick={() => onEdit(employee)} className="rounded-lg bg-slate-800 px-3 py-1 text-xs font-semibold text-white">Edit</button>
                  <button onClick={() => onDelete(employee.id)} className="rounded-lg bg-red-600 px-3 py-1 text-xs font-semibold text-white">Delete</button>
                </div>
              </div>
            ))}
            {!filteredEmployees.length ? <p className="text-sm text-slate-500">No employees found.</p> : null}
          </div>
        </div>
      </section>
    </div>
  );
};

export default AdminEmployees;

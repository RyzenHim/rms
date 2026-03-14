import { useEffect, useMemo, useState } from "react";
import {
  FiArchive,
  FiEye,
  FiRefreshCcw,
  FiSearch,
  FiShield,
  FiUserPlus,
  FiUsers,
} from "react-icons/fi";
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

const statusTabs = [
  { id: "all", label: "All Staff" },
  { id: "active", label: "Active" },
  { id: "inactive", label: "Inactive" },
  { id: "deleted", label: "Deleted" },
];

const allRoles = ["admin", "manager", "kitchen", "cashier", "waiter"];

const AdminEmployees = () => {
  const { token, user, getPrimaryRole } = useAuth();
  const actorRole = getPrimaryRole(user?.roles || []);
  const canAssignAdmin = actorRole === "admin";
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [showDeletedSection, setShowDeletedSection] = useState(true);

  const roleOptions = useMemo(
    () => allRoles.filter((role) => canAssignAdmin || role !== "admin"),
    [canAssignAdmin],
  );

  const resetForm = () => {
    setEditingId(null);
    setForm({
      ...emptyForm,
      role: roleOptions.includes(emptyForm.role) ? emptyForm.role : roleOptions[0] || "waiter",
    });
  };

  const canManageEmployee = (employee) => canAssignAdmin || employee.role !== "admin";

  const loadEmployees = async () => {
    try {
      const res = await employeeService.getEmployees(token);
      setEmployees(res.employees || []);
    } catch (err) {
      setMessage({ type: "error", text: err?.response?.data?.message || "Failed to load employees" });
    }
  };

  useEffect(() => {
    resetForm();
  }, [roleOptions]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    loadEmployees();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const onSubmit = async (event) => {
    event.preventDefault();
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
      resetForm();
      await loadEmployees();
    } catch (err) {
      setMessage({ type: "error", text: err?.response?.data?.message || "Employee save failed" });
    } finally {
      setSubmitting(false);
    }
  };

  const onEdit = (employee) => {
    if (!canManageEmployee(employee) || employee.isDeleted) {
      return;
    }

    setEditingId(employee.id);
    setForm({
      name: employee.name || "",
      email: employee.email || "",
      password: "",
      role: roleOptions.includes(employee.role) ? employee.role : roleOptions[0] || "waiter",
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

  const onSoftDelete = async (employee) => {
    if (!canManageEmployee(employee)) return;
    try {
      await employeeService.deleteEmployee(token, employee.id);
      setMessage({ type: "success", text: "Employee moved to deleted records" });
      if (editingId === employee.id) {
        resetForm();
      }
      await loadEmployees();
    } catch (err) {
      setMessage({ type: "error", text: err?.response?.data?.message || "Employee delete failed" });
    }
  };

  const onToggleActive = async (employee, nextActive) => {
    if (!canManageEmployee(employee) || employee.isDeleted) return;
    try {
      await employeeService.updateEmployeeStatus(token, employee.id, nextActive);
      setMessage({ type: "success", text: nextActive ? "Employee activated" : "Employee deactivated" });
      await loadEmployees();
    } catch (err) {
      setMessage({ type: "error", text: err?.response?.data?.message || "Employee status update failed" });
    }
  };

  const onRestore = async (employee) => {
    if (!canManageEmployee(employee)) return;
    try {
      await employeeService.restoreEmployee(token, employee.id);
      setMessage({ type: "success", text: "Employee restored" });
      await loadEmployees();
    } catch (err) {
      setMessage({ type: "error", text: err?.response?.data?.message || "Employee restore failed" });
    }
  };

  const employeeCounts = useMemo(() => {
    const active = employees.filter((employee) => employee.isActive && !employee.isDeleted).length;
    const inactive = employees.filter((employee) => !employee.isActive && !employee.isDeleted).length;
    const deleted = employees.filter((employee) => employee.isDeleted).length;
    const leadership = employees.filter((employee) => ["admin", "manager"].includes(employee.role) && !employee.isDeleted).length;

    return { active, inactive, deleted, leadership };
  }, [employees]);

  const filteredEmployees = useMemo(() => {
    return employees.filter((employee) => {
      const haystack = `${employee.name || ""} ${employee.email || ""} ${employee.role || ""} ${employee.department || ""} ${employee.employeeCode || ""}`.toLowerCase();
      const matchesSearch = haystack.includes(search.toLowerCase());
      const matchesStatus =
        statusFilter === "all"
          ? true
          : statusFilter === "active"
            ? employee.isActive && !employee.isDeleted
            : statusFilter === "inactive"
              ? !employee.isActive && !employee.isDeleted
              : employee.isDeleted;
      const matchesRole = roleFilter === "all" ? true : employee.role === roleFilter;

      return matchesSearch && matchesStatus && matchesRole;
    });
  }, [employees, roleFilter, search, statusFilter]);

  const visibleEmployees = filteredEmployees.filter((employee) => !employee.isDeleted);
  const deletedEmployees = filteredEmployees.filter((employee) => employee.isDeleted);

  const summary = [
    { label: "Workforce", value: employees.length, icon: FiUsers, tone: "from-sky-500 to-cyan-400" },
    { label: "Active Staff", value: employeeCounts.active, icon: FiShield, tone: "from-emerald-500 to-teal-400" },
    { label: "Leadership", value: employeeCounts.leadership, icon: FiUserPlus, tone: "from-fuchsia-500 to-violet-500" },
    { label: "Deleted Records", value: employeeCounts.deleted, icon: FiArchive, tone: "from-amber-500 to-orange-400" },
  ];

  return (
    <div className="space-y-5">
      <section className="glass-panel animate-rise-in rounded-[1.75rem] p-5 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <span className="glass-pill inline-flex rounded-full px-3.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-700 dark:text-slate-200">
              Workforce Studio
            </span>
            <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-900 dark:text-slate-50 md:text-3xl">
              {actorRole === "admin" ? "Employee Management" : "Team Management"}
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">
              Manage active staff, deactivate records, and keep deleted employees recoverable. Managers can handle all employee profiles except admin accounts.
            </p>
          </div>
          <div className="glass-subtle rounded-[1.25rem] px-4 py-3 text-xs font-semibold text-slate-600 dark:text-slate-300">
            Signed in as <span className="font-black uppercase tracking-[0.14em] text-slate-900 dark:text-slate-50">{actorRole}</span>
          </div>
        </div>
        {message.text ? <div className={`mt-4 ${message.type === "error" ? "alert-error" : "alert-success"}`}>{message.text}</div> : null}
      </section>

      <section className="grid gap-3 xl:grid-cols-4">
        {summary.map((card, index) => {
          const Icon = card.icon;
          return (
            <article key={card.label} className={`card-elevated animate-fade-in-up stagger-${(index % 4) + 1} smooth-transform p-4`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-300">{card.label}</p>
                  <p className="mt-2 text-2xl font-black tracking-tight text-slate-900 dark:text-slate-50">{card.value}</p>
                </div>
                <div className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${card.tone} text-white shadow-lg`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </article>
          );
        })}
      </section>

      <section className="grid gap-5 2xl:grid-cols-[1.05fr_1.25fr]">
        <form onSubmit={onSubmit} className="card-elevated animate-fade-in-up p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-slate-50">{editingId ? "Edit Employee" : "Create Employee"}</h3>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                Build complete employee records with role, shift, emergency contact, and ID details.
              </p>
            </div>
            <button type="button" onClick={resetForm} className="btn-outline px-4 py-2 text-xs">
              Reset
            </button>
          </div>

          <div className="mt-4 grid gap-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <input type="text" placeholder="Full name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} className="input-base" required />
              <input type="email" placeholder="Work email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} className="input-base" required />
            </div>

            {!editingId ? (
              <input type="password" placeholder="Temporary password" value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} className="input-base" required />
            ) : null}

            <div className="grid gap-3 md:grid-cols-3">
              <select value={form.role} onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))} className="input-base">
                {roleOptions.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
              <input type="text" placeholder="Employee code" value={form.employeeCode} onChange={(e) => setForm((p) => ({ ...p, employeeCode: e.target.value }))} className="input-base" />
              <input type="text" placeholder="Department" value={form.department} onChange={(e) => setForm((p) => ({ ...p, department: e.target.value }))} className="input-base" />
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <input type="text" placeholder="Phone number" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} className="input-base" />
              <input type="number" min="0" placeholder="Experience years" value={form.experienceYears} onChange={(e) => setForm((p) => ({ ...p, experienceYears: e.target.value }))} className="input-base" />
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <input type="text" placeholder="Emergency contact name" value={form.emergencyContactName} onChange={(e) => setForm((p) => ({ ...p, emergencyContactName: e.target.value }))} className="input-base" />
              <input type="text" placeholder="Emergency contact phone" value={form.emergencyContactPhone} onChange={(e) => setForm((p) => ({ ...p, emergencyContactPhone: e.target.value }))} className="input-base" />
            </div>

            <textarea placeholder="Address" value={form.address} onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))} className="input-base min-h-[5rem]" rows={2} />

            <div className="grid gap-3 md:grid-cols-3">
              <select value={form.gender} onChange={(e) => setForm((p) => ({ ...p, gender: e.target.value }))} className="input-base">
                <option value="">Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
              <input type="text" placeholder="Blood group" value={form.bloodGroup} onChange={(e) => setForm((p) => ({ ...p, bloodGroup: e.target.value }))} className="input-base" />
              <input type="date" value={form.dateOfBirth} onChange={(e) => setForm((p) => ({ ...p, dateOfBirth: e.target.value }))} className="input-base" />
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <input type="text" placeholder="ID proof type" value={form.idProofType} onChange={(e) => setForm((p) => ({ ...p, idProofType: e.target.value }))} className="input-base" />
              <input type="text" placeholder="ID proof number" value={form.idProofNumber} onChange={(e) => setForm((p) => ({ ...p, idProofNumber: e.target.value }))} className="input-base" />
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <input type="number" min="0" placeholder="Salary" value={form.salary} onChange={(e) => setForm((p) => ({ ...p, salary: e.target.value }))} className="input-base" />
              <select value={form.shift} onChange={(e) => setForm((p) => ({ ...p, shift: e.target.value }))} className="input-base">
                {["morning", "evening", "night"].map((shift) => (
                  <option key={shift} value={shift}>
                    {shift}
                  </option>
                ))}
              </select>
              <input type="date" value={form.joiningDate} onChange={(e) => setForm((p) => ({ ...p, joiningDate: e.target.value }))} className="input-base" />
            </div>

            <label className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
              <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))} />
              Keep employee active after save
            </label>

            <div className="flex flex-wrap gap-3">
              <button disabled={submitting} className="btn-primary px-5 py-2.5 text-sm">
                {submitting ? "Saving..." : editingId ? "Update employee" : "Create employee"}
              </button>
              {editingId ? (
                <button type="button" onClick={resetForm} className="btn-outline px-5 py-2.5 text-sm">
                  Cancel edit
                </button>
              ) : null}
            </div>
          </div>
        </form>

        <section className="card-elevated animate-fade-in-up p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-slate-50">Directory</h3>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                Filter by category, role, and search text. Deleted records stay recoverable.
              </p>
            </div>
            <div className="relative w-full sm:w-72">
              <FiSearch className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search staff..." className="input-base pl-11" />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {statusTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`rounded-full px-4 py-2 text-xs font-bold transition ${statusFilter === tab.id ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900" : "glass-pill text-slate-700 dark:text-slate-200"}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setRoleFilter("all")}
              className={`rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] ${roleFilter === "all" ? "bg-sky-600 text-white" : "glass-pill text-slate-700 dark:text-slate-200"}`}
            >
              All roles
            </button>
            {allRoles.map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => setRoleFilter(role)}
                className={`rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] ${roleFilter === role ? "bg-sky-600 text-white" : "glass-pill text-slate-700 dark:text-slate-200"}`}
              >
                {role}
              </button>
            ))}
          </div>

          <div className="mt-5 grid gap-3 xl:grid-cols-2">
            {visibleEmployees.map((employee, index) => {
              const canManage = canManageEmployee(employee);
              return (
                <article key={employee.id} className={`glass-subtle animate-fade-in-up stagger-${(index % 4) + 1} rounded-[1.35rem] p-4 smooth-transform`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-base font-black text-slate-900 dark:text-slate-50">{employee.name}</p>
                      <p className="text-sm text-slate-600 dark:text-slate-300">{employee.email}</p>
                      <p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                        {employee.role} | {employee.department || "no department"} | {employee.shift || "no shift"}
                      </p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-[11px] font-bold ${employee.isActive ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300" : "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300"}`}>
                      {employee.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>

                  <div className="mt-3 grid gap-1 text-xs text-slate-500 dark:text-slate-400">
                    <p>Phone: {employee.phone || "Not added"}</p>
                    <p>Code: {employee.employeeCode || "Not assigned"}</p>
                    <p>Joined: {employee.joiningDate ? new Date(employee.joiningDate).toLocaleDateString() : "Not set"}</p>
                  </div>

                  {!canManage ? (
                    <div className="mt-3 rounded-2xl bg-slate-900/5 px-3 py-2 text-xs font-semibold text-slate-600 dark:bg-white/5 dark:text-slate-300">
                      Managers can view admin records but cannot edit, deactivate, or delete them.
                    </div>
                  ) : null}

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button onClick={() => onEdit(employee)} disabled={!canManage} className="glass-pill rounded-full px-4 py-1.5 text-xs font-bold text-sky-700 disabled:cursor-not-allowed disabled:opacity-50 dark:text-sky-300">
                      Edit
                    </button>
                    <button onClick={() => onToggleActive(employee, !employee.isActive)} disabled={!canManage} className="glass-pill rounded-full px-4 py-1.5 text-xs font-bold text-amber-700 disabled:cursor-not-allowed disabled:opacity-50 dark:text-amber-300">
                      {employee.isActive ? "Deactivate" : "Activate"}
                    </button>
                    <button onClick={() => onSoftDelete(employee)} disabled={!canManage} className="glass-pill rounded-full px-4 py-1.5 text-xs font-bold text-rose-700 disabled:cursor-not-allowed disabled:opacity-50 dark:text-rose-300">
                      Soft delete
                    </button>
                  </div>
                </article>
              );
            })}
          </div>

          {!visibleEmployees.length && statusFilter !== "deleted" ? (
            <p className="py-10 text-center text-sm font-semibold text-slate-500 dark:text-slate-400">No employees found for the current category.</p>
          ) : null}

          <div className="mt-6 rounded-[1.5rem] border border-white/40 bg-white/40 p-4 shadow-[0_18px_50px_-34px_rgba(15,23,42,0.7)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/30">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h4 className="text-base font-black text-slate-900 dark:text-slate-50">Deleted employees</h4>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                  Archived staff stay here until restored.
                </p>
              </div>
              <button type="button" onClick={() => setShowDeletedSection((value) => !value)} className="glass-pill inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-200">
                <FiEye className="h-3.5 w-3.5" />
                {showDeletedSection ? "Hide section" : "Show section"}
              </button>
            </div>

            {showDeletedSection ? (
              <div className="mt-4 grid gap-3">
                {employees.filter((employee) => employee.isDeleted).map((employee) => {
                  const canManage = canManageEmployee(employee);
                  return (
                    <article key={employee.id} className="glass-subtle rounded-[1.15rem] p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-black text-slate-900 dark:text-slate-50">{employee.name}</p>
                          <p className="text-xs text-slate-600 dark:text-slate-300">{employee.email}</p>
                          <p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                            {employee.role} | deleted {employee.deletedAt ? new Date(employee.deletedAt).toLocaleDateString() : "recently"}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button onClick={() => onRestore(employee)} disabled={!canManage} className="glass-pill inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold text-emerald-700 disabled:cursor-not-allowed disabled:opacity-50 dark:text-emerald-300">
                            <FiRefreshCcw className="h-3.5 w-3.5" />
                            Restore
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
                {!employees.some((employee) => employee.isDeleted) ? (
                  <p className="py-6 text-center text-sm font-semibold text-slate-500 dark:text-slate-400">
                    No deleted employees.
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>

          {statusFilter === "deleted" && !deletedEmployees.length ? (
            <p className="py-10 text-center text-sm font-semibold text-slate-500 dark:text-slate-400">No deleted employees match this filter.</p>
          ) : null}
        </section>
      </section>
    </div>
  );
};

export default AdminEmployees;

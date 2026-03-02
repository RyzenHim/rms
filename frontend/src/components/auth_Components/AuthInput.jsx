const AuthInput = ({ label, name, type, value, onChange, placeholder }) => {
  return (
    <div className="mb-4">
      <label htmlFor={name} className="mb-1 block text-sm font-semibold text-slate-700">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-slate-900 transition focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-100"
      />
    </div>
  );
};

export default AuthInput;

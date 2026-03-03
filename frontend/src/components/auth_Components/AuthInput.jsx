const AuthInput = ({ label, name, type, value, onChange, placeholder }) => {
  return (
    <div className="mb-5">
      <label htmlFor={name} className="mb-2.5 block text-sm font-bold text-slate-800">
        {label}
      </label>
      <div className="relative">
        <input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full rounded-2xl border-2 border-slate-200 bg-white/50 px-5 py-3.5 text-slate-900 placeholder-slate-400 backdrop-blur-sm transition duration-200 hover:border-slate-300 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-0 focus:shadow-lg focus:shadow-emerald-100"
        />
        <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2">
          {type === "email" && (
            <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          )}
          {type === "password" && (
            <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthInput;

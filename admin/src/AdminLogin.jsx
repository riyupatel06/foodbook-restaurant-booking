import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { FaLock, FaUserShield } from "react-icons/fa";
import { useAdminAuth } from "./AdminAuthContext";

export default function AdminLogin() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: { email: "", password: "" },
    mode: "onTouched",
  });
  const { login, isAuthenticated } = useAdminAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState("");

  useEffect(() => {
    if (isAuthenticated) navigate("/admin", { replace: true });
  }, [isAuthenticated, navigate]);

  const onSubmit = async (values) => {
    setServerError("");
    try {
      await login(values);
      navigate("/admin", { replace: true });
    } catch (error) {
      setServerError(error.message || "Login failed");
    }
  };

  return (
    <div className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_top_left,rgba(34,193,195,0.18),transparent_26%),radial-gradient(circle_at_top_right,rgba(37,99,235,0.14),transparent_24%),linear-gradient(180deg,#08111f_0%,#050814_100%)] px-4 text-white">
      <div className="grid w-full max-w-6xl gap-8 lg:grid-cols-[1fr_0.9fr]">
        <section className="rounded-[2rem] border border-cyan-400/15 bg-cyan-400/6 p-8 shadow-2xl shadow-black/30">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#22c1c3] to-[#2563eb] text-2xl font-black text-white">
            <FaUserShield />
          </div>
          <p className="mt-6 text-xs uppercase tracking-[0.35em] text-cyan-200">Admin Login</p>
          <h1 className="mt-3 text-5xl font-black leading-tight">Manage everything from one place</h1>
          <p className="mt-4 max-w-xl text-base leading-8 text-cyan-50/80">
            Super admin access for restaurants, vendors, customers, bookings, payments, AI tools, notifications, reports, and system settings.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {["Single super admin", "JWT protected", "Modern dashboard", "Fast access"].map((item) => (
              <div key={item} className="rounded-2xl border border-cyan-400/10 bg-cyan-400/10 px-4 py-4 text-sm text-cyan-50">
                {item}
              </div>
            ))}
          </div>
        </section>

        <form onSubmit={handleSubmit(onSubmit)} className="rounded-[2rem] border border-cyan-400/15 bg-[#09111f]/90 p-8 shadow-2xl shadow-black/30">
          <p className="text-xs uppercase tracking-[0.35em] text-cyan-200">Secure access</p>
          <h2 className="mt-2 text-3xl font-bold">Enter admin panel</h2>
          <p className="mt-2 text-sm leading-6 text-cyan-50/70">Use the single super admin credential only.</p>
          <div className="mt-6 space-y-4">
            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-sm text-cyan-50">
                <FaUserShield className="text-cyan-200" /> Admin email
              </span>
              <input
                {...register("email", {
                  required: "Email is required",
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: "Enter a valid email address",
                  },
                })}
                type="email"
                autoComplete="username"
                className="w-full rounded-2xl border border-cyan-400/15 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-cyan-50/40"
                placeholder="admin@foodbook.app"
              />
              {errors.email ? <p className="mt-2 text-sm text-rose-300">{errors.email.message}</p> : null}
            </label>
            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-sm text-cyan-50">
                <FaLock className="text-cyan-200" /> Password
              </span>
              <input
                {...register("password", {
                  required: "Password is required",
                  minLength: { value: 8, message: "Password must be at least 8 characters" },
                })}
                type="password"
                autoComplete="current-password"
                className="w-full rounded-2xl border border-cyan-400/15 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-cyan-50/40"
                placeholder="Enter admin password"
              />
              {errors.password ? <p className="mt-2 text-sm text-rose-300">{errors.password.message}</p> : null}
            </label>
            {serverError ? <p className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{serverError}</p> : null}
            <button
              disabled={isSubmitting}
              className="w-full rounded-2xl bg-gradient-to-r from-[#22c1c3] to-[#2563eb] px-4 py-3 font-semibold text-white transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? "Checking credentials..." : "Enter Admin Panel"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

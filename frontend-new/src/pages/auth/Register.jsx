import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FaLock, FaRegEnvelope, FaUser, FaUserPlus } from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";

const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@]).{8,}$/;

export default function Register() {
  const navigate = useNavigate();
  const location = useLocation();
  const { register: registerUser, isAuthenticated, user, logout } = useAuth();
  const next = new URLSearchParams(location.search).get("next") ?? "";
  const [status, setStatus] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm();

  const password = useWatch({ control, name: "password" });

  if (isAuthenticated) {
    return (
      <div className="mx-auto flex min-h-[calc(100vh-0px)] max-w-3xl items-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="glass-panel-strong w-full rounded-[2rem] p-6 sm:p-8">
          <span className="section-kicker">Already signed in</span>
          <h1 className="font-display mt-2 text-4xl font-bold text-white">You are already logged in</h1>
          <p className="mt-3 text-sm leading-7 text-slate-400">
            Signed in as <span className="text-slate-200">{user?.email}</span>. You do not need to register again with the same email and password.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={() => navigate(next || "/", { replace: true })}
              className="rounded-full bg-gradient-to-r from-[#ff9f43] to-[#ff6b8b] px-5 py-3 font-semibold text-slate-950"
            >
              Continue
            </button>
            <button
              onClick={() => {
                logout();
                navigate("/login", { replace: true });
              }}
              className="rounded-full border border-white/10 px-5 py-3 font-semibold text-white"
            >
              Log out
            </button>
          </div>
        </div>
      </div>
    );
  }

  const onSubmit = async (data) => {
    setSubmitting(true);
    setStatus(null);

    try {
      await registerUser({
        name: data.name,
        email: data.email,
        phone: data.phone,
        password: data.password,
      });

      const destination = new URLSearchParams(location.search).get("next") ?? "/";
      setStatus({ type: "success", message: "Account created successfully. Redirecting..." });
      window.setTimeout(() => navigate(destination, { replace: true }), 800);
    } catch (error) {
      setStatus({ type: "error", message: error.message || "Registration failed" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto grid min-h-[calc(100vh-0px)] max-w-7xl items-center px-4 py-10 sm:px-6 lg:grid-cols-[0.9fr_1fr] lg:px-8">
      <section className="glass-panel-strong mx-auto w-full max-w-md rounded-[2rem] p-6 sm:p-8 lg:order-1">
        <div className="mb-8">
          <span className="section-kicker">Create account</span>
          <h2 className="font-display mt-2 text-4xl font-bold text-white">Register</h2>
          <p className="mt-3 text-sm leading-7 text-slate-400">
            Create a profile to save tables, track favourites, and book restaurants faster.
          </p>
        </div>

        {status ? (
          <div
            className={`mb-4 rounded-2xl border px-4 py-3 text-sm ${
              status.type === "success"
                ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
                : "border-rose-400/30 bg-rose-400/10 text-rose-200"
            }`}
          >
            {status.message}
          </div>
        ) : null}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <label className="block">
            <span className="mb-2 flex items-center gap-2 text-sm text-slate-300">
              <FaUser className="text-orange-200" />
              Full name
            </span>
            <input
              placeholder="Your name"
              {...register("name", { required: "Name Required" })}
              className="w-full rounded-2xl border border-white/10 bg-[#0b1222] px-4 py-3 text-white outline-none placeholder:text-slate-500"
            />
          </label>
          {errors.name ? <p className="text-sm text-red-300">{errors.name.message}</p> : null}

          <label className="block">
            <span className="mb-2 flex items-center gap-2 text-sm text-slate-300">
              <FaRegEnvelope className="text-orange-200" />
              Email
            </span>
            <input
              type="email"
              placeholder="you@example.com"
              {...register("email", { required: "Email Required" })}
              className="w-full rounded-2xl border border-white/10 bg-[#0b1222] px-4 py-3 text-white outline-none placeholder:text-slate-500"
            />
          </label>
          {errors.email ? <p className="text-sm text-red-300">{errors.email.message}</p> : null}

          <label className="block">
            <span className="mb-2 flex items-center gap-2 text-sm text-slate-300">
              <FaUser className="text-orange-200" />
              Mobile number
            </span>
            <input
              type="tel"
              placeholder="9876543210"
              {...register("phone", { required: "Mobile number Required" })}
              className="w-full rounded-2xl border border-white/10 bg-[#0b1222] px-4 py-3 text-white outline-none placeholder:text-slate-500"
            />
          </label>
          {errors.phone ? <p className="text-sm text-red-300">{errors.phone.message}</p> : null}

          <label className="block">
            <span className="mb-2 flex items-center gap-2 text-sm text-slate-300">
              <FaLock className="text-orange-200" />
              Password
            </span>
              <input
                type="password"
                placeholder="Create password"
                {...register("password", {
                  required: "Password Required",
                  pattern: {
                    value: passwordPattern,
                    message: "Use a password like Riya@1234",
                  },
                })}
                className="w-full rounded-2xl border border-white/10 bg-[#0b1222] px-4 py-3 text-white outline-none placeholder:text-slate-500"
              />
          </label>
          {errors.password ? <p className="text-sm text-red-300">{errors.password.message}</p> : null}
          <p className="text-xs leading-6 text-slate-500">
            Password must have 1 uppercase, 1 lowercase, 1 number, and 1 @.
          </p>

          <label className="block">
            <span className="mb-2 flex items-center gap-2 text-sm text-slate-300">
              <FaLock className="text-orange-200" />
              Confirm password
            </span>
            <input
              type="password"
              placeholder="Repeat password"
              {...register("confirmPassword", {
                validate: (value) => value === password || "Passwords do not match",
              })}
              className="w-full rounded-2xl border border-white/10 bg-[#0b1222] px-4 py-3 text-white outline-none placeholder:text-slate-500"
            />
          </label>
          {errors.confirmPassword ? (
            <p className="text-sm text-red-300">{errors.confirmPassword.message}</p>
          ) : null}

          <button
            disabled={submitting}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#ff9f43] to-[#ff6b8b] px-5 py-3 font-semibold text-slate-950 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-70"
          >
            <FaUserPlus />
            {submitting ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <p className="mt-6 text-sm text-slate-400">
          Already have an account?{" "}
          <Link
            to={next ? `/login?next=${encodeURIComponent(next)}` : "/login"}
            className="text-orange-200 transition hover:text-white"
          >
            Login
          </Link>
        </p>
      </section>

      <section className="hidden lg:block">
        <div className="glass-panel rounded-[2rem] p-8">
          <span className="section-kicker">Join now</span>
          <h1 className="font-display mt-4 text-6xl font-bold leading-[0.95] text-white">
            Save your
            <span className="gradient-text"> favourite Ahmedabad places</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-slate-300">
            Get quick access to your preferred localities, table types, and booking history in one
            account.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {[
              "Faster checkouts",
              "Saved localities",
              "VIP table access",
              "Booking reminders",
            ].map((item) => (
              <div key={item} className="rounded-3xl border border-white/10 bg-white/5 p-4 text-slate-200">
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

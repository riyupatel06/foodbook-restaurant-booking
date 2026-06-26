import { useForm } from "react-hook-form";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FaLock, FaRegEnvelope, FaSignInAlt } from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";

const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@]).{8,}$/;

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, user, logout } = useAuth();
  const next = new URLSearchParams(location.search).get("next") ?? "";
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = (data) => {
    login({ email: data.email, password: data.password })
      .then(() => {
        const params = new URLSearchParams(location.search);
        navigate(params.get("next") ?? "/", { replace: true });
      })
      .catch((error) => {
        alert(error.message || "Login failed");
      });
  };

  if (isAuthenticated) {
    return (
      <div className="mx-auto flex min-h-[calc(100vh-0px)] max-w-3xl items-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="glass-panel-strong w-full rounded-[2rem] p-6 sm:p-8">
          <span className="section-kicker">Already signed in</span>
          <h1 className="font-display mt-2 text-4xl font-bold text-white">You are already logged in</h1>
          <p className="mt-3 text-sm leading-7 text-slate-400">
            Signed in as <span className="text-slate-200">{user?.email}</span>.
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

  return (
    <div className="mx-auto grid min-h-[calc(100vh-0px)] max-w-7xl items-center px-4 py-10 sm:px-6 lg:grid-cols-[1fr_0.9fr] lg:px-8">
      <section className="hidden lg:block">
        <div className="glass-panel-strong relative overflow-hidden rounded-[2rem] p-8">
          <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-[#ff9f43]/20 blur-3xl" />
          <div className="absolute -bottom-10 left-10 h-56 w-56 rounded-full bg-[#58c7ff]/15 blur-3xl" />
          <span className="section-kicker">Welcome back</span>
          <h1 className="font-display mt-4 text-6xl font-bold leading-[0.95] text-white">
            Login to your
            <span className="gradient-text"> Ahmedabad dining</span>
            <br />
            experience
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-slate-300">
            Book tables, save favourite localities, and keep your reservation flow smooth from
            discovery to confirmation.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {[
              "Fast reservations",
              "Locality-based discovery",
              "Chef menu access",
              "Priority table updates",
            ].map((item) => (
              <div key={item} className="rounded-3xl border border-white/10 bg-white/5 p-4 text-slate-200">
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="glass-panel-strong mx-auto w-full max-w-md rounded-[2rem] p-6 sm:p-8">
        <div className="mb-8">
          <span className="section-kicker">Sign in</span>
          <h2 className="font-display mt-2 text-4xl font-bold text-white">Login</h2>
          <p className="mt-3 text-sm leading-7 text-slate-400">
            Access your reservations, saved places, and table booking history.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <label className="block">
            <span className="mb-2 flex items-center gap-2 text-sm text-slate-300">
              <FaRegEnvelope className="text-orange-200" />
              Email
            </span>
            <input
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              {...register("email", { required: "Email Required" })}
              className="w-full rounded-2xl border border-white/10 bg-[#0b1222] px-4 py-3 text-white outline-none placeholder:text-slate-500"
            />
          </label>
          {errors.email ? <p className="text-sm text-red-300">{errors.email.message}</p> : null}

          <label className="block">
            <span className="mb-2 flex items-center gap-2 text-sm text-slate-300">
              <FaLock className="text-orange-200" />
              Password
            </span>
              <input
              type="password"
              placeholder="Your password"
              autoComplete="current-password"
              {...register("password", {
                required: "Password Required",
                pattern: {
                  value: passwordPattern,
                  message: "Use the same strong password you registered with, like Riya@1234",
                },
              })}
              className="w-full rounded-2xl border border-white/10 bg-[#0b1222] px-4 py-3 text-white outline-none placeholder:text-slate-500"
            />
          </label>
          {errors.password ? <p className="text-sm text-red-300">{errors.password.message}</p> : null}

          <div className="flex items-center justify-between text-sm">
            <Link to="/forgot-password" className="text-orange-200 transition hover:text-white">
              Forgot password?
            </Link>
            <Link to={next ? `/register?next=${encodeURIComponent(next)}` : "/register"} className="text-slate-400 transition hover:text-white">
              Create account
            </Link>
          </div>

          <button className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#ff9f43] to-[#ff6b8b] px-5 py-3 font-semibold text-slate-950 transition hover:scale-[1.01]">
            <FaSignInAlt />
            Login
          </button>
        </form>

      </section>
    </div>
  );
}

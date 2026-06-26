import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaEnvelope, FaLock, FaUtensils } from "react-icons/fa";
import { useVendorAuth } from "../context/VendorAuthContext";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@])[A-Za-z\d@#$%^&*()_+\-=[\]{};':"\\|,.<>/?!~`]{8,}$/;

export default function VendorLogin() {
  const navigate = useNavigate();
  const { loginVendor, loginWithGoogle } = useVendorAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [status, setStatus] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [googleReady, setGoogleReady] = useState(false);
  const [googleStatus, setGoogleStatus] = useState(null);

  const validateForm = () => {
    if (!emailPattern.test(form.email.trim())) {
      return "Enter a valid email address";
    }
    if (!passwordPattern.test(form.password)) {
      return "Password must be 8+ chars with uppercase, lowercase, number, and @";
    }
    return "";
  };

  const submit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setStatus(null);

    const validationMessage = validateForm();
    if (validationMessage) {
      setStatus(validationMessage);
      setSubmitting(false);
      return;
    }

    try {
      await loginVendor(form);
      navigate("/", { replace: true });
    } catch (error) {
      setStatus(error.message || "Vendor login failed");
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    const scriptId = "google-identity-script-vendor";
    const existing = document.getElementById(scriptId);
    const start = () => {
      if (!window.google?.accounts?.id || !import.meta.env.VITE_GOOGLE_CLIENT_ID) return;
      window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        callback: async (response) => {
          try {
            setGoogleStatus(null);
            await loginWithGoogle(response.credential);
            navigate("/", { replace: true });
          } catch (error) {
            setGoogleStatus(error.message || "Google sign-in failed");
          }
        },
      });
      window.google.accounts.id.renderButton(document.getElementById("vendor-google-login"), {
        theme: "outline",
        size: "large",
        width: 320,
        text: "signin_with",
      });
      setGoogleReady(true);
    };

    if (window.google?.accounts?.id) {
      start();
      return undefined;
    }

    if (!existing) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = start;
      document.body.appendChild(script);
    } else {
      existing.addEventListener("load", start);
    }

    return () => {
      existing?.removeEventListener?.("load", start);
    };
  }, [loginWithGoogle, navigate]);

  return (
    <div className="min-h-screen bg-[#120c0b] text-white">
      <div className="mx-auto grid min-h-screen max-w-6xl items-center gap-8 px-4 py-10 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="rounded-[1.75rem] border border-white/10 bg-[linear-gradient(140deg,#1d1110_0%,#0d0b0b_58%,#24100b_100%)] p-8 shadow-2xl">
          <div className="mb-10 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#ff6b35] text-2xl text-white">
            <FaUtensils />
          </div>
          <p className="section-kicker">Restaurant admin</p>
          <h1 className="font-display mt-4 text-6xl font-bold leading-none">
            Manage every branch from  vendor panel
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-slate-300">
            Track bookings, tables, menus, offers, reviews, waitlist guests, and revenue without switching tools.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {["Multi-restaurant control", "Live table status", "Revenue analytics", "QR check-in"].map((item) => (
              <div key={item} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-slate-200">
                {item}
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[1.75rem] border border-white/10 bg-[#18100f]/90 p-6 shadow-2xl sm:p-8">
          <p className="section-kicker">Vendor login</p>
          <h2 className="font-display mt-3 text-5xl font-bold">Welcome back</h2>
          <p className="mt-3 text-sm text-slate-400">Use your own vendor email and password to open your restaurant dashboard.</p>

          {status ? (
            <div className="mt-5 rounded-2xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
              {status}
            </div>
          ) : null}
          {googleStatus ? (
            <div className="mt-5 rounded-2xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
              {googleStatus}
            </div>
          ) : null}

          <form onSubmit={submit} className="mt-6 space-y-4">
            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-sm text-slate-300">
                <FaEnvelope className="text-orange-200" /> Email
              </span>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={(event) => setForm((value) => ({ ...value, email: event.target.value }))}
                required
                autoComplete="email"
                className="w-full rounded-2xl border border-white/10 bg-[#0e0b0b] px-4 py-3 outline-none"
              />
            </label>
            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-sm text-slate-300">
                <FaLock className="text-orange-200" /> Password
              </span>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={(event) => setForm((value) => ({ ...value, password: event.target.value }))}
                required
                autoComplete="current-password"
                minLength={8}
                className="w-full rounded-2xl border border-white/10 bg-[#0e0b0b] px-4 py-3 outline-none"
              />
            </label>
            <button
              disabled={submitting}
              className="w-full rounded-full bg-[#ff6b35] px-5 py-3 font-bold text-white transition hover:bg-[#ff7b49] disabled:opacity-70"
            >
              {submitting ? "Signing in..." : "Open Vendor Panel"}
            </button>
          </form>

          <div className="mt-4 flex justify-center rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
            <div id="vendor-google-login" />
          </div>
          <p className="mt-2 text-center text-xs text-slate-500">
            {googleReady ? "Google sign-in is ready" : "Loading Google sign-in..."}
          </p>

          <p className="mt-6 text-sm text-slate-400">
            New restaurant owner? <Link to="/register" className="text-orange-200">Create vendor account</Link>
          </p>
        </section>
      </div>
    </div>
  );
}

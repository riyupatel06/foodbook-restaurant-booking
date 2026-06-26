import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaBuilding, FaEnvelope, FaLock, FaPhone, FaUser } from "react-icons/fa";
import { useVendorAuth } from "../context/VendorAuthContext";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^[1-9]\d{9}$/;
const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@])[A-Za-z\d@#$%^&*()_+\-=[\]{};':"\\|,.<>/?!~`]{8,}$/;

export default function VendorRegister() {
  const navigate = useNavigate();
  const { registerVendor, loginWithGoogle } = useVendorAuth();
  const [form, setForm] = useState({
    name: "",
    businessName: "",
    email: "",
    phone: "",
    password: "",
  });
  const [status, setStatus] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [googleReady, setGoogleReady] = useState(false);
  const [googleStatus, setGoogleStatus] = useState(null);

  const validateForm = () => {
    if (!form.name.trim()) return "Owner name is required";
    if (!form.businessName.trim()) return "Business name is required";
    if (!emailPattern.test(form.email.trim())) return "Enter a valid email address";
    if (!phonePattern.test(form.phone.trim())) return "Phone must be 10 digits and cannot start with 0";
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
      await registerVendor(form);
      navigate("/", { replace: true });
    } catch (error) {
      setStatus(error.message || "Vendor registration failed");
    } finally {
      setSubmitting(false);
    }
  };

  const update = (field) => (event) => setForm((value) => ({ ...value, [field]: event.target.value }));

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
      window.google.accounts.id.renderButton(document.getElementById("vendor-google-register"), {
        theme: "outline",
        size: "large",
        width: 320,
        text: "signup_with",
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
    <div className="min-h-screen bg-[#120c0b] px-4 py-10 text-white">
      <section className="mx-auto max-w-xl rounded-[1.75rem] border border-white/10 bg-[#18100f]/90 p-6 shadow-2xl sm:p-8">
        <p className="section-kicker">Vendor onboarding</p>
        <h1 className="font-display mt-3 text-5xl font-bold">Create restaurant admin</h1>
        <p className="mt-3 text-sm leading-7 text-slate-400">
          One vendor account can manage multiple restaurants, menus, tables, offers, and bookings.
        </p>

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
          {[
            ["name", "Owner name", FaUser],
            ["businessName", "Business name", FaBuilding],
            ["email", "Email", FaEnvelope],
            ["phone", "Phone", FaPhone],
            ["password", "Password", FaLock],
          ].map(([field, label, Icon]) => (
            <label key={field} className="block">
              <span className="mb-2 flex items-center gap-2 text-sm text-slate-300">
                <Icon className="text-orange-200" /> {label}
              </span>
              <input
                type={field === "password" ? "password" : field === "email" ? "email" : "text"}
                value={form[field]}
                onChange={update(field)}
                required
                autoComplete={
                  field === "name"
                    ? "name"
                    : field === "businessName"
                      ? "organization"
                      : field === "email"
                        ? "email"
                        : field === "phone"
                          ? "tel"
                          : "new-password"
                }
                minLength={field === "password" ? 8 : undefined}
                pattern={field === "phone" ? "[1-9][0-9]{9}" : undefined}
                className="w-full rounded-2xl border border-white/10 bg-[#0e0b0b] px-4 py-3 outline-none"
              />
            </label>
          ))}

          <button
            disabled={submitting}
            className="w-full rounded-full bg-[#ff6b35] px-5 py-3 font-bold text-white transition hover:bg-[#ff7b49] disabled:opacity-70"
          >
            {submitting ? "Creating..." : "Create Vendor Account"}
          </button>
        </form>

        <div className="mt-4 flex justify-center rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
          <div id="vendor-google-register" />
        </div>
        <p className="mt-2 text-center text-xs text-slate-500">
          {googleReady ? "Google sign-up is ready" : "Loading Google sign-up..."}
        </p>

        <p className="mt-6 text-sm text-slate-400">
          Already registered? <Link to="/login" className="text-orange-200">Login</Link>
        </p>
      </section>
    </div>
  );
}

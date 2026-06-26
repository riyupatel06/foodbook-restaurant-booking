import { useState } from "react";
import { Link } from "react-router-dom";
import { FaEnvelopeOpenText } from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";

export default function ForgotPassword() {
  const { requestPasswordOtp, resetPasswordWithOtp } = useAuth();
  const [form, setForm] = useState({ email: "", otp: "", newPassword: "" });
  const [otpSent, setOtpSent] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const sendOtp = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");
    try {
      const response = await requestPasswordOtp(form.email);
      setOtpSent(true);
      setMessage(`OTP sent. Demo OTP: ${response.otp}`);
    } catch (requestError) {
      setError(requestError.message || "Could not send OTP.");
    }
  };

  const resetPassword = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");
    try {
      await resetPasswordWithOtp(form);
      setMessage("Password reset successfully. You can log in now.");
    } catch (requestError) {
      setError(requestError.message || "Could not reset password.");
    }
  };

  return (
    <div className="mx-auto grid min-h-[calc(100vh-0px)] max-w-7xl items-center px-4 py-10 sm:px-6 lg:grid-cols-[1fr_0.9fr] lg:px-8">
      <section className="glass-panel-strong rounded-[2rem] p-6 sm:p-8">
        <span className="section-kicker">Reset access</span>
        <h1 className="font-display mt-4 text-5xl font-bold text-white sm:text-6xl">Forgot your password?</h1>
        <p className="mt-4 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
          Reset it using your email OTP. This flow works only through email.
        </p>

        {message ? <div className="mt-6 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">{message}</div> : null}
        {error ? <div className="mt-6 rounded-2xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">{error}</div> : null}

        <form onSubmit={otpSent ? resetPassword : sendOtp} className="mt-8 max-w-xl space-y-4">
          <label className="block">
            <span className="mb-2 flex items-center gap-2 text-sm text-slate-300">
              <FaEnvelopeOpenText className="text-orange-200" />
              Email address
            </span>
            <input
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
              className="w-full rounded-2xl border border-white/10 bg-[#0b1222] px-4 py-3 text-white outline-none placeholder:text-slate-500"
            />
          </label>

          {otpSent ? (
            <>
              <input value={form.otp} onChange={(event) => setForm((current) => ({ ...current, otp: event.target.value }))} placeholder="Enter 6-digit OTP" className="w-full rounded-2xl border border-white/10 bg-[#0b1222] px-4 py-3 text-white outline-none placeholder:text-slate-500" />
              <input type="password" value={form.newPassword} onChange={(event) => setForm((current) => ({ ...current, newPassword: event.target.value }))} placeholder="New password" className="w-full rounded-2xl border border-white/10 bg-[#0b1222] px-4 py-3 text-white outline-none placeholder:text-slate-500" />
            </>
          ) : null}

          <button className="inline-flex w-full items-center justify-center rounded-full bg-gradient-to-r from-[#ff9f43] to-[#ff6b8b] px-5 py-3 font-semibold text-slate-950 transition hover:scale-[1.01]">
            {otpSent ? "Reset Password" : "Send Email OTP"}
          </button>
        </form>

        <p className="mt-6 text-sm text-slate-400">
          Remembered it?{" "}
          <Link to="/login" className="text-orange-200 transition hover:text-white">
            Back to login
          </Link>
        </p>
      </section>

      <section className="hidden lg:block">
        <div className="glass-panel rounded-[2rem] p-8">
          <div className="rounded-[1.75rem] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(255,159,67,0.18),transparent_45%),linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-8">
            <span className="section-kicker">Security</span>
            <h2 className="font-display mt-4 text-4xl font-bold text-white">Email OTP reset</h2>
            <p className="mt-4 max-w-lg text-slate-300">
              Request an OTP, verify it, and set a new password without leaving the login flow.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

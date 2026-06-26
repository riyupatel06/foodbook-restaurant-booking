import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaImage, FaUpload } from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";

const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@]).{8,}$/;

function resizeImageFile(file, size = 320) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);

    image.onload = () => {
      const scale = Math.min(1, size / Math.max(image.width, image.height));
      const width = Math.max(1, Math.round(image.width * scale));
      const height = Math.max(1, Math.round(image.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d");
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, width, height);
      context.drawImage(image, 0, 0, width, height);
      URL.revokeObjectURL(objectUrl);
      resolve(canvas.toDataURL("image/jpeg", 0.82));
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Could not read image file."));
    };

    image.src = objectUrl;
  });
}

export default function UserProfile() {
  const navigate = useNavigate();
  const { isAuthenticated, user, refreshProfile, updateProfile, changePassword } = useAuth();
  const [profileForm, setProfileForm] = useState({ name: "", email: "", phone: "", picture: "" });
  const [passwordForm, setPasswordForm] = useState({ oldPassword: "", newPassword: "", confirmPassword: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login?next=%2Fprofile", { replace: true });
      return;
    }

    void refreshProfile().catch(() => {});
  }, [isAuthenticated, navigate, refreshProfile]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setProfileForm({
        name: user?.name ?? "",
        email: user?.email ?? "",
        phone: user?.phone ?? "",
        picture: user?.picture ?? "",
      });
    }, 0);
    return () => window.clearTimeout(timer);
  }, [user]);

  const uploadPicture = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }

    try {
      const picture = await resizeImageFile(file);
      setProfileForm((current) => ({ ...current, picture }));
      setError("");
    } catch (requestError) {
      setError(requestError.message || "Could not prepare image.");
    }
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");
    setSavingProfile(true);

    try {
      await updateProfile(profileForm);
      setMessage("Profile updated successfully.");
    } catch (requestError) {
      setError(requestError.message || "Could not update profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  const savePassword = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError("New password and confirm password must match.");
      return;
    }

    if (!passwordPattern.test(passwordForm.newPassword)) {
      setError("New password must have 1 uppercase, 1 lowercase, 1 number, and 1 @.");
      return;
    }

    setSavingPassword(true);

    try {
      await changePassword({
        oldPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
      setMessage("Password updated successfully.");
    } catch (requestError) {
      setError(requestError.message || "Could not update password.");
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <section className="glass-panel-strong rounded-[2rem] p-6 sm:p-8">
        <span className="section-kicker">My profile</span>
        <h1 className="font-display mt-3 text-4xl font-bold text-white sm:text-5xl">Manage your account</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
          Update your name, email, mobile number, and password from one place.
        </p>

        {message ? <div className="mt-6 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">{message}</div> : null}
        {error ? <div className="mt-6 rounded-2xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">{error}</div> : null}

        <div className="mt-8 rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
          <h2 className="text-2xl font-bold text-white">Account overview</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-[#0b1222] px-4 py-4">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Name</p>
              <p className="mt-2 truncate text-base font-semibold text-white">{user?.name || "Not added"}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#0b1222] px-4 py-4">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Email</p>
              <p className="mt-2 truncate text-base font-semibold text-white">{user?.email || "Not added"}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#0b1222] px-4 py-4">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Phone</p>
              <p className="mt-2 truncate text-base font-semibold text-white">{user?.phone || "Not added"}</p>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <form id="edit-profile" onSubmit={saveProfile} className="space-y-4 rounded-[1.5rem] border border-white/10 bg-white/5 p-5 scroll-mt-28">
            <h2 className="text-2xl font-bold text-white">Edit profile</h2>
            <div className="rounded-2xl border border-white/10 bg-[#0b1222] p-4">
              <p className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Profile photo</p>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-full border border-white/10 bg-white/5">
                  {profileForm.picture ? (
                    <img src={profileForm.picture} alt="Profile" className="h-full w-full object-cover" />
                  ) : (
                    <FaImage className="text-2xl text-slate-500" />
                  )}
                </div>
                <div className="flex flex-wrap gap-3">
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-gradient-to-r from-[#ff9f43] to-[#ff6b8b] px-4 py-2.5 text-sm font-semibold text-slate-950">
                    <FaUpload />
                    Add photo
                    <input type="file" accept="image/*" onChange={uploadPicture} className="sr-only" />
                  </label>
                  <button type="button" onClick={() => setProfileForm((current) => ({ ...current, picture: "" }))} className="rounded-full border border-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10">
                    Remove
                  </button>
                </div>
              </div>
            </div>
            <input required value={profileForm.name} onChange={(event) => setProfileForm((current) => ({ ...current, name: event.target.value }))} placeholder="Full name" className="w-full rounded-2xl border border-white/10 bg-[#0b1222] px-4 py-3 text-white outline-none" />
            <input required value={profileForm.email} onChange={(event) => setProfileForm((current) => ({ ...current, email: event.target.value }))} placeholder="Email" type="email" className="w-full rounded-2xl border border-white/10 bg-[#0b1222] px-4 py-3 text-white outline-none" />
            <input required value={profileForm.phone} onChange={(event) => setProfileForm((current) => ({ ...current, phone: event.target.value }))} placeholder="Mobile number" pattern="[1-9][0-9]{9}" className="w-full rounded-2xl border border-white/10 bg-[#0b1222] px-4 py-3 text-white outline-none" />
            <button disabled={savingProfile} className="rounded-full bg-gradient-to-r from-[#ff9f43] to-[#ff6b8b] px-5 py-3 font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-70">
              {savingProfile ? "Saving..." : "Save profile"}
            </button>
          </form>

          <form onSubmit={savePassword} className="space-y-4 rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
            <h2 className="text-2xl font-bold text-white">Change password</h2>
            <input required value={passwordForm.oldPassword} onChange={(event) => setPasswordForm((current) => ({ ...current, oldPassword: event.target.value }))} placeholder="Old password" type="password" autoComplete="current-password" className="w-full rounded-2xl border border-white/10 bg-[#0b1222] px-4 py-3 text-white outline-none" />
            <input required value={passwordForm.newPassword} onChange={(event) => setPasswordForm((current) => ({ ...current, newPassword: event.target.value }))} placeholder="New password" type="password" autoComplete="new-password" className="w-full rounded-2xl border border-white/10 bg-[#0b1222] px-4 py-3 text-white outline-none" />
            <input required value={passwordForm.confirmPassword} onChange={(event) => setPasswordForm((current) => ({ ...current, confirmPassword: event.target.value }))} placeholder="Confirm new password" type="password" autoComplete="new-password" className="w-full rounded-2xl border border-white/10 bg-[#0b1222] px-4 py-3 text-white outline-none" />
            <p className="text-xs leading-6 text-slate-500">Password must have 1 uppercase, 1 lowercase, 1 number, and 1 @.</p>
            <div className="flex flex-wrap items-center gap-3">
              <button disabled={savingPassword} className="rounded-full border border-white/10 px-5 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70">
                {savingPassword ? "Updating..." : "Update password"}
              </button>
              <Link to="/forgot-password" className="text-sm font-semibold text-orange-200 transition hover:text-white">
                Forgot password?
              </Link>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}

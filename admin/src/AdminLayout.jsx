import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { FaBell, FaCamera, FaChevronLeft, FaCog, FaHome, FaMapMarkedAlt, FaShoppingBag, FaStore, FaTimes, FaUsers } from "react-icons/fa";
import { useAdminAuth } from "./AdminAuthContext";
import { changeAdminPassword } from "./services/adminApi";

const links = [
  { to: "/admin", label: "Dashboard", icon: FaHome, end: true },
  { to: "/admin/restaurants", label: "Restaurants", icon: FaStore },
  { to: "/admin/users", label: "Customers", icon: FaUsers },
  { to: "/admin/vendors", label: "Vendors", icon: FaShoppingBag },
];

function SideLink({ to, label, icon: Icon, end = false, collapsed = false }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        [
          "group flex items-center rounded-xl px-4 py-3 text-sm font-medium transition",
          collapsed ? "justify-center gap-0" : "gap-3",
          isActive
            ? "bg-gradient-to-r from-[#22c1c3] to-[#2563eb] text-white shadow-lg shadow-cyan-500/20"
            : "text-cyan-50/75 hover:bg-cyan-400/10 hover:text-white",
        ].join(" ")
      }
      title={collapsed ? label : undefined}
    >
      <Icon className="text-base" />
      {!collapsed ? label : <span className="sr-only">{label}</span>}
    </NavLink>
  );
}

export default function AdminLayout() {
  const { admin, logout, updateProfile } = useAdminAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: admin?.name ?? "Super Admin",
    phone: admin?.phone ?? "",
    picture: admin?.picture ?? "",
  });
  const [passwordForm, setPasswordForm] = useState({ oldPassword: "", newPassword: "", confirmPassword: "" });
  const [profileStatus, setProfileStatus] = useState("");
  const [passwordStatus, setPasswordStatus] = useState("");

  const adminInitial = (admin?.name || "A").trim()[0]?.toUpperCase() || "A";

  const openProfile = () => {
    setProfileForm({
      name: admin?.name ?? "Super Admin",
      phone: admin?.phone ?? "",
      picture: admin?.picture ?? "",
    });
    setProfileStatus("");
    setPasswordStatus("");
    setProfileOpen(true);
  };

  const handleProfileImage = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setProfileForm((current) => ({ ...current, picture: String(reader.result || "") }));
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async (event) => {
    event.preventDefault();
    setProfileStatus("");
    try {
      await updateProfile({
        name: profileForm.name.trim(),
        phone: profileForm.phone.trim(),
        picture: profileForm.picture,
      });
      setProfileStatus("Profile saved");
    } catch (error) {
      setProfileStatus(error.message || "Could not save profile");
    }
  };

  const handleChangePassword = async (event) => {
    event.preventDefault();
    setPasswordStatus("");
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordStatus("New password and confirm password must match");
      return;
    }
    try {
      await changeAdminPassword({
        oldPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
      setPasswordStatus("Password changed");
    } catch (error) {
      setPasswordStatus(error.message || "Could not change password");
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f8ff] text-slate-900">
      <div className={`min-h-screen lg:grid ${collapsed ? "lg:grid-cols-[96px_1fr]" : "lg:grid-cols-[280px_1fr]"}`}>
        <aside className="hidden border-r border-cyan-950/80 bg-[#08111f] text-white lg:flex lg:flex-col">
          <div className="border-b border-cyan-400/15 px-5 py-5">
            <div className={`flex items-center ${collapsed ? "justify-center" : "gap-3"}`}>
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-[#22c1c3] to-[#2563eb] text-white">
                <FaMapMarkedAlt />
              </div>
              {!collapsed ? (
                <div>
                  <p className="text-lg font-bold leading-none">RestorantBooking</p>
                  <p className="text-xs text-cyan-100/70">Admin</p>
                </div>
              ) : null}
            </div>
          </div>

          <div className="px-4 py-4">
            {!collapsed ? (
              <p className="px-3 pb-3 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200/80">
                Super Admin Panel
              </p>
            ) : null}
            <nav className="space-y-2">
              {links.map((link) => (
                <SideLink key={link.to} {...link} collapsed={collapsed} />
              ))}
            </nav>
          </div>

          <div className="mt-auto border-t border-cyan-400/15 p-4">
            <div className="rounded-2xl bg-cyan-400/10 p-4">
              {!collapsed ? (
                <>
                  <p className="text-sm font-semibold text-white">{admin?.name ?? "Super Admin"}</p>
                  <p className="mt-1 text-xs text-cyan-100/80">{admin?.email ?? "admin@foodbook.app"}</p>
                </>
              ) : (
                <p className="text-center text-xs text-cyan-100/80">Admin</p>
              )}
            </div>
          </div>
        </aside>

        <div className="flex min-h-screen flex-col">
          <header className="sticky top-0 z-30 border-b border-cyan-100 bg-white/92 backdrop-blur">
            <div className="flex items-center gap-4 px-4 py-4 sm:px-6 lg:px-8">
              <button
                onClick={() => setCollapsed((value) => !value)}
                className="grid h-11 w-11 place-items-center rounded-full border border-cyan-100 bg-white text-cyan-700"
                aria-label="Toggle sidebar"
              >
                <FaChevronLeft className={collapsed ? "rotate-180 transition-transform" : "transition-transform"} />
              </button>

              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-600">Dashboard</p>
                <h1 className="text-xl font-semibold text-slate-900 sm:text-2xl">Admin Control</h1>
              </div>

              <label className="hidden flex-1 items-center gap-3 rounded-2xl border border-cyan-100 bg-cyan-50 px-4 py-3 text-sm text-cyan-700 md:flex md:max-w-md">
                <span className="text-cyan-400">?</span>
                <input
                  placeholder="Search here..."
                  className="w-full bg-transparent outline-none placeholder:text-cyan-300"
                />
              </label>

              <button className="grid h-11 w-11 place-items-center rounded-full border border-cyan-100 bg-white text-cyan-700">
                <FaBell />
              </button>

              <button onClick={openProfile} className="grid h-11 w-11 place-items-center rounded-full border border-cyan-100 bg-white text-cyan-700">
                <FaCog />
              </button>

              <button
                type="button"
                onClick={openProfile}
                className="flex items-center gap-3 rounded-full border border-cyan-100 bg-white px-3 py-2 text-left transition hover:bg-cyan-50"
              >
                <div className="grid h-9 w-9 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-[#22c1c3] to-[#2563eb] text-sm font-bold text-white">
                  {admin?.picture ? <img src={admin.picture} alt="" className="h-full w-full object-cover" /> : adminInitial}
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-semibold leading-none text-slate-900">{admin?.name ?? "Super Admin"}</p>
                  <p className="text-xs text-cyan-700">Administrator</p>
                </div>
              </button>
            </div>
          </header>

          <main className="flex-1 px-4 py-5 sm:px-6 lg:px-8">
            <div className="mb-4 flex flex-wrap gap-2 lg:hidden">
              {links.map((link) => (
                <SideLink key={link.to} {...link} collapsed={false} />
              ))}
            </div>

            <div className="mx-auto max-w-[1600px]">
              <Outlet />
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => {
                  logout();
                  navigate("/admin/login");
                }}
                className="rounded-full border border-cyan-100 bg-white px-4 py-2 text-sm font-medium text-cyan-700 transition hover:bg-cyan-50"
              >
                Logout
              </button>
            </div>
          </main>
        </div>
      </div>

      {profileOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 py-6">
          <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-3xl border border-cyan-100 bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-cyan-100 bg-cyan-50 px-6 py-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-600">Admin profile</p>
                <h2 className="mt-1 text-2xl font-semibold text-slate-900">Profile settings</h2>
              </div>
              <button
                type="button"
                onClick={() => setProfileOpen(false)}
                className="grid h-10 w-10 place-items-center rounded-full bg-white text-cyan-700 shadow-sm"
                aria-label="Close profile settings"
              >
                <FaTimes />
              </button>
            </div>

            <div className="grid gap-6 p-6 lg:grid-cols-[0.9fr_1.1fr]">
              <form onSubmit={handleSaveProfile} className="space-y-4 rounded-2xl border border-cyan-100 p-5">
                <div className="flex items-center gap-4">
                  <div className="grid h-20 w-20 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-[#22c1c3] to-[#2563eb] text-2xl font-bold text-white">
                    {profileForm.picture ? <img src={profileForm.picture} alt="" className="h-full w-full object-cover" /> : adminInitial}
                  </div>
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-cyan-50 px-4 py-2 text-sm font-semibold text-cyan-700">
                    <FaCamera />
                    Set profile picture
                    <input type="file" accept="image/*" onChange={handleProfileImage} className="sr-only" />
                  </label>
                </div>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-900">Name</span>
                  <input
                    value={profileForm.name}
                    onChange={(event) => setProfileForm((current) => ({ ...current, name: event.target.value }))}
                    className="w-full rounded-2xl border border-cyan-100 bg-white px-4 py-3 text-sm outline-none focus:border-cyan-400"
                    required
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-900">Phone</span>
                  <input
                    value={profileForm.phone}
                    onChange={(event) => setProfileForm((current) => ({ ...current, phone: event.target.value }))}
                    className="w-full rounded-2xl border border-cyan-100 bg-white px-4 py-3 text-sm outline-none focus:border-cyan-400"
                    placeholder="Admin phone"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-900">Email</span>
                  <input
                    value={admin?.email ?? ""}
                    className="w-full rounded-2xl border border-cyan-100 bg-cyan-50 px-4 py-3 text-sm text-cyan-900/70 outline-none"
                    disabled
                  />
                </label>

                {profileStatus ? <p className="rounded-2xl bg-cyan-50 px-4 py-3 text-sm font-semibold text-cyan-700">{profileStatus}</p> : null}

                <button className="w-full rounded-full bg-gradient-to-r from-[#22c1c3] to-[#2563eb] px-4 py-3 text-sm font-semibold text-white">
                  Save profile
                </button>
              </form>

              <form onSubmit={handleChangePassword} className="space-y-4 rounded-2xl border border-cyan-100 p-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-600">Security</p>
                  <h3 className="mt-1 text-xl font-semibold text-slate-900">Reset password</h3>
                </div>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-900">Old password</span>
                  <input
                    type="password"
                    value={passwordForm.oldPassword}
                    onChange={(event) => setPasswordForm((current) => ({ ...current, oldPassword: event.target.value }))}
                    className="w-full rounded-2xl border border-cyan-100 bg-white px-4 py-3 text-sm outline-none focus:border-cyan-400"
                    required
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-900">New password</span>
                  <input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(event) => setPasswordForm((current) => ({ ...current, newPassword: event.target.value }))}
                    className="w-full rounded-2xl border border-cyan-100 bg-white px-4 py-3 text-sm outline-none focus:border-cyan-400"
                    required
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-900">Confirm password</span>
                  <input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(event) => setPasswordForm((current) => ({ ...current, confirmPassword: event.target.value }))}
                    className="w-full rounded-2xl border border-cyan-100 bg-white px-4 py-3 text-sm outline-none focus:border-cyan-400"
                    required
                  />
                </label>

                <p className="rounded-2xl bg-cyan-50 px-4 py-3 text-sm text-cyan-900/70">
                  Password must be at least 8 characters and include uppercase, lowercase, number, and @.
                </p>

                {passwordStatus ? <p className="rounded-2xl bg-cyan-50 px-4 py-3 text-sm font-semibold text-cyan-700">{passwordStatus}</p> : null}

                <button className="w-full rounded-full bg-slate-900 px-4 py-3 text-sm font-semibold text-white">
                  Change password
                </button>
              </form>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

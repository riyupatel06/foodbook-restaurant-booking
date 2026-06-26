import { useEffect, useState } from "react";
import { FaBan, FaCheckCircle, FaTrash } from "react-icons/fa";
import AdminSectionTitle from "./components/AdminSectionTitle";
import { deleteUser, fetchAdminDashboard, updateUser } from "./services/adminApi";

export default function AdminUsers() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchAdminDashboard().then(setData);
  }, []);

  const users = data?.users ?? [];

  const toggleBlock = async (user) => {
    const updated = await updateUser(user._id, { isBlocked: !user.isBlocked });
    setData((current) => ({
      ...current,
      users: current.users.map((item) => (item._id === user._id ? updated : item)),
    }));
  };

  const removeUser = async (user) => {
    if (!window.confirm(`Delete ${user.name}?`)) return;
    await deleteUser(user._id);
    setData((current) => ({
      ...current,
      users: current.users.filter((item) => item._id !== user._id),
    }));
  };

  return (
    <div className="space-y-5">
      <section className="rounded-[28px] border border-cyan-100 bg-white p-5 shadow-sm">
        <AdminSectionTitle
          kicker="Customer Control"
          title="Customer Management"
          description="Review and remove customer accounts."
        />
      </section>

      <section className="overflow-hidden rounded-[28px] border border-cyan-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-cyan-100">
            <thead className="bg-cyan-50">
              <tr className="text-left text-xs font-semibold uppercase tracking-[0.2em] text-cyan-700">
                <th className="px-5 py-4">Name</th>
                <th className="px-5 py-4">Email</th>
                <th className="px-5 py-4">Phone</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cyan-50">
              {users.length ? (
                users.map((user) => (
                  <tr key={user._id} className="bg-white">
                    <td className="px-5 py-4 font-semibold text-slate-900">{user.name}</td>
                    <td className="px-5 py-4 text-sm text-cyan-900/75">{user.email}</td>
                    <td className="px-5 py-4 text-sm text-cyan-900/75">{user.phone}</td>
                    <td className="px-5 py-4 text-sm font-semibold">
                      <span className={`rounded-full px-3 py-1 ${user.isBlocked ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-700"}`}>
                        {user.isBlocked ? "Blocked" : "Active"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => toggleBlock(user)}
                          className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white ${user.isBlocked ? "bg-emerald-600" : "bg-amber-500"}`}
                        >
                          {user.isBlocked ? <FaCheckCircle /> : <FaBan />}
                          {user.isBlocked ? "Unblock" : "Block"}
                        </button>
                      <button
                        onClick={() => removeUser(user)}
                        className="inline-flex items-center gap-2 rounded-full bg-rose-500 px-4 py-2 text-sm font-semibold text-white"
                      >
                        <FaTrash />
                        Remove
                      </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-5 py-8 text-sm text-cyan-900/60" colSpan={5}>
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

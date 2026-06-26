import { useEffect, useState } from "react";
import { FaBan, FaCheckCircle, FaTrash } from "react-icons/fa";
import AdminSectionTitle from "./components/AdminSectionTitle";
import { deleteVendor, fetchAdminDashboard, updateVendor } from "./services/adminApi";

export default function AdminVendors() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchAdminDashboard().then(setData);
  }, []);

  const vendors = data?.vendors ?? [];

  const toggleBlock = async (vendor) => {
    const updated = await updateVendor(vendor._id, { isBlocked: !vendor.isBlocked });
    setData((current) => ({
      ...current,
      vendors: current.vendors.map((item) => (item._id === vendor._id ? updated : item)),
    }));
  };

  const removeVendor = async (vendor) => {
    if (!window.confirm(`Delete ${vendor.businessName || vendor.name}?`)) return;
    await deleteVendor(vendor._id);
    setData((current) => ({
      ...current,
      vendors: current.vendors.filter((item) => item._id !== vendor._id),
    }));
  };

  return (
    <div className="space-y-5">
      <section className="rounded-[28px] border border-cyan-100 bg-white p-5 shadow-sm">
        <AdminSectionTitle
          kicker="Vendor Control"
          title="Vendor Management"
          description="Review, monitor, and remove vendor accounts."
        />
      </section>

      <section className="overflow-hidden rounded-[28px] border border-cyan-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-cyan-100">
            <thead className="bg-cyan-50">
              <tr className="text-left text-xs font-semibold uppercase tracking-[0.2em] text-cyan-700">
                <th className="px-5 py-4">Business</th>
                <th className="px-5 py-4">Email</th>
                <th className="px-5 py-4">Phone</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cyan-50">
              {vendors.length ? (
                vendors.map((vendor) => (
                  <tr key={vendor._id} className="bg-white">
                    <td className="px-5 py-4 font-semibold text-slate-900">{vendor.businessName}</td>
                    <td className="px-5 py-4 text-sm text-cyan-900/75">{vendor.email}</td>
                    <td className="px-5 py-4 text-sm text-cyan-900/75">{vendor.phone || "-"}</td>
                    <td className="px-5 py-4 text-sm font-semibold">
                      <span className={`rounded-full px-3 py-1 ${vendor.isBlocked ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-700"}`}>
                        {vendor.isBlocked ? "Blocked" : "Active"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => toggleBlock(vendor)}
                          className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white ${vendor.isBlocked ? "bg-emerald-600" : "bg-amber-500"}`}
                        >
                          {vendor.isBlocked ? <FaCheckCircle /> : <FaBan />}
                          {vendor.isBlocked ? "Unblock" : "Block"}
                        </button>
                      <button
                        onClick={() => removeVendor(vendor)}
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
                    No vendors found.
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

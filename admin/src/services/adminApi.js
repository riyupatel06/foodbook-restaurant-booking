import { apiDelete, apiGet, apiPatch, apiPost, getToken } from "../lib/api";

export function adminToken() {
  return getToken();
}

export function fetchAdminDashboard(token = adminToken()) {
  return apiGet("/admin/dashboard", token);
}

export function adminLogin(payload) {
  return apiPost("/admin/login", payload, "");
}

export function fetchAdminProfile(token = adminToken()) {
  return apiGet("/admin/me", token);
}

export function updateAdminProfile(payload, token = adminToken()) {
  return apiPatch("/admin/me", payload, token);
}

export function changeAdminPassword(payload, token = adminToken()) {
  return apiPost("/admin/change-password", payload, token);
}

export function updateRestaurant(id, payload, token = adminToken()) {
  return apiPatch(`/admin/restaurants/${id}`, payload, token);
}

export function createRestaurant(payload, token = adminToken()) {
  return apiPost("/admin/restaurants", payload, token);
}

export function fetchAdminRestaurantDetail(id, token = adminToken()) {
  return apiGet(`/admin/restaurants/${id}/detail`, token);
}

export function deleteRestaurant(id, token = adminToken()) {
  return apiDelete(`/admin/restaurants/${id}`, token);
}

export function deleteUser(id, token = adminToken()) {
  return apiDelete(`/admin/users/${id}`, token);
}

export function updateUser(id, payload, token = adminToken()) {
  return apiPatch(`/admin/users/${id}`, payload, token);
}

export function deleteVendor(id, token = adminToken()) {
  return apiDelete(`/admin/vendors/${id}`, token);
}

export function updateVendor(id, payload, token = adminToken()) {
  return apiPatch(`/admin/vendors/${id}`, payload, token);
}

export function fetchAdminBookings(token = adminToken()) {
  return apiGet("/admin/bookings", token);
}

export function createAdminBooking(payload, token = adminToken()) {
  return apiPost("/admin/bookings", payload, token);
}

export function updateAdminBooking(id, payload, token = adminToken()) {
  return apiPatch(`/admin/bookings/${id}`, payload, token);
}

export function updateAdminBookingStatus(id, status, token = adminToken()) {
  return apiPatch(`/admin/bookings/${id}/status`, { status }, token);
}

export function deleteAdminBooking(id, token = adminToken()) {
  return apiDelete(`/admin/bookings/${id}`, token);
}

export function fetchAdminPayments(token = adminToken()) {
  return apiGet("/admin/payments", token);
}

export function fetchAdminPayment(id, token = adminToken()) {
  return apiGet(`/admin/payments/${id}`, token);
}

export function fetchAdminRestaurantPayments(restaurantId, token = adminToken()) {
  return apiGet(`/admin/payments/restaurant/${restaurantId}`, token);
}

export function payRestaurantForPayment(id, token = adminToken()) {
  return apiPatch(`/admin/payments/${id}/payout`, {}, token);
}

export function payRestaurantPayments(restaurantId, token = adminToken()) {
  return apiPatch(`/admin/payments/restaurant/${restaurantId}/payout`, {}, token);
}

export function fetchAdminOrders(token = adminToken()) {
  return apiGet("/admin/orders", token);
}

export function fetchAdminTables(token = adminToken()) {
  return apiGet("/admin/tables", token);
}

export function fetchAdminMenuItems(token = adminToken()) {
  return apiGet("/admin/menu-items", token);
}

export function updateAdminTable(id, payload, token = adminToken()) {
  return apiPatch(`/admin/tables/${id}`, payload, token);
}

export function createAdminTable(payload, token = adminToken()) {
  return apiPost("/admin/tables", payload, token);
}

export function deleteAdminTable(id, token = adminToken()) {
  return apiDelete(`/admin/tables/${id}`, token);
}

export function createAdminMenuItem(payload, token = adminToken()) {
  return apiPost("/admin/menu-items", payload, token);
}

export function updateAdminMenuItem(id, payload, token = adminToken()) {
  return apiPatch(`/admin/menu-items/${id}`, payload, token);
}

export function deleteAdminMenuItem(id, token = adminToken()) {
  return apiDelete(`/admin/menu-items/${id}`, token);
}

export function fetchAdminCoupons(token = adminToken()) {
  return apiGet("/admin/coupons", token);
}

export function deleteAdminCoupon(id, token = adminToken()) {
  return apiDelete(`/admin/coupons/${id}`, token);
}

export function fetchAdminDeals(token = adminToken()) {
  return apiGet("/admin/deals", token);
}

export function createAdminDeal(payload, token = adminToken()) {
  return apiPost("/admin/deals", payload, token);
}

export function updateAdminDeal(id, payload, token = adminToken()) {
  return apiPatch(`/admin/deals/${id}`, payload, token);
}

export function deleteAdminDeal(id, token = adminToken()) {
  return apiDelete(`/admin/deals/${id}`, token);
}

export function fetchAdminEvents(token = adminToken()) {
  return apiGet("/admin/events", token);
}

export function fetchAdminReviews(token = adminToken()) {
  return apiGet("/admin/reviews", token);
}

export function deleteAdminReview(id, token = adminToken()) {
  return apiDelete(`/admin/reviews/${id}`, token);
}

export function fetchAdminNotifications(token = adminToken()) {
  return apiGet("/admin/notifications", token);
}

export function deleteAdminNotification(id, token = adminToken()) {
  return apiDelete(`/admin/notifications/${id}`, token);
}

export function fetchAdminWaitlist(token = adminToken()) {
  return apiGet("/admin/waitlist", token);
}

export function updateAdminWaitlistEntry(id, payload, token = adminToken()) {
  return apiPatch(`/admin/waitlist/${id}`, payload, token);
}

export function deleteAdminWaitlistEntry(id, token = adminToken()) {
  return apiDelete(`/admin/waitlist/${id}`, token);
}

export function fetchAdminReports(token = adminToken()) {
  return apiGet("/admin/reports", token);
}

export function downloadAdminReport(token = adminToken()) {
  return fetch(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"}/admin/reports/pdf`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  }).then(async (response) => {
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      const error = new Error(data.message || "Unable to download report");
      error.statusCode = response.status;
      throw error;
    }

    return response.blob();
  });
}

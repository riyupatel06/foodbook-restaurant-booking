export const memoryUsers = new Map();
export const memoryVendors = new Map();

export function createMemoryUser({ name, email, phone, passwordHash }) {
  const normalizedEmail = email.toLowerCase().trim();
  const user = {
    _id: `mem-user-${Date.now()}`,
    name,
    email: normalizedEmail,
    phone,
    passwordHash,
    resetOtpHash: null,
    resetOtpExpiresAt: null,
    role: "user",
    isBlocked: false,
  };

  memoryUsers.set(normalizedEmail, user);
  return user;
}

export function findMemoryUserByEmail(email) {
  return memoryUsers.get(email.toLowerCase().trim()) ?? null;
}

export function findMemoryUserById(id) {
  for (const user of memoryUsers.values()) {
    if (user._id === id) {
      return user;
    }
  }

  return null;
}

export function updateMemoryUser(email, updates) {
  const normalizedEmail = email.toLowerCase().trim();
  const current = memoryUsers.get(normalizedEmail);
  if (!current) return null;

  const next = { ...current, ...updates };
  const nextKey = String(next.email ?? normalizedEmail).toLowerCase().trim();
  if (nextKey !== normalizedEmail) {
    memoryUsers.delete(normalizedEmail);
  }
  memoryUsers.set(nextKey, next);
  return next;
}

export function createMemoryVendor({ name, businessName, email, phone, passwordHash, logo = "" }) {
  const normalizedEmail = email.toLowerCase().trim();
  const vendor = {
    _id: `mem-vendor-${Date.now()}`,
    name,
    businessName,
    email: normalizedEmail,
    phone,
    passwordHash,
    logo,
    isBlocked: false,
    role: "vendor",
  };

  memoryVendors.set(normalizedEmail, vendor);
  return vendor;
}

export function findMemoryVendorByEmail(email) {
  return memoryVendors.get(email.toLowerCase().trim()) ?? null;
}

export function findMemoryVendorById(id) {
  for (const vendor of memoryVendors.values()) {
    if (vendor._id === id) {
      return vendor;
    }
  }

  return null;
}

export function updateMemoryVendor(email, updates) {
  const normalizedEmail = email.toLowerCase().trim();
  const current = memoryVendors.get(normalizedEmail);
  if (!current) return null;

  const next = { ...current, ...updates };
  const nextKey = String(next.email ?? normalizedEmail).toLowerCase().trim();
  if (nextKey !== normalizedEmail) {
    memoryVendors.delete(normalizedEmail);
  }
  memoryVendors.set(nextKey, next);
  return next;
}

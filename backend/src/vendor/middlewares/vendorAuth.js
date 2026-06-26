import jwt from "jsonwebtoken";

export function requireVendorAuth(request, response, next) {
  const header = request.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return response.status(401).json({ message: "Missing vendor authorization token" });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (payload.role !== "vendor") {
      return response.status(403).json({ message: "Vendor access required" });
    }

    request.vendor = payload;
    return next();
  } catch {
    return response.status(401).json({ message: "Invalid or expired vendor token" });
  }
}

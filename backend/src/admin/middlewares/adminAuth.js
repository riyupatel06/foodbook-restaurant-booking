import jwt from "jsonwebtoken";

export function requireAdminAuth(request, response, next) {
  const header = request.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return response.status(401).json({ message: "Missing authorization token" });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (payload.role !== "admin") {
      return response.status(403).json({ message: "Admin access required" });
    }

    request.admin = payload;
    return next();
  } catch {
    return response.status(401).json({ message: "Invalid or expired token" });
  }
}

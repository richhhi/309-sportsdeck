import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";

export interface AuthPayload {
  id: string;
  role: string;
}

/**
 * Checks user's Bearer JWT in the HTTP header. Returns null if invalid.
 */
export function getUserFromRequest(request: NextRequest): AuthPayload | null {
  const token = request.cookies.get("accessToken")?.value || "";

  if (!token) return null;

  try {
    const accessSecret = process.env.JWT_ACCESS_SECRET || "dev_access_secret";
    const payload = jwt.verify(token, accessSecret) as any;

    return { id: payload.id , role: payload.role };
  } catch (err) {
    console.error("JWT validation failed", err);
    return null;
  }
}

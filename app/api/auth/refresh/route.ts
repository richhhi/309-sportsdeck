import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const ACCESS_EXP_MINUTES = 120;
const REFRESH_EXP_DAYS = 7;

export async function POST(request: NextRequest) {
  try {
    const refreshToken = request.cookies.get("refreshToken")?.value;

    if (!refreshToken) {
      return NextResponse.json({ error: "refreshToken cookie is required" }, { status: 400 });
    }

    const refreshSecret = process.env.JWT_REFRESH_SECRET || "dev_refresh_secret";

    try {
      const payload = jwt.verify(refreshToken, refreshSecret) as any;
      const expiresAt = new Date(Date.now() + ACCESS_EXP_MINUTES * 60 * 1000).toISOString();

      const newPayload = {
        id: payload.id,
        role: payload.role,
        expiresAt,
      };
      
      const accessSecret = process.env.JWT_ACCESS_SECRET || "dev_access_secret";
      const newAccessToken = jwt.sign(newPayload, accessSecret, { expiresIn: `${ACCESS_EXP_MINUTES}m` });
      
      const newRefreshToken = jwt.sign(newPayload, refreshSecret, { expiresIn: `${REFRESH_EXP_DAYS}d` });

      const response = NextResponse.json({ success: true }, { status: 200 });
      
      response.cookies.set("accessToken", newAccessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: ACCESS_EXP_MINUTES * 60,
        path: "/",
      });
      
      response.cookies.set("refreshToken", newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: REFRESH_EXP_DAYS * 24 * 60 * 60,
        path: "/",
      });

      return response;
    } catch (err) {
      // Invalid or expired refresh token
      return NextResponse.json({ error: "Invalid or expired refresh token" }, { status: 401 });
    }
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Refresh failed" }, { status: 500 });
  }
}

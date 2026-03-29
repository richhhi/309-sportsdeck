import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import jwt from "jsonwebtoken";

const ACCESS_EXP_MINUTES = 120;
const REFRESH_EXP_DAYS = 7;

interface GoogleUserInfo {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

// GET /api/auth/google/callback — Handle the redirect from Google
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const storedState = request.cookies.get("oauth_state")?.value;

    // ── Validate state (CSRF check) ──────────────────────
    if (!state || !storedState || state !== storedState) {
      return NextResponse.redirect(new URL("/login?error=invalid_state", request.url));
    }

    if (!code) {
      return NextResponse.redirect(new URL("/login?error=no_code", request.url));
    }

    const clientId = process.env.GOOGLE_CLIENT_ID!;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET!;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI!;

    // ── Exchange authorization code for tokens ───────────
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) {
      console.error("Google token exchange failed", await tokenRes.text());
      return NextResponse.redirect(new URL("/login?error=token_exchange", request.url));
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token as string;

    // ── Fetch user profile from Google ───────────────────
    const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!userInfoRes.ok) {
      console.error("Google userinfo fetch failed", await userInfoRes.text());
      return NextResponse.redirect(new URL("/login?error=userinfo", request.url));
    }

    const googleUser: GoogleUserInfo = await userInfoRes.json();

    // ── Find or create the local user ────────────────────
    let user = await prisma.user.findUnique({ where: { email: googleUser.email } });

    if (user) {
      // Link the Google provider if the account was previously local-only
      if (!user.authProvider || user.authProvider === "LOCAL") {
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            authProvider: "GOOGLE",
            avatarUrl: user.avatarUrl || googleUser.picture || null,
          },
        });
      }
    } else {
      // Create a brand-new user
      // Derive a unique username from the email prefix
      const baseUsername = googleUser.email.split("@")[0];
      let username = baseUsername;
      let suffix = 1;
      while (await prisma.user.findUnique({ where: { username } })) {
        username = `${baseUsername}${suffix}`;
        suffix++;
      }

      user = await prisma.user.create({
        data: {
          email: googleUser.email,
          passwordHash: null,
          authProvider: "GOOGLE",
          username,
          avatarUrl: googleUser.picture || null,
        },
      });
    }

    // ── Issue JWT cookies (same pattern as /api/auth/login) ──
    const expiresAt = new Date(Date.now() + ACCESS_EXP_MINUTES * 60 * 1000).toISOString();

    const payload = {
      id: user.id,
      role: user.role,
      expiresAt,
    };

    const accessSecret = process.env.JWT_ACCESS_SECRET || "dev_access_secret";
    const refreshSecret = process.env.JWT_REFRESH_SECRET || "dev_refresh_secret";

    const jwtAccessToken = jwt.sign(payload, accessSecret, { expiresIn: `${ACCESS_EXP_MINUTES}m` });
    const jwtRefreshToken = jwt.sign(payload, refreshSecret, { expiresIn: `${REFRESH_EXP_DAYS}d` });

    const response = NextResponse.redirect(new URL("/", request.url));

    response.cookies.set("accessToken", jwtAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: ACCESS_EXP_MINUTES * 60,
      path: "/",
    });

    response.cookies.set("refreshToken", jwtRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: REFRESH_EXP_DAYS * 24 * 60 * 60,
      path: "/",
    });

    // Clear the temporary OAuth state cookie
    response.cookies.set("oauth_state", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0,
      path: "/",
    });

    return response;
  } catch (err) {
    console.error("Google OAuth callback error", err);
    return NextResponse.redirect(new URL("/login?error=server", request.url));
  }
}

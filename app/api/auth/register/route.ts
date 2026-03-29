import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const ACCESS_EXP_MINUTES = 120; // access token lifetime
const REFRESH_EXP_DAYS = 7; // refresh token lifetime

// POST /api/auth/register - Create a new account with email/password (Visitor)
export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { email, password, username } = body ?? {};

		if (!email || !password) {
			return NextResponse.json({ error: "email and password are required" }, { status: 400 });
		}

		// basic email format check
		const emailRegex = /^\S+@\S+\.\S+$/;
		if (!emailRegex.test(email)) {
			return NextResponse.json({ error: "invalid email format" }, { status: 400 });
		}

		// password length validation
		if (password.length < 8) {
			return NextResponse.json({ error: "password must be at least 8 characters" }, { status: 400 });
		}

		const existing = await prisma.user.findUnique({ where: { email } });
		if (existing) {
			return NextResponse.json({ error: "email already exists" }, { status: 400 });
		}

		const passwordHash = await bcrypt.hash(password, 10);

		const user = await prisma.user.create({
			data: {
				email,
				passwordHash,
				username: username ?? email,
			},
		});

		const expiresAt = new Date(Date.now() + ACCESS_EXP_MINUTES * 60 * 1000).toISOString();
		const payload = {
			id: user.id,
			role: user.role,
			expiresAt,
		};

		const accessSecret = process.env.JWT_ACCESS_SECRET || "dev_access_secret";
		const refreshSecret = process.env.JWT_REFRESH_SECRET || "dev_refresh_secret";

		const accessToken = jwt.sign(payload, accessSecret, { expiresIn: `${ACCESS_EXP_MINUTES}m` });
		const refreshToken = jwt.sign(payload, refreshSecret, { expiresIn: `${REFRESH_EXP_DAYS}d` });

		const response = NextResponse.json({ message: "User registered and logged in" }, { status: 200 });

		response.cookies.set("accessToken", accessToken, {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "strict",
			maxAge: ACCESS_EXP_MINUTES * 60,
			path: "/",
		});

		response.cookies.set("refreshToken", refreshToken, {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "strict",
			maxAge: REFRESH_EXP_DAYS * 24 * 60 * 60,
			path: "/",
		});

		return response;
	} catch (err) {
		console.error(err);
		return NextResponse.json({ error: "Registration failed" }, { status: 500 });
	}
}

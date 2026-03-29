import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { getUserFromRequest } from "../../../../../lib/auth";
import fs from "fs/promises";
import path from "path";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "avatars");
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// POST /api/users/me/avatar - Upload an avatar image
export async function POST(request: NextRequest) {
  try {
    const currentUser = getUserFromRequest(request);
    if (currentUser == null) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("avatar") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No avatar file provided" }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "File must be an image" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File size exceeds 5MB limit" }, { status: 400 });
    }

    const id = currentUser.id;

    // Ensure directory exists
    await fs.mkdir(UPLOAD_DIR, { recursive: true });

    const buffer = Buffer.from(await file.arrayBuffer());
    // Get original extension, default to png if unknown
    const originalName = file.name || "avatar.png";
    const extensionParts = originalName.split(".");
    const extension = extensionParts.length > 1 ? extensionParts.pop() : "png";
    const filename = `${id}-${Date.now()}.${extension}`;
    const filePath = path.join(UPLOAD_DIR, filename);

    // Get current user to check for exist profile picture to delete
    const user = await prisma.user.findUnique({
      where: { id },
      select: { avatarUrl: true },
    });

    if (user?.avatarUrl && user.avatarUrl.startsWith("/uploads/avatars/")) {
      const oldFilename = user.avatarUrl.split("/").pop();
      if (oldFilename) {
        const oldFilePath = path.join(UPLOAD_DIR, oldFilename);
        try {
          await fs.unlink(oldFilePath);
        } catch (e) {
          console.warn("Failed to delete old avatar file:", oldFilePath);
        }
      }
    }

    await fs.writeFile(filePath, buffer);
    const newAvatarUrl = `/uploads/avatars/${filename}`;

    const updated = await prisma.user.update({
      where: { id },
      data: { avatarUrl: newAvatarUrl },
      select: { id: true, email: true, username: true, avatarUrl: true, favoriteTeamId: true, role: true },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to upload avatar" }, { status: 500 });
  }
}

// DELETE /api/users/me/avatar - Remove avatar image
export async function DELETE(request: NextRequest) {
  try {
    const currentUser = getUserFromRequest(request);
    if (currentUser == null) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    const id = currentUser.id;

    const user = await prisma.user.findUnique({
      where: { id },
      select: { avatarUrl: true },
    });

    if (user?.avatarUrl && user.avatarUrl.startsWith("/uploads/avatars/")) {
      const oldFilename = user.avatarUrl.split("/").pop();
      if (oldFilename) {
        const oldFilePath = path.join(UPLOAD_DIR, oldFilename);
        try {
          await fs.unlink(oldFilePath);
        } catch (e) {
          console.warn("Failed to delete old avatar file:", oldFilePath);
        }
      }
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { avatarUrl: null },
      select: { id: true, email: true, username: true, avatarUrl: true, favoriteTeamId: true, role: true },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to delete avatar" }, { status: 500 });
  }
}

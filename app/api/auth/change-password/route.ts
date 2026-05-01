import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const DB_NAME = "asean_dmcc";
const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret";

function getUserEmail(req: NextRequest): string | null {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  try {
    const decoded = jwt.verify(auth.slice(7), JWT_SECRET) as { email?: string };
    return decoded.email ?? null;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const userEmail = getUserEmail(req);
  if (!userEmail) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!clientPromise) return NextResponse.json({ error: "Database not configured" }, { status: 503 });

  const { currentPassword, newPassword } = await req.json() as {
    currentPassword: string;
    newPassword: string;
  };

  if (!currentPassword || !newPassword)
    return NextResponse.json({ error: "Both fields are required" }, { status: 400 });
  if (newPassword.length < 8)
    return NextResponse.json({ error: "New password must be at least 8 characters" }, { status: 400 });

  const client = await clientPromise;
  const db = client.db(DB_NAME);
  const user = await db.collection("users").findOne({ email: userEmail });

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const match = await bcrypt.compare(currentPassword, user.password as string);
  if (!match) return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });

  const hashed = await bcrypt.hash(newPassword, 12);
  await db.collection("users").updateOne({ email: userEmail }, { $set: { password: hashed } });

  return NextResponse.json({ ok: true });
}

import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import jwt from "jsonwebtoken";

const DB_NAME = "asean_dmcc";
const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

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

function isAdmin(req: NextRequest): boolean {
  const email = getUserEmail(req);
  return !!ADMIN_EMAIL && email === ADMIN_EMAIL;
}

/** PATCH /api/admin/users — update lastPayment for a user */
export async function PATCH(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!clientPromise) return NextResponse.json({ error: "No DB" }, { status: 503 });

  const { email, lastPayment } = (await req.json()) as {
    email: string;
    lastPayment: string;
  };

  if (!email) return NextResponse.json({ error: "email required" }, { status: 400 });

  const client = await clientPromise;
  await client
    .db(DB_NAME)
    .collection("users")
    .updateOne({ email }, { $set: { lastPayment: lastPayment ?? "" } });

  return NextResponse.json({ success: true });
}

/** DELETE /api/admin/users — delete a user + all their data */
export async function DELETE(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!clientPromise) return NextResponse.json({ error: "No DB" }, { status: 503 });

  const { email } = (await req.json()) as { email: string };
  if (!email) return NextResponse.json({ error: "email required" }, { status: 400 });

  // Prevent admin from deleting themselves
  const requesterEmail = getUserEmail(req);
  if (email === requesterEmail) {
    return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });
  }

  const client = await clientPromise;
  const db = client.db(DB_NAME);

  await Promise.all([
    db.collection("users").deleteOne({ email }),
    db.collection("transactions").deleteMany({ userEmail: email }),
    db.collection("voice_sessions").deleteMany({ userEmail: email }),
  ]);

  return NextResponse.json({ success: true });
}

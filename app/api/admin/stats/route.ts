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

export async function GET(req: NextRequest) {
  const userEmail = getUserEmail(req);
  if (!userEmail) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!ADMIN_EMAIL || userEmail !== ADMIN_EMAIL)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!clientPromise)
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });

  const client = await clientPromise;
  const db = client.db(DB_NAME);

  const users = await db
    .collection("users")
    .find({}, { projection: { password: 0 } })
    .sort({ createdAt: -1 })
    .toArray();

  const txAgg = await db
    .collection("transactions")
    .aggregate([
      { $group: { _id: "$userEmail", count: { $sum: 1 }, lastActivity: { $max: "$createdAt" } } },
    ])
    .toArray();

  const txMap = new Map(
    txAgg.map((r) => [
      r._id as string,
      { count: r.count as number, lastActivity: r.lastActivity as Date },
    ]),
  );

  const vsAgg = await db
    .collection("voice_sessions")
    .aggregate([{ $group: { _id: "$userEmail", count: { $sum: 1 } } }])
    .toArray();

  const vsMap = new Map(vsAgg.map((r) => [r._id as string, r.count as number]));

  const totalTransactions = txAgg.reduce((s, r) => s + (r.count as number), 0);
  const totalVoiceSessions = vsAgg.reduce((s, r) => s + (r.count as number), 0);

  const rows = users.map((u) => {
    const email = u.email as string;
    const tx = txMap.get(email);
    return {
      email,
      createdAt: u.createdAt ?? null,
      transactionCount: tx?.count ?? 0,
      voiceSessionCount: vsMap.get(email) ?? 0,
      lastActivity: tx?.lastActivity ?? null,
      lastPayment: (u.lastPayment as string) ?? "",
    };
  });

  rows.sort((a, b) => b.transactionCount - a.transactionCount);

  return NextResponse.json({ totalUsers: users.length, totalTransactions, totalVoiceSessions, users: rows });
}

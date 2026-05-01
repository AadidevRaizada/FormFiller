import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import jwt from "jsonwebtoken";

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

export async function GET(req: NextRequest) {
  const userEmail = getUserEmail(req);
  if (!userEmail) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!clientPromise) return NextResponse.json({ error: "Database not configured" }, { status: 503 });

  const client = await clientPromise;
  const db = client.db(DB_NAME);

  // last 365 days
  const since = new Date();
  since.setDate(since.getDate() - 364);
  since.setHours(0, 0, 0, 0);

  const [txDays, vsDays] = await Promise.all([
    db.collection("transactions").aggregate([
      { $match: { userEmail, createdAt: { $gte: since } } },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
    ]).toArray(),
    db.collection("voice_sessions").aggregate([
      { $match: { userEmail, createdAt: { $gte: since } } },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
    ]).toArray(),
  ]);

  const txMap = new Map(txDays.map((r) => [r._id as string, r.count as number]));
  const vsMap = new Map(vsDays.map((r) => [r._id as string, r.count as number]));

  // Build full 365-day grid
  const days: { date: string; transactions: number; voiceSessions: number }[] = [];
  for (let i = 364; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    days.push({ date: key, transactions: txMap.get(key) ?? 0, voiceSessions: vsMap.get(key) ?? 0 });
  }

  return NextResponse.json({ days });
}

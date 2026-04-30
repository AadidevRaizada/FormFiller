import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import jwt from "jsonwebtoken";

const DB_NAME = "asean_dmcc";
const COLLECTION = "voice_sessions";
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

  if (!clientPromise) return NextResponse.json({ sessions: [] });

  const client = await clientPromise;
  const rows = await client
    .db(DB_NAME)
    .collection(COLLECTION)
    .find({ userEmail }, { projection: { apiMessages: 0, chatMessages: 0 } })
    .sort({ updatedAt: -1 })
    .limit(50)
    .toArray();

  return NextResponse.json({
    sessions: rows.map((s) => ({ ...s, _id: s._id.toString() })),
  });
}

export async function POST(req: NextRequest) {
  const userEmail = getUserEmail(req);
  if (!userEmail) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!clientPromise) return NextResponse.json({ sessionId: "mock" });

  const client = await clientPromise;
  const result = await client
    .db(DB_NAME)
    .collection(COLLECTION)
    .insertOne({
      userEmail,
      title: "New conversation",
      chatMessages: [],
      apiMessages: [],
      formValues: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    });

  return NextResponse.json({ sessionId: result.insertedId.toString() });
}

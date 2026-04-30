import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import jwt from "jsonwebtoken";
import { ObjectId } from "mongodb";

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

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const userEmail = getUserEmail(req);
  if (!userEmail) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!clientPromise) return NextResponse.json({ session: null });

  try {
    const client = await clientPromise;
    const session = await client
      .db(DB_NAME)
      .collection(COLLECTION)
      .findOne({ _id: new ObjectId(params.id), userEmail });

    if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ session: { ...session, _id: session._id.toString() } });
  } catch {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const userEmail = getUserEmail(req);
  if (!userEmail) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!clientPromise) return NextResponse.json({ success: true });

  try {
    const client = await clientPromise;
    await client
      .db(DB_NAME)
      .collection(COLLECTION)
      .deleteOne({ _id: new ObjectId(params.id), userEmail });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }
}

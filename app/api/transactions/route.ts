import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import jwt from "jsonwebtoken";

const DB_NAME = "asean_dmcc";
const COLLECTION_NAME = "transactions";
const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret";

/** Extract user email from Authorization header JWT */
function getUserEmail(request: NextRequest): string | null {
  const auth = request.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  try {
    const decoded = jwt.verify(auth.slice(7), JWT_SECRET) as { email?: string };
    return decoded.email || null;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const userEmail = getUserEmail(request);
    if (!userEmail) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!clientPromise) {
      const body = await request.json();
      console.log("[mock] Transaction saved:", body);
      return NextResponse.json({ success: true, mock: true });
    }

    const body = await request.json();
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);

    const result = await collection.insertOne({
      ...body,
      userEmail,
      createdAt: new Date(),
      versionNumber: 1,
    });

    return NextResponse.json({ success: true, id: result.insertedId.toString() });
  } catch (error) {
    console.error("Failed to save transaction:", error);
    return NextResponse.json(
      { error: "Failed to save transaction" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const userEmail = getUserEmail(request);
    if (!userEmail) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!clientPromise) {
      console.log("[mock] Returning empty transactions array");
      return NextResponse.json([]);
    }

    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);

    const transactions = await collection
      .find({ userEmail })
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json(transactions);
  } catch (error) {
    console.error("Failed to fetch transactions:", error);
    return NextResponse.json(
      { error: "Failed to fetch transactions" },
      { status: 500 }
    );
  }
}

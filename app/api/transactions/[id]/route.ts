import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import jwt from "jsonwebtoken";

const DB_NAME = "asean_dmcc";
const COLLECTION_NAME = "transactions";
const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret";

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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!clientPromise) {
      return NextResponse.json({ success: true, mock: true });
    }

    const userEmail = getUserEmail(request);
    if (!userEmail) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let objectId: ObjectId;
    try {
      objectId = new ObjectId(id);
    } catch {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);

    const result = await collection.deleteOne({ _id: objectId, userEmail });
    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete transaction:", error);
    return NextResponse.json({ error: "Failed to delete transaction" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!clientPromise) {
      return NextResponse.json({ success: true, mock: true });
    }

    const userEmail = getUserEmail(request);
    if (!userEmail) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let objectId: ObjectId;
    try {
      objectId = new ObjectId(id);
    } catch {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const body = await request.json();
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);

    // Fetch the current document to create a version snapshot before overwriting
    const current = await collection.findOne({ _id: objectId, userEmail });
    if (!current) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Build snapshot: strip metadata fields
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { _id: _id_, versions: _versions, createdAt: _ca, updatedAt: _ua, userEmail: _ue, versionNumber: _vn, ...snapshot } = current;
    const currentVersionNumber = current.versionNumber ?? 1;
    const newVersionEntry = {
      versionNumber: currentVersionNumber,
      savedAt: new Date(),
      snapshot,
    };

    const result = await collection.updateOne(
      { _id: objectId, userEmail },
      {
        $set: { ...body, updatedAt: new Date(), versionNumber: currentVersionNumber + 1 },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        $push: { versions: newVersionEntry } as any,
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to update transaction:", error);
    return NextResponse.json({ error: "Failed to update transaction" }, { status: 500 });
  }
}

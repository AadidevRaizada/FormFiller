import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import jwt from "jsonwebtoken";
import { ObjectId } from "mongodb";

const DB_NAME = "asean_dmcc";
const COLLECTION = "voice_sessions";
const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret";
const DEEPSEEK_KEY = process.env.NEXT_PUBLIC_DEEPSEEK_API_KEY;

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

/* ── DeepSeek types ───────────────────────────────────────────────────────── */

interface DsToolCall {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
}

interface DsMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string | null;
  tool_calls?: DsToolCall[];
  tool_call_id?: string;
}

interface DsResponse {
  choices: Array<{
    message: {
      content: string | null;
      tool_calls?: DsToolCall[];
    };
  }>;
}

/* ── Form tool definition (all fields) ───────────────────────────────────── */

const FILL_FORM_TOOL = {
  type: "function",
  function: {
    name: "fill_form",
    description:
      "Record extracted maritime transaction form field values. Call this whenever the user provides any form data. Merge with existing values — only pass fields explicitly mentioned.",
    parameters: {
      type: "object",
      properties: {
        // Step 1 — Transaction Details
        date: { type: "string", description: "Transaction date, ISO YYYY-MM-DD" },
        vesselNameImo: { type: "string", description: 'Vessel name + IMO e.g. "MT Fortune (IMO 9234567)"' },
        port: { type: "string", description: 'Port name and country e.g. "Fujairah, UAE"' },
        eta: { type: "string", description: 'ETA range e.g. "1st May 2025–5th May 2025"' },
        product: { type: "string", description: 'Primary fuel product e.g. "VLSFO 0.5%"' },
        quantity: { type: "string", description: 'Quantity with unit e.g. "500 MT" or "500–1000 MT"' },
        deliveryMode: { type: "string", description: 'Delivery mode e.g. "Ship-to-Ship"' },
        agents: { type: "string", description: "Shipping agent name" },
        physicalSupplier: { type: "string", description: "Physical fuel supplier name" },
        signatory: { type: "string", description: "Signatory name" },
        productCount: { type: "string", enum: ["1", "2", "3"], description: "Number of distinct products" },
        product2: { type: "string", description: "Second product if productCount >= 2" },
        quantity2: { type: "string", description: "Second product quantity if productCount >= 2" },
        product3: { type: "string", description: "Third product if productCount = 3" },
        quantity3: { type: "string", description: "Third product quantity if productCount = 3" },
        // Step 2 — Bunker Nomination
        bn_to: { type: "string", description: "BN recipient company" },
        bn_attn: { type: "string", description: "BN attention (person name)" },
        bn_sellers: { type: "string", description: "BN sellers" },
        bn_suppliers: { type: "string", description: "BN suppliers" },
        bn_buyingPrice: { type: "string", description: 'BN buying price e.g. "650 USD/MT"' },
        bn_paymentTerms: { type: "string", description: "BN payment terms" },
        bn_remarks: { type: "string", description: "BN remarks / additional notes" },
        bn_buyingPrice2: { type: "string", description: "BN buying price for product 2" },
        bn_buyingPrice3: { type: "string", description: "BN buying price for product 3" },
        // Step 3 — Order Confirmation
        oc_to: { type: "string", description: "OC recipient company" },
        oc_attn: { type: "string", description: "OC attention (person name)" },
        oc_buyers: { type: "string", description: "OC buyers" },
        oc_sellingPrice: { type: "string", description: 'OC selling price e.g. "700 USD/MT"' },
        oc_paymentTerms: { type: "string", description: "OC payment terms" },
        oc_remarks: { type: "string", description: "OC remarks / additional notes" },
        oc_sellingPrice2: { type: "string", description: "OC selling price for product 2" },
        oc_sellingPrice3: { type: "string", description: "OC selling price for product 3" },
      },
      required: [],
    },
  },
} as const;

const SYSTEM_PROMPT = `You are a maritime document assistant for ASEAN International DMCC. Help users fill out bunker transaction forms through conversation.

The form has three sections:
1. Transaction Details: date, vessel name & IMO, port, ETA, product(s), quantity, delivery mode, agents, physical supplier, signatory
2. Bunker Nomination (BN): recipient (bn_to), attention, sellers, suppliers, buying price, payment terms, remarks
3. Order Confirmation (OC): recipient (oc_to), attention, buyers, selling price, payment terms, remarks

When the user provides any form information, call fill_form with the extracted values. Only include fields clearly mentioned — never guess.

After calling the tool, respond naturally:
- Confirm what you captured in 1-2 sentences
- Mention key fields still missing if relevant (don't list everything)
- Keep responses concise and conversational

If the user says something that has nothing to do with a bunker transaction, respond helpfully but briefly and redirect to the task.`;

/* ── DeepSeek caller ──────────────────────────────────────────────────────── */

async function callDeepSeek(messages: DsMessage[]): Promise<DsResponse> {
  if (!DEEPSEEK_KEY) throw new Error("DEEPSEEK API key not configured");

  const res = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${DEEPSEEK_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages,
      tools: [FILL_FORM_TOOL],
      tool_choice: "auto",
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(text);
  }
  return res.json() as Promise<DsResponse>;
}

/* ── Route handler ────────────────────────────────────────────────────────── */

export async function POST(req: NextRequest) {
  const userEmail = getUserEmail(req);
  if (!userEmail) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json()) as {
    sessionId: string;
    userMessage: string;
    apiMessages: DsMessage[];
    currentFormValues: Record<string, string>;
  };

  const { sessionId, userMessage, apiMessages, currentFormValues } = body;

  // Build messages for this turn
  const turnMessages: DsMessage[] = [
    { role: "system", content: SYSTEM_PROMPT },
    ...apiMessages,
    { role: "user", content: userMessage },
  ];

  let filledFields: Record<string, string> = {};
  let replyText = "";
  const newApiMessages: DsMessage[] = [{ role: "user", content: userMessage }];

  try {
    // First call
    const first = await callDeepSeek(turnMessages);
    const firstMsg = first.choices[0]?.message;

    if (firstMsg?.tool_calls?.length) {
      // Parse tool call
      const toolCall = firstMsg.tool_calls[0];
      try {
        filledFields = JSON.parse(toolCall.function.arguments) as Record<string, string>;
      } catch {
        filledFields = {};
      }

      // Append assistant tool_call message + tool result
      newApiMessages.push({
        role: "assistant",
        content: firstMsg.content ?? null,
        tool_calls: firstMsg.tool_calls,
      });
      newApiMessages.push({
        role: "tool",
        content: JSON.stringify({ success: true, fieldsRecorded: Object.keys(filledFields) }),
        tool_call_id: toolCall.id,
      });

      // Second call to get the text reply
      const secondMessages: DsMessage[] = [
        { role: "system", content: SYSTEM_PROMPT },
        ...apiMessages,
        ...newApiMessages,
      ];
      const second = await callDeepSeek(secondMessages);
      replyText = second.choices[0]?.message?.content ?? "Got it, I've recorded those details.";
      newApiMessages.push({ role: "assistant", content: replyText });
    } else {
      replyText = firstMsg?.content ?? "Could you tell me more about the transaction?";
      newApiMessages.push({ role: "assistant", content: replyText });
    }
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "AI call failed" },
      { status: 502 },
    );
  }

  // Merge new fields into accumulated form values
  const accumulatedFormValues = { ...currentFormValues, ...filledFields };

  // Persist to MongoDB
  if (clientPromise && sessionId && sessionId !== "mock") {
    try {
      const client = await clientPromise;
      const col = client.db(DB_NAME).collection(COLLECTION);

      const update: Record<string, unknown> = {
        $push: {
          apiMessages: { $each: newApiMessages } as unknown,
          chatMessages: {
            $each: [
              { role: "user", content: userMessage, timestamp: new Date().toISOString() },
              {
                role: "assistant",
                content: replyText,
                filledFields: Object.keys(filledFields).length ? filledFields : undefined,
                timestamp: new Date().toISOString(),
              },
            ],
          } as unknown,
        },
        $set: {
          formValues: accumulatedFormValues,
          updatedAt: new Date(),
        },
      };

      // Set title from first user message
      const session = await col.findOne({ _id: new ObjectId(sessionId) });
      if (session && session.chatMessages?.length === 0) {
        (update.$set as Record<string, unknown>).title =
          userMessage.slice(0, 60) + (userMessage.length > 60 ? "…" : "");
      }

      await col.updateOne({ _id: new ObjectId(sessionId), userEmail }, update);
    } catch {
      // Non-fatal — still return the AI response
    }
  }

  return NextResponse.json({ reply: replyText, filledFields, accumulatedFormValues });
}

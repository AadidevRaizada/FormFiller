"use client";

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  type KeyboardEvent,
} from "react";
import {
  FiMic,
  FiMicOff,
  FiSend,
  FiPlus,
  FiLoader,
  FiTrash2,
  FiChevronRight,
  FiAlertCircle,
} from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { AuthGuard } from "@/components/AuthGuard";
import { useAuth } from "@/lib/auth-context";
import { useFormStore, type FormFieldKey } from "@/lib/store";
import { isoToOrdinal } from "@/lib/date-utils";
import { useVoiceRecorder } from "./useVoiceRecorder";

/* ── Types ────────────────────────────────────────────────────────────────── */

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  filledFields?: Record<string, string>;
  timestamp: string;
}

interface ApiMessage {
  role: string;
  content: string | null;
  tool_calls?: unknown[];
  tool_call_id?: string;
}

interface SessionSummary {
  _id: string;
  title: string;
  updatedAt: string;
}

/* ── Helpers ──────────────────────────────────────────────────────────────── */

const FIELD_LABEL: Record<string, string> = {
  date: "Date",
  vesselNameImo: "Vessel",
  port: "Port",
  eta: "ETA",
  product: "Product",
  quantity: "Quantity",
  deliveryMode: "Delivery Mode",
  agents: "Agents",
  physicalSupplier: "Supplier",
  signatory: "Signatory",
  productCount: "Products",
  product2: "Product 2",
  quantity2: "Quantity 2",
  product3: "Product 3",
  quantity3: "Quantity 3",
  bn_to: "BN To",
  bn_attn: "BN Attn",
  bn_sellers: "BN Sellers",
  bn_suppliers: "BN Suppliers",
  bn_buyingPrice: "BN Buying Price",
  bn_paymentTerms: "BN Payment Terms",
  bn_remarks: "BN Remarks",
  bn_buyingPrice2: "BN Price 2",
  bn_buyingPrice3: "BN Price 3",
  oc_to: "OC To",
  oc_attn: "OC Attn",
  oc_buyers: "OC Buyers",
  oc_sellingPrice: "OC Selling Price",
  oc_paymentTerms: "OC Payment Terms",
  oc_remarks: "OC Remarks",
  oc_sellingPrice2: "OC Price 2",
  oc_sellingPrice3: "OC Price 3",
};

const WELCOME =
  "Hi! I'm your maritime document assistant. Tell me about your bunker transaction — vessel, port, quantities, suppliers, prices, or anything else. You can type or tap the mic to speak.";

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function relativeDate(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 86_400_000) return "Today";
  if (diff < 172_800_000) return "Yesterday";
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

/* ── Page shell ───────────────────────────────────────────────────────────── */

export default function VoicePage() {
  return (
    <AuthGuard>
      <VoiceChat />
    </AuthGuard>
  );
}

/* ── Main chat component ──────────────────────────────────────────────────── */

function VoiceChat() {
  const { token } = useAuth();
  const { startRecording, stopRecording, isSupported } = useVoiceRecorder();

  // Sessions sidebar
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: WELCOME, timestamp: new Date().toISOString() },
  ]);
  const [apiMessages, setApiMessages] = useState<ApiMessage[]>([]);
  const [formValues, setFormValues] = useState<Record<string, string>>({});

  // Input state
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const startTimeRef = useRef(0);

  const deepgramKey = process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY;

  // Scroll to bottom whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  /* ── Session management ─────────────────────────────────────────────────── */

  const authHeaders = useCallback(
    () => ({ Authorization: `Bearer ${token}`, "Content-Type": "application/json" }),
    [token],
  );

  const loadSessions = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/voice-sessions", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = (await res.json()) as { sessions: SessionSummary[] };
        setSessions(data.sessions);
      }
    } catch {
      // non-fatal
    }
  }, [token]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const createNewSession = useCallback(async () => {
    if (!token) return null;
    try {
      const res = await fetch("/api/voice-sessions", {
        method: "POST",
        headers: authHeaders(),
      });
      if (res.ok) {
        const data = (await res.json()) as { sessionId: string };
        return data.sessionId;
      }
    } catch {
      // non-fatal
    }
    return null;
  }, [token, authHeaders]);

  const startNewChat = useCallback(async () => {
    const newId = await createNewSession();
    setSessionId(newId);
    setChatMessages([
      { role: "assistant", content: WELCOME, timestamp: new Date().toISOString() },
    ]);
    setApiMessages([]);
    setFormValues({});
    setError(null);
    setText("");
    setSidebarOpen(false);
    await loadSessions();
  }, [createNewSession, loadSessions]);

  const loadSession = useCallback(
    async (id: string) => {
      if (!token) return;
      try {
        const res = await fetch(`/api/voice-sessions/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = (await res.json()) as {
            session: {
              chatMessages: ChatMessage[];
              apiMessages: ApiMessage[];
              formValues: Record<string, string>;
            };
          };
          const s = data.session;
          setChatMessages(
            s.chatMessages?.length
              ? s.chatMessages
              : [{ role: "assistant", content: WELCOME, timestamp: new Date().toISOString() }],
          );
          setApiMessages(s.apiMessages ?? []);
          setFormValues(s.formValues ?? {});
          setSessionId(id);
          setSidebarOpen(false);
          setError(null);
        }
      } catch {
        // non-fatal
      }
    },
    [token],
  );

  const deleteSession = useCallback(
    async (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if (!token) return;
      await fetch(`/api/voice-sessions/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (sessionId === id) {
        await startNewChat();
      } else {
        await loadSessions();
      }
    },
    [token, sessionId, startNewChat, loadSessions],
  );

  /* ── Send message ─────────────────────────────────────────────────────────*/

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || sending) return;
      setError(null);

      // Ensure we have a session
      let sid = sessionId;
      if (!sid) {
        sid = await createNewSession();
        setSessionId(sid);
      }

      const userMsg: ChatMessage = {
        role: "user",
        content: content.trim(),
        timestamp: new Date().toISOString(),
      };
      setChatMessages((prev) => [...prev, userMsg]);
      setText("");
      setSending(true);

      // Resize textarea back
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }

      try {
        const res = await fetch("/api/voice-chat", {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({
            sessionId: sid ?? "mock",
            userMessage: content.trim(),
            apiMessages,
            currentFormValues: formValues,
          }),
        });

        if (!res.ok) {
          const err = (await res.json().catch(() => ({ error: res.statusText }))) as {
            error: string;
          };
          throw new Error(err.error);
        }

        const data = (await res.json()) as {
          reply: string;
          filledFields: Record<string, string>;
          accumulatedFormValues: Record<string, string>;
        };

        const assistantMsg: ChatMessage = {
          role: "assistant",
          content: data.reply,
          filledFields:
            Object.keys(data.filledFields ?? {}).length ? data.filledFields : undefined,
          timestamp: new Date().toISOString(),
        };

        setChatMessages((prev) => [...prev, assistantMsg]);
        setApiMessages((prev) => [
          ...prev,
          { role: "user", content: content.trim() },
          { role: "assistant", content: data.reply },
        ]);
        setFormValues(data.accumulatedFormValues ?? {});
        await loadSessions();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
        // Remove the optimistic user message on error
        setChatMessages((prev) => prev.filter((m) => m !== userMsg));
      } finally {
        setSending(false);
      }
    },
    [sessionId, sending, apiMessages, formValues, authHeaders, createNewSession, loadSessions],
  );

  /* ── Voice recording ──────────────────────────────────────────────────────*/

  const handleMicClick = useCallback(async () => {
    if (transcribing || sending) return;

    if (!recording) {
      if (!deepgramKey) {
        setError("Deepgram API key not configured.");
        return;
      }
      startTimeRef.current = Date.now();
      await startRecording();
      setRecording(true);
      return;
    }

    // Stop recording
    setRecording(false);
    const duration = Date.now() - startTimeRef.current;
    const blob = await stopRecording();

    if (duration < 1000) {
      setError("Recording too short — please speak more then try again.");
      return;
    }

    setTranscribing(true);
    setError(null);

    try {
      const res = await fetch(
        "https://api.deepgram.com/v1/listen?model=nova-3&smart_format=true",
        {
          method: "POST",
          headers: {
            Authorization: `Token ${deepgramKey}`,
            "Content-Type": "audio/webm",
          },
          body: blob,
        },
      );
      if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));

      const dgData = (await res.json()) as {
        results: { channels: Array<{ alternatives: Array<{ transcript: string }> }> };
      };
      const transcript =
        dgData.results?.channels?.[0]?.alternatives?.[0]?.transcript ?? "";

      if (!transcript) {
        setError("Couldn't hear anything — please try again.");
        return;
      }

      await sendMessage(transcript);
    } catch (err) {
      setError(`Transcription failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setTranscribing(false);
    }
  }, [recording, transcribing, sending, deepgramKey, startRecording, stopRecording, sendMessage]);

  /* ── Textarea auto-resize ────────────────────────────────────────────────*/

  function handleTextChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setText(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(text);
    }
  }

  /* ── Continue to form ────────────────────────────────────────────────────*/

  function handleContinueToForm() {
    const toStore = { ...formValues };
    if (toStore.date && /^\d{4}-\d{2}-\d{2}$/.test(toStore.date)) {
      toStore.date = isoToOrdinal(toStore.date);
    }
    useFormStore
      .getState()
      .setAllFields(toStore as Partial<Record<FormFieldKey, string>>);
    useFormStore.getState().setEditingTransactionId(null);
    // Hard navigation ensures FormShell re-reads store defaultValues
    window.location.href = "/form";
  }

  const filledCount = Object.keys(formValues).length;

  /* ── Render ──────────────────────────────────────────────────────────────*/

  return (
    <div className="flex h-[calc(100vh-56px)] overflow-hidden">
      {/* ── Sidebar backdrop (mobile) ───────────────────────────────────── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sessions sidebar ─────────────────────────────────────────────── */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 mt-14 flex w-64 flex-col border-r bg-background transition-transform duration-200 md:relative md:mt-0 md:translate-x-0 md:z-auto ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b px-3 py-3">
          <span className="text-sm font-semibold">Conversations</span>
          <Button
            size="icon-sm"
            variant="ghost"
            onClick={startNewChat}
            title="New conversation"
          >
            <FiPlus className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto py-2">
          {sessions.length === 0 ? (
            <p className="px-3 py-4 text-xs text-muted-foreground">No conversations yet</p>
          ) : (
            sessions.map((s) => (
              <div
                key={s._id}
                onClick={() => loadSession(s._id)}
                className={`group flex cursor-pointer items-center gap-2 px-3 py-2 hover:bg-muted/60 ${
                  s._id === sessionId ? "bg-muted" : ""
                }`}
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{s.title}</p>
                  <p className="text-xs text-muted-foreground">{relativeDate(s.updatedAt)}</p>
                </div>
                <button
                  onClick={(e) => deleteSession(s._id, e)}
                  className="hidden shrink-0 rounded p-1 text-muted-foreground hover:text-destructive group-hover:block"
                  title="Delete"
                >
                  <FiTrash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </aside>

      {/* ── Main chat area ────────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Chat header */}
        <div className="flex shrink-0 items-center justify-between border-b px-4 py-2.5">
          <div className="flex items-center gap-2">
            {/* Mobile sidebar toggle */}
            <button
              className="rounded-md p-1.5 text-muted-foreground hover:text-foreground md:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <FiChevronRight className="h-4 w-4 rotate-180" />
            </button>
            <span className="text-sm font-semibold text-foreground">Voice Assistant</span>
            {filledCount > 0 && (
              <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/40 dark:text-green-300">
                {filledCount} fields filled
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {filledCount > 0 && (
              <Button size="sm" className="min-h-[36px]" onClick={handleContinueToForm}>
                Continue to Form →
              </Button>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-3xl px-4 py-6 space-y-4">
            {chatMessages.map((msg, i) =>
              msg.role === "user" ? (
                <div key={i} className="flex justify-end">
                  <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-primary px-4 py-2.5 text-primary-foreground">
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    <p className="mt-1 text-right text-[10px] opacity-60">
                      {formatTime(msg.timestamp)}
                    </p>
                  </div>
                </div>
              ) : (
                <div key={i} className="flex justify-start">
                  <div className="max-w-[80%] space-y-2">
                    <div className="rounded-2xl rounded-tl-sm bg-muted px-4 py-2.5">
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                      <p className="mt-1 text-[10px] text-muted-foreground">
                        {formatTime(msg.timestamp)}
                      </p>
                    </div>
                    {/* Filled field pills */}
                    {msg.filledFields && Object.keys(msg.filledFields).length > 0 && (
                      <div className="flex flex-wrap gap-1.5 px-1">
                        {Object.entries(msg.filledFields).map(([k, v]) => (
                          <span
                            key={k}
                            className="inline-flex items-center gap-1 rounded-full border border-green-200 bg-green-50 px-2 py-0.5 text-xs text-green-700 dark:border-green-800 dark:bg-green-900/30 dark:text-green-300"
                          >
                            <span className="font-medium">{FIELD_LABEL[k] ?? k}:</span>
                            <span className="max-w-[120px] truncate">{v}</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ),
            )}

            {/* Sending indicator */}
            {sending && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-2xl rounded-tl-sm bg-muted px-4 py-3">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
                  <span className="text-sm text-muted-foreground">Thinking…</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mx-4 mb-2 flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            <FiAlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Input bar */}
        <div className="shrink-0 border-t bg-background px-4 py-3">
          <div className="mx-auto flex max-w-3xl items-end gap-2">
            {/* Mic button */}
            <button
              onClick={handleMicClick}
              disabled={!isSupported || sending || transcribing}
              title={recording ? "Stop recording" : "Start voice input"}
              aria-label={recording ? "Stop recording" : "Start voice input"}
              className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                !isSupported || sending
                  ? "cursor-not-allowed opacity-40 bg-muted"
                  : transcribing
                  ? "cursor-wait bg-muted"
                  : recording
                  ? "bg-red-500 text-white hover:bg-red-600 cursor-pointer"
                  : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground cursor-pointer"
              }`}
            >
              {recording && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-60" />
              )}
              {transcribing ? (
                <FiLoader className="h-4 w-4 animate-spin" />
              ) : recording ? (
                <FiMicOff className="relative h-4 w-4" />
              ) : (
                <FiMic className="h-4 w-4" />
              )}
            </button>

            {/* Text input */}
            <textarea
              ref={textareaRef}
              value={text}
              onChange={handleTextChange}
              onKeyDown={handleKeyDown}
              placeholder={
                recording
                  ? "Recording… tap mic to stop"
                  : transcribing
                  ? "Transcribing…"
                  : "Message (Enter to send, Shift+Enter for new line)"
              }
              rows={1}
              disabled={sending || transcribing || recording}
              className="flex-1 resize-none rounded-xl border border-input bg-background px-3 py-2.5 text-sm leading-relaxed text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
              style={{ maxHeight: "160px", overflowY: "auto" }}
            />

            {/* Send button */}
            <button
              onClick={() => sendMessage(text)}
              disabled={!text.trim() || sending || transcribing || recording}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Send"
            >
              <FiSend className="h-4 w-4" />
            </button>
          </div>

          {/* Mic unavailable hint */}
          {!isSupported && (
            <p className="mt-1.5 text-center text-xs text-muted-foreground">
              Microphone unavailable — use HTTPS or a supported browser
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

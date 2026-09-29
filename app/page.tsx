"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Message,
  LeadQualification,
  ChatApiResponse,
  BudgetStatus,
  LeadStatus,
} from "@/lib/types";

/* ─── Quick-Starter Chips ───────────────────────────────────────── */
const STARTER_CHIPS = [
  "Scaling our Meta spend",
  "We have an in-house team",
  "Our CPA doubled recently",
];

/* ─── Helper: derive budget badge ────────────────────────────────── */
function deriveBudgetStatus(spend: string | null): BudgetStatus {
  if (!spend) return "pending";
  const nums = spend.replace(/[^0-9.]/g, "");
  const val = parseFloat(nums);
  if (isNaN(val)) return "pending";
  // Handle "k" shorthand
  const normalized =
    spend.toLowerCase().includes("k") && val < 1000 ? val * 1000 : val;
  if (normalized < 3000) return "disqualified";
  if (normalized >= 5000) return "qualified";
  return "pending";
}

function deriveLeadStatus(
  q: LeadQualification
): LeadStatus {
  if (q.isQualified) return "High-Intent Qualified";
  if (q.estimatedSpend || q.bottleneck) return "Qualifying";
  return "Unqualified";
}

/* ─── WhatsApp double-check SVG ──────────────────────────────────── */
function DoubleCheck({ read }: { read?: boolean }) {
  return (
    <svg
      width="16"
      height="11"
      viewBox="0 0 16 11"
      className={`inline-block ml-1 ${
        read ? "text-blue-400" : "text-gray-400"
      }`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M11.071 0.653L4.714 7.01L2.429 4.725L1 6.154L4.714 9.868L12.5 2.082L11.071 0.653Z"
        fill="currentColor"
      />
      <path
        d="M14.571 0.653L8.214 7.01L7.5 6.296L6.071 7.725L8.214 9.868L16 2.082L14.571 0.653Z"
        fill="currentColor"
      />
    </svg>
  );
}

/* ─── Main Component ─────────────────────────────────────────────── */
export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [qualification, setQualification] = useState<LeadQualification>({
    estimatedSpend: null,
    bottleneck: null,
    isQualified: false,
  });
  const [showBookingCard, setShowBookingCard] = useState(false);
  const [chatStarted, setChatStarted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const sendMessage = useCallback(
    async (content: string, currentMessages: Message[]) => {
      setIsLoading(true);
      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: currentMessages.map((m) => ({
              role: m.role,
              content: m.content,
            })),
          }),
        });

        if (!response.ok) throw new Error("Failed to get response");

        const data: ChatApiResponse = await response.json();

        const assistantMessage: Message = {
          role: "assistant",
          content: data.reply,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, assistantMessage]);

        if (data.leadData) {
          setQualification((prev) => ({
            estimatedSpend:
              data.leadData.estimatedSpend || prev.estimatedSpend,
            bottleneck: data.leadData.bottleneck || prev.bottleneck,
            isQualified: data.leadData.isQualified || prev.isQualified,
          }));
        }

        if (data.showBookingCard) {
          setShowBookingCard(true);
        }
      } catch (error) {
        console.error("Error:", error);
        const errorMessage: Message = {
          role: "assistant",
          content:
            "Hey, give me one sec — small hiccup on my end. Mind trying that again?",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const handleUserInput = useCallback(
    async (input: string) => {
      if (!input.trim() || isLoading) return;

      if (!chatStarted) setChatStarted(true);

      const userMessage: Message = {
        role: "user",
        content: input,
        timestamp: new Date(),
      };
      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);
      await sendMessage(input, updatedMessages);
    },
    [isLoading, chatStarted, messages, sendMessage]
  );

  const budgetStatus = deriveBudgetStatus(qualification.estimatedSpend);
  const leadStatus = deriveLeadStatus(qualification);

  return (
    <div className="h-screen flex bg-slate-900 text-white overflow-hidden">
      {/* ─── Left: Contact Sidebar ─────────────────────────────────── */}
      <aside className="hidden md:flex flex-col w-[340px] border-r border-slate-700/60 bg-slate-800/80">
        {/* Sidebar Header */}
        <div className="px-4 py-3 bg-slate-800 flex items-center justify-between">
          <div className="w-10 h-10 rounded-full bg-slate-600 flex items-center justify-center text-sm font-semibold">
            You
          </div>
          <div className="flex items-center gap-3 text-slate-400">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 20.664a9.012 9.012 0 0 1-4.572-1.243l-.252-.149-2.616.687.698-2.553-.163-.266A9.004 9.004 0 1 1 12 20.664z" /></svg>
          </div>
        </div>

        {/* Search */}
        <div className="px-3 py-2">
          <div className="bg-slate-700/50 rounded-lg flex items-center px-3 py-1.5 gap-2">
            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search or start new chat"
              className="bg-transparent text-sm text-slate-300 placeholder-slate-500 outline-none w-full"
              readOnly
            />
          </div>
        </div>

        {/* Contact Item */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-3 py-3 flex items-center gap-3 bg-slate-700/40 border-l-4 border-emerald-500 cursor-pointer">
            <div className="relative">
              <div className="w-12 h-12 rounded-full bg-emerald-600 flex items-center justify-center text-lg font-bold">
                A
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-slate-800" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-baseline">
                <p className="font-medium truncate">Alex — Growth Partner</p>
                <span className="text-xs text-emerald-400 whitespace-nowrap ml-2">
                  now
                </span>
              </div>
              <p className="text-sm text-slate-400 truncate">
                {messages.length > 0
                  ? messages[messages.length - 1].content.slice(0, 45) + "..."
                  : "Tap to start chatting"}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* ─── Center: Chat Area ─────────────────────────────────────── */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Chat Header */}
        <header className="px-4 py-2.5 bg-slate-800 flex items-center gap-3 border-b border-slate-700/60">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center font-bold">
              A
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-slate-800" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-medium text-[15px] leading-tight">Alex — Growth Partner</h1>
            <p className="text-xs text-emerald-400">online</p>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <svg className="w-5 h-5 cursor-pointer hover:text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <svg className="w-5 h-5 cursor-pointer hover:text-slate-200" fill="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="5" r="1.5" />
              <circle cx="12" cy="12" r="1.5" />
              <circle cx="12" cy="19" r="1.5" />
            </svg>
          </div>
        </header>

        {/* Messages Feed */}
        <div
          className="flex-1 overflow-y-auto px-4 sm:px-12 lg:px-20 py-4 space-y-1.5"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23334155' fill-opacity='0.08'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
            backgroundColor: "#0b141a",
          }}
        >
          {/* Welcome splash if no messages */}
          {!chatStarted && (
            <div className="flex flex-col items-center justify-center h-full text-center gap-4">
              <div className="w-20 h-20 rounded-full bg-emerald-600/20 border-2 border-emerald-500/30 flex items-center justify-center">
                <svg className="w-10 h-10 text-emerald-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-slate-200 mb-1">Hey there 👋</h2>
                <p className="text-sm text-slate-400 max-w-md">
                  I&apos;m Alex, a growth partner for performance brands. Type anything below or tap a quick-start to kick things off.
                </p>
              </div>
            </div>
          )}

          {/* Message Bubbles */}
          {messages.map((message, index) => {
            const isUser = message.role === "user";
            return (
              <div
                key={index}
                className={`flex ${isUser ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`relative max-w-[75%] sm:max-w-[65%] px-3 py-2 rounded-lg text-[14.5px] leading-[19px] shadow-sm ${
                    isUser
                      ? "bg-emerald-700 text-white rounded-tr-none"
                      : "bg-slate-700 text-slate-100 rounded-tl-none"
                  }`}
                >
                  {/* Tail */}
                  <span
                    className={`absolute top-0 w-3 h-3 ${
                      isUser
                        ? "-right-1.5 text-emerald-700"
                        : "-left-1.5 text-slate-700"
                    }`}
                  >
                    <svg viewBox="0 0 8 13" fill="currentColor">
                      {isUser ? (
                        <path d="M5.188 0H0v11.193l6.467-8.625C7.526 1.156 6.958 0 5.188 0z" />
                      ) : (
                        <path d="M2.812 0H8v11.193L1.533 2.568C.474 1.156 1.042 0 2.812 0z" />
                      )}
                    </svg>
                  </span>

                  <p className="whitespace-pre-wrap break-words">{message.content}</p>

                  <span className={`flex items-center justify-end gap-0.5 mt-0.5 text-[11px] ${
                    isUser ? "text-emerald-200/70" : "text-slate-400/70"
                  }`}>
                    {message.timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    {isUser && <DoubleCheck read />}
                  </span>
                </div>
              </div>
            );
          })}

          {/* Booking Card inside chat */}
          {showBookingCard && (
            <div className="flex justify-start">
              <div className="max-w-[75%] sm:max-w-[65%] rounded-lg rounded-tl-none bg-gradient-to-br from-emerald-900/60 to-emerald-800/40 border border-emerald-500/30 p-4 shadow-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h4 className="font-semibold text-emerald-300 text-sm">Book Growth Strategy Call</h4>
                </div>
                <p className="text-[13px] text-slate-300 mb-3 leading-snug">
                  Free 30-min session — we&apos;ll map your scaling roadmap and find quick wins in your account.
                </p>
                <div className="space-y-2">
                  {["Tue, Oct 6 — 10:00 AM", "Wed, Oct 7 — 2:00 PM", "Thu, Oct 8 — 11:00 AM"].map((slot) => (
                    <button
                      key={slot}
                      className="w-full text-left px-3 py-2 rounded-md bg-slate-800/60 hover:bg-emerald-600/30 border border-slate-600/50 hover:border-emerald-500/50 text-sm text-slate-200 transition-colors"
                    >
                      {slot}
                    </button>
                  ))}
                </div>
                <a
                  href="https://calendly.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  Open full calendar
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            </div>
          )}

          {/* Typing indicator */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-slate-700 rounded-lg rounded-tl-none px-4 py-3 shadow-sm">
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* ─── Quick-start chips + Input ────────────────────────────── */}
        <div className="bg-slate-800 border-t border-slate-700/60 px-4 py-2.5">
          {/* Chips — only before first message */}
          {!chatStarted && (
            <div className="flex flex-wrap gap-2 mb-2.5 px-1">
              {STARTER_CHIPS.map((chip) => (
                <button
                  key={chip}
                  onClick={() => handleUserInput(chip)}
                  className="px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-600/15 text-emerald-400 border border-emerald-500/25 hover:bg-emerald-600/25 hover:border-emerald-500/40 transition-colors"
                >
                  {chip}
                </button>
              ))}
            </div>
          )}

          <ChatInput onSend={handleUserInput} disabled={isLoading} />
        </div>
      </main>

      {/* ─── Right: Qualification Tracker ──────────────────────────── */}
      <aside className="hidden lg:flex flex-col w-[280px] border-l border-slate-700/60 bg-slate-800/80">
        <div className="p-4 border-b border-slate-700/60">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Lead Qualification</h2>
        </div>

        <div className="flex-1 p-4 space-y-5 overflow-y-auto">
          {/* Budget Status */}
          <div>
            <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1.5">Budget Status</p>
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                budgetStatus === "qualified"
                  ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                  : budgetStatus === "disqualified"
                  ? "bg-red-500/15 text-red-400 border border-red-500/30"
                  : "bg-slate-600/30 text-slate-400 border border-slate-600/40"
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${
                budgetStatus === "qualified"
                  ? "bg-emerald-400"
                  : budgetStatus === "disqualified"
                  ? "bg-red-400"
                  : "bg-slate-400"
              }`} />
              {budgetStatus === "qualified"
                ? `Qualified ${qualification.estimatedSpend}`
                : budgetStatus === "disqualified"
                ? `Under \$3k — ${qualification.estimatedSpend}`
                : "Pending"}
            </span>
          </div>

          {/* Bottleneck */}
          <div>
            <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1.5">Bottleneck Identified</p>
            {qualification.bottleneck ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/15 text-amber-400 border border-amber-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                {qualification.bottleneck}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-600/30 text-slate-400 border border-slate-600/40">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                Not yet identified
              </span>
            )}
          </div>

          {/* Lead Status */}
          <div>
            <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1.5">Lead Status</p>
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                leadStatus === "High-Intent Qualified"
                  ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                  : leadStatus === "Qualifying"
                  ? "bg-yellow-500/15 text-yellow-400 border border-yellow-500/30"
                  : "bg-slate-600/30 text-slate-400 border border-slate-600/40"
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${
                leadStatus === "High-Intent Qualified"
                  ? "bg-emerald-400 animate-pulse"
                  : leadStatus === "Qualifying"
                  ? "bg-yellow-400"
                  : "bg-slate-400"
              }`} />
              {leadStatus}
            </span>
          </div>

          {/* Divider */}
          <hr className="border-slate-700/60" />

          {/* Raw extracted data */}
          <div>
            <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-2">Extracted Data</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Spend</span>
                <span className="text-slate-300">{qualification.estimatedSpend ?? "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Bottleneck</span>
                <span className="text-slate-300">{qualification.bottleneck ?? "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Qualified</span>
                <span className={qualification.isQualified ? "text-emerald-400" : "text-slate-400"}>
                  {qualification.isQualified ? "Yes" : "No"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Powered by */}
        <div className="p-3 border-t border-slate-700/60 text-center">
          <p className="text-[10px] text-slate-600">Powered by Groq LPU × Llama 3.3</p>
        </div>
      </aside>
    </div>
  );
}

/* ─── Chat Input Component ───────────────────────────────────────── */
function ChatInput({
  onSend,
  disabled,
}: {
  onSend: (message: string) => void;
  disabled: boolean;
}) {
  const [input, setInput] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !disabled) {
      onSend(input);
      setInput("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      {/* Emoji placeholder */}
      <button type="button" className="text-slate-400 hover:text-slate-200 transition-colors">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>

      {/* Attach placeholder */}
      <button type="button" className="text-slate-400 hover:text-slate-200 transition-colors">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
        </svg>
      </button>

      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Type a message"
        className="flex-1 bg-slate-700/50 rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:outline-none placeholder-slate-500"
        disabled={disabled}
      />

      {input.trim() ? (
        <button
          type="submit"
          disabled={disabled}
          className="w-10 h-10 rounded-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 flex items-center justify-center transition-colors"
        >
          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        </button>
      ) : (
        <button type="button" className="w-10 h-10 rounded-full bg-emerald-600/50 flex items-center justify-center text-slate-300">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 15c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v7c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 15 6.7 12H5c0 3.41 2.72 6.23 6 6.72V22h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z" />
          </svg>
        </button>
      )}
    </form>
  );
}
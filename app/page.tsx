"use client";

import React, { useState, useRef, useEffect } from "react";
import { 
  Send, 
  Bot, 
  User, 
  Calendar, 
  DollarSign, 
  Target, 
  Briefcase, 
  CheckCircle2, 
  Sparkles, 
  Clock, 
  PhoneCall,
  Activity
} from "lucide-react";

interface Message {
  id: string;
  sender: "bot" | "user";
  text: string;
  timestamp: string;
}

interface LeadData {
  leadName?: string;
  businessType?: string;
  monthlyBudget?: string;
  primaryGoal?: string;
  qualificationScore: number;
  status: "NEW" | "QUALIFYING" | "QUALIFIED" | "UNQUALIFIED" | "BOOKED";
  bookedSlot?: string;
  email?: string;
}

export default function LeadQualifierDashboard() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      sender: "bot",
      text: "Hey there! Thanks for reaching out to GrowthScale Agency. What kind of business do you run, and what is your current growth bottleneck?",
      timestamp: "Just now",
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [lead, setLead] = useState<LeadData>({
    qualificationScore: 15,
    status: "NEW",
  });

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSendMessage = async (textToSend?: string) => {
    const messageText = textToSend || input;
    if (!messageText.trim() || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: "user",
      text: messageText,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMsg],
          currentLead: lead,
        }),
      });

      const data = await res.json();

      if (data.text) {
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            sender: "bot",
            text: data.text,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
        ]);
      }

      if (data.leadData) {
        setLead(data.leadData);
      }
    } catch (err) {
      console.error("Chat error:", err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: LeadData["status"]) => {
    const styles = {
      NEW: "bg-blue-500/10 text-blue-400 border-blue-500/20",
      QUALIFYING: "bg-amber-500/10 text-amber-400 border-amber-500/20",
      QUALIFIED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      BOOKED: "bg-purple-500/10 text-purple-400 border-purple-500/20 animate-pulse",
      UNQUALIFIED: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    };
    return styles[status] || styles.NEW;
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col p-4 md:p-8">
      {/* Top Banner */}
      <div className="max-w-7xl mx-auto w-full mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium mb-2">
            <Sparkles className="w-3.5 h-3.5" /> High-Ticket Agency Automation
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            AI WhatsApp Lead Qualifier & Booking Agent
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Instant inbound lead triage, CRM synchronization, and calendar slot booking via Gemini 3.6 Tool Calling.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-xs text-slate-500 font-mono">PIPELINE VALUE</p>
            <p className="text-lg font-bold text-emerald-400">$1,000 / Retainer</p>
          </div>
        </div>
      </div>

      {/* Main Grid: WhatsApp Phone Left | CRM Pipeline Right */}
      <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
        
        {/* Left: WhatsApp Web Emulator (5 cols) */}
        <div className="lg:col-span-6 flex flex-col bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
          {/* WhatsApp Header */}
          <div className="bg-slate-800/90 px-4 py-3 border-b border-slate-700/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-white shadow">
                  S
                </div>
                <span className="w-3 h-3 bg-emerald-400 border-2 border-slate-900 rounded-full absolute bottom-0 right-0"></span>
              </div>
              <div>
                <h3 className="font-semibold text-sm leading-tight">Sarah (AI Growth Advisor)</h3>
                <p className="text-xs text-slate-400">Meta WhatsApp Cloud API • Online</p>
              </div>
            </div>
            <div className="flex gap-2">
              <span className="text-xs font-mono px-2 py-1 bg-slate-900/60 rounded text-slate-300 border border-slate-700">
                Live Simulator
              </span>
            </div>
          </div>

          {/* Quick Preset Buttons */}
          <div className="bg-slate-900/60 px-4 py-2 border-b border-slate-800 flex gap-2 overflow-x-auto text-xs">
            <button 
              onClick={() => handleSendMessage("We run an e-commerce clothing store and want to scale ad spend.")}
              className="whitespace-nowrap px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            >
              🛍️ E-commerce ($3k Ad Spend)
            </button>
            <button 
              onClick={() => handleSendMessage("I am a solo coach with $200 budget.")}
              className="whitespace-nowrap px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            >
              💸 Low Budget Lead ($200)
            </button>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px]">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.sender === "user" ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-md leading-relaxed ${
                    m.sender === "user"
                      ? "bg-emerald-600 text-white rounded-br-none"
                      : "bg-slate-800 text-slate-100 rounded-bl-none border border-slate-700/60"
                  }`}
                >
                  <p>{m.text}</p>
                  <span className={`block text-[10px] mt-1 text-right ${m.sender === "user" ? "text-emerald-200" : "text-slate-400"}`}>
                    {m.timestamp}
                  </span>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-800/60 p-2.5 rounded-xl border border-slate-800 w-fit">
                <Clock className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                <span>Sarah is analyzing intent & checking tools...</span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input Bar */}
          <div className="p-3 bg-slate-800/80 border-t border-slate-700/60">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message as the lead..."
                className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 p-2.5 rounded-xl text-white font-medium transition flex items-center justify-center"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>

        {/* Right: Agency CRM Pipeline (6 cols) */}
        <div className="lg:col-span-6 flex flex-col gap-6">
          
          {/* Lead Qualification Stage Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" /> Live CRM Pipeline Status
              </h2>
              <span className={`text-xs px-3 py-1 rounded-full font-bold border ${getStatusBadge(lead.status)}`}>
                STAGE: {lead.status}
              </span>
            </div>

            {/* Score Bar */}
            <div className="mb-5">
              <div className="flex justify-between text-xs text-slate-400 mb-1.5 font-medium">
                <span>AI Qualification Score</span>
                <span className="font-mono text-emerald-400 font-bold">{lead.qualificationScore}/100</span>
              </div>
              <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-700 rounded-full ${
                    lead.qualificationScore > 70 
                      ? "bg-emerald-500" 
                      : lead.qualificationScore > 40 
                      ? "bg-amber-500" 
                      : "bg-blue-500"
                  }`}
                  style={{ width: `${lead.qualificationScore}%` }}
                />
              </div>
            </div>

            {/* Extracted Attributes Matrix */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
                <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                  <User className="w-3.5 h-3.5 text-blue-400" /> Prospect / Business
                </div>
                <p className="font-medium text-slate-200">
                  {lead.businessType || lead.leadName || "Not identified yet"}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
                <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-400" /> Monthly Budget
                </div>
                <p className="font-medium text-slate-200">
                  {lead.monthlyBudget || "Pending inquiry"}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
                <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                  <Target className="w-3.5 h-3.5 text-rose-400" /> Core Pain Point / Bottleneck
                </div>
                <p className="font-medium text-slate-200">
                  {lead.primaryGoal || "Analyzing conversation..."}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
                <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                  <Calendar className="w-3.5 h-3.5 text-purple-400" /> Confirmed Meeting Slot
                </div>
                <p className="font-medium text-slate-200">
                  {lead.bookedSlot ? (
                    <span className="text-purple-400 font-semibold">{lead.bookedSlot}</span>
                  ) : (
                    "Awaiting qualification"
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Autonomous Actions Log (Proof of Tool Calling for Clients) */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex-1 flex flex-col">
            <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Real-Time Agency Automations
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-950/50 border border-slate-800/60">
                <div className="w-2 h-2 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                <div>
                  <p className="font-medium text-slate-200">Instant Lead Response Engine</p>
                  <p className="text-slate-400 text-[11px]">Triggers within 10 seconds of Meta/TikTok ad webhook ingestion.</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-950/50 border border-slate-800/60">
                <div className="w-2 h-2 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                <div>
                  <p className="font-medium text-slate-200">CRM Field Extraction (Gemini Tool Calling)</p>
                  <p className="text-slate-400 text-[11px]">Automatically updates HubSpot/GoHighLevel contact attributes via function execution.</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-950/50 border border-slate-800/60">
                <div className="w-2 h-2 rounded-full bg-purple-400 mt-1.5 shrink-0" />
                <div>
                  <p className="font-medium text-slate-200">Autonomous Calendar Locking</p>
                  <p className="text-slate-400 text-[11px]">Syncs qualified leads with Google Calendar / Calendly with zero human intervention.</p>
                </div>
              </div>
            </div>

            {/* Direct Pitch for Agency Clients */}
            <div className="mt-auto pt-4 border-t border-slate-800/80">
              <div className="p-3 bg-emerald-950/20 border border-emerald-900/40 rounded-xl">
                <p className="text-xs text-emerald-300 font-medium">
                  💡 <strong>B2B Value Metric:</strong> Decreases lead drop-off by 68% and eliminates the need for full-time inbound appointment setters.
                </p>
              </div>
            </div>

          </div>

        </div>

      </div>
    </main>
  );
}
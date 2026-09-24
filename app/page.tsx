"use client";

import React, { useState } from "react";
import { 
  Send, 
  Bot, 
  User, 
  CheckCircle2, 
  Calendar, 
  DollarSign, 
  AlertCircle, 
  Sparkles, 
  RefreshCw,
  Zap,
  Building2
} from "lucide-react";

interface Message {
  role: "assistant" | "user";
  text: string;
}

interface CRMData {
  score: number;
  stage: string;
  business: string;
  budget: string;
  bottleneck: string;
  meetingSlot: string;
}

const PRESET_HIGH = "We run an e-commerce clothing store doing $40k/month and want to scale ad spend profitably.";
const PRESET_LOW = "I just started dropshipping yesterday and have $200 total budget. Can you help me?";

export default function WhatsAppQualifierPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      text: "Hey there! Thanks for reaching out to GrowthScale Agency. What kind of business do you run, and what is your current growth bottleneck?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const [crm, setCrm] = useState<CRMData>({
    score: 15,
    stage: "NEW",
    business: "Not identified yet",
    budget: "Pending inquiry",
    bottleneck: "Analyzing conversation...",
    meetingSlot: "Awaiting qualification",
  });

  const sendMessage = async (messageText?: string) => {
    const textToSend = messageText || input;
    if (!textToSend.trim() || loading) return;

    const newMessages: Message[] = [...messages, { role: "user", text: textToSend }];
    setMessages(newMessages);
    if (!messageText) setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend,
          messages: newMessages.map((m) => ({
            role: m.role,
            content: m.text,
          })),
        }),
      });

      const data = await res.json();

      if (res.ok) {
        const replyText =
          data.reply ||
          data.message ||
          data.response ||
          "Thanks for sharing! Let me evaluate your requirements.";

        setMessages((prev) => [...prev, { role: "assistant", text: replyText }]);

        // Live CRM Update
        if (data.crm || data.qualificationScore) {
          setCrm({
            score: data.crm?.score || data.qualificationScore || 75,
            stage: data.crm?.stage || data.stage || "QUALIFIED",
            business: data.crm?.business || data.business || "Identified Prospect",
            budget: data.crm?.budget || data.budget || "$3k - $5k / Mo",
            bottleneck: data.crm?.bottleneck || data.bottleneck || "Scaling Ad Spend",
            meetingSlot: data.crm?.meetingSlot || data.meetingSlot || "Offered Booking Link",
          });
        }
      } else {
        alert("Server Error: " + (data.error || "Failed to generate reply"));
      }
    } catch (err: any) {
      console.error(err);
      alert("Network Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8 border-b border-slate-800 pb-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium mb-2">
            <Sparkles className="w-3.5 h-3.5" /> High-Ticket Agency Automation #3
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            AI WhatsApp Lead Qualifier & Booking Agent
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Instant inbound lead triage, CRM synchronization, and calendar slot booking via Groq LPU Engine.
          </p>
        </div>

        <div className="text-right">
          <p className="text-xs text-slate-500 font-mono">PIPELINE VALUE</p>
          <p className="text-lg font-bold text-emerald-400">$1,000 / Retainer</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: WhatsApp Chat Simulator */}
        <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[650px]">
          {/* Chat Header */}
          <div className="bg-slate-950/80 px-5 py-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center font-bold text-slate-950 shadow-md shadow-emerald-500/20">
                S
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-1.5">
                  Sarah (AI Growth Advisor)
                </h3>
                <p className="text-[11px] text-emerald-400 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  Meta WhatsApp Cloud API • Online
                </p>
              </div>
            </div>
            <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
              Live Simulator
            </span>
          </div>

          {/* Quick Preset Buttons */}
          <div className="bg-slate-950/40 px-4 py-2 border-b border-slate-800/80 flex items-center gap-2 overflow-x-auto text-[11px]">
            <span className="text-slate-500 text-[10px] font-mono whitespace-nowrap">Presets:</span>
            <button
              onClick={() => sendMessage(PRESET_HIGH)}
              disabled={loading}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-300 rounded-lg border border-slate-700 whitespace-nowrap transition disabled:opacity-50"
            >
              ⚡ E-commerce ($5k Ad Spend)
            </button>
            <button
              onClick={() => sendMessage(PRESET_LOW)}
              disabled={loading}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-lg border border-slate-700 whitespace-nowrap transition disabled:opacity-50"
            >
              ⭐ Low Budget Lead ($200)
            </button>
          </div>

          {/* Message List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-950/20">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[82%] rounded-2xl px-4 py-3 text-xs leading-relaxed shadow ${
                    m.role === "user"
                      ? "bg-emerald-600 text-slate-950 font-medium rounded-br-none"
                      : "bg-slate-800/90 text-slate-200 border border-slate-700/60 rounded-bl-none"
                  }`}
                >
                  <p>{m.text}</p>
                  <span className={`text-[9px] mt-1.5 block text-right font-mono ${m.role === "user" ? "text-emerald-950/70" : "text-slate-400"}`}>
                    Just now
                  </span>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-slate-800 border border-slate-700/60 text-slate-400 rounded-2xl px-4 py-2.5 text-xs flex items-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                  Sarah is typing via Groq...
                </div>
              </div>
            )}
          </div>

          {/* Message Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
            className="p-3 bg-slate-950/80 border-t border-slate-800 flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message as the lead..."
              className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-slate-950 p-2.5 rounded-xl transition"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Right Column: Live CRM Pipeline Status */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-sm font-semibold flex items-center gap-2 text-slate-200">
                <Zap className="w-4 h-4 text-emerald-400" /> Live CRM Pipeline Status
              </h2>
              <span className={`text-[10px] font-mono px-2.5 py-1 rounded-full font-bold border ${
                crm.stage === "QUALIFIED"
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                  : "bg-cyan-500/10 text-cyan-400 border-cyan-500/30"
              }`}>
                STAGE: {crm.stage}
              </span>
            </div>

            {/* AI Qualification Score */}
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-slate-400 font-mono text-[11px]">AI Qualification Score</span>
                <span className="font-bold font-mono text-emerald-400">{crm.score}/100</span>
              </div>
              <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-500"
                  style={{ width: `${crm.score}%` }}
                ></div>
              </div>
            </div>

            {/* 4 CRM Data Boxes */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-950/70 border border-slate-800/80 p-3.5 rounded-2xl">
                <span className="text-[10px] uppercase font-mono text-slate-500 flex items-center gap-1 mb-1">
                  <Building2 className="w-3 h-3 text-cyan-400" /> Prospect / Business
                </span>
                <p className="font-semibold text-slate-200 truncate">{crm.business}</p>
              </div>

              <div className="bg-slate-950/70 border border-slate-800/80 p-3.5 rounded-2xl">
                <span className="text-[10px] uppercase font-mono text-slate-500 flex items-center gap-1 mb-1">
                  <DollarSign className="w-3 h-3 text-emerald-400" /> Monthly Budget
                </span>
                <p className="font-semibold text-emerald-400 truncate">{crm.budget}</p>
              </div>

              <div className="bg-slate-950/70 border border-slate-800/80 p-3.5 rounded-2xl">
                <span className="text-[10px] uppercase font-mono text-slate-500 flex items-center gap-1 mb-1">
                  <AlertCircle className="w-3 h-3 text-rose-400" /> Core Bottleneck
                </span>
                <p className="font-semibold text-slate-300 truncate">{crm.bottleneck}</p>
              </div>

              <div className="bg-slate-950/70 border border-slate-800/80 p-3.5 rounded-2xl">
                <span className="text-[10px] uppercase font-mono text-slate-500 flex items-center gap-1 mb-1">
                  <Calendar className="w-3 h-3 text-violet-400" /> Confirmed Meeting Slot
                </span>
                <p className="font-semibold text-slate-300 truncate">{crm.meetingSlot}</p>
              </div>
            </div>
          </div>

          {/* Agency Automations Information */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <h3 className="text-xs font-semibold text-slate-200 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Real-Time Agency Automations
            </h3>

            <div className="space-y-3 text-xs text-slate-400">
              <div className="flex items-start gap-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5"></div>
                <div>
                  <strong className="text-slate-300">Instant Lead Response Engine:</strong>
                  <p className="text-[11px] text-slate-500">Triggers within 10 seconds of Meta/TikTok ad webhook ingestion.</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5"></div>
                <div>
                  <strong className="text-slate-300">CRM Field Extraction (Groq LPU Engine):</strong>
                  <p className="text-[11px] text-slate-500">Automatically parses and updates contact attributes with zero human intervention.</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-violet-400 mt-1.5"></div>
                <div>
                  <strong className="text-slate-300">Autonomous Calendar Locking:</strong>
                  <p className="text-[11px] text-slate-500">Syncs qualified leads with Google Calendar / Calendly instantly.</p>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800/80">
              <p className="text-[11px] text-slate-400 font-mono">
                💡 <span className="text-slate-300 font-semibold">B2B Value Metric:</span> Decreases lead drop-off by 68% and eliminates the need for full-time inbound appointment setters.
              </p>
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}
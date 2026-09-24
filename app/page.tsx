"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Send, 
  Sparkles, 
  RefreshCw,
  Zap,
  Building2,
  DollarSign,
  AlertCircle,
  Calendar,
  CheckCircle2,
  Phone,
  PhoneCall,
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  Radio
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

export default function WhatsAppVoiceQualifierPage() {
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

  // Voice Call Modal States
  const [isCalling, setIsCalling] = useState(false);
  const [callStatus, setCallStatus] = useState<"connecting" | "connected" | "ended">("connecting");
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState<string>("Connecting to Sarah via Groq Voice Bridge...");
  const [aiSpeaking, setAiSpeaking] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const recognitionRef = useRef<any>(null);

  // Call duration counter
  useEffect(() => {
    if (callStatus === "connected") {
      timerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setCallDuration(0);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [callStatus]);

  // Text-To-Speech helper for Sarah
  const speakSarahResponse = (text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;
    
    // Choose female voice if available
    const voices = window.speechSynthesis.getVoices();
    const femaleVoice = voices.find(
      (v) =>
        v.name.includes("Female") ||
        v.name.includes("Google UK English Female") ||
        v.name.includes("Samantha") ||
        v.name.includes("Zira")
    );
    if (femaleVoice) utterance.voice = femaleVoice;

    setAiSpeaking(true);
    utterance.onend = () => setAiSpeaking(false);
    utterance.onerror = () => setAiSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  // Start Call Handler
  const startVoiceCall = () => {
    setIsCalling(true);
    setCallStatus("connecting");
    setVoiceTranscript("Dialing GrowthScale Agency Voice Bridge...");

    setTimeout(() => {
      setCallStatus("connected");
      const intro = "Hi, this is Sarah from GrowthScale! I saw you reached out on WhatsApp. Could you quickly tell me about your store's monthly ad spend and main scaling blocker?";
      setVoiceTranscript(`Sarah: "${intro}"`);
      speakSarahResponse(intro);
    }, 1500);
  };

  // End Call Handler
  const endVoiceCall = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setCallStatus("ended");
    setAiSpeaking(false);
    setIsListening(false);
    setTimeout(() => {
      setIsCalling(false);
    }, 700);
  };

  // Speech Recognition (Voice Mic)
  const toggleSpeechRecognition = () => {
    if (typeof window === "undefined") return;
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech Recognition is not supported by your browser. You can click on the quick voice buttons below!");
      return;
    }

    if (isListening) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = "en-US";
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
        setVoiceTranscript("Listening to your voice... Speak now.");
      };

      recognition.onresult = (event: any) => {
        const spokenText = event.results[0][0].transcript;
        setIsListening(false);
        handleVoiceDialogue(spokenText);
      };

      recognition.onerror = (err: any) => {
        console.error("Speech recognition error:", err);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e: any) {
      console.error(e);
      setIsListening(false);
    }
  };

  // Handle Spoken Dialogue through Groq API
  const handleVoiceDialogue = async (userVoiceText: string) => {
    setVoiceTranscript(`You: "${userVoiceText}"`);
    const newMessages: Message[] = [...messages, { role: "user", text: `[VOICE CALL] ${userVoiceText}` }];
    setMessages(newMessages);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userVoiceText,
          messages: newMessages.map((m) => ({
            role: m.role,
            content: m.text,
          })),
        }),
      });

      const data = await res.json();
      if (res.ok) {
        const reply = data.reply || data.message || "Got that! Let's lock in a calendar slot.";
        setVoiceTranscript(`Sarah: "${reply}"`);
        setMessages((prev) => [...prev, { role: "assistant", text: `[VOICE CALL] ${reply}` }]);
        speakSarahResponse(reply);

        if (data.crm || data.qualificationScore) {
          setCrm({
            score: data.crm?.score || data.qualificationScore || 85,
            stage: data.crm?.stage || "CALL_QUALIFIED",
            business: data.crm?.business || "Voice Verified Prospect",
            budget: data.crm?.budget || "$5,000+ / Mo",
            bottleneck: data.crm?.bottleneck || "Scaling Customer Acquisition",
            meetingSlot: "Locked for Tomorrow 3:00 PM EST",
          });
        }
      }
    } catch (err: any) {
      console.error(err);
      setVoiceTranscript("Voice processing failed. Please try again.");
    }
  };

  // Standard Text Chat Handler
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

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 relative overflow-x-hidden">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8 border-b border-slate-800 pb-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium mb-2">
            <Sparkles className="w-3.5 h-3.5" /> High-Ticket Agency Automation #3
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            AI WhatsApp & Voice Call Qualification Setter
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Omni-channel inbound triage via WhatsApp Cloud API & real-time Groq LPU Voice Calling Agent.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={startVoiceCall}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition transform active:scale-95"
          >
            <PhoneCall className="w-4 h-4 animate-bounce" />
            <span>Launch Live Voice Call</span>
          </button>
          <div className="text-right pl-4 border-l border-slate-800">
            <p className="text-xs text-slate-500 font-mono">RETAINER VALUE</p>
            <p className="text-lg font-bold text-emerald-400">$2,500 / Month</p>
          </div>
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

            <div className="flex items-center gap-2">
              <button
                onClick={startVoiceCall}
                title="Call Sarah"
                className="p-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-full border border-emerald-500/30 transition"
              >
                <Phone className="w-4 h-4" />
              </button>
              <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                Chat & Voice
              </span>
            </div>
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
                  Sarah is qualifying via Groq...
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
              placeholder="Type WhatsApp message as the prospect..."
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
                crm.stage.includes("QUALIFIED")
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

          {/* Autonomous Agency Automations Box */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <h3 className="text-xs font-semibold text-slate-200 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Real-Time Agency Automations
            </h3>

            <div className="space-y-3 text-xs text-slate-400">
              <div className="flex items-start gap-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5"></div>
                <div>
                  <strong className="text-slate-300">Autonomous WhatsApp & Inbound Calling Engine:</strong>
                  <p className="text-[11px] text-slate-500">Triggers outbound AI phone call within 60s if WhatsApp lead goes cold.</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5"></div>
                <div>
                  <strong className="text-slate-300">Real-Time BANT Voice Triage (Groq LPU):</strong>
                  <p className="text-[11px] text-slate-500">Handles live sales objections in under 400ms without robotic latency.</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-violet-400 mt-1.5"></div>
                <div>
                  <strong className="text-slate-300">HubSpot / GoHighLevel Two-Way Booking:</strong>
                  <p className="text-[11px] text-slate-500">Autonomous slot reservation directly placed into executive calendar.</p>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800/80">
              <p className="text-[11px] text-slate-400 font-mono">
                💡 <span className="text-slate-300 font-semibold">Agency Retention Metric:</span> Converts 4.2x more cold inbound ad traffic into paid client discovery calls compared to traditional static lead forms.
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* FULLSCREEN REALISTIC WHATSAPP AUDIO CALL MODAL */}
      {isCalling && (
        <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col items-center justify-between min-h-[580px] relative overflow-hidden">
            
            {/* Top WhatsApp Call Header */}
            <div className="text-center space-y-1">
              <div className="inline-flex items-center gap-1.5 text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                <Radio className="w-3 h-3 animate-pulse" />
                {callStatus === "connecting" ? "WHATSAPP AUDIO CALL..." : "SECURE GROQ VOICE BRIDGE"}
              </div>
              <h2 className="text-lg font-bold text-slate-100">Sarah (AI Growth Advisor)</h2>
              <p className="text-xs font-mono text-slate-400">
                {callStatus === "connected" ? formatTimer(callDuration) : "Connecting..."}
              </p>
            </div>

            {/* Pulsating Radar Avatar */}
            <div className="my-6 relative flex items-center justify-center">
              {aiSpeaking && (
                <>
                  <div className="absolute w-36 h-36 rounded-full bg-emerald-500/20 animate-ping"></div>
                  <div className="absolute w-48 h-48 rounded-full bg-emerald-500/10 animate-pulse"></div>
                </>
              )}
              <div className="w-28 h-28 rounded-full bg-emerald-500 text-slate-950 font-black text-4xl flex items-center justify-center shadow-2xl border-4 border-slate-800 relative z-10">
                S
              </div>
            </div>

            {/* Dynamic Sound Wave Visualizer */}
            <div className="flex items-center gap-1.5 h-8">
              {[40, 70, 90, 45, 80, 100, 60, 30, 85, 50, 95, 40].map((h, i) => (
                <div
                  key={i}
                  className={`w-1 rounded-full transition-all duration-300 ${
                    aiSpeaking
                      ? "bg-emerald-400 animate-pulse"
                      : isListening
                      ? "bg-cyan-400 animate-bounce"
                      : "bg-slate-700 h-2"
                  }`}
                  style={{
                    height: aiSpeaking || isListening ? `${(h * Math.random() + 20).toFixed(0)}%` : "6px",
                  }}
                ></div>
              ))}
            </div>

            {/* Spoken Dialogue Transcript Box */}
            <div className="w-full bg-slate-950/80 border border-slate-800/80 rounded-2xl p-3 my-4 text-center">
              <p className="text-xs text-slate-300 italic leading-relaxed line-clamp-3">
                {voiceTranscript}
              </p>
            </div>

            {/* Quick Demo Spoken Pills */}
            <div className="w-full space-y-2 mb-4">
              <p className="text-[10px] text-center text-slate-500 font-mono">
                Click to speak / test objection handling:
              </p>
              <div className="flex gap-2 justify-center flex-wrap">
                <button
                  onClick={() => handleVoiceDialogue("We are spending $8,000 monthly on Meta ads but our CPA is too high.")}
                  className="px-2.5 py-1 text-[10px] rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 transition"
                >
                  🗣️ "$8k Ad Spend / High CPA"
                </button>
                <button
                  onClick={() => handleVoiceDialogue("Sounds great, what time can we book a strategy call?")}
                  className="px-2.5 py-1 text-[10px] rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 transition"
                >
                  📅 "Book 15-Min Strategy Call"
                </button>
              </div>
            </div>

            {/* Call Control Action Bar */}
            <div className="flex items-center gap-5">
              <button
                onClick={toggleSpeechRecognition}
                className={`p-4 rounded-full border transition transform active:scale-90 ${
                  isListening
                    ? "bg-cyan-500 text-slate-950 border-cyan-400 animate-pulse shadow-lg shadow-cyan-500/30"
                    : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"
                }`}
                title="Speak into microphone"
              >
                {isListening ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
              </button>

              <button
                onClick={endVoiceCall}
                className="p-5 rounded-full bg-rose-600 hover:bg-rose-500 text-white shadow-xl shadow-rose-600/30 transition transform active:scale-90"
                title="End Call"
              >
                <PhoneOff className="w-6 h-6" />
              </button>

              <button
                onClick={() => {
                  setIsMuted(!isMuted);
                  if (typeof window !== "undefined" && "speechSynthesis" in window) {
                    window.speechSynthesis.cancel();
                  }
                }}
                className={`p-4 rounded-full border transition ${
                  isMuted
                    ? "bg-rose-500/20 text-rose-400 border-rose-500/30"
                    : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"
                }`}
                title="Toggle Mute"
              >
                <Volume2 className="w-5 h-5" />
              </button>
            </div>

          </div>
        </div>
      )}

    </main>
  );
}
import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

export const dynamic = "force-dynamic";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || "",
});

// Groq ke live account se automatically active chat model dhoondne ka bulletproof function
async function getActiveChatModel(): Promise<string> {
  try {
    const modelList = await groq.models.list();
    const availableIds = modelList.data.map((m) => m.id);
    
    // Non-chat models ko filter out karein
    const chatOnly = availableIds.filter(
      (id) =>
        !id.includes("whisper") &&
        !id.includes("guard") &&
        !id.includes("vision") &&
        !id.includes("audio") &&
        !id.includes("safeguard")
    );

    // Best chat model priority
    const matched =
      chatOnly.find((id) => id.includes("llama-3.3-70b")) ||
      chatOnly.find((id) => id.includes("llama-3.1-70b")) ||
      chatOnly.find((id) => id.includes("llama3-70b")) ||
      chatOnly.find((id) => id.includes("llama-3.1-8b")) ||
      chatOnly.find((id) => id.includes("llama3-8b")) ||
      chatOnly.find((id) => id.includes("mixtral")) ||
      chatOnly[0];

    if (matched) {
      console.log("Successfully resolved Groq chat model:", matched);
      return matched;
    }
  } catch (e) {
    console.warn("Could not list Groq models, falling back to default:", e);
  }
  return "llama3-8b-8192";
}

const SYSTEM_PROMPT = `You are Alex, an elite direct-response growth partner at a top performance marketing agency.
Your goal is to qualify inbound leads naturally via WhatsApp conversation and address objections without being pushy.

RULES:
1. Speak like a sharp, friendly, human media buyer (1-2 sentences max).
2. MULTILINGUAL & CASUAL: Understand English, Roman Urdu, and casual phrasing (e.g. if user says "shoaib hai mera naam", greet Shoaib warmly; if they say "budget 6k", acknowledge $6k/month; if they say "nhi krwana", be polite and courteous).
3. NEVER repeat a question you already asked. If the lead mentioned their spend or name, acknowledge it naturally.
4. DYNAMIC OBJECTION HANDLING:
   - If user says they have an in-house media buyer or team:
     Respect their setup. Explain that you partner alongside internal buyers—handling rapid UGC testing and creative fatigue so their team can focus on media buying. Offer a zero-risk 15-min audit of their creative drop-off.
   - If they say they are not looking for an agency:
     Keep it zero pressure. Frame it as a peer-to-peer strategy session.
5. If qualified ($5k+ spend and bottleneck identified), set "showBookingCard": true.

OUTPUT FORMAT:
Respond ONLY with a valid raw JSON object matching this schema (no markdown, no backticks):
{
  "reply": "Your WhatsApp text response",
  "leadData": {
    "estimatedSpend": string | null,
    "bottleneck": string | null,
    "isQualified": boolean
  },
  "showBookingCard": boolean
}`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawMessages = body.messages || [];

    // Sanitize messages so Groq never throws 400 on extra UI fields
    const cleanMessages = rawMessages
      .filter((m: any) => m && m.content)
      .map((m: any) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: String(m.content),
      }));

    const fullMessages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...cleanMessages,
    ];

    // Automatically resolve the exact available model on this Groq account
    const activeModel = await getActiveChatModel();

    const completion = await groq.chat.completions.create({
      model: activeModel,
      messages: fullMessages as any,
      temperature: 0.7,
      response_format: { type: "json_object" },
    });

    const rawContent = completion.choices[0]?.message?.content || "{}";
    const cleaned = rawContent.replace(/```json/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    return NextResponse.json(parsed);
  } catch (err: any) {
    console.error("Groq Chat Error:", err);
    return NextResponse.json({
      reply: "Hey! What is your current monthly ad spend and the main bottleneck you are facing right now?",
      leadData: {
        estimatedSpend: null,
        bottleneck: null,
        isQualified: false,
      },
      showBookingCard: false,
    });
  }
}
import { NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || "",
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message, messages, conversationHistory } = body;

    const systemPrompt = `You are a high-performing WhatsApp AI Sales Assistant and Lead Qualifier for a premier B2B Marketing Agency.
Guidelines:
1. Converse naturally like an authentic human sales development rep on WhatsApp (concise, conversational, professional yet warm).
2. Keep replies short (maximum 2 to 3 sentences), exactly like a real person chatting on WhatsApp. Never write huge corporate paragraphs.
3. Subtly qualify the lead on BANT (Budget, Need, Timeline, Authority).
4. If the lead is qualified (ad spend / budget > $1,500/mo or urgent growth bottleneck), suggest booking a quick 15-minute strategy call.`;

    let formattedMessages: any[] = [{ role: "system", content: systemPrompt }];

    if (Array.isArray(messages) && messages.length > 0) {
      formattedMessages = [
        { role: "system", content: systemPrompt },
        ...messages.map((m: any) => ({
          role: m.role === "assistant" || m.role === "bot" ? "assistant" : "user",
          content: m.content || m.text || "",
        })),
      ];
    } else if (Array.isArray(conversationHistory) && conversationHistory.length > 0) {
      formattedMessages = [
        { role: "system", content: systemPrompt },
        ...conversationHistory.map((m: any) => ({
          role: m.sender === "bot" || m.role === "assistant" ? "assistant" : "user",
          content: m.text || m.content || "",
        })),
        ...(message ? [{ role: "user", content: message }] : []),
      ];
    } else if (message) {
      formattedMessages.push({ role: "user", content: message });
    }

    // Dynamic model selection to bypass deprecations
    const modelListRes = await groq.models.list();
    const candidateIds = modelListRes.data
      .map((m: any) => m.id)
      .filter((id: string) => {
        const lower = id.toLowerCase();
        return (
          !lower.includes("whisper") &&
          !lower.includes("guard") &&
          !lower.includes("vision") &&
          !lower.includes("safeguard") &&
          !lower.includes("canopy") &&
          !lower.includes("orpheus") &&
          !lower.includes("tts") &&
          !lower.includes("audio")
        );
      });

    const priorityList = [
      "llama-3.1-8b-instant",
      "llama-3.3-70b-versatile",
      "llama-3.2-3b-preview",
      ...candidateIds,
    ];

    const availableToTry = Array.from(
      new Set(priorityList.filter((p) => candidateIds.includes(p)))
    );

    let completion = null;
    let lastError: any = null;

    for (const model of availableToTry) {
      try {
        completion = await groq.chat.completions.create({
          messages: formattedMessages,
          model: model,
          temperature: 0.6,
          max_tokens: 500,
        });

        if (completion?.choices[0]?.message?.content) {
          break;
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`Groq model ${model} failed, trying next candidate...`);
      }
    }

    const replyText = completion?.choices[0]?.message?.content || "";
    if (!replyText) {
      throw lastError || new Error("No response generated from Groq.");
    }

    return NextResponse.json({
      reply: replyText,
      message: replyText,
      response: replyText,
      content: replyText,
    });
  } catch (error: any) {
    console.error("WhatsApp AI Qualifier Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process chat message" },
      { status: 500 }
    );
  }
}
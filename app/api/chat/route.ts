import { NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || "",
});

function cleanAndParseJSON(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    const firstBrace = text.indexOf("{");
    const lastBrace = text.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1) {
      return JSON.parse(text.substring(firstBrace, lastBrace + 1));
    }
    throw new Error("Could not parse JSON from AI response.");
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message, messages, conversationHistory } = body;

    const latestUserMsg =
      message ||
      (Array.isArray(messages) && messages[messages.length - 1]?.content) ||
      "Hi";

    const systemPrompt = `You are Sarah, an elite WhatsApp AI Growth Advisor & Lead Qualification Setter for GrowthScale Agency.
Always respond strictly in valid JSON with this exact schema:
{
  "reply": "Your punchy conversational WhatsApp response (2-3 short, natural sentences, friendly tone, qualifying ad spend or proposing a quick call).",
  "qualificationScore": 75,
  "stage": "QUALIFIED",
  "business": "E-Commerce Clothing Store",
  "budget": "$3,000 - $5,000 / Mo",
  "bottleneck": "Scale Ad Spend profitably",
  "meetingSlot": "Booking Link Offered"
}`;

    const userPrompt = `Prospect WhatsApp Message: "${latestUserMsg}"
Conversation Context: ${JSON.stringify(messages || conversationHistory || latestUserMsg)}

Qualify this prospect and update the live CRM record. Return strictly raw JSON.`;

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
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          model: model,
          temperature: 0.3,
          max_tokens: 1024,
          response_format: { type: "json_object" },
        });

        if (completion?.choices[0]?.message?.content) {
          break;
        }
      } catch (err: any) {
        lastError = err;
      }
    }

    const responseContent = completion?.choices[0]?.message?.content || "";
    if (!responseContent) {
      throw lastError || new Error("No response from Groq models");
    }

    const data = cleanAndParseJSON(responseContent);

    return NextResponse.json({
      reply: data.reply,
      message: data.reply,
      qualificationScore: data.qualificationScore || 70,
      stage: data.stage || "DISCOVERY",
      business: data.business || "Identified Prospect",
      budget: data.budget || "Pending Inquiry",
      bottleneck: data.bottleneck || "Scaling Acquisition",
      meetingSlot: data.meetingSlot || "Awaiting Qualification",
      crm: {
        score: data.qualificationScore || 70,
        stage: data.stage || "DISCOVERY",
        business: data.business || "Identified Prospect",
        budget: data.budget || "Pending Inquiry",
        bottleneck: data.bottleneck || "Scaling Acquisition",
        meetingSlot: data.meetingSlot || "Awaiting Qualification",
      }
    });
  } catch (error: any) {
    console.error("WhatsApp AI Route Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process chat message" },
      { status: 500 }
    );
  }
}
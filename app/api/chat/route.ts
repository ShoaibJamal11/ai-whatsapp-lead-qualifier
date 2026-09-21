import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({
  model: "gemini-3.6-flash",
  generationConfig: {
    responseMimeType: "application/json",
  },
  systemInstruction: `You are 'Sarah', a high-converting, empathetic, and professional AI Business Growth Advisor for a premium Growth Marketing Agency on WhatsApp.
Your goal:
1. Converse naturally in 1-2 punchy, conversational sentences like a real human on WhatsApp. Never sound like a robotic script.
2. Inquire about their business, current growth bottleneck, and monthly ad budget.
3. If their monthly budget is $1,000+ or they show high intent:
   - Mark status as 'QUALIFIED'
   - Set qualificationScore between 75 and 90
   - Offer these specific slots: "Tomorrow at 11:00 AM PKT" or "Tomorrow at 3:00 PM PKT" for a 15-min discovery call.
4. If they agree to a slot (or give their email/confirmation):
   - Mark status as 'BOOKED'
   - Set qualificationScore to 100
   - Set bookedSlot to the chosen time
   - Confirm enthusiastically!
5. If their budget is under $500:
   - Mark status as 'UNQUALIFIED'
   - Set qualificationScore to 25
   - Politely point them to free agency audit resources.

You MUST respond strictly in valid JSON matching this schema:
{
  "reply": "Sarah's WhatsApp message to the prospect",
  "leadData": {
    "leadName": "Prospect name if mentioned, otherwise null",
    "businessType": "Business niche/type if mentioned, otherwise null",
    "monthlyBudget": "Ad budget mentioned e.g. $2,500/mo, otherwise null",
    "primaryGoal": "Core bottleneck or goal, otherwise null",
    "qualificationScore": 85,
    "status": "NEW" | "QUALIFYING" | "QUALIFIED" | "UNQUALIFIED" | "BOOKED",
    "bookedSlot": "Slot string if booked, otherwise null"
  }
}`
});

export async function POST(req: Request) {
  try {
    const { messages, currentLead } = await req.json();

    const conversationText = messages
      .map((m: any) => `${m.sender === "user" ? "Prospect" : "Sarah"}: ${m.text}`)
      .join("\n");

    const prompt = `Current CRM State:
${JSON.stringify(currentLead, null, 2)}

Full WhatsApp Conversation So Far:
${conversationText}

Task: Read the prospect's latest message, update the CRM lead fields realistically, and write Sarah's next natural WhatsApp response.`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const parsed = JSON.parse(responseText);

    return NextResponse.json({
      text: parsed.reply,
      leadData: {
        ...currentLead,
        ...parsed.leadData,
        leadName: parsed.leadData?.leadName || currentLead.leadName,
        businessType: parsed.leadData?.businessType || currentLead.businessType,
        monthlyBudget: parsed.leadData?.monthlyBudget || currentLead.monthlyBudget,
        primaryGoal: parsed.leadData?.primaryGoal || currentLead.primaryGoal,
        qualificationScore: parsed.leadData?.qualificationScore ?? currentLead.qualificationScore,
        status: parsed.leadData?.status || currentLead.status,
        bookedSlot: parsed.leadData?.bookedSlot || currentLead.bookedSlot,
      }
    });
  } catch (error: any) {
    console.error("Agent error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process message" },
      { status: 500 }
    );
  }
}
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

export const AVAILABLE_SLOTS = [
  "Tomorrow at 11:00 AM PKT",
  "Tomorrow at 3:00 PM PKT",
  "Tomorrow at 5:30 PM PKT",
  "Thursday at 2:00 PM PKT",
  "Thursday at 4:00 PM PKT"
];

const leadQualifierTools = [
  {
    name: "updateLeadProfile",
    description: "Update the lead's CRM profile when they reveal details like name, budget, niche, or pain points.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        leadName: { type: SchemaType.STRING, description: "Prospect's name" },
        businessType: { type: SchemaType.STRING, description: "Type of business or niche" },
        monthlyBudget: { type: SchemaType.STRING, description: "Monthly advertising or marketing budget" },
        primaryGoal: { type: SchemaType.STRING, description: "Main goal or marketing bottleneck" },
        qualificationScore: { type: SchemaType.NUMBER, description: "Lead quality score from 1 to 100 based on budget and intent" },
        status: { 
          type: SchemaType.STRING, 
          description: "Current stage: NEW, QUALIFYING, QUALIFIED, UNQUALIFIED, or BOOKED",
          enum: ["NEW", "QUALIFYING", "QUALIFIED", "UNQUALIFIED", "BOOKED"]
        }
      },
      required: ["status", "qualificationScore"]
    }
  },
  {
    name: "checkAvailableSlots",
    description: "Check available calendar meeting slots for high-intent qualified leads.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        requestedDay: { type: SchemaType.STRING, description: "Day requested by lead e.g., tomorrow, thursday" }
      }
    }
  },
  {
    name: "confirmBooking",
    description: "Confirm and lock an appointment slot once the lead agrees to a specific time.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        selectedSlot: { type: SchemaType.STRING, description: "The confirmed meeting time slot" },
        prospectEmail: { type: SchemaType.STRING, description: "Lead's email address for the invite" }
      },
      required: ["selectedSlot"]
    }
  }
];

export const qualifierModel = genAI.getGenerativeModel({
  model: "gemini-3.6-flash",
  tools: [{ functionDeclarations: leadQualifierTools as any }],
  systemInstruction: `You are 'Sarah', a high-converting, empathetic, and professional AI Business Growth Advisor for a premium Growth Marketing Agency.
Your objective:
1. Greet incoming Meta/WhatsApp leads warmly and naturally in conversational, concise language (1-2 sentences per message, like real WhatsApp chat).
2. Gather 3 core criteria to qualify the lead:
   - What kind of business do they run?
   - What is their primary growth bottleneck (leads, ROAS, conversions)?
   - What is their estimated monthly ad budget (Under $1,000, $1k-$5k, or $5k+)?
3. As soon as you discover any detail, call 'updateLeadProfile' tool behind the scenes to sync CRM.
4. If monthly budget is $1,000+ or high intent: Mark as 'QUALIFIED', call 'checkAvailableSlots', and offer 2 specific meeting slots for a 15-minute Strategy Call with the Agency Director.
5. Once they choose a slot and share their email, call 'confirmBooking' and celebrate with confirmation details.
6. If budget is under $500: Politely offer free audit resources without booking a direct call.
Keep answers punchy, natural, and never send long bullet points.`
});
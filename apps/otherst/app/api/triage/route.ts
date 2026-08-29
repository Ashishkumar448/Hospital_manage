import { NextResponse } from "next/server";
import OpenAI from "openai";
import { hospitalInfo } from "@repo/ui/hospitalInfo";

export async function POST(req: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "OpenAI API key not configured." }, { status: 500 });
    }

    const openai = new OpenAI({ apiKey });
    const { patientSymptoms, bedBoardAdmissions } = await req.json();

    const systemPrompt = `You are the AI Triage Director for City General Hospital.
Your job is to analyze the patient's symptoms/condition provided by the nursing staff, and output a structured JSON recommendation.
Based on the symptoms, determine the most appropriate department (Cardiology, Orthopedics, Endocrinology, Dermatology, General Medicine).
You must also recommend a priority level (Normal or Rapid Priority).
Finally, you must recommend a specific bed. The hospital has beds in various wards (e.g., Gen Ward A, Gen Ward B, ICU). Look at the current bedBoardAdmissions to ensure you don't assign a bed that is currently occupied. If you don't have exact bed data, just recommend a logical ward and append a random bed number (e.g., "Gen Ward A - Bed 14").

CRITICAL INSTRUCTION: If the user input is a general question (e.g., "how many beds are available", "what are the fees") and NOT a description of a patient's medical condition, you MUST output "N/A" for department, priority, and recommendedBed, and set reasoning to: "This form is specifically for Patient Triage and Assessment. Please use the floating Ops Assistant chat icon in the bottom right corner for general hospital inquiries or bed counts."

Hospital Info:
${JSON.stringify(hospitalInfo, null, 2)}

Current Ward Admissions Context:
${JSON.stringify(bedBoardAdmissions, null, 2)}

Output EXACTLY in the following JSON format, and nothing else:
{
  "department": "Department Name (or N/A)",
  "priority": "Normal or Rapid Priority (or N/A)",
  "recommendedBed": "Ward Name - Bed Number (or N/A)",
  "reasoning": "Brief medical explanation for this triage decision, or the rejection message if this is a general question."
}`;

    const chatResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Patient Symptoms/Condition: ${patientSymptoms}` }
      ],
      temperature: 0.2,
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(chatResponse.choices[0]?.message?.content || "{}");
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Triage API Error:", error);
    return NextResponse.json({ error: "I'm sorry, I encountered an error connecting to the AI Triage service." }, { status: 500 });
  }
}

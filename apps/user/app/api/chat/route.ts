import { NextResponse } from "next/server";
import OpenAI from "openai";
import { hospitalInfo } from "@repo/ui/hospitalInfo";

export async function POST(req: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ reply: "OpenAI API key not configured. Please add OPENAI_API_KEY to your environment variables." }, { status: 200 });
    }

    const openai = new OpenAI({ apiKey });

    const { messages, contextData } = await req.json();

    const systemPrompt = `You are a helpful AI assistant for City General Hospital. 
You answer questions from patients based ONLY on the provided context and hospital information.
You MUST respond in either English or Hindi, matching the user's language.
If the user asks something completely unrelated to the hospital, health, or their data, politely refuse to answer.
If asked about fees or facilities, refer to the hospital info.

Hospital Info:
${JSON.stringify(hospitalInfo, null, 2)}

Patient's Live Data Context:
${contextData ? JSON.stringify(contextData, null, 2) : "No live data available."}
`;

    const chatResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages.map((m: any) => ({ role: m.role, content: m.content }))
      ],
      temperature: 0.3,
      max_tokens: 500,
    });

    return NextResponse.json({ reply: chatResponse.choices[0]?.message?.content || "I couldn't process that." });
  } catch (error: any) {
    console.error("Chat API Error:", error);
    return NextResponse.json({ reply: "I'm sorry, I encountered an error connecting to the AI service." }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const dynamic = "force-dynamic";
export const maxDuration = 15;

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "API key not configured" }, { status: 500 });
  }

  const body = await request.json();
  const { text, targetLang } = body as { text: string; targetLang: string };

  if (!text || !targetLang) {
    return NextResponse.json({ error: "Missing text or targetLang" }, { status: 400 });
  }

  const safeText = text.slice(0, 2000);
  const safeLang = targetLang.slice(0, 30);

  const prompt = `Translate the following text to ${safeLang}. Return ONLY the translation, nothing else.\n\n${safeText}`;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const models = ["gemini-2.5-flash", "gemini-2.0-flash"];

    for (const modelName of models) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        return NextResponse.json({ translated: result.response.text() });
      } catch (err) {
        const msg = err instanceof Error ? err.message : "";
        if (!msg.includes("503") && !msg.includes("429")) break;
      }
    }

    return NextResponse.json({ error: "Translation failed. API may be busy." }, { status: 500 });
  } catch {
    return NextResponse.json({ error: "Translation failed." }, { status: 500 });
  }
}

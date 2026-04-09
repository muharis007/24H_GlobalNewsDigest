import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "API key not configured" }, { status: 500 });
  }

  const body = await request.json();
  const { question, context } = body as { question: string; context: string };

  if (!question || !context) {
    return NextResponse.json({ error: "Missing question or context" }, { status: 400 });
  }

  // Limit context and question size
  const safeContext = context.slice(0, 8000);
  const safeQuestion = question.slice(0, 500);

  const prompt = `You are a helpful news analyst. Below is a summary of recent global news:

${safeContext}

Based ONLY on this information, answer the following question concisely (2-4 sentences). If the answer is not in the data, say so.

Question: ${safeQuestion}`;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const models = ["gemini-2.5-flash", "gemini-2.0-flash"];
    let lastError: Error | null = null;

    for (const modelName of models) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        return NextResponse.json({ answer: text });
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        if (!lastError.message.includes("503") && !lastError.message.includes("429")) break;
      }
    }

    const isQuota = lastError?.message?.includes("429");
    return NextResponse.json(
      { error: isQuota ? "API quota exhausted. Try again later." : "Failed to generate response." },
      { status: isQuota ? 429 : 500 }
    );
  } catch (err) {
    return NextResponse.json({ error: "Failed to process request." }, { status: 500 });
  }
}

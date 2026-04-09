import { GoogleGenerativeAI } from "@google/generative-ai";

const PROMPT = `You are a news aggregator AI. I'm giving you headlines and snippets from 4 news sources from the last 24 hours.

Organize these news stories by COUNTRY (the country the story is about, not where the source is from). For each country, provide:
- A list of stories with: headline, 1-2 sentence summary, source name, category (one of: politics, conflict, economy, sports, tech, health, other)

Return ONLY valid JSON in this exact format, no markdown, no backticks:
{
  "countries": [
    {
      "name": "Pakistan",
      "code": "PAK",
      "stories": [
        {
          "headline": "...",
          "summary": "...",
          "source": "ARY News",
          "category": "politics"
        }
      ]
    }
  ],
  "updated_at": "ISO timestamp"
}

Use standard ISO 3166-1 alpha-3 country codes. Here are the headlines:

`;

export async function summarizeNews(headlines: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not set");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  // Retry up to 3 times with exponential backoff
  let lastError: Error | null = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      if (attempt > 0) {
        const delay = Math.pow(2, attempt) * 1000;
        console.log(`[Gemini] Retry ${attempt}, waiting ${delay}ms...`);
        await new Promise((r) => setTimeout(r, delay));
      }
      const result = await model.generateContent(PROMPT + headlines);
      const text = result.response.text();
      return text;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      console.error(`[Gemini] Attempt ${attempt + 1} failed:`, lastError.message);
      // Only retry on 503/429 errors
      if (!lastError.message.includes("503") && !lastError.message.includes("429") && !lastError.message.includes("high demand")) {
        throw lastError;
      }
    }
  }
  throw lastError!;
}

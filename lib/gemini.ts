import { GoogleGenerativeAI } from "@google/generative-ai";

const PROMPT = `You are a news aggregator AI. I'm giving you headlines and snippets from 4 news sources from the last 24 hours.

Organize these news stories by COUNTRY (the country the story is about, not where the source is from). For each country, provide:
- A list of stories with: headline, 1-2 sentence summary, source name, category (one of: politics, conflict, economy, sports, tech, health, other), breaking (boolean - true only for major developing stories), sentiment (one of: positive, negative, neutral)
- overall_sentiment for the country (one of: positive, negative, neutral) based on the dominant tone
- sentiment_score from -1.0 (very negative) to 1.0 (very positive)

IMPORTANT: If multiple sources cover the same story or event, merge them into a SINGLE entry.
List all sources that covered it in the "source" field separated by commas, e.g. "ARY News, Geo TV".
Do NOT list the same event as separate stories from different sources.
For example, if both ARY News and Geo TV report on "PM addresses parliament", combine into one story with source "ARY News, Geo TV".

Context about sources:
- arynews.tv and geo.tv are Pakistani news channels. Most of their stories are about Pakistan unless explicitly about another country.
- arabnews.com is Saudi-based. Stories without a specific country mentioned are likely about Saudi Arabia.
- bbc.co.uk covers global news. Classify based on the story content.
When in doubt about which country a story belongs to, use the source's home country.

Return ONLY valid JSON in this exact format, no markdown, no backticks:
{
  "countries": [
    {
      "name": "Pakistan",
      "code": "PAK",
      "overall_sentiment": "negative",
      "sentiment_score": -0.5,
      "stories": [
        {
          "headline": "...",
          "summary": "...",
          "source": "ARY News",
          "category": "politics",
          "breaking": false,
          "sentiment": "neutral"
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
  // Use only gemini-2.0-flash — fastest model, fits within Vercel Hobby 10s limit
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  const PER_CALL_TIMEOUT = 8_000; // 8s to stay within Vercel Hobby 10s function limit

  let lastError: Error | null = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      if (attempt > 0) {
        console.log(`[Gemini] Retry attempt ${attempt + 1}...`);
      }
      console.log(`[Gemini] gemini-2.0-flash attempt ${attempt + 1}`);
      const result = await Promise.race([
        model.generateContent(PROMPT + headlines),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Timeout")), PER_CALL_TIMEOUT)
        ),
      ]);
      const text = result.response.text();
      return text;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      console.error(`[Gemini] attempt ${attempt + 1} failed:`, lastError.message);
      if (lastError.message.includes("API_KEY_INVALID") || lastError.message.includes("API key expired") || lastError.message.includes("401") || lastError.message.includes("403")) {
        throw lastError;
      }
      // Only retry on transient errors
      if (!lastError.message.includes("503") && !lastError.message.includes("429") && !lastError.message.includes("Timeout")) {
        break;
      }
    }
  }
  throw lastError!;
}

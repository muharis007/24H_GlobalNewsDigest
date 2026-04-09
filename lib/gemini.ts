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
  const models = ["gemini-2.5-flash", "gemini-2.0-flash"];

  // Retry up to 3 times with exponential backoff, falling back to alternate models
  let lastError: Error | null = null;
  for (const modelName of models) {
    const model = genAI.getGenerativeModel({ model: modelName });
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        if (attempt > 0) {
          const delay = Math.pow(2, attempt) * 1000;
          console.log(`[Gemini] Retry ${attempt} on ${modelName}, waiting ${delay}ms...`);
          await new Promise((r) => setTimeout(r, delay));
        }
        console.log(`[Gemini] Trying model: ${modelName}, attempt ${attempt + 1}`);
        const result = await model.generateContent(PROMPT + headlines);
        const text = result.response.text();
        return text;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        console.error(`[Gemini] ${modelName} attempt ${attempt + 1} failed:`, lastError.message);
        if (!lastError.message.includes("503") && !lastError.message.includes("429") && !lastError.message.includes("high demand")) {
          break; // Don't retry non-transient errors on this model, try next model
        }
      }
    }
  }
  throw lastError!;
}

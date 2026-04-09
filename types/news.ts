export type Category = "politics" | "conflict" | "economy" | "sports" | "tech" | "health" | "other";
export type Sentiment = "positive" | "negative" | "neutral";

export interface Story {
  headline: string;
  summary: string;
  source: string;
  category: Category;
  link?: string;
  breaking?: boolean;
  sentiment?: Sentiment;
}

export interface Country {
  name: string;
  code: string;
  stories: Story[];
  overall_sentiment?: Sentiment;
  sentiment_score?: number;
}

export interface NewsData {
  countries: Country[];
  updated_at: string;
}

export interface CountryCoord {
  lat: number;
  lng: number;
}

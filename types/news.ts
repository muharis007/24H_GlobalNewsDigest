export interface Story {
  headline: string;
  summary: string;
  source: string;
  category: "politics" | "conflict" | "economy" | "sports" | "tech" | "health" | "other";
  link?: string;
}

export interface Country {
  name: string;
  code: string;
  stories: Story[];
}

export interface NewsData {
  countries: Country[];
  updated_at: string;
}

export interface CountryCoord {
  lat: number;
  lng: number;
}

export interface NewsArticle {
  title: string;
  description: string;
  content?: string;
  url: string;
  image: string;
  publishedAt: string;
  source: {
    name: string;
    url?: string;
  };
}

export interface NewsResponse {
  totalArticles: number;
  articles: NewsArticle[];
}

export interface UserPreferences {
  categories: string[];
  language: string;
  country: string;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  preferences: UserPreferences;
  createdAt: string;
}

export interface Bookmark {
  _id: string;
  userId: string;
  article: {
    title: string;
    description: string;
    url: string;
    image: string;
    source: string;
    publishedAt: string;
    category: string;
  };
  notes?: string;
  tags: string[];
  createdAt: string;
}

export interface ReadingHistoryItem {
  _id: string;
  userId: string;
  article: {
    title: string;
    url: string;
    category: string;
    source: string;
  };
  readAt: string;
  readDuration?: number;
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  user?: User;
  message?: string;
}

export const CATEGORIES = [
  { id: 'general', name: 'General' },
  { id: 'business', name: 'Business' },
  { id: 'technology', name: 'Technology' },
  { id: 'science', name: 'Science' },
  { id: 'health', name: 'Health' },
  { id: 'sports', name: 'Sports' },
  { id: 'entertainment', name: 'Entertainment' },
] as const;

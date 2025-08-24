/**
 * Shared code between client and server
 * Useful to share types between client and server
 * and/or small pure JS functions that can be used on both client and server
 */

/**
 * Example response type for /api/demo
 */
export interface DemoResponse {
  message: string;
}

/**
 * Sentiment Analysis API Types
 */
export interface SentimentPost {
  id: string;
  content: string;
  sentiment: "positive" | "neutral" | "negative";
  confidence: number;
  timestamp: string;
  author: string;
  platform: string;
  hashtag: string;
}

export interface SentimentData {
  timestamp: string;
  positive: number;
  neutral: number;
  negative: number;
}

export interface SentimentStats {
  totalPosts: number;
  positivePosts: number;
  neutralPosts: number;
  negativePosts: number;
  avgSentiment: number;
}

export interface StartMonitoringRequest {
  hashtag: string;
  platforms?: string[];
}

export interface SentimentStreamResponse {
  posts: SentimentPost[];
  sentimentData: SentimentData[];
  stats: SentimentStats;
  isActive: boolean;
}

export interface WebSocketMessage {
  type: "new_post" | "sentiment_update" | "stats_update" | "error";
  data: SentimentPost | SentimentData | SentimentStats | { message: string };
}

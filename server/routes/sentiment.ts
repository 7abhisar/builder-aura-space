import { RequestHandler } from "express";
import { 
  SentimentPost, 
  SentimentData, 
  SentimentStats, 
  StartMonitoringRequest, 
  SentimentStreamResponse 
} from "@shared/api";

// Mock data store (in production this would be a real database)
let activeMonitoring: Map<string, boolean> = new Map();
let sentimentHistory: Map<string, SentimentData[]> = new Map();
let postsHistory: Map<string, SentimentPost[]> = new Map();

// Mock sentiment analysis function (in production this would call HuggingFace API)
function analyzeSentiment(text: string): { sentiment: "positive" | "neutral" | "negative", confidence: number } {
  // Simple mock sentiment analysis based on keywords
  const positiveWords = ["amazing", "great", "excellent", "love", "wonderful", "fantastic", "brilliant", "awesome"];
  const negativeWords = ["terrible", "awful", "hate", "horrible", "bad", "worst", "disgusting", "pathetic"];
  
  const lowerText = text.toLowerCase();
  const positiveCount = positiveWords.reduce((count, word) => 
    count + (lowerText.includes(word) ? 1 : 0), 0);
  const negativeCount = negativeWords.reduce((count, word) => 
    count + (lowerText.includes(word) ? 1 : 0), 0);
  
  if (positiveCount > negativeCount) {
    return { sentiment: "positive", confidence: Math.min(0.7 + positiveCount * 0.1, 0.95) };
  } else if (negativeCount > positiveCount) {
    return { sentiment: "negative", confidence: Math.min(0.7 + negativeCount * 0.1, 0.95) };
  } else {
    return { sentiment: "neutral", confidence: 0.6 + Math.random() * 0.2 };
  }
}

// Generate mock social media posts
function generateMockPost(hashtag: string): SentimentPost {
  const mockContents = [
    `This ${hashtag} campaign is amazing! Love the message`,
    `Not sure about this ${hashtag} approach, seems risky`,
    `Absolutely brilliant ${hashtag} strategy!`,
    `I have mixed feelings about this ${hashtag}`,
    `This ${hashtag} is terrible, completely disagree`,
    `Great ${hashtag} initiative, hope it succeeds`,
    `Neutral stance on this ${hashtag} topic`,
    `Outstanding work by the ${hashtag} team`,
    `${hashtag} is trending for all the right reasons!`,
    `Why is everyone talking about ${hashtag}? Overrated.`,
    `Finally, a ${hashtag} that makes sense`,
    `${hashtag} movement gaining momentum`,
    `Critical analysis of ${hashtag} reveals flaws`,
    `Supporting ${hashtag} wholeheartedly!`,
    `${hashtag} needs more thoughtful consideration`
  ];
  
  const platforms = ["twitter", "instagram", "facebook", "linkedin"];
  const content = mockContents[Math.floor(Math.random() * mockContents.length)];
  const analysis = analyzeSentiment(content);
  
  return {
    id: `post-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    content,
    sentiment: analysis.sentiment,
    confidence: analysis.confidence,
    timestamp: new Date().toISOString(),
    author: `@user${Math.floor(Math.random() * 1000)}`,
    platform: platforms[Math.floor(Math.random() * platforms.length)],
    hashtag
  };
}

// Generate mock sentiment data over time
function generateSentimentData(hashtag: string): SentimentData[] {
  const data = [];
  const now = new Date();
  
  for (let i = 23; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000);
    data.push({
      timestamp: timestamp.toISOString(),
      positive: Math.floor(Math.random() * 30) + 40,
      neutral: Math.floor(Math.random() * 20) + 25,
      negative: Math.floor(Math.random() * 25) + 10
    });
  }
  
  return data;
}

// Calculate stats from posts
function calculateStats(posts: SentimentPost[]): SentimentStats {
  const positivePosts = posts.filter(p => p.sentiment === "positive").length;
  const neutralPosts = posts.filter(p => p.sentiment === "neutral").length;
  const negativePosts = posts.filter(p => p.sentiment === "negative").length;
  
  const avgSentiment = posts.length > 0 
    ? (positivePosts * 1 + neutralPosts * 0 + negativePosts * -1) / posts.length
    : 0;
  
  return {
    totalPosts: posts.length,
    positivePosts,
    neutralPosts,
    negativePosts,
    avgSentiment
  };
}

// Start monitoring a hashtag
export const startMonitoring: RequestHandler = (req, res) => {
  const { hashtag, platforms = ["twitter"] } = req.body as StartMonitoringRequest;
  
  if (!hashtag) {
    return res.status(400).json({ error: "Hashtag is required" });
  }
  
  // Initialize data for this hashtag
  activeMonitoring.set(hashtag, true);
  
  // Generate initial posts
  const initialPosts = Array.from({ length: 20 }, () => generateMockPost(hashtag));
  postsHistory.set(hashtag, initialPosts);
  
  // Generate initial sentiment data
  const initialSentimentData = generateSentimentData(hashtag);
  sentimentHistory.set(hashtag, initialSentimentData);
  
  const stats = calculateStats(initialPosts);
  
  const response: SentimentStreamResponse = {
    posts: initialPosts,
    sentimentData: initialSentimentData,
    stats,
    isActive: true
  };
  
  res.json(response);
};

// Stop monitoring a hashtag
export const stopMonitoring: RequestHandler = (req, res) => {
  const { hashtag } = req.params;
  
  if (!hashtag) {
    return res.status(400).json({ error: "Hashtag is required" });
  }
  
  activeMonitoring.set(hashtag, false);
  
  res.json({ message: `Stopped monitoring ${hashtag}`, isActive: false });
};

// Get current data for a hashtag
export const getHashtagData: RequestHandler = (req, res) => {
  const { hashtag } = req.params;
  
  if (!hashtag) {
    return res.status(400).json({ error: "Hashtag is required" });
  }
  
  const posts = postsHistory.get(hashtag) || [];\n  const sentimentData = sentimentHistory.get(hashtag) || [];\n  const isActive = activeMonitoring.get(hashtag) || false;\n  const stats = calculateStats(posts);\n  \n  const response: SentimentStreamResponse = {\n    posts,\n    sentimentData,\n    stats,\n    isActive\n  };\n  \n  res.json(response);\n};\n\n// Get new posts for a hashtag (simulates real-time updates)\nexport const getNewPosts: RequestHandler = (req, res) => {\n  const { hashtag } = req.params;\n  \n  if (!hashtag) {\n    return res.status(400).json({ error: \"Hashtag is required\" });\n  }\n  \n  const isActive = activeMonitoring.get(hashtag);\n  \n  if (!isActive) {\n    return res.json({ posts: [], newSentimentData: null });\n  }\n  \n  // Generate 1-3 new posts\n  const newPostsCount = Math.floor(Math.random() * 3) + 1;\n  const newPosts = Array.from({ length: newPostsCount }, () => generateMockPost(hashtag));\n  \n  // Update posts history\n  const currentPosts = postsHistory.get(hashtag) || [];\n  const updatedPosts = [...newPosts, ...currentPosts].slice(0, 100); // Keep only latest 100\n  postsHistory.set(hashtag, updatedPosts);\n  \n  // Update sentiment data with latest point\n  const currentSentimentData = sentimentHistory.get(hashtag) || [];\n  const newSentimentPoint: SentimentData = {\n    timestamp: new Date().toISOString(),\n    positive: Math.floor(Math.random() * 30) + 40,\n    neutral: Math.floor(Math.random() * 20) + 25,\n    negative: Math.floor(Math.random() * 25) + 10\n  };\n  \n  const updatedSentimentData = [...currentSentimentData.slice(1), newSentimentPoint];\n  sentimentHistory.set(hashtag, updatedSentimentData);\n  \n  const stats = calculateStats(updatedPosts);\n  \n  res.json({\n    posts: newPosts,\n    newSentimentData: newSentimentPoint,\n    stats\n  });\n};\n\n// Get monitoring status\nexport const getMonitoringStatus: RequestHandler = (req, res) => {\n  const activeHashtags = Array.from(activeMonitoring.entries())\n    .filter(([_, isActive]) => isActive)\n    .map(([hashtag, _]) => hashtag);\n  \n  res.json({\n    activeHashtags,\n    totalActive: activeHashtags.length\n  });\n};
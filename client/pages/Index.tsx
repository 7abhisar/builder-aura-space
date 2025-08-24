import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from "recharts";
import { Search, TrendingUp, MessageCircle, Activity } from "lucide-react";
import { SentimentPost, SentimentData, SentimentStats, StartMonitoringRequest, SentimentStreamResponse } from "@shared/api";

const COLORS = {
  positive: "#10b981",
  neutral: "#6b7280",
  negative: "#ef4444"
};

export default function Index() {
  const [hashtag, setHashtag] = useState("#campaign");
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [sentimentData, setSentimentData] = useState<SentimentData[]>([]);
  const [posts, setPosts] = useState<SentimentPost[]>([]);
  const [stats, setStats] = useState<SentimentStats>({
    totalPosts: 0,
    positivePosts: 0,
    neutralPosts: 0,
    negativePosts: 0,
    avgSentiment: 0
  });
  const [loading, setLoading] = useState(false);

  // Calculate sentiment distribution
  const sentimentDistribution = [
    { name: "Positive", value: posts.filter(p => p.sentiment === "positive").length, color: COLORS.positive },
    { name: "Neutral", value: posts.filter(p => p.sentiment === "neutral").length, color: COLORS.neutral },
    { name: "Negative", value: posts.filter(p => p.sentiment === "negative").length, color: COLORS.negative }
  ];

  // Format sentiment data for charts
  const chartSentimentData = sentimentData.map(data => ({
    ...data,
    timestamp: new Date(data.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  }));

  const handleStartMonitoring = async () => {
    if (!hashtag.trim()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/sentiment/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hashtag: hashtag.trim() } as StartMonitoringRequest)
      });

      if (response.ok) {
        const data: SentimentStreamResponse = await response.json();
        setSentimentData(data.sentimentData);
        setPosts(data.posts);
        setStats(data.stats);
        setIsMonitoring(data.isActive);
      }
    } catch (error) {
      console.error('Error starting monitoring:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStopMonitoring = async () => {
    if (!hashtag.trim()) return;

    try {
      const response = await fetch(`/api/sentiment/stop/${encodeURIComponent(hashtag.trim())}`, {
        method: 'POST'
      });

      if (response.ok) {
        setIsMonitoring(false);
      }
    } catch (error) {
      console.error('Error stopping monitoring:', error);
    }
  };

  // Fetch existing data for hashtag
  const fetchHashtagData = async (tag: string) => {
    try {
      const response = await fetch(`/api/sentiment/${encodeURIComponent(tag)}`);
      if (response.ok) {
        const data: SentimentStreamResponse = await response.json();
        setSentimentData(data.sentimentData);
        setPosts(data.posts);
        setStats(data.stats);
        setIsMonitoring(data.isActive);
      }
    } catch (error) {
      console.error('Error fetching hashtag data:', error);
    }
  };

  // Real-time updates
  useEffect(() => {
    if (!isMonitoring || !hashtag.trim()) return;

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/sentiment/${encodeURIComponent(hashtag.trim())}/new`);
        if (response.ok) {
          const data = await response.json();

          if (data.posts && data.posts.length > 0) {
            setPosts(prev => [...data.posts, ...prev.slice(0, 50)]); // Keep latest 50 posts
          }

          if (data.newSentimentData) {
            setSentimentData(prev => [...prev.slice(1), data.newSentimentData]);
          }

          if (data.stats) {
            setStats(data.stats);
          }
        }
      } catch (error) {
        console.error('Error fetching new posts:', error);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [isMonitoring, hashtag]);

  // Load initial data when hashtag changes
  useEffect(() => {
    if (hashtag.trim()) {
      fetchHashtagData(hashtag.trim());
    }
  }, [hashtag]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <div className="border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Activity className="h-8 w-8 text-blue-600" />
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">SentimentStream</h1>
              </div>
              <Badge variant="secondary" className="ml-4">
                {isMonitoring ? "🟢 Live" : "⚪ Offline"}
              </Badge>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Search className="h-4 w-4 text-slate-500" />
                <Input
                  placeholder="Enter hashtag..."
                  value={hashtag}
                  onChange={(e) => setHashtag(e.target.value)}
                  className="w-64"
                />
              </div>
              <Button
                onClick={isMonitoring ? handleStopMonitoring : handleStartMonitoring}
                variant={isMonitoring ? "destructive" : "default"}
                disabled={loading}
              >
                {loading ? "Loading..." : isMonitoring ? "Stop Monitoring" : "Start Monitoring"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="container mx-auto px-4 py-6">
        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
              <MessageCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalPosts.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {isMonitoring ? "Live monitoring" : "Historical data"}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Positive</CardTitle>
              <div className="h-3 w-3 rounded-full bg-green-500"></div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {posts.length > 0 ? Math.round((stats.positivePosts / stats.totalPosts) * 100) : 0}%
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.positivePosts} posts
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Neutral</CardTitle>
              <div className="h-3 w-3 rounded-full bg-gray-500"></div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-600">
                {posts.length > 0 ? Math.round((stats.neutralPosts / stats.totalPosts) * 100) : 0}%
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.neutralPosts} posts
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Negative</CardTitle>
              <div className="h-3 w-3 rounded-full bg-red-500"></div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {posts.length > 0 ? Math.round((stats.negativePosts / stats.totalPosts) * 100) : 0}%
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.negativePosts} posts
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Sentiment Trends */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5" />
                <span>Sentiment Trends (24h)</span>
              </CardTitle>
              <CardDescription>
                Real-time sentiment analysis over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  positive: { label: "Positive", color: COLORS.positive },
                  neutral: { label: "Neutral", color: COLORS.neutral },
                  negative: { label: "Negative", color: COLORS.negative }
                }}
                className="h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartSentimentData}>
                    <XAxis dataKey="timestamp" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line type="monotone" dataKey="positive" stroke={COLORS.positive} strokeWidth={2} />
                    <Line type="monotone" dataKey="neutral" stroke={COLORS.neutral} strokeWidth={2} />
                    <Line type="monotone" dataKey="negative" stroke={COLORS.negative} strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Sentiment Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Sentiment Distribution</CardTitle>
              <CardDescription>
                Overall sentiment breakdown
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  positive: { label: "Positive", color: COLORS.positive },
                  neutral: { label: "Neutral", color: COLORS.neutral },
                  negative: { label: "Negative", color: COLORS.negative }
                }}
                className="h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sentimentDistribution}>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="value" fill={(entry) => entry.color} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        {/* Live Posts Feed */}
        <Card>
          <CardHeader>
            <CardTitle>Live Posts Feed</CardTitle>
            <CardDescription>
              Recent posts with sentiment analysis • Updates every 3 seconds when monitoring
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <div className="space-y-4">
                {posts.map((post, index) => (
                  <div key={post.id} className="flex items-start space-x-3 p-4 rounded-lg border bg-card">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-blue-600">{post.author}</span>
                          <Badge variant="outline" className="text-xs">
                            {post.platform}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge
                            variant={post.sentiment === "positive" ? "default" : post.sentiment === "negative" ? "destructive" : "secondary"}
                            className={
                              post.sentiment === "positive" ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" :
                              post.sentiment === "negative" ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" :
                              "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
                            }
                          >
                            {post.sentiment} ({Math.round(post.confidence * 100)}%)
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(post.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">{post.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

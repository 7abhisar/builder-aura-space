import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import {
  startMonitoring,
  stopMonitoring,
  getHashtagData,
  getNewPosts,
  getMonitoringStatus,
} from "./routes/sentiment";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // Sentiment Analysis API routes
  app.post("/api/sentiment/start", startMonitoring);
  app.post("/api/sentiment/stop/:hashtag", stopMonitoring);
  app.get("/api/sentiment/:hashtag", getHashtagData);
  app.get("/api/sentiment/:hashtag/new", getNewPosts);
  app.get("/api/sentiment/status", getMonitoringStatus);

  return app;
}

import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
//changed line
const app = express();

// 1. GLOBAL SETTINGS & PARSERS
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// 2. DEBUG LOGGER (Must be at the top to see incoming traffic)
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;

  // Log the arrival
  log(`📥 ${req.method} ${path} - Request Received`);

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      log(`📤 ${req.method} ${path} ${res.statusCode} in ${duration}ms`);
    }
  });
  next();
});

// 3. SPECIFIC SYSTEM ROUTES
app.get("/.well-known/assetlinks.json", (_req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.sendFile("public/.well-known/assetlinks.json", { root: process.cwd() });
});

(async () => {
  try {
    // 4. REGISTER API ROUTES
    // We await this to ensure all routes are mounted before moving to static files
    const server = await registerRoutes(app);

    // 5. GLOBAL ERROR HANDLER FOR API
    // This prevents the "Unexpected character <" by ensuring errors are JSON
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      log(`🔥 Error: ${message}`);
      res.status(status).json({ error: message });
    });

    // 6. FALLBACK 404 FOR /API ROUTES
    // If a request starts with /api but didn't match a route, return JSON, not HTML
    app.use("/api", (req, res) => {
      res.status(404).json({ error: `API route ${req.method} ${req.originalUrl} not found` });
    });

    // 7. STATIC ASSETS (Development Vite or Production Build)
    // This is placed AFTER API routes so it doesn't intercept API calls
    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    // 8. START SERVER
    const port = parseInt(process.env.PORT || '3001', 10);
    server.listen(port, '0.0.0.0', () => {
      log(`🚀 Server running in ${app.get("env")} mode on port ${port}`);
    });

  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
})();
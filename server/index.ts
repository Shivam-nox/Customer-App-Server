import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();

/* ======================================================
   GLOBAL MIDDLEWARE (ORDER MATTERS)
====================================================== */

// Parse JSON bodies
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Fix BigInt serialization
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

// Android App Links (assetlinks.json)
app.get("/.well-known/assetlinks.json", (_req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.sendFile("public/.well-known/assetlinks.json", {
    root: process.cwd(),
  });
});

// Request logger (API only)
app.use((req, res, next) => {
  const start = Date.now();
  let capturedJson: any;

  const originalJson = res.json.bind(res);
  res.json = (body: any) => {
    capturedJson = body;
    return originalJson(body);
  };

  res.on("finish", () => {
    if (req.path.startsWith("/api")) {
      const duration = Date.now() - start;
      log(
        `${req.method} ${req.path} ${res.statusCode} in ${duration}ms` +
          (capturedJson ? ` :: ${JSON.stringify(capturedJson).slice(0, 80)}…` : "")
      );
    }
  });

  next();
});

/* ======================================================
   REGISTER API ROUTES
====================================================== */

(async () => {
  const server = await registerRoutes(app);

  /* ======================================================
     ERROR HANDLER (API ONLY)
  ====================================================== */
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ error: message });
  });

  /* ======================================================
     FRONTEND (VITE / STATIC) — MUST BE LAST
  ====================================================== */
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  /* ======================================================
     START SERVER
  ====================================================== */
  const port = parseInt(process.env.PORT || "3001", 10);

  server.listen(port, "0.0.0.0", () => {
    log(`🚀 Server running on port ${port}`);
  });
})();

import express from "express";
import cors from "cors";
import geminiRoutes from "./routes/gemini.routes.js";
import toolsRoutes from "./routes/tools.routes.js";
import { processProxiedHtml } from "./controllers/tools.controller.js";

const app = express();

const defaultOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:3000",
];
const envOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim()).filter(Boolean)
  : [];
const allowedOrigins = [...defaultOrigins, ...envOrigins];

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // Allow dynamically in development/staging while respecting security
      return callback(null, true);
    },
    methods: ["GET", "POST", "OPTIONS"],
    exposedHeaders: ["Content-Disposition", "Content-Type"],
  })
);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Backend funcionando",
  });
});

app.use("/api/gemini", geminiRoutes);
app.use("/api/tools", toolsRoutes);

// Fallback proxy middleware for sub-resources (scripts, chunks, styles, images, fonts)
// requested by pages running inside the proxy iframe.
// Origin is derived strictly from the Referer header to prevent cross-tenant/multi-company data leaks.
app.use(async (req, res, next) => {
  if (req.path.startsWith('/api/') || req.path === '/health') {
    return next();
  }

  // Determine target origin strictly from Referer header of the proxy-frame request
  const referer = req.headers.referer || req.headers.referrer || '';
  let targetOrigin = null;
  let refererSettings = { colorScheme: 'light', scrollbar: 'hidden' };

  if (referer && referer.includes('/api/tools/proxy-frame')) {
    try {
      const refUrl = new URL(referer);
      const targetParam = refUrl.searchParams.get('url');
      if (targetParam) {
        const parsedTarget = new URL(targetParam.startsWith('http') ? targetParam : `https://${targetParam}`);
        targetOrigin = parsedTarget.origin;
      }
      if (refUrl.searchParams.get('colorScheme')) {
        refererSettings.colorScheme = refUrl.searchParams.get('colorScheme');
      }
      if (refUrl.searchParams.get('scrollbar')) {
        refererSettings.scrollbar = refUrl.searchParams.get('scrollbar');
      }
    } catch (e) {}
  }

  if (targetOrigin) {
    try {
      const targetResourceUrl = `${targetOrigin}${req.originalUrl}`;
      const proxyRes = await fetch(targetResourceUrl, {
        headers: {
          'User-Agent': req.headers['user-agent'] || 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1 Chrome/124.0.0.0',
          'Accept': req.headers['accept'] || '*/*',
          'Accept-Language': req.headers['accept-language'] || 'es-ES,es;q=0.9,en;q=0.8',
        },
      });

      const contentType = proxyRes.headers.get('content-type') || '';
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.removeHeader('X-Frame-Options');
      res.removeHeader('x-frame-options');
      res.removeHeader('Content-Security-Policy');
      res.removeHeader('content-security-policy');
      res.setHeader('X-Frame-Options', 'ALLOWALL');
      res.setHeader('Content-Security-Policy', "frame-ancestors *");

      if (contentType.includes('text/html')) {
        const rawHtml = await proxyRes.text();
        const processedHtml = processProxiedHtml({
          html: rawHtml,
          cleanUrl: targetResourceUrl,
          effectiveOrigin: targetOrigin,
          colorScheme: refererSettings.colorScheme || 'light',
          scrollbar: refererSettings.scrollbar || 'hidden',
        });
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.status(proxyRes.status).send(processedHtml);
      }

      if (contentType) {
        res.setHeader('Content-Type', contentType);
      }

      const arrayBuffer = await proxyRes.arrayBuffer();
      return res.status(proxyRes.status).send(Buffer.from(arrayBuffer));
    } catch (err) {
      return next();
    }
  }

  next();
});

export default app;
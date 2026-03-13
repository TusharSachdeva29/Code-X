import express from "express";
import http from "http";
import cors from "cors";
import httpProxy from "http-proxy";
import { config } from "./config";
import routes from "./route/spawn"
import { healthCheck } from "./utils/health-check";

export const app = express();

const allowedOrigins = process.env.CLIENT_ORIGINS?.split(",") || [];

console.log(process.env.CLIENT_ORIGINS);
console.log(allowedOrigins);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true); 

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        return callback(
          new Error("CORS blocked: Not allowed by CLIENT_ORIGINS")
        );
      }
    },
    credentials: true,
  })
);
app.use(express.json());

healthCheck(app);

// Routes
app.use("/", routes);

// Create HTTP server for WebSocket support
const server = http.createServer(app);

// Create a proxy server for WebSocket connections
const wsProxy = httpProxy.createProxyServer({
  ws: true,
  changeOrigin: true,
});

wsProxy.on("error", (err, req, res) => {
  console.error("❌ Proxy error:", err.message);
});

// Handle WebSocket upgrade requests for user containers
server.on("upgrade", (req, socket, head) => {
  const url = req.url || "";
  // Match both /user/{username}/{port}/... and /{username}/{port}/... (for when nginx strips /user)
  let match = url.match(/^\/user\/([^\/]+)\/(\d+)(\/.*)?$/);
  
  // If no match with /user prefix, try without it (nginx may strip the prefix)
  if (!match) {
    match = url.match(/^\/([^\/]+)\/(\d+)(\/.*)?$/);
  }
  
  if (match) {
    const username = match[1];
    const port = match[2];
    const remainingPath = match[3] || "/";
    const target = `http://user-${username}-svc.default.svc.cluster.local:${port}`;
    
    // Rewrite the URL to strip the prefix
    req.url = remainingPath;
    
    console.log(`🔌 WebSocket upgrade for user: ${username}, target: ${target}, original path: ${url}, rewritten: ${req.url}`);
    
    wsProxy.ws(req, socket, head, { target });
  } else {
    console.log(`⚠️ WebSocket upgrade request did not match pattern: ${url}`);
    socket.destroy();
  }
});

server.listen(config.PORT, () => {
  console.log(`✅ Server live on ${config.PORT}`);
});

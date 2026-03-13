import { Request, Response, NextFunction } from "express";
import httpProxy from "http-proxy";

// Create a reusable proxy instance
const proxy = httpProxy.createProxyServer({
  changeOrigin: true,
  ws: true,
});

proxy.on("error", (err, req, res) => {
  console.error("❌ Proxy error:", err.message);
  if (res && "writeHead" in res && !res.writableEnded) {
    (res as any).writeHead(502);
    (res as any).end("Bad Gateway");
  }
});

export const handleProxy = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { username, port } = req.params;

  if (!username || !port) {
    res.status(400).json({ error: "Missing username or port" });
    return;
  }

  // Use the service DNS name (service-name.namespace.svc.cluster.local)
  const target = `http://user-${username}-svc.default.svc.cluster.local:${port}`;
  
  // Debug logging
  console.log(`🔍 Debug - originalUrl: ${req.originalUrl}, url: ${req.url}, path: ${req.path}, query: ${JSON.stringify(req.query)}`);
  
  // Rewrite the URL to strip the /:username/:port prefix
  const prefixToRemove = `/${username}/${port}`;
  
  // Use req.url which should include query string, or reconstruct from originalUrl
  let newUrl = req.originalUrl;
  if (newUrl.startsWith(prefixToRemove)) {
    newUrl = newUrl.slice(prefixToRemove.length) || "/";
  }
  
  console.log(`📡 HTTP proxy: ${req.originalUrl} -> ${target}${newUrl}`);
  
  req.url = newUrl;
  proxy.web(req, res, { target });
};

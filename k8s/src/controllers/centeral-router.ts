import { Request, Response, NextFunction } from "express";
import { createProxyMiddleware } from "http-proxy-middleware";

export const handleProxy = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { username, port } = req.params;

  console.log("Proxying request for:", username, "port:", port);

  if (!username || !port) {
    res.status(400).json({ error: "Missing username or port" });
    return;
  }

  // Use the service DNS name (service-name.namespace.svc.cluster.local)
  const target = `http://user-${username}-svc.default.svc.cluster.local:${port}`;
  console.log("Proxy target:", target);

  const proxy = createProxyMiddleware({
    target,
    pathRewrite: (path: string, req: Request): string =>
      path.replace(`/${username}/${port}`, ""),
    changeOrigin: true,
    ws: true,
    onError(err: Error, req: Request, res: Response) {
      console.error(`❌ Proxy error for user ${req.params.username}:`, err);
      if (!res.headersSent) {
        res.writeHead(502);
      }
      res.end("Bad Gateway");
    },
  } as any);

  return proxy(req, res, next);
};

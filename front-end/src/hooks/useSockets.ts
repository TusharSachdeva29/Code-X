import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

export function useSocket(dockerBackendUrl?: string | null) {
  const [socketS3, setSocketS3] = useState<Socket | null>(null);
  const [socketDocker, setSocketDocker] = useState<Socket | null>(null);

  useEffect(() => {
    const s = io(import.meta.env.VITE_WEB_SOCKET_URL, {
      transports: ["websocket"],
      // Keep this socket isolated from other sockets on the same origin.
      forceNew: true,
      multiplex: false,
    });

    setSocketS3(s);

    return () => {
      s.disconnect();
      setSocketS3(null);
    };
  }, [setSocketS3]);

  useEffect(() => {
    // Only connect when per-user container URL is available.
    // Connecting early to the root URL can create SID/path mismatches.
    const url = dockerBackendUrl;

    if (!url) {
      console.log("No per-user Docker backend URL available yet");
      return;
    }
    
    console.log("Connecting Docker socket to:", url);
    
    // Extract the path from the URL for Socket.io
    // URL like http://20.204.187.189/user/tushar-sachdeva/3000
    // needs path: /user/tushar-sachdeva/3000/socket.io/
    let socketPath = "/socket.io/";
    let baseUrl = url;
    
    try {
      const urlObj = new URL(url);
      if (urlObj.pathname && urlObj.pathname !== "/") {
        // Custom path - need to append socket.io to it
        socketPath = urlObj.pathname.replace(/\/$/, "") + "/socket.io/";
        baseUrl = urlObj.origin;
      }
    } catch (e) {
      console.error("Failed to parse URL:", e);
    }
    
    console.log("Socket.io base URL:", baseUrl, "path:", socketPath);
    
    const s = io(baseUrl, {
      path: socketPath,
      // Use polling first so the HTTP handshake works through the multi-hop
      // proxy chain (nginx → k8s-orchestrator → user pod), then upgrade to WS.
      transports: ["polling", "websocket"],
      // Prevent sharing a manager with the S3/default socket path.
      forceNew: true,
      multiplex: false,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,
    });

    s.on("connect", () => {
      console.log("✅ Docker socket connected");
    });

    s.on("connect_error", (err) => {
      console.error("❌ Docker socket connection error:", err.message);
    });

    setSocketDocker(s);

    return () => {
      s.disconnect();
      setSocketDocker(null);
    };
  }, [dockerBackendUrl]);

  return { socketS3, socketDocker };
}

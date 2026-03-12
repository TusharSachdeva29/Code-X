import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

export function useSocket(dockerBackendUrl?: string | null) {
  const [socketS3, setSocketS3] = useState<Socket | null>(null);
  const [socketDocker, setSocketDocker] = useState<Socket | null>(null);

  useEffect(() => {
    const s = io(import.meta.env.VITE_WEB_SOCKET_URL, {
      transports: ["websocket"],
    });

    setSocketS3(s);

    return () => {
      s.disconnect();
      setSocketS3(null);
    };
  }, [setSocketS3]);

  useEffect(() => {
    // Use provided URL (per-user container) or fallback to env variable
    const url = dockerBackendUrl || import.meta.env.VITE_DOCKER_BACKEND;
    
    if (!url) {
      console.log("No Docker backend URL available yet");
      return;
    }
    
    console.log("Connecting Docker socket to:", url);
    
    const s = io(url, {
      transports: ["websocket"],
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

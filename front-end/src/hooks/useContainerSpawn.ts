import { useState, useCallback } from "react";
import { spawnUserContainer } from "@/api/container/spawn";

interface UseContainerSpawnResult {
  isSpawning: boolean;
  isSpawned: boolean;
  error: string | null;
  containerUrl: string | null;
  spawn: (username: string) => Promise<void>;
}

export function useContainerSpawn(): UseContainerSpawnResult {
  const [isSpawning, setIsSpawning] = useState(false);
  const [isSpawned, setIsSpawned] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [containerUrl, setContainerUrl] = useState<string | null>(null);

  const spawn = useCallback(async (username: string) => {
    if (isSpawned || isSpawning) return;
    
    setIsSpawning(true);
    setError(null);
    
    try {
      const result = await spawnUserContainer(username);
      console.log("✅ Container spawned:", result);
      
      // The container URL will be routed through the k8s orchestrator
      const baseUrl = import.meta.env.VITE_WEB_SOCKET_URL?.replace(/\/$/, "");
      const userContainerUrl = `${baseUrl}/user/${username.toLowerCase().replace(/[^a-z0-9-]/g, "-")}/3000`;
      
      setContainerUrl(userContainerUrl);
      setIsSpawned(true);
    } catch (err: any) {
      console.error("❌ Failed to spawn container:", err);
      // If already exists, that's okay
      if (err.response?.status === 409 || err.message?.includes("already exists")) {
        const baseUrl = import.meta.env.VITE_WEB_SOCKET_URL?.replace(/\/$/, "");
        const userContainerUrl = `${baseUrl}/user/${username.toLowerCase().replace(/[^a-z0-9-]/g, "-")}/3000`;
        setContainerUrl(userContainerUrl);
        setIsSpawned(true);
      } else {
        setError(err.message || "Failed to spawn container");
      }
    } finally {
      setIsSpawning(false);
    }
  }, [isSpawned, isSpawning]);

  return {
    isSpawning,
    isSpawned,
    error,
    containerUrl,
    spawn,
  };
}

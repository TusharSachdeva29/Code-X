import { useState, useCallback } from "react";
import { spawnUserContainer } from "@/api/container/spawn";

/**
 * Poll the user container's /health endpoint (via the nginx → k8s-orchestrator
 * proxy chain) until it responds 200 or we exhaust attempts.
 */
async function waitForContainerReady(
  healthUrl: string,
  maxAttempts = 30,
  delayMs = 3000
): Promise<boolean> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const res = await fetch(healthUrl, { signal: AbortSignal.timeout(4000) });
      if (res.ok) {
        console.log(`✅ Container ready after ${i + 1} attempt(s)`);
        return true;
      }
    } catch {
      // Container not reachable yet — keep waiting
    }
    console.log(`⏳ Waiting for container… attempt ${i + 1}/${maxAttempts}`);
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
  console.warn("⚠️ Container readiness timed out – connecting anyway");
  return false;
}

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
      const sanitized = username.toLowerCase().replace(/[^a-z0-9-]/g, "-");
      const userContainerUrl = `${baseUrl}/user/${sanitized}/3000`;

      // Wait for the pod to be ready before handing the URL to useSocket.
      // The health endpoint travels: browser → nginx → k8s-orchestrator → user pod.
      await waitForContainerReady(`${userContainerUrl}/health`);

      setContainerUrl(userContainerUrl);
      setIsSpawned(true);
    } catch (err: any) {
      console.error("❌ Failed to spawn container:", err);
      // If already exists, that's okay
      if (err.response?.status === 409 || err.message?.includes("already exists")) {
        const baseUrl = import.meta.env.VITE_WEB_SOCKET_URL?.replace(/\/$/, "");
        const sanitized = username.toLowerCase().replace(/[^a-z0-9-]/g, "-");
        const userContainerUrl = `${baseUrl}/user/${sanitized}/3000`;
        // Container already existed – still wait for it to be reachable
        await waitForContainerReady(`${userContainerUrl}/health`);
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

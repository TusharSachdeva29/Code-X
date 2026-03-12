import axios from "axios";

interface SpawnResponse {
  message: string;
  deployment?: any;
  proxyUrl?: string;
}

// Use base URL without /api/ since spawn is at root
const spawnClient = axios.create({
  baseURL: import.meta.env.VITE_WEB_SOCKET_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

spawnClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export async function spawnUserContainer(username: string): Promise<SpawnResponse> {
  const response = await spawnClient.post<SpawnResponse>("/spawn", { username });
  return response.data;
}

export async function deleteUserContainer(username: string): Promise<{ message: string }> {
  const response = await spawnClient.post<{ message: string }>("/delete", { username });
  return response.data;
}

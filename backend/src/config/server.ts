import cors from "cors";

const allowedOrigins = process.env.CLIENT_ORIGIN?.split(",") || ["http://localhost:5173"];

export const corsConfig = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(null, true); // Allow all for development
    }
  },
  credentials: true,
};

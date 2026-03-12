import dotenv from "dotenv";

dotenv.config();

export const PORT = process.env.PORT || 3001;

// Support both CLIENT_ORIGIN and CLIENT_ORIGINS (comma-separated)
const originsEnv = process.env.CLIENT_ORIGINS || process.env.CLIENT_ORIGIN || "*";
export const CLIENT_ORIGIN = originsEnv.includes(",") 
  ? originsEnv.split(",").map(o => o.trim())
  : originsEnv;

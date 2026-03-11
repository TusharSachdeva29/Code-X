import { Request, Response } from "express";
import dotenv from "dotenv";
import { downloadBlob } from "../../lib/blob-service";
import { project } from "../../dummy-data";

dotenv.config();

export const loadFile = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, path } = req.body;
    const { name } = project;

    if (!username || !name || !path) {
      res
        .status(400)
        .json({ message: "Missing username, projectName, or path" });
      return;
    }

    const finalPath = `users/${username}/${name}/${path}`;

    const fileContent = await downloadBlob(finalPath);

    res.status(200).json({ content: fileContent });
  } catch (error) {
    console.error("❌ Error fetching file from Azure Blob Storage:", error);
    res.status(500).json({ message: "Failed to load file" });
  }
};

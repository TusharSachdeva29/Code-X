import { Request, Response } from "express";
import dotenv from "dotenv";
import { project } from "../../dummy-data";
import { uploadBlob } from "../../lib/blob-service";

dotenv.config();

export const saveFile = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { username, path, content } = req.body;
    const { name: projectName } = project;

    if (!username || !projectName || !path || content === undefined) {
      res
        .status(400)
        .json({ message: "Missing username, projectName, path, or content" });
      return;
    }

    const finalPath = `users/${username}/${projectName}/${path}`;

    await uploadBlob(finalPath, content);

    console.log(`✅ File saved to Azure Blob Storage at: ${finalPath}`);
    res.status(200).json({ message: "File saved successfully" });
  } catch (error) {
    console.error("❌ Error uploading to Azure Blob Storage:", error);
    res.status(500).json({ message: "Failed to save file to Azure Blob Storage" });
  }
};

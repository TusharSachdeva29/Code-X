import { Request, Response } from "express";
import { uploadBlob } from "../../lib/blob-service";
import { project } from "../../dummy-data";

export default async function addBlobObject(req: Request, res: Response) {
  const { name } = project;
  const { path, type, content, username } = req.body;

  if (!path || !type) {
    res.status(400).json({ message: "Path and type are required." });
    return;
  }

  const finalPath = `users/${username}/${name}/${path}`;
  const key = type === "folder" ? finalPath.replace(/\/?$/, "/") : finalPath;
  const blobContent = type === "file" ? content || "" : "";

  try {
    await uploadBlob(key, blobContent);

    res.status(200).json({
      message: `${type} created successfully ✅`,
      key,
    });
  } catch (err) {
    console.error("❌ Error uploading to Azure Blob Storage:", err);
    res.status(500).json({ message: "Failed to upload", error: err });
  }
}

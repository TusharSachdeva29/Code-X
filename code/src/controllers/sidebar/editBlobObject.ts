import { Request, Response } from "express";
import { copyBlob, deleteBlob } from "../../lib/blob-service";
import dotenv from "dotenv";
import { project } from "../../dummy-data";

dotenv.config();

interface RenameBlobObjectPayload {
  name: string;
  path: string;
  username: string;
}

export default async function editBlobObject(req: Request, res: Response) {
  const { name: project_name } = project;
  const { name, path, username }: RenameBlobObjectPayload = req.body;

  if (!name || !path) {
    res.status(400).json({ message: "Missing name or path in request body" });
    return;
  }

  const finalPath = `users/${username}/${project_name}/${path}`;

  const pathSegments = finalPath.split("/");
  pathSegments[pathSegments.length - 1] = name;
  const newKey = pathSegments.join("/");

  try {
    // Copy blob to new location
    await copyBlob(finalPath, newKey);

    // Delete the original blob
    await deleteBlob(finalPath);

    res.status(200).json({
      message: "File renamed successfully",
      newPath: newKey,
    });
  } catch (err) {
    console.error("Azure Blob Rename Error:", err);
    res.status(500).json({ message: "Failed to rename file", error: err });
  }
}

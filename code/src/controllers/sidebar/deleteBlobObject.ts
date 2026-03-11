import { Request, Response } from "express";
import { deleteBlob, blobExists, deleteBlobsByPrefix } from "../../lib/blob-service";
import dotenv from "dotenv";
import { project } from "../../dummy-data";

dotenv.config();

export default async function deleteBlobObject(req: Request, res: Response) {
  const { name: project_name } = project;
  const { path, type, username } = req.body;

  if (!path) {
    res.status(400).json({ message: "Missing name or path in request body" });
    return;
  }

  if (type === "file") {
    const finalPath = `users/${username}/${project_name}/${path}`;

    try {
      const exists = await blobExists(finalPath);
      if (!exists) {
        console.warn("⚠️ File not found in Azure Blob Storage:", finalPath);
      }

      await deleteBlob(finalPath);

      console.log(`✅ Deleted: ${finalPath}`);

      res.status(200).json({
        message: "File deleted successfully",
      });
    } catch (err) {
      console.error("Azure Blob Delete Error:", err);
      res.status(500).json({ message: "Failed to delete file", error: err });
    }
  } else {
    try {
      const finalPrefix =
        `users/${username}/${project_name}/${path}`.replace(/\/+$/, "") + "/";

      const deletedKeys = await deleteBlobsByPrefix(finalPrefix);

      if (deletedKeys.length === 0) {
        res.status(404).json({ message: "No objects found under folder" });
        return;
      }

      res.status(200).json({
        message: `✅ Folder and its contents deleted successfully`,
        deleted: deletedKeys.map((key) => ({ Key: key })),
      });
    } catch (err) {
      console.error("❌ Azure Blob folder delete error:", err);
      res.status(500).json({ message: "Failed to delete folder", error: err });
    }
  }
}

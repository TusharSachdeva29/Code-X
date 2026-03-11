import { Request, Response } from "express";
import { listBlobs } from "../../lib/blob-service";
import dotenv from "dotenv";
import { parseBlobObjectToTree } from "../../lib/tree-folder";
import { BlobObject } from "../../types/blob-object";

dotenv.config();

export default async function getFolderStructureTree(req: Request, res: Response) {
  const {username} = req.body;

  const prefix = `users/${username}/VCode`;

  try {
    const blobs = await listBlobs(prefix);

    if(blobs.length === 0){
        res.json([]);
        return;
    }

    const final = blobs.map(blob => {
        const parts = blob.name.split("/").slice(3); 
        return {
            key: parts.join("/"),
            lastModified: blob.lastModified,
            size: blob.size,
        };
    });

    const tree_structure = parseBlobObjectToTree(final as BlobObject[]);

    res.json(tree_structure);
  } catch (err) {
    console.error("Error fetching Azure Blob folder structure:", err);
    res.status(500).json({ error: "Failed to get blob folder structure" });
  }
}

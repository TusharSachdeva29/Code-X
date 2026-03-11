import { Request, Response } from "express";
import fs from "fs";
import path from "path";
import { listBlobs, downloadBlobAsBuffer } from "../../lib/blob-service";
import { project, user } from "../../dummy-data";

export const copyCodeToLocal = async (req: Request, res: Response) => {
  const { username } = user;
  const { name } = project;

  const localDir = path.resolve(__dirname, process.env.COPY_DIST!);
  const finalPath = `users/${username}/${name}/`;

  console.log(`📁 Local target: ${localDir}`);
  console.log(`🌐 Azure Blob prefix: ${finalPath}`);

  try {
    if (fs.existsSync(localDir)) {
      fs.rmSync(localDir, { recursive: true, force: true });
      console.log("🗑️ Cleaned up previous local directory");
    }

    const blobs = await listBlobs(finalPath);

    if (blobs.length === 0) {
      res.status(404).json({ error: "No files found under that prefix." });
      return;
    }

    for (const blob of blobs) {
      const key = blob.name;
      if (!key || key.endsWith("/")) continue;

      const relativePath = key.replace(finalPath, "");
      const localFilePath = path.join(localDir, relativePath);
      const dirPath = path.dirname(localFilePath);

      fs.mkdirSync(dirPath, { recursive: true });

      const blobContent = await downloadBlobAsBuffer(key);
      fs.writeFileSync(localFilePath, blobContent);

      console.log(`✅ Downloaded: ${key} -> ${localFilePath}`);
    }

    res.status(200).json({ message: "✅ Folder downloaded successfully." });
  } catch (err: any) {
    console.error("❌ Azure Blob Download Error:", err);
    res.status(500).json({ error: "Internal Server Error", details: err.message });
  }
};

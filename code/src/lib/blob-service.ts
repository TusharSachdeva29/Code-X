import { BlobServiceClient, ContainerClient } from "@azure/storage-blob";

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING!;
const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME!;

const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
export const containerClient: ContainerClient = blobServiceClient.getContainerClient(containerName);

/**
 * Upload a blob (file or empty folder marker) to Azure Blob Storage
 */
export async function uploadBlob(blobName: string, content: string | Buffer): Promise<void> {
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);
  const data = typeof content === "string" ? Buffer.from(content, "utf-8") : content;
  await blockBlobClient.upload(data, data.length, {
    blobHTTPHeaders: { blobContentType: "text/plain" },
  });
}

/**
 * Download a blob's content as a string
 */
export async function downloadBlob(blobName: string): Promise<string> {
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);
  const downloadResponse = await blockBlobClient.download(0);
  const downloaded = await streamToBuffer(downloadResponse.readableStreamBody!);
  return downloaded.toString("utf-8");
}

/**
 * Delete a single blob
 */
export async function deleteBlob(blobName: string): Promise<void> {
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);
  await blockBlobClient.deleteIfExists();
}

/**
 * Check if a blob exists
 */
export async function blobExists(blobName: string): Promise<boolean> {
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);
  return await blockBlobClient.exists();
}

/**
 * List all blobs with a given prefix
 */
export async function listBlobs(prefix: string): Promise<Array<{ name: string; lastModified?: Date; size?: number }>> {
  const blobs: Array<{ name: string; lastModified?: Date; size?: number }> = [];
  for await (const blob of containerClient.listBlobsFlat({ prefix })) {
    blobs.push({
      name: blob.name,
      lastModified: blob.properties.lastModified,
      size: blob.properties.contentLength,
    });
  }
  return blobs;
}

/**
 * Delete all blobs with a given prefix (folder deletion)
 */
export async function deleteBlobsByPrefix(prefix: string): Promise<string[]> {
  const deletedKeys: string[] = [];
  for await (const blob of containerClient.listBlobsFlat({ prefix })) {
    await containerClient.deleteBlob(blob.name);
    deletedKeys.push(blob.name);
  }
  return deletedKeys;
}

/**
 * Copy a blob from source to destination
 */
export async function copyBlob(sourceKey: string, destinationKey: string): Promise<void> {
  const sourceBlobClient = containerClient.getBlockBlobClient(sourceKey);
  const destBlobClient = containerClient.getBlockBlobClient(destinationKey);
  
  const sourceUrl = sourceBlobClient.url;
  await destBlobClient.beginCopyFromURL(sourceUrl);
}

/**
 * Download blob as buffer
 */
export async function downloadBlobAsBuffer(blobName: string): Promise<Buffer> {
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);
  const downloadResponse = await blockBlobClient.download(0);
  return await streamToBuffer(downloadResponse.readableStreamBody!);
}

/**
 * Helper function to convert a readable stream to a Buffer
 */
async function streamToBuffer(readableStream: NodeJS.ReadableStream): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    readableStream.on("data", (data) => {
      chunks.push(Buffer.isBuffer(data) ? data : Buffer.from(data));
    });
    readableStream.on("end", () => {
      resolve(Buffer.concat(chunks));
    });
    readableStream.on("error", reject);
  });
}

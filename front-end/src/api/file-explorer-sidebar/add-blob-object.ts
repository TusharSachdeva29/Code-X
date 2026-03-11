import axiosBackendClient from "@/lib/axios-backend-client";
import axiosDockerClient from "@/lib/axios-docker-client";
import type { AddBlobObjectPayload } from "@/types/file-structure";

export const addBlobObject = async (payload: AddBlobObjectPayload) => {
  try {
    // API endpoints kept the same for backward compatibility
    const backendResponse = await axiosBackendClient.post("/sidebar/add-s3-object", payload);
    const dockerResponse = await axiosDockerClient.post("/folder-structure/add-file-folder", payload);
    return {
      blob: backendResponse.data,
      backend: dockerResponse.data,
    };
  } catch (error) {
    console.error("❌ Failed to add object to Azure Blob Storage or backend:", error);
    throw error;
  }
};

// Keep backward compatibility export
export const addS3Object = addBlobObject;

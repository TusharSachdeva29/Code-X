import axiosBackendClient from "@/lib/axios-backend-client";
import axiosDockerClient from "@/lib/axios-docker-client";
import type { DeleteBlobObjectPayload } from "@/types/file-structure";

export const deleteBlobObject = async (payload: DeleteBlobObjectPayload) => {
  try {
    // API endpoints kept the same for backward compatibility
    const backendResponse = await axiosBackendClient.put("/sidebar/delete-s3-object", payload);
    const dockerResponse = await axiosDockerClient.post("/folder-structure/delete-file-folder", payload);

    return {
      blob: backendResponse.data,
      docker: dockerResponse.data,
    };
  } catch (error) {
    console.error("❌ Failed to delete Azure Blob object or backend file:", error);
    throw error;
  }
};

// Keep backward compatibility export
export const deleteS3Object = deleteBlobObject;

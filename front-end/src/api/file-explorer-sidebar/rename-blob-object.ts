import axiosBackendClient from "@/lib/axios-backend-client";
import type { RenameBlobObjectPayload } from "@/types/file-structure";

export const renameBlobObject = async (payload: RenameBlobObjectPayload) => {
  // API endpoint kept the same for backward compatibility
  const response = await axiosBackendClient.put("/sidebar/edit-s3-object", payload);
  return response.data;
};

// Keep backward compatibility export
export const renameS3Object = renameBlobObject;

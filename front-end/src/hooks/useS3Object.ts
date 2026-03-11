// Re-export from useBlobObject for backward compatibility
// This file is deprecated - use useBlobObject.ts instead
export {
  useAddBlobObject,
  useDeleteBlobObject,
  useRenameBlobObject,
  useAddBlobObject as useAddS3Object,
  useDeleteBlobObject as useDeleteS3Object,
  useRenameBlobObject as useRenameS3Object,
} from "./useBlobObject";

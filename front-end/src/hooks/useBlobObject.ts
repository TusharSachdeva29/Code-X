import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addBlobObject } from "@/api/file-explorer-sidebar/add-blob-object";
import { deleteBlobObject } from "@/api/file-explorer-sidebar/delete-blob-object";
import { renameBlobObject } from "@/api/file-explorer-sidebar/rename-blob-object";
import { useFileTree } from "@/contexts/file-tree-context";

export const useAddBlobObject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addBlobObject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["folder-structure"] });
    },
    onError: (error) => {
      console.error("❌ Failed to add blob object", error);
    },
  });
};

export const useDeleteBlobObject = () => {
  const { setSelectedNode } = useFileTree();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteBlobObject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["folder-structure"] });
      setSelectedNode(null);
    },
    onError: (error) => {
      console.error("❌ Failed to delete blob object", error);
    },
  });
};

export const useRenameBlobObject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: renameBlobObject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["folder-structure"] });
    },
    onError: (error) => {
      console.error("❌ Failed to rename blob object", error);
    },
  });
};

// Keep backward compatibility exports
export const useAddS3Object = useAddBlobObject;
export const useDeleteS3Object = useDeleteBlobObject;
export const useRenameS3Object = useRenameBlobObject;

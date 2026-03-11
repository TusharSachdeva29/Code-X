import type { Socket } from "socket.io-client";

export interface FileNode {
  name: string;
  path: string;
  type: "file" | "folder";
  children?: FileNode[];
  isExpanded?: boolean;
}

export interface BlobObject {
  Key: string;
  Size?: number;
  LastModified?: Date;
}

export interface FileTreeContextType {
  tree: FileNode[];
  setTree: (tree: FileNode[]) => void;
  selectedNode: FileNode | null;
  setSelectedNode: (node: FileNode | null) => void;
  expandedNodes: Set<string>;
  toggleExpanded: (nodeId: string) => void;
  selectingNode: boolean;
  setSelectingNode: (value: boolean) => void;
  code: string;
  setCode: (value: string) => void;
  language: string;
  setLanguage: (value: string) => void;
  socketS3: Socket | null;
  socketDocker: Socket | null;
}

export interface AddBlobObjectPayload {
  path: string;
  type: "file" | "folder";
  content?: string;
}

export interface RenameBlobObjectPayload {
  name: string;
  path: string;
}

export interface DeleteBlobObjectPayload {
  path: string;
  type: "file" | "folder";
}

// Keep backward compatibility aliases
export type S3Object = BlobObject;
export type AddS3ObjectPayload = AddBlobObjectPayload;
export type RenameS3ObjectPayload = RenameBlobObjectPayload;
export type DeleteS3ObjectPayload = DeleteBlobObjectPayload;

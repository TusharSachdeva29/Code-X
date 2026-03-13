import type { Socket } from "socket.io-client";
import { Terminal as XTerminal } from "@xterm/xterm";
import { useEffect, useRef } from "react";
import { useAddS3Object, useDeleteS3Object } from "./useS3Object";
import { saveFile } from "@/api/file-system/save-file";

function normalizeDockerPath(rawPath: string): string {
  if (!rawPath) return "";

  const normalized = rawPath.replace(/\\/g, "/").trim();

  if (!normalized) return "";

  if (!normalized.startsWith("/")) {
    return normalized.replace(/^\.\//, "");
  }

  const rootMatch = normalized.match(/\/(?:s3-code|code)\/(.+)$/);
  if (rootMatch?.[1]) {
    return rootMatch[1];
  }

  return normalized.replace(/^\/+/, "");
}

export function useTerminal(
  socketS3: Socket | null,
  socketDocker: Socket | null
) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const terminalInstance = useRef<XTerminal | null>(null);

  const { mutateAsync: addS3Object } = useAddS3Object();
  const { mutateAsync: deleteS3Object } = useDeleteS3Object();

  // start terminal
  useEffect(() => {
    if (!socketDocker || !terminalRef.current || terminalInstance.current)
      return;

    const term = new XTerminal({
      cols: 80,
      rows: 24,
      cursorBlink: true,
      theme: {
        background: "#1e1e1e",
        foreground: "#ffffff",
      },
    });

    term.open(terminalRef.current);
    terminalInstance.current = term;

    term.onData((data) => {
      socketDocker.emit("terminal:write", data);
    });

    const onTerminalData = (data: string) => {
      term.write(data);
    };

    socketDocker.on("terminal:data", onTerminalData);

    return () => {
      socketDocker.off("terminal:data", onTerminalData);
      term.dispose();
    };
  }, [socketDocker]);

  // add file-folder
  useEffect(() => {
    if (!socketDocker || !socketS3) return;

    const addFileFolder = async ({
      path,
      type,
      content,
    }: {
      path: string;
      type: "file" | "folder";
      content: string;
    }) => {
      const finalpath = normalizeDockerPath(path);
      if (!finalpath) return;
      await addS3Object({ path: finalpath, type, content });
    };

    socketDocker.on("docker:add", addFileFolder);

    return () => {
      socketDocker.off("docker:add", addFileFolder);
    };
  }, [socketDocker, socketS3, addS3Object]);

  // remove file-folder
  useEffect(() => {
    if (!socketDocker || !socketS3) return;

    const deleteFileFolder = async ({
      path,
      type,
    }: {
      path: string;
      type: "file" | "folder";
    }) => {
      const finalpath = normalizeDockerPath(path);
      if (!finalpath) return;
      await deleteS3Object({ path: finalpath, type });
    };

    socketDocker.on("docker:remove", deleteFileFolder);

    return () => {
      socketDocker.off("docker:remove", deleteFileFolder);
    };
  }, [socketDocker, socketS3, deleteS3Object]);

  useEffect(() => {
  if (!socketDocker || !socketS3) return;

  const updateFile = async ({
    path,
    content,
  }: {
    path: string;
    content: string;
  }) => {
    const finalpath = normalizeDockerPath(path);
    if (!finalpath) return;
    await saveFile({ path: finalpath, content });
  };

  socketDocker.on("docker:update", updateFile);

  return () => {
    socketDocker.off("docker:update", updateFile);
  };
}, [socketDocker, socketS3]);

  return terminalRef;
}

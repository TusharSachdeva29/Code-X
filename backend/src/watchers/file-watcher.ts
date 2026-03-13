import chokidar from "chokidar";
import { Server } from "socket.io";
import fs from "fs/promises";
import path from "path";
import { getFileContent } from "../utils/in-memory-map";

function toRelativePath(rootPath: string, targetPath: string): string {
  const relativePath = path.relative(rootPath, targetPath).replace(/\\/g, "/");
  return relativePath;
}

function shouldIgnore(p: string): boolean {
  return IGNORED_DIRS.some(
    (dir) => p.includes(`/${dir}/`) || p.endsWith(`/${dir}`)
  );
}

async function emitFolderContents(io: Server, folderPath: string, watchRootPath: string) {
  if (shouldIgnore(folderPath)) return;

  try {
    const entries = await fs.readdir(folderPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(folderPath, entry.name);

      if (shouldIgnore(fullPath)) continue;

      if (entry.isFile()) {
        const content = await fs.readFile(fullPath, "utf-8");
        const relativePath = toRelativePath(watchRootPath, fullPath);
        if (!relativePath || relativePath.startsWith("..")) continue;

        io.emit("docker:add", {
          path: relativePath,
          type: "file",
          content,
        });
      } else if (entry.isDirectory()) {
        const relativePath = toRelativePath(watchRootPath, fullPath);
        if (!relativePath || relativePath.startsWith("..")) continue;

        io.emit("docker:add", {
          path: relativePath,
          type: "folder",
        });

        await emitFolderContents(io, fullPath, watchRootPath);
      }
    }
  } catch (err) {
    console.error(`❌ Error reading folder ${folderPath}:`, err);
  }
}

export function setupFileWatcher(io: Server) {
  const watchRootPath = path.resolve(process.env.ACTUAL_PATH || "./code");

  const watcher = chokidar.watch(watchRootPath, {
    persistent: true,
    ignoreInitial: false,
    ignored: (path) => shouldIgnore(path),
  });

  watcher
    .on("add", async (filePath) => {
      if (shouldIgnore(filePath)) return;

      try {
        const relativePath = toRelativePath(watchRootPath, filePath);
        if (!relativePath || relativePath.startsWith("..")) return;

        const content = await fs.readFile(filePath, "utf-8");
        io.emit("docker:add", {
          path: relativePath,
          type: "file",
          content,
        });
      } catch (err) {
        console.error(`❌ Error reading file ${filePath}:`, err);
      }
    })
    .on("addDir", async (folderPath) => {
      if (shouldIgnore(folderPath)) return;

      const relativePath = toRelativePath(watchRootPath, folderPath);
      if (!relativePath || relativePath.startsWith("..")) return;

      io.emit("docker:add", {
        path: relativePath,
        type: "folder",
      });

      await emitFolderContents(io, folderPath, watchRootPath);
    })
    .on("unlink", (filePath) => {
      if (shouldIgnore(filePath)) return;

      const relativePath = toRelativePath(watchRootPath, filePath);
      if (!relativePath || relativePath.startsWith("..")) return;

      io.emit("docker:remove", {
        path: relativePath,
        type: "file",
      });
    })
    .on("unlinkDir", (folderPath) => {
      if (shouldIgnore(folderPath)) return;

      const relativePath = toRelativePath(watchRootPath, folderPath);
      if (!relativePath || relativePath.startsWith("..")) return;

      io.emit("docker:remove", {
        path: relativePath,
        type: "folder",
      });
    })
    .on("change", async (filePath) => {
      if (shouldIgnore(filePath)) return;

      const contentFromDisk = await fs.readFile(filePath, "utf-8");
      const contentFromMemory = getFileContent(filePath);

      if (contentFromMemory === contentFromDisk) {
        return;
      }

      try {
        const content = await fs.readFile(filePath, "utf-8");
        const relativePath = toRelativePath(watchRootPath, filePath);
        if (!relativePath || relativePath.startsWith("..")) return;

        io.emit("docker:update", {
          path: relativePath,
          type: "file",
          content:contentFromDisk,
        });
      } catch (err) {
        console.error(`❌ Error reading updated file ${filePath}:`, err);
      }
    });
}

const IGNORED_DIRS = [
  // JavaScript / Node.js
  "node_modules",
  "dist",
  "build",
  "out",
  ".next",
  ".vercel",
  ".turbo",
  "coverage",
  ".eslintcache",
  ".parcel-cache",
  ".yarn",
  ".npm",

  // Python
  "__pycache__",
  ".pytest_cache",
  ".mypy_cache",
  ".venv",
  "venv",
  ".env",
  ".ipynb_checkpoints",

  // C / C++
  "bin",
  "obj",
  ".vscode",
  ".ccls-cache",
  ".clangd",
  "CMakeFiles",
  "cmake-build-debug",
  "cmake-build-release",

  // Common / OS / IDEs / Meta
  ".git",
  ".idea",
  ".DS_Store",
  "logs",
  ".cache",
  ".swp", // Vim temp files
  ".history", // Shell history
  ".editorconfig",
  "Thumbs.db", // Windows junk
];

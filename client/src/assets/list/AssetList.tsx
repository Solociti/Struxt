import { AssetListItem } from "common/models/assets/AssetModel";
import { DirectoryNode } from "./DirectoryView";

/**
 * Create the directory tree to use when rendering the file list
 *
 * @param list
 * @returns
 */
export function createFileTree(list: AssetListItem[]): DirectoryNode {
  const root: DirectoryNode = {
    name: "root",
    path: "/",
    subDirectories: [
      {
        files: [],
        subDirectories: [],
        name: "public",
        path: "/public/",
        defaultOpen: true,
      },
    ],
    files: [],
  };

  for (const item of list) {
    if (item.isExternalSrc) {
      const external = root.subDirectories.find(
        (d) => d.name === "external",
      ) || {
        name: "external",
        path: "/external/",
        isExternalSrc: true,
        preventNewFile: true,
        subDirectories: [],
        files: [],
      };
      if (!root.subDirectories.includes(external)) {
        root.subDirectories.push(external);
      }

      external.files.push(item);
      continue;
    }

    const parts = item.path.split("/").filter(Boolean);
    // remove the last part, which is the filename
    parts.pop();

    let current = root;

    for (const part of parts) {
      const next: DirectoryNode = current.subDirectories.find(
        (d) => d.name === part,
      ) || {
        name: part,
        path: `${current.path}${part}/`,
        subDirectories: [],
        files: [],
      };

      if (!current.subDirectories.includes(next)) {
        current.subDirectories.push(next);
      }

      current = next;
    }

    current.files.push(item);
  }

  const trashDir = root.subDirectories.find((d) => d.name === ".trash");
  if (trashDir) {
    trashDir.preventNewFile = true;
  }

  return root;
}

/**
 * Get all the items in a directory and its sub-directories
 *
 * @param dir
 * @returns
 */
export function getRecursiveDirItems(dir: DirectoryNode): AssetListItem[] {
  const items: AssetListItem[] = [];

  for (const subDir of dir.subDirectories) {
    items.push(...getRecursiveDirItems(subDir));
  }

  items.push(...dir.files);

  return items;
}

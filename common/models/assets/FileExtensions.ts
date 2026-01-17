export const images = [
  "jpg",
  "jpeg",
  "png",
  "gif",
  "webp",
  "svg",
  "bmp",
  "ico",
];
export const videos = ["mp4", "webm", "mov", "avi", "mkv"];
export const audio = ["mp3", "wav", "ogg", "m4a", "flac"];
export const documents = ["pdf", "docx", "xlsx", "pptx", "doc", "xls", "ppt"];

export const textFiles = [
  "txt",
  "md",
  "markdown",
  "js",
  "ts",
  "jsx",
  "tsx",
  "json",
  "html",
  "htm",
  "css",
  "scss",
  "sass",
  "less",
  "xml",
  "yml",
  "yaml",
  "toml",
  "ini",
  "csv",
  "log",
  "sh",
  "bash",
  "py",
  "java",
  "c",
  "cpp",
  "h",
  "php",
  "rb",
  "go",
  "rs",
  "sql",
  "svg",
];

export type FileType = "image" | "video" | "audio" | "document" | "other";

/**
 * Get the file type based on the file extension
 *
 * @param extension The file extension (without the dot)
 * @returns The file type category
 */
export function getFileType(extension: string): FileType {
  const ext = extension.toLowerCase();

  if (images.includes(ext)) {
    return "image";
  }

  if (videos.includes(ext)) {
    return "video";
  }

  if (audio.includes(ext)) {
    return "audio";
  }

  if (documents.includes(ext)) {
    return "document";
  }

  return "other";
}

/**
 * Check if a file is a text file (UTF-8)
 *
 * @param extension The file extension (without the dot)
 * @returns True if the file is a text file
 */
export function isTextFile(extension: string): boolean {
  return textFiles.includes(extension.toLowerCase());
}

/**
 * Check if a file is an image
 *
 * @param extension The file extension (without the dot)
 * @returns True if the file is an image
 */
export function isImage(extension: string): boolean {
  return images.includes(extension.toLowerCase());
}

/**
 * Check if a file is a video
 *
 * @param extension The file extension (without the dot)
 * @returns True if the file is a video
 */
export function isVideo(extension: string): boolean {
  return videos.includes(extension.toLowerCase());
}

/**
 * Check if a file is an audio file
 *
 * @param extension The file extension (without the dot)
 * @returns True if the file is an audio file
 */
export function isAudio(extension: string): boolean {
  return audio.includes(extension.toLowerCase());
}

/**
 * Check if a file is a document
 *
 * @param extension The file extension (without the dot)
 * @returns True if the file is a document
 */
export function isDocument(extension: string): boolean {
  return documents.includes(extension.toLowerCase());
}

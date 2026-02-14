export type FileType =
  | "text"
  | "image"
  | "video"
  | "audio"
  | "document"
  | "other";

interface FileExtensionInfo {
  type: FileType;
  mime: string;
}

const fileExtensions: Record<string, FileExtensionInfo> = {
  avi: { type: "video", mime: "video/x-msvideo" },
  bash: { type: "text", mime: "text/plain" },
  bmp: { type: "image", mime: "image/bmp" },
  c: { type: "text", mime: "text/plain" },
  cpp: { type: "text", mime: "text/plain" },
  css: { type: "text", mime: "text/css" },
  csv: { type: "text", mime: "text/csv" },
  doc: { type: "document", mime: "application/msword" },
  docx: {
    type: "document",
    mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  },
  flac: { type: "audio", mime: "audio/flac" },
  gif: { type: "image", mime: "image/gif" },
  go: { type: "text", mime: "text/plain" },
  h: { type: "text", mime: "text/plain" },
  htm: { type: "text", mime: "text/html" },
  html: { type: "text", mime: "text/html" },
  ico: { type: "image", mime: "image/x-icon" },
  ini: { type: "text", mime: "text/plain" },
  java: { type: "text", mime: "text/plain" },
  jpeg: { type: "image", mime: "image/jpeg" },
  jpg: { type: "image", mime: "image/jpeg" },
  js: { type: "text", mime: "text/javascript" },
  json: { type: "text", mime: "application/json" },
  jsx: { type: "text", mime: "text/plain" },
  less: { type: "text", mime: "text/plain" },
  log: { type: "text", mime: "text/plain" },
  m4a: { type: "audio", mime: "audio/mp4" },
  markdown: { type: "text", mime: "text/markdown" },
  md: { type: "text", mime: "text/markdown" },
  mkv: { type: "video", mime: "video/x-matroska" },
  mov: { type: "video", mime: "video/quicktime" },
  mp3: { type: "audio", mime: "audio/mpeg" },
  mp4: { type: "video", mime: "video/mp4" },
  ogg: { type: "audio", mime: "audio/ogg" },
  pdf: { type: "document", mime: "application/pdf" },
  php: { type: "text", mime: "text/plain" },
  png: { type: "image", mime: "image/png" },
  ppt: { type: "document", mime: "application/vnd.ms-powerpoint" },
  pptx: {
    type: "document",
    mime: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  },
  py: { type: "text", mime: "text/plain" },
  rb: { type: "text", mime: "text/plain" },
  rs: { type: "text", mime: "text/plain" },
  sass: { type: "text", mime: "text/plain" },
  scss: { type: "text", mime: "text/plain" },
  sh: { type: "text", mime: "text/plain" },
  sql: { type: "text", mime: "text/plain" },
  svg: { type: "image", mime: "image/svg+xml" },
  toml: { type: "text", mime: "text/plain" },
  ts: { type: "text", mime: "text/plain" },
  tsx: { type: "text", mime: "text/plain" },
  txt: { type: "text", mime: "text/plain" },
  wav: { type: "audio", mime: "audio/wav" },
  webm: { type: "video", mime: "video/webm" },
  webp: { type: "image", mime: "image/webp" },
  xls: { type: "document", mime: "application/vnd.ms-excel" },
  xlsx: {
    type: "document",
    mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  },
  xml: { type: "text", mime: "application/xml" },
  yaml: { type: "text", mime: "text/plain" },
  yml: { type: "text", mime: "text/plain" },
};

/**
 * Get the file type based on the file extension
 *
 * @param extension The file extension (without the dot)
 * @returns The file type category
 */
export function getFileType(extension: string): FileType {
  const ext = extension.toLowerCase();
  return fileExtensions[ext]?.type ?? "other";
}

/**
 * Check if a file is a text file (UTF-8)
 *
 * @param extension The file extension (without the dot)
 * @returns True if the file is a text file
 */
export function isTextFile(extension: string): boolean {
  return fileExtensions[extension.toLowerCase()]?.type === "text";
}

/**
 * Check if a file is an image
 *
 * @param extension The file extension (without the dot)
 * @returns True if the file is an image
 */
export function isImage(extension: string): boolean {
  return fileExtensions[extension.toLowerCase()]?.type === "image";
}

/**
 * Check if a file is a video
 *
 * @param extension The file extension (without the dot)
 * @returns True if the file is a video
 */
export function isVideo(extension: string): boolean {
  return fileExtensions[extension.toLowerCase()]?.type === "video";
}

/**
 * Check if a file is an audio file
 *
 * @param extension The file extension (without the dot)
 * @returns True if the file is an audio file
 */
export function isAudio(extension: string): boolean {
  return fileExtensions[extension.toLowerCase()]?.type === "audio";
}

/**
 * Check if a file is a document
 *
 * @param extension The file extension (without the dot)
 * @returns True if the file is a document
 */
export function isDocument(extension: string): boolean {
  return fileExtensions[extension.toLowerCase()]?.type === "document";
}

/**
 * Get the MIME type for a file based on its extension
 *
 * @param extension The file extension (without the dot)
 * @returns The MIME type string
 */
export function getMimeTypeLite(extension: string): string {
  const ext = extension.toLowerCase();
  return fileExtensions[ext]?.mime ?? "application/octet-stream";
}

/**
 * Get the file extension from a file name
 *
 * @param fileName
 * @returns
 */
export function getFileExtension(fileName: string): string {
  const parts = fileName.split(".");
  if (parts.length === 1) {
    return "";
  }
  return parts.pop()?.toLowerCase() || "";
}

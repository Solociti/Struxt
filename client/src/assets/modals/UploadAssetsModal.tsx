import {
  batchUploadFiles,
  getFilesToUpload,
  getUploadStatusMessage,
  getZipFileEntries,
} from "client/assets/apis/uploadHelpers";
import { useContentManager } from "client/assets/cm/contentManager";
import { FileIcon } from "client/assets/list/FileIcon";
import StatusIcon from "client/assets/modals/upload/StatusIcon";
import Group from "client/components/Group";
import IconButton from "client/components/IconButton";
import SimpleModal from "client/components/modals/SimpleModal";
import { ShowError } from "client/components/ShowError";
import { useAsyncCallback } from "client/components/useAsyncCallback";
import { useHtmlId } from "client/components/useHtmlId";
import { dirname, extname, join } from "common/path/path";
import { useEffect, useRef, useState } from "react";
import Form from "react-bootstrap/Form";
import ListGroup from "react-bootstrap/ListGroup";

export interface FileToUpload {
  /**
   * Unique identifier for this file in the upload queue.
   */
  localId: number;

  /**
   * The actual file object being uploaded. Can be a File from user selection or a Blob for extracted zip entries.
   * For zip entries, this references the parent zip file that will be processed to extract the entry content.
   */
  file: File | Blob;

  /**
   * The relative filename or path for this file (e.g., logo.png or folder/file.txt).
   * Does NOT start with /. Joined with basePath to create the full project path.
   * For regular files this is the filename, for zip entries this is the path inside the zip.
   * Will be joined with basePath when uploading to create the absolute path for AssetModel.
   */
  path: string;

  /**
   * Current upload state for this file.
   * - pending: File is queued but upload hasn't started
   * - uploading: File is currently being uploaded to the server
   * - complete: File upload finished successfully
   * - error: Upload failed or zip extraction encountered an error
   */
  status: "pending" | "uploading" | "complete" | "error";

  /**
   * When true, indicates that this file should be extracted (for zip files)
   */
  shouldExtract?: boolean;

  /**
   * files added from extracted zip entries will have a reference to the localId of the source zip file
   */
  sourceZipId?: number;

  /**
   * The original zip file for entries extracted from a zip. This is used to read the content of the zip entry when uploading.
   */
  sourceZipFile?: File;

  /**
   * Original filename - for regular files this is file.name, for zip entries this is the path inside the zip.
   * Used for extraction and will enable renaming functionality.
   */
  originalName: string;

  /**
   * When true, indicates that a file with the same path already exists in the project
   */
  hasCollision?: boolean;

  /**
   * When true, this file will overwrite the existing file if there's a collision
   */
  overwrite?: boolean;

  /**
   * User-facing error message when upload or zip extraction fails.
   * Stored as string (not Error object) since this is transient UI state meant for display to users.
   * Error objects are converted to messages at catch sites where full context is available.
   */
  error?: string;
}

let idCounter = 0;

/**
 * Check for path collisions between files to upload and existing assets
 *
 * @param files - Files to check for collisions (with relative paths)
 * @param existingAssets - List of existing assets in the project (with absolute paths)
 * @param basePath - Base path to join with relative paths for comparison
 * @returns Array of files with hasCollision property set
 */
function detectFileNameCollisions(
  files: FileToUpload[],
  existingAssets: { path: string }[],
  basePath: string,
): FileToUpload[] {
  const existingPaths = new Set(existingAssets.map((a) => a.path));

  return files.map((file) => {
    const fullPath = join(basePath, file.path);
    const hasCollision = existingPaths.has(fullPath);
    return {
      ...file,
      hasCollision,
    };
  });
}

/**
 * Modal for uploading files to a project with zip extraction support
 */
export default function UploadAssetsModal() {
  const { commands, project, assets } = useContentManager();
  const { projectId } = project;

  const [show, setShow] = useState(false);

  const [basePath, setBasePath] = useState<string>("/");
  const [files, setFiles] = useState<FileToUpload[]>([]);
  const [uploadCompleted, setUploadCompleted] = useState(false);
  const [isEditingBasePath, setIsEditingBasePath] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const htmlId = useHtmlId();

  /**
   * Recheck all files for collisions with the current basePath
   * Call this whenever basePath changes
   */
  const recheckAllCollisions = () => {
    setFiles((prev) => {
      return detectFileNameCollisions(prev, assets.list || [], basePath);
    });
  };

  useEffect(() => {
    const unregisterShow = commands.on("upload:show", (path: string) => {
      const isDir = path.endsWith("/");
      path = isDir ? path : dirname(path);

      setBasePath(path || "/");
      setShow(true);
      setFiles([]);
      setUploadCompleted(false);
      setIsEditingBasePath(false);
    });

    const unregisterHide = commands.on("upload:hide", () => {
      setBasePath("/");
      setShow(false);
      setFiles([]);
      setUploadCompleted(false);
      setIsEditingBasePath(false);
    });

    return () => {
      unregisterShow();
      unregisterHide();
    };
  }, [commands]);

  /**
   * Updates the state for the file with the given localId
   *
   * @param localId
   * @param updates
   */
  const updateFileState = (
    localId: number,
    updates:
      | Partial<FileToUpload>
      | ((prev: FileToUpload) => Partial<FileToUpload>),
  ) => {
    setFiles((prev) => {
      const index = prev.findIndex((f) => f.localId === localId);
      if (index === -1) return prev;

      const updated = [...prev];
      const partialUpdates =
        typeof updates === "function" ? updates(prev[index]) : updates;
      updated[index] = {
        ...updated[index],
        ...partialUpdates,
      };
      return updated;
    });
  };

  const handleFileSelect = useAsyncCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = event.target.files;
      if (!selectedFiles) return;

      const newFiles: FileToUpload[] = [];

      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const isZip = extname(file.name).toLowerCase() === ".zip";

        const fileItem: FileToUpload = {
          localId: ++idCounter,
          file,
          path: file.name,
          originalName: file.name,
          status: "pending" as const,
          shouldExtract: isZip ? true : undefined,
        };

        newFiles.push(fileItem);

        if (isZip) {
          try {
            const entries = await getZipFileEntries(file, basePath);
            const zipId = fileItem.localId;

            entries.forEach((entry) => {
              newFiles.push({
                localId: ++idCounter,
                file: file,
                path: entry.filename,
                originalName: entry.filename,
                status: "pending" as const,
                sourceZipId: zipId,
                sourceZipFile: file,
                hasCollision: false,
              });
            });
          } catch (error) {
            fileItem.status = "error";
            fileItem.error =
              error instanceof Error ? error.message : "Failed to read zip";
          }
        }
      }

      const files = detectFileNameCollisions(
        newFiles,
        assets.list || [],
        basePath,
      );

      setFiles(files.sort((a, b) => a.path.localeCompare(b.path)));

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    { toastError: false },
  );

  const handleZipOptionChange = useAsyncCallback(
    async (localId: number, shouldExtract: boolean) => {
      const fileItem = files.find((f) => f.localId === localId);
      if (!fileItem) return;

      if (shouldExtract) {
        const entries = await getZipFileEntries(
          fileItem.file as File,
          basePath,
        );

        setFiles((prev) => {
          const index = prev.findIndex((f) => f.localId === localId);
          if (index === -1) return prev;

          const updated = [...prev];
          updated[index] = {
            ...updated[index],
            shouldExtract,
            status: "pending",
            error: undefined,
          };

          const newEntries: FileToUpload[] = entries.map((entry) => ({
            localId: ++idCounter,
            file: fileItem.file,
            path: entry.filename,
            originalName: entry.filename,
            status: "pending" as const,
            sourceZipId: localId,
            sourceZipFile: fileItem.file as File,
            hasCollision: false,
          }));

          const entriesWithCollisions = detectFileNameCollisions(
            newEntries,
            assets.list || [],
            basePath,
          );

          updated.splice(index + 1, 0, ...entriesWithCollisions);
          return updated.sort((a, b) => a.path.localeCompare(b.path));
        });
      } else {
        setFiles((prev) => {
          const updated = prev.map((f) =>
            f.localId === localId
              ? {
                  ...f,
                  shouldExtract,
                  status: "pending" as const,
                  error: undefined,
                }
              : f,
          );

          return updated.filter(
            (f) => f.localId === localId || f.sourceZipId !== localId,
          );
        });
      }
    },
    { toastError: false },
  );

  const handleUpload = useAsyncCallback(
    async () => {
      await batchUploadFiles(
        projectId,
        basePath,
        files,
        (index, status, error) => {
          const file = files[index];
          if (!file) return;

          updateFileState(file.localId, (prev) => ({
            status:
              prev.status !== "error" && status === "uploading"
                ? "uploading"
                : status,
            error,
          }));
        },
      );
      // TODO: get the list of assets uploaded
      commands.trigger("upload", []);
      setUploadCompleted(true);
    },
    { toastError: false },
  );

  const handleClose = () => {
    if (!handleUpload.isLoading) {
      commands.trigger("upload:hide");
    } else {
      // TODO: Cancel ongoing uploads. We can terminate using the AbortController signal.
    }
  };

  const filesToUpload = getFilesToUpload(files);
  const isUploading = handleUpload.isLoading;
  const statusMessage = getUploadStatusMessage(filesToUpload, isUploading);

  const footer = (
    <>
      <div className="flex-grow-1 text-muted small">{statusMessage}</div>
      <IconButton
        icon="close"
        variant="secondary"
        onClick={handleClose}
        disabled={isUploading}
      >
        {isUploading ? "Close" : "Cancel"}
      </IconButton>

      {!uploadCompleted && (
        <IconButton
          icon="upload"
          variant="primary"
          onClick={() => handleUpload.callback()}
          disabled={isUploading || filesToUpload.length === 0}
          spinner={isUploading}
        >
          Upload
        </IconButton>
      )}
    </>
  );

  return (
    <SimpleModal
      show={show}
      onHide={handleClose}
      title="Upload Assets"
      size="lg"
      footer={footer}
      modalProps={{ scrollable: true }}
    >
      <Group prepend="Upload to">
        <Form.Control
          type="text"
          value={basePath}
          onChange={(e) => setBasePath(e.target.value)}
          size="sm"
          disabled={isUploading || uploadCompleted || !isEditingBasePath}
          className="flex-grow-1"
        />

        {isEditingBasePath ? (
          <IconButton
            icon="check"
            variant="outline-success"
            onClick={() => {
              setIsEditingBasePath(false);
              setBasePath((prev) => (prev.endsWith("/") ? prev : `${prev}/`));
              recheckAllCollisions();
            }}
            disabled={isUploading || uploadCompleted}
          />
        ) : (
          <IconButton
            icon="edit"
            variant="outline-secondary"
            onClick={() => {
              setIsEditingBasePath(true);
            }}
            disabled={isUploading || uploadCompleted}
          />
        )}
      </Group>

      <div className="d-flex align-items-center justify-content-center my-3">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={(e) => handleFileSelect.callback(e)}
          style={{ display: "none" }}
        />
        <IconButton
          icon="add"
          variant="outline-primary"
          onClick={() => fileInputRef.current?.click()}
          disabled={
            isUploading || handleFileSelect.isLoading || uploadCompleted
          }
          spinner={handleFileSelect.isLoading}
        >
          Select Files
        </IconButton>
      </div>

      <ShowError error={handleUpload.error} />
      <ShowError error={handleFileSelect.error} />
      <ShowError error={handleZipOptionChange.error} />

      {files.length > 0 && (
        <ListGroup>
          {files.map((fileItem) => {
            if (fileItem.sourceZipId !== undefined) {
              return null;
            }

            return (
              <UploadFileItem
                key={fileItem.localId}
                basePath={basePath}
                fileItem={fileItem}
                files={files}
                assets={assets.list || []}
                handleZipOptionChange={handleZipOptionChange}
                htmlId={htmlId}
                isUploading={isUploading}
                updateFileState={updateFileState}
              />
            );
          })}
        </ListGroup>
      )}
    </SimpleModal>
  );
}

interface UploadFileItemProps {
  fileItem: FileToUpload;
  basePath: string;
  files: FileToUpload[];
  assets: { path: string }[];
  isUploading: boolean;
  updateFileState: (
    localId: number,
    updates:
      | Partial<FileToUpload>
      | ((prev: FileToUpload) => Partial<FileToUpload>),
  ) => void;
  handleZipOptionChange: {
    callback: (localId: number, shouldExtract: boolean) => void;
    isLoading: boolean;
  };
  htmlId: { id: (suffix: string) => string };
  isNested?: boolean;
}

/**
 * Renders a single file item in the upload list with support for zip extraction and collision handling
 * Recursively renders nested files for zip archives
 *
 * @param fileItem - The file to upload
 * @param basePath - The base path where files are being uploaded
 * @param files - All files in the upload queue (used to find extracted files)
 * @param assets - Existing assets in the project
 * @param isUploading - Whether upload is in progress
 * @param updateFileState - Callback to update file state
 * @param handleZipOptionChange - Callback to handle zip extraction toggle
 * @param htmlId - HTML ID generator for form elements
 * @param isNested - Whether this is a nested file (inside a zip)
 */
function UploadFileItem({
  basePath,
  fileItem,
  files,
  assets,
  handleZipOptionChange,
  htmlId,
  isUploading,
  updateFileState,
  isNested = false,
}: UploadFileItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedFileName, setEditedFileName] = useState("");

  // Zip files nested inside another zip are treated as regular files (no extraction)
  const isZip =
    !isNested &&
    (fileItem.file.type === "application/zip" ||
      extname(fileItem.originalName) === ".zip");

  const ext = extname(fileItem.path);
  const extractedFiles = isZip
    ? files.filter((f) => f.sourceZipId === fileItem.localId)
    : [];

  // Disable editing for zip files being extracted (only the extracted contents should be editable)
  const canEdit = !(isZip && fileItem.shouldExtract);

  const handleToggleEdit = () => {
    if (isEditing) {
      if (editedFileName) {
        // Check for collision with the new filename
        const fullPath = join(basePath, editedFileName);
        const existingPaths = new Set(assets.map((a) => a.path));
        const hasCollision = existingPaths.has(fullPath);

        updateFileState(fileItem.localId, {
          path: editedFileName,
          originalName: editedFileName,
          hasCollision,
          overwrite: undefined,
        });
      }
      setIsEditing(false);
      setEditedFileName("");
    } else {
      setIsEditing(true);
      setEditedFileName(fileItem.originalName);
    }
  };

  return (
    <ListGroup.Item>
      <div className="d-flex align-items-center">
        <FileIcon extension={ext} />

        <div className="flex-grow-1 ms-2">
          <div className="d-flex align-items-center">
            {isEditing ? (
              <Group>
                <Form.Control
                  type="text"
                  value={editedFileName}
                  onChange={(e) => setEditedFileName(e.target.value)}
                  size="sm"
                  disabled={isUploading}
                  className="flex-grow-1"
                />
                <IconButton
                  icon="check"
                  size="sm"
                  variant="outline-success"
                  onClick={handleToggleEdit}
                  disabled={isUploading}
                />
              </Group>
            ) : (
              <>
                <div
                  className={
                    "flex-grow-1" +
                    (fileItem.hasCollision && !fileItem.overwrite
                      ? " text-decoration-line-through"
                      : "")
                  }
                >
                  {fileItem.path}
                </div>
                {canEdit && (
                  <IconButton
                    icon="edit"
                    size="sm"
                    variant="outline-secondary"
                    onClick={handleToggleEdit}
                    disabled={isUploading}
                  />
                )}
              </>
            )}

            <div className="ms-2">
              <StatusIcon fileItem={fileItem} />
            </div>
          </div>
          {fileItem.hasCollision && (
            <Form.Check
              id={htmlId.id(`collision-${fileItem.localId}`)}
              type="checkbox"
              label={
                <label
                  htmlFor={htmlId.id(`collision-${fileItem.localId}`)}
                  className="text-warning small d-flex align-items-center"
                >
                  Overwrite?
                </label>
              }
              checked={fileItem.overwrite === true}
              onChange={(e) =>
                updateFileState(fileItem.localId, {
                  overwrite: e.target.checked,
                })
              }
              disabled={isUploading}
              className="mt-1"
            />
          )}
          {isZip && (
            <Form.Check
              id={htmlId.id(`extract-${fileItem.localId}`)}
              type="checkbox"
              label={
                <label
                  htmlFor={htmlId.id(`extract-${fileItem.localId}`)}
                  className="text-muted small"
                >
                  Extract
                </label>
              }
              checked={fileItem.shouldExtract === true}
              onChange={(e) =>
                handleZipOptionChange.callback(
                  fileItem.localId,
                  e.target.checked,
                )
              }
              disabled={isUploading || handleZipOptionChange.isLoading}
              className="mt-1"
            />
          )}
          {fileItem.status === "error" && fileItem.error && (
            <div className="text-danger small mt-1">{fileItem.error}</div>
          )}
        </div>
      </div>

      {isZip && fileItem.shouldExtract && extractedFiles.length > 0 && (
        <div className="mt-2">
          <ListGroup variant="flush">
            {extractedFiles.map((extracted) => (
              <UploadFileItem
                key={extracted.localId}
                basePath={basePath}
                fileItem={extracted}
                files={files}
                assets={assets}
                handleZipOptionChange={handleZipOptionChange}
                htmlId={htmlId}
                isUploading={isUploading}
                updateFileState={updateFileState}
                isNested={true}
              />
            ))}
          </ListGroup>
        </div>
      )}
    </ListGroup.Item>
  );
}

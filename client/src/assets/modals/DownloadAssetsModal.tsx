import { BlobWriter, ZipWriter } from "@zip.js/zip.js";
import { useLoadAsync } from "client/api/useLoadAsync";
import IconButton from "client/components/IconButton";
import SimpleModal from "client/components/modals/SimpleModal";
import { useAsyncCallback } from "client/components/useAsyncCallback";
import { formatStorageSize } from "common/format/storageSize";
import { AssetListItem, AssetModel } from "common/models/assets/AssetModel";
import { basename, extname, relative } from "common/path/path";
import { useEffect, useRef, useState } from "react";
import ListGroup from "react-bootstrap/ListGroup";
import Spinner from "react-bootstrap/Spinner";
import { getAsset } from "../assetApis";
import { getAssetUrl } from "../assetUtils";
import { useContentManager } from "../cm/contentManager";
import { FileIcon } from "../list/FileIcon";

/**
 * When a single file is selected, download that file.
 * When multiple files are selected, show a modal with the directory structure that will be
 * downloaded as a zip file, and a button to trigger the download.
 *
 * @returns
 */
export function DownloadAssetsModal() {
  const { commands, project } = useContentManager();
  const { projectId } = project;

  const [show, setShow] = useState(false);
  const [items, setItems] = useState<AssetListItem[]>([]);
  const [srcPath, setSrcPath] = useState("");

  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const _loadedAssets = useRef<AssetModel[]>([]);
  const { response: assets, isLoading } = useLoadAsync(async () => {
    if (!show || items.length === 0) {
      return null;
    }

    // Load asset details for all items so we have the file size to show in the UI
    const loadedAssets = await Promise.all(
      items.map((item) => {
        // Check if we already loaded this asset to avoid duplicate API calls
        const cached = _loadedAssets.current.find((a) => a.uuid === item.uuid);
        if (cached) {
          return cached;
        }
        return getAsset(projectId, item.uuid);
      }),
    );
    _loadedAssets.current = loadedAssets;

    return loadedAssets;
  }, [projectId, items, show]);

  useEffect(() => {
    const unregister: Function[] = [];

    unregister.push(
      commands.on("download:show", (src, items) => {
        setShow(true);
        setItems(items);
        setSrcPath(src.path);
        setCompletedIds([]);
        setProcessingId(null);
      }),
    );

    unregister.push(
      commands.on("download:hide", () => {
        setShow(false);
        setItems([]);
        setSrcPath("");
      }),
    );

    return () => {
      unregister.forEach((cb) => cb());
    };
  }, [commands]);

  const handleHide = () => {
    commands.trigger("download:hide");
  };

  const handleDownload = useAsyncCallback(
    async () => {
      // Setup the writer
      let zipWriter: ZipWriter<any>;
      let blobWriter: BlobWriter | null = null;
      const fileName = `${basename(srcPath) || "assets"}.zip`;

      if ("showSaveFilePicker" in window) {
        // @ts-ignore - Experimental API not in all TS definitions yet
        const handle = await window.showSaveFilePicker({
          suggestedName: fileName,
          types: [
            {
              description: "ZIP Archive",
              accept: { "application/zip": [".zip"] },
            },
          ],
        });

        const writable = await handle.createWritable();
        zipWriter = new ZipWriter(writable);
      } else {
        // Fallback: Buffer in memory using BlobWriter
        blobWriter = new BlobWriter("application/zip");
        zipWriter = new ZipWriter(blobWriter);
      }

      try {
        for (const item of items) {
          setProcessingId(item.uuid);

          // Stream the file contents into the zip
          const url = getAssetUrl(item, projectId);
          const response = await fetch(url);

          if (!response.ok) {
            throw new Error(`Failed to fetch ${item.path}`);
          }
          if (!response.body) {
            throw new Error(`No content for ${item.path}`);
          }

          await zipWriter.add(relative("/", item.path), response.body);

          setCompletedIds((prev) => [...prev, item.uuid]);
        }
      } finally {
        setProcessingId(null);
        await zipWriter.close();
      }

      // If we used the BlobWriter fallback, trigger the download manually
      if (blobWriter) {
        const blob = await blobWriter.getData();
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        // Delay revoking the URL to avoid cancelling the download in some browsers
        setTimeout(() => URL.revokeObjectURL(url), 100);
      }

      // Close modal on success
      handleHide();
    },
    {
      toastError: true,
    },
  );

  return (
    <SimpleModal
      show={show}
      onHide={handleHide}
      title="Download Assets"
      footer={
        <>
          <IconButton icon="close" variant="secondary" onClick={handleHide}>
            Close
          </IconButton>
          <IconButton
            icon="download"
            variant="primary"
            disabled={
              isLoading || handleDownload.isLoading || items.length === 0
            }
            spinner={handleDownload.isLoading}
            onClick={handleDownload.callback}
          >
            Download
          </IconButton>
        </>
      }
    >
      <div>
        {/* show the directory structure that will get downloaded as a zip */}
        <ListGroup>
          {items.map((item) => {
            const isCompleted = completedIds.includes(item.uuid);
            const isProcessing = processingId === item.uuid;
            const isQueued =
              handleDownload.isLoading && !isCompleted && !isProcessing;

            const asset = assets?.find((a) => a.uuid === item.uuid);

            return (
              <ListGroup.Item
                key={item.uuid}
                className={`d-flex align-items-center ${isQueued ? "text-muted" : ""} ${isCompleted ? "text-success" : ""}`}
              >
                <FileIcon extension={extname(item.path).replace(/^\./, "")} />

                <div className="flex-grow-1">{item.path}</div>
                {isProcessing && (
                  <Spinner size="sm" animation="border" className="ms-2" />
                )}
                <div className="text-muted small ms-2">
                  {isLoading
                    ? "..."
                    : asset
                      ? formatStorageSize(asset.size)
                      : "? B"}
                </div>
              </ListGroup.Item>
            );
          })}
        </ListGroup>
      </div>
    </SimpleModal>
  );
}

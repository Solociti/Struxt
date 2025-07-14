import { AssetsResultProps, useEditor } from "@grapesjs/react";
import IconButton from "client/components/IconButton";
import type { Asset } from "grapesjs";
import Badge from "react-bootstrap/Badge";
import Button from "react-bootstrap/Button";

export type CustomAssetManagerProps = Pick<
  AssetsResultProps,
  "assets" | "close" | "select"
>;

export function CustomAssetManager({
  assets,
  select,
}: CustomAssetManagerProps) {
  const editor = useEditor();

  const remove = (asset: Asset) => {
    // TODO: confirm before removing
    editor.Assets.remove(asset);
  };

  return (
    <div className="row g-2 pe-2">
      <style>{`
        .asset-item .asset-overlay {
          transition: opacity 0.2s ease-in-out;
        }
        .asset-item:hover .asset-overlay {
          opacity: 1 !important;
        }
      `}</style>

      {assets.map((asset) => (
        <div
          key={asset.getSrc()}
          className="col-4 position-relative rounded overflow-hidden asset-item"
          onClick={() => select(asset, true)}
        >
          <img className="d-block w-100 border rounded" src={asset.getSrc()} />

          <div className="d-flex flex-nowrap justify-content-between position-absolute bottom-0 start-0 w-100 py-1 px-2">
            <Badge bg="info" className="me-1 text-truncate">
              {asset.getFilename()}
            </Badge>
          </div>

          <div className="d-flex align-items-center justify-content-center position-absolute top-0 start-0 w-100 h-100 p-3 bg-dark bg-opacity-75 opacity-0 asset-overlay">
            <Button
              variant="light"
              size="sm"
              onClick={() => select(asset, true)}
            >
              Select
            </Button>

            <IconButton
              variant="outline-danger"
              size="sm"
              icon="delete"
              className="position-absolute top-0 end-0 m-2"
              onClick={(event) => {
                event.stopPropagation();
                remove(asset);
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

import { FileIcon } from "client/assets/list/FileIcon";
import IconButton from "client/components/IconButton";
import MaterialIcon from "client/components/MaterialIcon";
import { centerTruncateText } from "common/format/text";
import { AssetListItem } from "common/models/assets/AssetModel";
import { dirname, extname } from "common/path/path";
import { useState } from "react";
import Dropdown from "react-bootstrap/Dropdown";
import Form from "react-bootstrap/Form";

interface ChooseAssetProps {
  assetId: string | null;
  onChange: (assetId: string) => void;

  isInvalid?: boolean;

  /**
   * The list of assets to choose from.
   */
  list: AssetListItem[];
}

/**
 * Input component to choose an asset for a trigger.
 *
 * @param param0
 */
export function ChooseAsset({
  assetId,
  onChange,
  list,
  isInvalid,
}: ChooseAssetProps) {
  if (assetId) {
    return (
      <ShowCurrentAsset
        assetId={assetId}
        list={list}
        clearAsset={() => onChange("")}
        isInvalid={isInvalid}
      />
    );
  }

  return (
    <ShowSelectionDropdown
      list={list}
      onSelect={(id) => {
        onChange(id);
      }}
      isInvalid={isInvalid}
    />
  );
}

/**
 * The asset selection dropdown
 *
 * @param param0
 * @returns
 */
function ShowSelectionDropdown({
  list,
  onSelect,
  isInvalid,
}: {
  list: AssetListItem[];
  onSelect: (assetId: string) => void;
  isInvalid?: boolean;
}) {
  const [search, setSearch] = useState("");

  const filtered = list
    .filter((asset) => {
      if (asset.isExternalSrc) {
        return false;
      }

      if (!search) {
        return true;
      }

      if (asset.path.toLowerCase().includes(search.toLowerCase())) {
        return true;
      }

      return false;
    })
    .sort((a, b) => {
      if (a.displayName === b.displayName) {
        return a.path.localeCompare(b.path);
      }

      return a.displayName.localeCompare(b.displayName);
    });

  return (
    <Dropdown>
      <Dropdown.Toggle
        variant="outline-secondary"
        size="sm"
        className="w-100 d-flex align-items-center"
      >
        <div className="text-center flex-grow-1">Select Asset</div>
        {isInvalid && (
          <MaterialIcon className="text-danger fs-3">error</MaterialIcon>
        )}
      </Dropdown.Toggle>

      <Dropdown.Menu
        renderOnMount
        popperConfig={{
          strategy: "fixed",
        }}
        style={{ maxHeight: "min(25rem, 60vh)", overflowY: "auto" }}
        className="pt-0"
      >
        <div
          className="p-1 sticky-top border-bottom"
          style={{ backgroundColor: "var(--bs-body-bg)" }}
        >
          <Form.Control
            type="text"
            placeholder="Search assets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="m-0"
          />
        </div>

        {filtered.map((asset) => {
          return (
            <Dropdown.Item
              key={asset.uuid}
              onClick={() => onSelect(asset.uuid)}
              className="d-flex align-items-center gap-1"
            >
              <FileIcon extension={extname(asset.path)} />
              <div className="d-flex flex-column flex-grow-1">
                <div>{centerTruncateText(asset.displayName, 50)}</div>
                <div className="text-muted small">
                  {centerTruncateText(dirname(asset.path), 60)}
                </div>
              </div>
            </Dropdown.Item>
          );
        })}
      </Dropdown.Menu>
    </Dropdown>
  );
}

/**
 * Badge to show the currently selected asset.
 *
 * @param param0
 * @returns
 */
function ShowCurrentAsset({
  assetId,
  list,
  clearAsset,
  isInvalid,
}: {
  assetId: string;
  list: AssetListItem[];
  clearAsset: () => void;
  isInvalid?: boolean;
}) {
  const asset = list.find((a) => a.uuid === assetId);

  return (
    <div
      className="d-flex align-items-center h-100 rounded bg-light-subtle"
      title={asset?.path}
    >
      <div className="d-flex align-items-center gap-1 p-1 flex-grow-1">
        {asset ? (
          <>
            <FileIcon extension={extname(asset.path)} />

            <div>{centerTruncateText(asset.displayName, 20)}</div>
            <div className="text-muted small">
              {centerTruncateText(dirname(asset.path), 30)}
            </div>
          </>
        ) : (
          <div>Asset not found</div>
        )}
      </div>

      {isInvalid && (
        <MaterialIcon className="text-danger fs-3">error</MaterialIcon>
      )}

      <IconButton
        icon="close"
        size="sm"
        variant="outline-secondary"
        onClick={clearAsset}
        className="ms-auto border-0 text-muted"
        title="Reset Asset"
      />
    </div>
  );
}

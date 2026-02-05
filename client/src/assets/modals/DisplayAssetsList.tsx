import { AssetListItem, AssetModel } from "common/models/assets/AssetModel";
import { getFileExtension } from "common/path/FileExtensions";
import ListGroup from "react-bootstrap/ListGroup";
import { FileIcon } from "../list/FileIcon";

/**
 * Display a list of assets with the file icon and path
 *
 * @param param0
 * @returns
 */
export function DisplayAssetsList({ list }: { list: AssetListItem[] }) {
  return (
    <ListGroup>
      {list.map((item) => {
        const fileName = AssetModel.getFileName(item.path);
        const extension = getFileExtension(fileName);
        const path = AssetModel.getBasePath(item.path);

        return (
          <ListGroup.Item key={item.uuid} title={item.path}>
            <div className="d-flex align-items-center">
              <FileIcon extension={extension} />
              <div className="ms-2 text-truncate text-muted">
                {path.slice(0, -6)}
              </div>
              <div className="text-muted">{path.slice(-6)}</div>
              <div>{fileName}</div>
            </div>
          </ListGroup.Item>
        );
      })}
    </ListGroup>
  );
}

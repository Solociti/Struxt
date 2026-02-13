import { FileToUpload } from "client/assets/modals/UploadAssetsModal";
import MaterialIcon from "client/components/MaterialIcon";
import Spinner from "react-bootstrap/Spinner";

interface StatusIconProps {
  fileItem: FileToUpload;
}

/**
 * Displays an appropriate icon based on the current status of a file item
 *
 * @param fileItem - File item containing status and metadata
 */
export default function StatusIcon({ fileItem }: StatusIconProps) {
  if (fileItem.status === "pending") {
    if (fileItem.shouldSkip) {
      return <MaterialIcon className="text-muted">block</MaterialIcon>;
    }

    return <MaterialIcon>schedule</MaterialIcon>;
  }

  if (fileItem.status === "uploading") {
    return <Spinner size="sm" animation="border" />;
  }

  if (fileItem.status === "complete") {
    return <MaterialIcon className="text-success">check_circle</MaterialIcon>;
  }

  if (fileItem.status === "error") {
    return <MaterialIcon className="text-danger">error</MaterialIcon>;
  }

  return null;
}

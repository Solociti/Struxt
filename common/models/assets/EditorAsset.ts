import { FileType } from "../../path/FileExtensions";

export interface EditorAsset {
  uuid: string;

  type: FileType;

  src: string;
  name: string;

  width?: number;
  height?: number;
}

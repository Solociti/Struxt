import { Model, UserModelAction } from "../Model";
import { DeepPartial, mergeDeep } from "../utils";
import { EditorAsset } from "./EditorAsset";
import { getFileType, isTextFile } from "./FileExtensions";

export interface AssetListItem {
  uuid: string;

  displayName: string;
  path: string;

  isExternalSrc: boolean;

  updated: AssetModel["updated"];
}

/**
 * Keeps track of assets and their metadata.
 */
export class AssetModel extends Model {
  /**
   * A unique identifier for the asset
   */
  public uuid: string = "";

  public projectId: string = "";

  /**
   * The display name for the asset.
   */
  public displayName: string = "";

  /**
   * The full path including the filename, or the full external URL.
   *
   * For local assets: /public/assets/logo.png
   * For external assets: https://example.com/image.png
   *
   * Must be unique per project.
   */
  public path: string = "";

  /**
   * If this assets is referencing an external source, path will be full the URL
   */
  public isExternalSrc: boolean = false;

  /**
   * The size of the asset in bytes
   */
  public size: number = 0;

  /**
   * The dimensions of the asset
   */
  public dimensions: { width: number; height: number } = {
    width: 0,
    height: 0,
  };

  public created: Omit<UserModelAction, "active"> = {
    date: Math.floor(Date.now() / 1000),
    userId: "",
    displayName: "",
  };

  public updated: Omit<UserModelAction, "active"> = {
    date: 0,
    userId: "",
    displayName: "",
  };

  public deleted: UserModelAction & { originalPath: string } = {
    active: false,
    date: 0,
    userId: "",
    displayName: "",
    originalPath: "",
  };

  constructor(data?: DeepPartial<AssetModel>) {
    super();

    if (data) {
      this.update(data);
    }
  }

  update(data: DeepPartial<AssetModel>) {
    mergeDeep(this, data);
  }

  clone(): AssetModel {
    const data = JSON.parse(JSON.stringify(this));
    return new AssetModel(data);
  }

  getEditorAsset(): EditorAsset {
    const item: EditorAsset = {
      uuid: this.uuid,
      type: getFileType(this.getFileExtension()),
      src: this.getPublicUrl(),
      name: this.displayName,
    };

    if (this.dimensions.width > 0 && this.dimensions.height > 0) {
      item.width = this.dimensions.width;
      item.height = this.dimensions.height;
    }

    return item;
  }

  /**
   * Get the file name from the path
   *
   * @returns
   */
  getFileName(): string {
    return AssetModel.getFileName(this.path);
  }

  static getFileName(path: string): string {
    if (!path) {
      return "";
    }

    if (path.startsWith("http://") || path.startsWith("https://")) {
      const url = new URL(path);
      return decodeURIComponent(
        url.pathname.split("/").filter(Boolean).pop() || "",
      );
    }

    return path.split("/").filter(Boolean).pop() || "";
  }

  /**
   * Get the file extension from the path
   *
   * @returns
   */
  getFileExtension(): string {
    const fileName = this.getFileName();
    if (fileName.includes(".")) {
      return fileName.split(".").pop() as string;
    }
    return "";
  }

  /**
   * Check if the asset is a text file.
   *
   * @returns
   */
  isTextFile(): boolean {
    return isTextFile(this.getFileExtension());
  }

  /**
   * Get the public facing URL for the asset.
   * Assets that are not saved withing /public are going to return a blank string.
   *
   * This is used to get the URL for grapesjs.
   *
   * @returns
   */
  getPublicUrl(): string {
    if (this.isExternalSrc) {
      return this.path;
    }

    if (this.path.startsWith("/public")) {
      return this.path.replace("/public", "");
    }

    return "";
  }

  /**
   * Create a list item for the routine.
   *
   * @returns
   */
  getListItem(): AssetListItem {
    return {
      uuid: this.uuid,
      displayName: this.displayName,
      path: this.path,
      isExternalSrc: this.isExternalSrc,
      updated: this.updated,
    };
  }
}

import { Model, UserModelAction } from "../Model";
import { DeepPartial, mergeDeep } from "../utils";
import { isTextFile } from "./FileExtensions";

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
   * The file name including the extension.
   *
   * The path + name must remain unique.
   */
  public name: string = "";

  /**
   * The parent path of the asset
   *
   * the path starts and ends with a slash
   */
  public path: string = "";

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

  public deleted: UserModelAction = {
    active: false,
    date: 0,
    userId: "",
    displayName: "",
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

  /**
   * Get the file extension from the name
   *
   * @returns
   */
  getFileExtension(): string {
    if (this.name.includes(".")) {
      return this.name.split(".").pop() as string;
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
   * Get the URL for the asset
   *
   * @returns
   */
  getUrl(): string {
    return AssetModel.createUrl(this.path, this.name);
  }

  static createUrl(path: string, name: string): string {
    if (!path.startsWith("/")) {
      path = `/${path}`;
    }
    if (!path.endsWith("/")) {
      path = `${path}/`;
    }

    return `${path}${name}`;
  }
}

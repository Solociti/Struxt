import {
  AssetDeleteApi,
  AssetMoveApi,
  AssetRestoreApi,
} from "common/api/assets/assets";
import { AssetListItem, AssetModel } from "common/models/assets/AssetModel";
import { useMemo, useRef } from "react";
import { DirectoryNode } from "../list/DirectoryView";

interface CommandResult {
  success: boolean;
  items?: AssetListItem[];
  item?: AssetListItem;
}

type UnregisterCallback = () => void;

export interface CommandManager {
  // tabs:open
  trigger(command: "tabs:open", item: AssetListItem): void;
  on(event: "tabs:open", cb: (item: AssetListItem) => void): UnregisterCallback;

  // tabs:close
  trigger(command: "tabs:close", uuid: string): void;
  on(event: "tabs:close", cb: (uuid: string) => void): UnregisterCallback;

  // new-asset
  trigger(command: "new-asset", result: AssetModel): void;
  trigger(command: "new-asset:show", basePath: string): void;
  trigger(command: "new-asset:hide"): void;
  on(event: "new-asset", cb: (result: AssetModel) => void): UnregisterCallback;
  on(
    event: "new-asset:show",
    cb: (basePath: string) => void,
  ): UnregisterCallback;
  on(event: "new-asset:hide", cb: () => void): UnregisterCallback;

  // delete
  trigger(command: "delete", result: AssetDeleteApi["PostResponse"]): void;
  trigger(
    command: "delete:show",
    items: AssetListItem[],
    isPermanent: boolean,
  ): void;
  trigger(command: "delete:hide"): void;
  on(
    event: "delete",
    cb: (result: AssetDeleteApi["PostResponse"]) => void,
  ): UnregisterCallback;
  on(
    event: "delete:show",
    cb: (items: AssetListItem[], isPermanent: boolean) => void,
  ): UnregisterCallback;
  on(event: "delete:hide", cb: () => void): UnregisterCallback;

  // restore
  trigger(command: "restore", result: AssetRestoreApi["PostResponse"]): void;
  on(
    event: "restore",
    cb: (result: AssetRestoreApi["PostResponse"]) => void,
  ): UnregisterCallback;

  // rename
  trigger(command: "rename", result: AssetMoveApi["PostResponse"]): void;
  trigger(
    command: "rename:show",
    items: AssetListItem[],
    basePath: string,
  ): void;
  trigger(command: "rename:hide"): void;
  on(
    event: "rename",
    cb: (result: AssetMoveApi["PostResponse"]) => void,
  ): UnregisterCallback;
  on(
    event: "rename:show",
    cb: (items: AssetListItem[], basePath: string) => void,
  ): UnregisterCallback;
  on(event: "rename:hide", cb: () => void): UnregisterCallback;

  // move
  trigger(command: "move", result: AssetMoveApi["PostResponse"]): void;
  trigger(command: "move:show", items: AssetListItem[], basePath: string): void;
  trigger(command: "move:hide"): void;
  on(
    event: "move",
    cb: (result: AssetMoveApi["PostResponse"]) => void,
  ): UnregisterCallback;
  on(
    event: "move:show",
    cb: (items: AssetListItem[], basePath: string) => void,
  ): UnregisterCallback;
  on(event: "move:hide", cb: () => void): UnregisterCallback;

  // copy
  trigger(command: "copy", result: CommandResult): void;
  trigger(command: "copy:show", uuids: string[]): void;
  trigger(command: "copy:hide"): void;
  on(event: "copy", cb: (result: CommandResult) => void): UnregisterCallback;
  on(event: "copy:show", cb: (uuids: string[]) => void): UnregisterCallback;
  on(event: "copy:hide", cb: () => void): UnregisterCallback;

  // paste
  trigger(command: "paste", result: CommandResult): void;
  trigger(command: "paste:show", destinationPath: string): void;
  trigger(command: "paste:hide"): void;
  on(event: "paste", cb: (result: CommandResult) => void): UnregisterCallback;
  on(
    event: "paste:show",
    cb: (destinationPath: string) => void,
  ): UnregisterCallback;
  on(event: "paste:hide", cb: () => void): UnregisterCallback;

  // download
  trigger(command: "download", result: CommandResult): void;
  trigger(command: "download:show", items: AssetListItem[]): void;
  trigger(command: "download:hide"): void;
  on(
    event: "download",
    cb: (result: CommandResult) => void,
  ): UnregisterCallback;
  on(
    event: "download:show",
    cb: (items: AssetListItem[]) => void,
  ): UnregisterCallback;
  on(event: "download:hide", cb: () => void): UnregisterCallback;

  // upload
  trigger(command: "upload", result: CommandResult): void;
  trigger(command: "upload:show", basePath: string): void;
  trigger(command: "upload:hide"): void;
  on(event: "upload", cb: (result: CommandResult) => void): UnregisterCallback;
  on(event: "upload:show", cb: (basePath: string) => void): UnregisterCallback;
  on(event: "upload:hide", cb: () => void): UnregisterCallback;

  // context-menu
  trigger(
    command: "context-menu:show",
    target: HTMLElement,
    item: DirectoryNode | AssetListItem,
  ): void;
  trigger(command: "context-menu:hide"): void;
  on(
    event: "context-menu:show",
    cb: (target: HTMLElement, item: DirectoryNode | AssetListItem) => void,
  ): UnregisterCallback;
  on(event: "context-menu:hide", cb: () => void): UnregisterCallback;
}

/**
 * Create a command manager
 *
 * @returns
 */
export function useCommandManager(): CommandManager {
  const commandListeners = useRef<Record<string, Set<Function>>>({});

  const commands = useMemo<CommandManager>(() => {
    const getListeners = (event: string) => {
      if (!commandListeners.current[event]) {
        commandListeners.current[event] = new Set();
      }
      return commandListeners.current[event];
    };

    return {
      trigger(command: string, ...args: any[]) {
        const listeners = commandListeners.current[command];
        if (listeners) {
          listeners.forEach((cb) => cb(...args));
        }
      },
      on(event: string, cb: Function) {
        getListeners(event).add(cb);
        return () => getListeners(event).delete(cb);
      },
    } as any;
  }, []);

  return commands;
}

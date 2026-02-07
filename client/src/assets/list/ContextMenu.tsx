import { errorToastWrapFunction } from "client/components/ErrorSnackBar";
import MaterialIcon from "client/components/MaterialIcon";
import { AssetListItem, AssetModel } from "common/models/assets/AssetModel";
import { PropsWithChildren, useEffect, useRef, useState } from "react";
import ListGroup from "react-bootstrap/ListGroup";
import Overlay from "react-bootstrap/Overlay";
import { restoreAsset } from "../assetApis";
import { useContentManager } from "../cm/contentManager";
import { getRecursiveDirItems } from "./AssetList";
import { DirectoryNode } from "./DirectoryView";

interface ContextMenuProps {
  show: boolean;
  onHide: () => void;
  target: HTMLElement | null;
}

/**
 * Creates a context menu
 *
 * @param param0
 * @returns
 */
function ContextMenu({
  children,
  show,
  onHide,
  target,
}: PropsWithChildren<ContextMenuProps>) {
  return (
    <Overlay
      target={target}
      onHide={onHide}
      placement="bottom-start"
      rootClose
      show={show}
    >
      {({
        arrowProps: _arrowProps,
        hasDoneInitialMeasure: _hasDoneInitialMeasure,
        placement: _placement,
        popper: _popper,
        show: _show,
        ...props
      }) => (
        <div
          {...props}
          style={{
            ...props.style,
          }}
        >
          <ListGroup className="position-relative border">{children}</ListGroup>
        </div>
      )}
    </Overlay>
  );
}

/**
 * Creates a context menu item
 *
 * @param param0
 * @returns
 */
function ContextMenuItem({
  text,
  icon,
  onClick,
}: {
  text: string;
  icon: string;
  onClick: () => void;
}) {
  return (
    <ListGroup.Item
      action
      onClick={onClick}
      className="border-0 d-flex align-items-center gap-2"
      variant="light"
    >
      <MaterialIcon>{icon}</MaterialIcon>
      {text}
    </ListGroup.Item>
  );
}

interface MenuItem {
  hide?: boolean;
  section: string;
  icon: string;
  text: string;
  onClick: () => void;
}

/**
 * Creates a context menu for a directory item
 *
 * @returns
 */
export function ItemContextMenu() {
  const { project, commands } = useContentManager();

  const [item, setItem] = useState<null | DirectoryNode | AssetListItem>(null);
  const menuOverlayRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const unregisterShow = commands.on("context-menu:show", (target, item) => {
      const el = target as HTMLElement;

      menuOverlayRef.current = el;
      setItem(item);
    });
    const unregisterHide = commands.on("context-menu:hide", () => {
      setItem(null);
    });

    return () => {
      unregisterShow();
      unregisterHide();
    };
  });

  if (!item) {
    return null;
  }
  const isDir = item && "subDirectories" in item;
  const isInTrash = item && item.path.startsWith("/.trash/");
  const isTrashDir = isDir && item.path === "/.trash/";

  const menuItems: MenuItem[] = [
    {
      hide: isInTrash || (isDir && item.preventNewFile) || item.isExternalSrc,
      section: "general",
      icon: "note_add",
      text: "New File",
      onClick: () => {
        let path = item.path;
        if (!isDir && !item.isExternalSrc) {
          path = AssetModel.getBasePath(path);
        }

        commands.trigger("new-asset:show", path);
        commands.trigger("context-menu:hide");
      },
    },
    {
      hide: isInTrash || item.isExternalSrc,
      section: "general",
      icon: "delete",
      text: "Trash",
      onClick: () => {
        const items: AssetListItem[] = [];
        if (isDir) {
          items.push(...getRecursiveDirItems(item));
        } else {
          items.push(item);
        }

        commands.trigger("delete:show", items, false);
        commands.trigger("context-menu:hide");
      },
    },
    {
      hide:
        (!isInTrash && !item.isExternalSrc) ||
        isTrashDir ||
        (isDir && item.isExternalSrc),
      section: "general",
      icon: "delete_forever",
      text: "Permanently Delete",
      onClick: () => {
        const items: AssetListItem[] = [];
        if (isDir) {
          items.push(...getRecursiveDirItems(item));
        } else {
          items.push(item);
        }

        commands.trigger("delete:show", items, true);
        commands.trigger("context-menu:hide");
      },
    },
    {
      hide: !isTrashDir,
      section: "general",
      icon: "delete_forever",
      text: "Empty Trash",
      onClick: () => {
        const items: AssetListItem[] = [];
        if (isDir) {
          items.push(...getRecursiveDirItems(item));
        } else {
          items.push(item);
        }

        commands.trigger("delete:show", items, true);
        commands.trigger("context-menu:hide");
      },
    },
    {
      hide: !isInTrash || isTrashDir,
      section: "general",
      icon: "restore_from_trash",
      text: "Restore",
      onClick: errorToastWrapFunction(async () => {
        const items: AssetListItem[] = [];
        if (isDir) {
          items.push(...getRecursiveDirItems(item));
        } else {
          items.push(item);
        }

        const result = await restoreAsset(
          project.projectId,
          items.map((i) => ({ uuid: i.uuid })),
        );

        commands.trigger("restore", result);
        commands.trigger("context-menu:hide");
      }),
    },
    {
      hide: isInTrash || Boolean(item.isExternalSrc),
      section: "modify",
      icon: "label",
      text: "Rename",
      onClick: () => {
        const items: AssetListItem[] = [];
        const basePath = item.path;
        if (isDir) {
          items.push(...getRecursiveDirItems(item));
        } else {
          items.push(item);
        }

        commands.trigger("rename:show", items, basePath);
        commands.trigger("context-menu:hide");
      },
    },
    {
      hide: isInTrash || item.isExternalSrc,
      section: "modify",
      icon: "move_item",
      text: "Move",
      onClick: () => {
        const items: AssetListItem[] = [];
        if (isDir) {
          items.push(...getRecursiveDirItems(item));
        } else {
          items.push(item);
        }

        commands.trigger("move:show", items, item.path);
        commands.trigger("context-menu:hide");
      },
    },
    {
      // allowing to copy files from the trash, but not pasting them
      hide: isTrashDir || item.isExternalSrc,
      section: "clipboard",
      icon: "file_copy",
      text: "Copy",
      onClick: () => {
        const items: AssetListItem[] = [];
        if (isDir) {
          items.push(...getRecursiveDirItems(item));
        } else {
          items.push(item);
        }

        commands.trigger(
          "copy:show",
          items.map((i) => i.uuid),
        );
        commands.trigger("context-menu:hide");
      },
    },
    {
      hide: isInTrash || item.isExternalSrc,
      section: "clipboard",
      icon: "content_paste",
      text: "Paste",
      onClick: () => {
        commands.trigger("paste:show", item.path);
        commands.trigger("context-menu:hide");
      },
    },
    {
      hide: isInTrash || item.isExternalSrc,
      section: "transfer",
      icon: "download",
      text: "Download",
      onClick: () => {
        const items: AssetListItem[] = [];
        if (isDir) {
          items.push(...getRecursiveDirItems(item));
        } else {
          items.push(item);
        }

        commands.trigger("download:show", items);
        commands.trigger("context-menu:hide");
      },
    },
    {
      hide: isInTrash || item.isExternalSrc,
      section: "transfer",
      icon: "upload",
      text: "Upload",
      onClick: () => {
        commands.trigger("upload:show", item.path);
        commands.trigger("context-menu:hide");
      },
    },
    {
      hide: isInTrash,
      section: "path",
      icon: "account_tree",
      text: "Copy Path",
      onClick: () => {
        // TODO: show a copied toast
        navigator.clipboard.writeText(item.path);
        commands.trigger("context-menu:hide");
      },
    },
    {
      hide: isDir || isInTrash,
      section: "path",
      icon: "link",
      text: "Copy URL",
      onClick: () => {
        const url = item.path;

        navigator.clipboard.writeText(url);
        commands.trigger("context-menu:hide");
      },
    },
  ];

  const visibleItems = menuItems.filter((item) => !item.hide);

  return (
    <ContextMenu
      onHide={() => commands.trigger("context-menu:hide")}
      show={Boolean(item)}
      target={menuOverlayRef.current}
    >
      {visibleItems.map((menuItem, index) => {
        const prevItem = visibleItems[index - 1];
        const showDivider = prevItem && prevItem.section !== menuItem.section;

        return (
          <div key={menuItem.text}>
            {showDivider && <div className="border-bottom" />}
            <ContextMenuItem
              icon={menuItem.icon}
              text={menuItem.text}
              onClick={menuItem.onClick}
            />
          </div>
        );
      })}
    </ContextMenu>
  );
}

import { closestCenter, DndContext, DragEndEvent } from "@dnd-kit/core";
import {
  restrictToParentElement,
  restrictToVerticalAxis,
} from "@dnd-kit/modifiers";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { PagesResultProps, useEditor } from "@grapesjs/react";
import IconButton from "client/components/IconButton";
import MaterialIcon from "client/components/MaterialIcon";
import { Page } from "grapesjs";
import ListGroup from "react-bootstrap/ListGroup";
import { PageSettingsModal } from "./PageSettingsModal";

export function CustomPageManager({
  pages,
  selected,
  add,
  select,
}: PagesResultProps) {
  const editor = useEditor();
  const { Pages } = editor;

  const addNewPage = () => {
    const nextIndex = pages.length + 1;
    add({
      name: `Page ${nextIndex}`,
      component: `<h1>Page ${nextIndex}</h1>`,
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || !active) {
      return;
    }

    if (active.id !== over.id) {
      const newIndex = pages
        .map((page) => page.getId())
        .indexOf(over.id as string);

      Pages.move(active.id as string, { at: newIndex });
    }
  };

  return (
    <div className="gjs-custom-page-manager">
      <div className="d-flex justify-content-between p-2 my-2">
        <IconButton
          type="button"
          icon="add"
          variant="primary"
          size="sm"
          onClick={addNewPage}
        >
          New Page
        </IconButton>

        <IconButton
          icon="settings"
          size="sm"
          variant="outline-secondary"
          title="Global Settings"
          onClick={() => {
            editor.runCommand("struxt:page:settings", {});
          }}
        ></IconButton>
      </div>

      <PageSettingsModal />

      <DndContext
        modifiers={[restrictToParentElement, restrictToVerticalAxis]}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={pages.map((p) => p.getId())}
          strategy={verticalListSortingStrategy}
        >
          <ListGroup variant="flush">
            {pages.map((page) => (
              <PageItem
                key={page.getId()}
                page={page}
                handleSelect={() => select(page)}
                handleEdit={() => {
                  editor.runCommand("struxt:page:settings", {
                    page,
                  });
                }}
                isSelected={selected === page}
              />
            ))}
          </ListGroup>
        </SortableContext>
      </DndContext>
    </div>
  );
}

function PageItem({
  handleEdit,
  handleSelect,
  isSelected,
  page,
}: {
  page: Page;
  handleSelect: () => void;
  handleEdit: () => void;
  isSelected: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: page.getId() });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <ListGroup.Item
      key={page.getId()}
      action
      as="div"
      className={
        "d-flex align-items-center px-2 py-1 gap-2 user-select-none" +
        (isSelected ? " bg-secondary text-light" : "")
      }
      ref={setNodeRef}
      style={style}
      onClick={handleSelect}
      {...attributes}
    >
      <div className="cursor-grab" {...listeners}>
        <MaterialIcon>drag_handle</MaterialIcon>
      </div>

      <div className="flex-grow-1 text-left">
        {page.getName() || "Untitled page"}
      </div>

      <IconButton
        variant="transparent"
        className="p-0"
        icon="settings"
        size="sm"
        onClick={handleEdit}
      ></IconButton>
    </ListGroup.Item>
  );
}

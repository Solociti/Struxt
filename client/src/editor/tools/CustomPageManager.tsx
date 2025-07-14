import { PagesResultProps } from "@grapesjs/react";
import IconButton from "client/components/IconButton";
import { cx } from "./common";

export function CustomPageManager({
  pages,
  selected,
  add,
  select,
  remove,
}: PagesResultProps) {
  const addNewPage = () => {
    const nextIndex = pages.length + 1;
    add({
      name: `New page ${nextIndex}`,
      component: `<h1>Page content ${nextIndex}</h1>`,
    });
  };

  return (
    <div className="gjs-custom-page-manager">
      <div className="p-2">
        <IconButton
          type="button"
          icon="add"
          className="rounded"
          variant="primary"
          onClick={addNewPage}
        >
          New Page
        </IconButton>
      </div>
      {pages.map((page, index) => (
        <div
          key={page.getId()}
          className={cx(
            "d-flex align-items-center py-2 px-4 border-bottom",
            index === 0 && "border-top"
          )}
        >
          <button
            type="button"
            className="flex-grow text-left"
            onClick={() => select(page)}
          >
            {page.getName() || "Untitled page"}
          </button>
          {selected !== page && (
            <IconButton
              variant="transparent"
              icon="delete"
              onClick={() => remove(page)}
            ></IconButton>
          )}
        </div>
      ))}
    </div>
  );
}

import { useEffect, useState } from "react";

namespace Dropdown {
  export function Button({
    children,
    title,
    isLoading,
    onToggle,
  }: {
    children: React.ReactNode;
    title: string;
    isLoading?: boolean;
    onToggle?: (isOpen: boolean) => void;
  }) {
    const [isOpen, setIsOpen] = useState(false);

    const toggleDropdown = () => setIsOpen(!isOpen);

    useEffect(() => {
      if (onToggle) {
        onToggle(isOpen);
      }
    }, [isOpen, onToggle]);

    return (
      <div className="relative inline-block text-left w-full">
        <button
          type="button"
          className="inline-flex justify-between w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
          onClick={toggleDropdown}
        >
          {isLoading ? (
            <span>Loading...</span>
          ) : title ? (
            title
          ) : (
            <span className="text-gray-400">Select an option</span>
          )}

          <svg
            className="-mr-1 ml-2 h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>

        {isOpen && (
          <div className="origin-top-right absolute right-0 w-full rounded-md shadow-lg bg-white border border-gray-300 z-10">
            <div
              className="py-1 max-h-60 overflow-auto"
              role="menu"
              aria-orientation="vertical"
              aria-labelledby="options-menu"
              onClick={(event) => {
                // only close the dropdown if the click was on an item
                // that is not disabled
                if (
                  event.target instanceof HTMLElement &&
                  event.target.getAttribute("aria-disabled") !== "true"
                ) {
                  setIsOpen(false);
                }
              }}
            >
              {children}
            </div>
          </div>
        )}
      </div>
    );
  }

  export function Item({
    children,
    onSelect,
    readOnly,
    className: extraClassName,
  }: {
    children: React.ReactNode;
    onSelect?: () => void;
    readOnly?: boolean;
    className?: string;
  }) {
    let className = "px-4 py-2 select-none";

    if (readOnly) {
      className += " text-gray-400 cursor-not-allowed";
    } else {
      className +=
        " text-gray-700 hover:bg-gray-100 hover:text-gray-900 cursor-pointer";
    }
    if (extraClassName) {
      className += ` ${extraClassName}`;
    }

    return (
      <div
        className={className}
        role="menuitem"
        aria-disabled={readOnly}
        onClick={onSelect && !readOnly ? () => onSelect() : undefined}
      >
        {children}
      </div>
    );
  }
}
export default Dropdown;

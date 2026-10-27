import { useLoadAsync } from "client/api/useLoadAsync";
import { getTextAssetContents } from "client/assets/assetApis";
import { centerTruncateText } from "common/format/text";
import { AssetListItem, AssetModel } from "common/models/assets/AssetModel";
import { getJsExports } from "common/tree-sitter/getJsExports";
import { useEffect, useState } from "react";
import Dropdown from "react-bootstrap/Dropdown";
import FormControl from "react-bootstrap/FormControl";
import Spinner from "react-bootstrap/Spinner";

interface SelectFunctionProps {
  value: string;
  onChange: (value: string) => void;

  isInvalid?: boolean;

  projectId: string;
  asset: AssetModel | AssetListItem | null;
}

/**
 * Renders a function input with searchable dropdown suggestions.
 */
export function SelectFunction({
  value,
  onChange,
  projectId,
  asset,
  isInvalid,
}: SelectFunctionProps) {
  const [load, setLoad] = useState(false);
  const { response: exportList, isLoading } = useLoadAsync(async () => {
    if (!asset || !load) {
      return null;
    }

    const content = await getTextAssetContents(projectId, asset);

    const exportList = await getJsExports(content);
    return exportList;
  }, [load, projectId, asset?.uuid]);

  return (
    <DropdownMenu
      value={value}
      onChange={onChange}
      list={exportList || []}
      isLoading={isLoading}
      onOpen={() => setLoad(true)}
      isInvalid={isInvalid}
    />
  );
}

interface DropdownMenuProps {
  list: string[];
  value: string;

  isInvalid?: boolean;

  isLoading: boolean;

  onChange: (value: string) => void;
  onOpen: () => void;
}

function DropdownMenu({
  value: incomingValue,
  onChange,
  list,
  isLoading,
  onOpen,
  isInvalid,
}: DropdownMenuProps) {
  const [value, setValue] = useState(incomingValue);
  const [show, setShow] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const normalizedValue = value.trim().toLowerCase();
  const filteredList = list.filter((item) => {
    if (!normalizedValue) {
      return true;
    }

    return item.toLowerCase().includes(normalizedValue);
  });

  useEffect(() => {
    setValue(incomingValue);
  }, [incomingValue]);

  const handleChange = (value: string) => {
    const val = value.trim();
    setValue(val);
    onChange(val);
  };

  useEffect(() => {
    if (show) {
      onOpen();
    }
  }, [show]);

  useEffect(() => {
    if (show) {
      setHighlightedIndex(-1);
    }
  }, [show, value]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (filteredList.length === 0) {
      return;
    }

    if (!show) {
      setShow(true);
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) => (prev + 1) % filteredList.length);
        break;

      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex(
          (prev) => (prev - 1 + filteredList.length) % filteredList.length,
        );
        break;

      case "Enter":
        if (highlightedIndex >= 0) {
          e.preventDefault();
          handleChange(filteredList[highlightedIndex]);
          setShow(false);
        }
        break;

      case "Escape":
        setShow(false);
        break;
    }
  };

  return (
    <div>
      <FormControl
        className="form-control form-control-sm border-0 bg-light-subtle"
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
        }}
        isInvalid={isInvalid}
        onFocus={() => {
          setShow(true);
        }}
        onBlur={(e) => {
          if (value !== incomingValue) {
            handleChange(value);
          }

          if (!e.currentTarget.contains(e.relatedTarget)) {
            setShow(false);
          }
        }}
        onKeyDown={handleKeyDown}
        role="combobox"
        aria-expanded={show}
        aria-haspopup="listbox"
      />

      <Dropdown.Menu
        style={{ maxHeight: "15rem", minWidth: "10rem", overflowY: "auto" }}
        popperConfig={{
          strategy: "fixed",
        }}
        renderOnMount
        show={show}
      >
        {filteredList.length === 0 && !isLoading && (
          <Dropdown.Item disabled className="text-center">
            <small>No exports found</small>
          </Dropdown.Item>
        )}

        {isLoading && (
          <Dropdown.Item disabled className="text-center">
            <Spinner size="sm" animation="border" />
          </Dropdown.Item>
        )}

        {filteredList.map((item, index) => (
          <Dropdown.Item
            key={index}
            active={item === value}
            className={highlightedIndex === index ? "bg-light-subtle" : ""}
            onMouseDown={(e) => {
              e.preventDefault();
            }}
            onClick={() => {
              handleChange(item);
              setShow(false);
            }}
          >
            {centerTruncateText(item, 40)}
          </Dropdown.Item>
        ))}
      </Dropdown.Menu>
    </div>
  );
}

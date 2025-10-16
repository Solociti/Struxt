import Dropdown from "react-bootstrap/Dropdown";
import InputGroup from "react-bootstrap/InputGroup";
import { ModelItem, VendorItem } from "./helpers";

/**
 * Add dropdowns to select the vendor and model to view prompts for
 *
 * @param param0
 * @returns
 */
export function ModelSelectionDropdowns({
  selectedVendor,
  setSelectedVendor,
  selectedModel,
  setSelectedModel,
  vendorList,
  modelList,
}: {
  selectedVendor: VendorItem;
  setSelectedVendor: (v: VendorItem) => void;
  selectedModel: ModelItem;
  setSelectedModel: (m: ModelItem) => void;
  vendorList: VendorItem[];
  modelList: ModelItem[];
}) {
  return (
    <InputGroup title="View Prompts For">
      <InputGroup.Text>Vendor</InputGroup.Text>
      <Dropdown>
        <Dropdown.Toggle variant="primary" size="sm">
          {selectedVendor.name}
        </Dropdown.Toggle>

        <Dropdown.Menu>
          <Dropdown.Item
            key="default"
            onClick={() => {
              setSelectedVendor({ id: "", name: "Default" });
              if (selectedModel.vendorId !== "") {
                setSelectedModel({
                  id: "",
                  name: "Default",
                  vendorId: "",
                });
              }
            }}
          >
            Default
          </Dropdown.Item>
          {vendorList.map((v) => (
            <Dropdown.Item
              key={v.id}
              onClick={() => {
                setSelectedVendor(v);

                if (selectedModel.vendorId !== v.id) {
                  setSelectedModel({
                    id: "",
                    name: "Default",
                    vendorId: "",
                  });
                }
              }}
            >
              {v.name}
            </Dropdown.Item>
          ))}
        </Dropdown.Menu>
      </Dropdown>

      <InputGroup.Text>Model</InputGroup.Text>
      <Dropdown>
        <Dropdown.Toggle variant="secondary" size="sm">
          {selectedModel.name}
        </Dropdown.Toggle>

        <Dropdown.Menu>
          <Dropdown.Item
            key="default"
            onClick={() =>
              setSelectedModel({ id: "", name: "Default", vendorId: "" })
            }
          >
            Default
          </Dropdown.Item>
          {modelList.map((m) => (
            <Dropdown.Item
              key={m.id}
              onClick={() => {
                const vendor = vendorList.find((v) => v.id === m.vendorId);
                if (!vendor) {
                  return;
                }

                setSelectedModel(m);
                setSelectedVendor(vendor);
              }}
            >
              {m.name}
            </Dropdown.Item>
          ))}
        </Dropdown.Menu>
      </Dropdown>
    </InputGroup>
  );
}

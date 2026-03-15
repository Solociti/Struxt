import { FormInput } from "client/components/FormInput";
import IconButton from "client/components/IconButton";
import { HttpTrigger } from "common/models/projects/Triggers";
import { RoutineEnvModel } from "common/models/routines/RoutineEnv";
import Table from "react-bootstrap/Table";
import { useContentManager } from "../cm/contentManager";
import { ChooseAsset } from "./inputs/ChooseAsset";
import { SelectRoutineEnv } from "./inputs/SelectRoutineEnv";

/**
 * Show and manage the HTTP triggers
 *
 * @param param0
 */
export function ShowHttpTriggers({
  httpTriggers,
  setHttpTriggers,
  environments,
}: {
  httpTriggers?: HttpTrigger[];
  setHttpTriggers: (triggers: HttpTrigger[]) => void;
  environments: RoutineEnvModel[];
}) {
  const { tabs, assets } = useContentManager();

  const markDirty = () => {
    if (tabs.activeTab?.tabId) {
      tabs.markDirty(tabs.activeTab.tabId);
    }
  };

  const addHttpTrigger = () => {
    const newTrigger: HttpTrigger = {
      endpoint: "",
      method: "GET",
      assetId: "",
      handler: "",
      environmentId: "",
    };

    setHttpTriggers([...(httpTriggers ?? []), newTrigger]);
    markDirty();
  };

  const updateHttpTrigger = (
    index: number,
    updatedTrigger: Partial<HttpTrigger>,
  ) => {
    if (!httpTriggers) {
      return;
    }

    const updatedTriggers = httpTriggers.map((trigger, i) =>
      i === index ? { ...trigger, ...updatedTrigger } : trigger,
    );

    setHttpTriggers(updatedTriggers);
    markDirty();
  };

  return (
    <>
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div>
          <h4 className="mb-1">Routes</h4>
          <p className="small text-muted mb-0">
            Incoming web requests mapped to an asset file and exported function.
          </p>
        </div>

        <IconButton
          icon="add"
          size="sm"
          variant="outline-primary"
          onClick={addHttpTrigger}
        >
          Route
        </IconButton>
      </div>

      {httpTriggers && httpTriggers.length === 0 && (
        <div className="my-1 text-center">
          <span className="text-muted small">No configured routes.</span>
        </div>
      )}

      {httpTriggers && httpTriggers.length > 0 && (
        <Table size="sm" responsive borderless className="align-middle my-1">
          <thead>
            <tr className="text-muted small uppercase">
              <th className="px-0" style={{ minWidth: "7.5rem", width: "5%" }}>
                Env
              </th>
              <th className="px-0" style={{ minWidth: "6rem", width: "5%" }}>
                Method
              </th>
              <th className="px-0" style={{ minWidth: "15rem", width: "35%" }}>
                Endpoint
              </th>
              <th className="px-0" style={{ minWidth: "12rem", width: "35%" }}>
                Asset File
              </th>
              <th className="px-0" style={{ minWidth: "10rem", width: "20%" }}>
                Exported Function
              </th>
              <th style={{ minWidth: "2rem" }}></th>
            </tr>
          </thead>

          <tbody>
            {httpTriggers.map((trigger, index) => (
              <tr key={index}>
                <td className="p-1">
                  <SelectRoutineEnv
                    environmentId={trigger.environmentId}
                    onChange={(envId) =>
                      updateHttpTrigger(index, { environmentId: envId })
                    }
                    environments={environments}
                  />
                </td>

                <td className="p-1">
                  <select
                    className="form-select form-select-sm border-0 bg-light-subtle"
                    value={trigger.method}
                    onChange={(e) => {
                      if (!e.target.value) {
                        return;
                      }

                      updateHttpTrigger(index, {
                        method: e.target.value as HttpTrigger["method"],
                      });
                    }}
                  >
                    <option>GET</option>
                    <option>POST</option>
                    <option>PUT</option>
                    <option>PATCH</option>
                    <option>DELETE</option>
                  </select>
                </td>

                <td className="p-1">
                  <FormInput
                    className="form-control form-control-sm border-0 bg-light-subtle"
                    placeholder="/routines/example-1"
                    value={trigger.endpoint}
                    onRealChange={(value) => {
                      updateHttpTrigger(index, { endpoint: value });
                    }}
                    type="text"
                  />
                </td>

                <td className="p-1">
                  <ChooseAsset
                    assetId={trigger.assetId}
                    list={assets.list}
                    onChange={(id) => {
                      updateHttpTrigger(index, { assetId: id });
                    }}
                  />
                </td>

                <td className="p-1">
                  <FormInput
                    className="form-control form-control-sm border-0 bg-light-subtle"
                    value={trigger.handler}
                    onRealChange={(value) => {
                      updateHttpTrigger(index, { handler: value });
                    }}
                    type="text"
                  />
                </td>

                <td className="p-1">
                  <IconButton
                    icon="close_small"
                    size="sm"
                    variant="outline-warning"
                    onClick={() => {
                      const updatedTriggers = httpTriggers.filter(
                        (_, i) => i !== index,
                      );

                      setHttpTriggers(updatedTriggers);
                      markDirty();
                    }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </>
  );
}

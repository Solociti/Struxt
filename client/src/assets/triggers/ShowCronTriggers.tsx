import { FormInput } from "client/components/FormInput";
import IconButton from "client/components/IconButton";
import { CronTrigger } from "common/models/projects/Triggers";
import Table from "react-bootstrap/Table";
import { useContentManager } from "../cm/contentManager";

/**
 * Renders and manages cron trigger rows.
 *
 * @param param0
 */
export function ShowCronTriggers({
  cronTriggers,
  setCronTriggers,
}: {
  cronTriggers?: CronTrigger[];
  setCronTriggers: (triggers: CronTrigger[]) => void;
}) {
  const { tabs } = useContentManager();

  const markDirty = () => {
    if (tabs.activeTab?.tabId) {
      tabs.markDirty(tabs.activeTab.tabId);
    }
  };

  const addCronTrigger = () => {
    const newTrigger: CronTrigger = {
      cronExpression: "",
      assetId: "",
      handler: "",
      environmentId: "",
    };

    setCronTriggers([...(cronTriggers ?? []), newTrigger]);
    markDirty();
  };

  const updateCronTrigger = (
    index: number,
    updatedTrigger: Partial<CronTrigger>,
  ) => {
    if (!cronTriggers) {
      return;
    }

    const updatedTriggers = cronTriggers.map((trigger, i) =>
      i === index ? { ...trigger, ...updatedTrigger } : trigger,
    );

    setCronTriggers(updatedTriggers);
    markDirty();
  };

  return (
    <>
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div>
          <h4 className="mb-1">Cron Triggers</h4>
          <p className="small text-muted mb-0">
            Scheduled cron expressions mapped to an asset file and exported
            function.
          </p>
        </div>

        <IconButton
          icon="add"
          size="sm"
          variant="outline-secondary"
          onClick={addCronTrigger}
        >
          Cron Trigger
        </IconButton>
      </div>

      <Table size="sm" responsive borderless className="align-middle my-1">
        <thead>
          <tr className="text-muted small uppercase">
            <th className="px-0" style={{ minWidth: "10rem", width: "30%" }}>
              Cron
            </th>
            <th className="px-0" style={{ minWidth: "12rem", width: "35%" }}>
              Asset File
            </th>
            <th className="px-0" style={{ minWidth: "10rem", width: "30%" }}>
              Exported Function
            </th>
            <th style={{ minWidth: "2rem" }}></th>
          </tr>
        </thead>

        <tbody>
          {cronTriggers && cronTriggers.length === 0 && (
            <tr>
              <td colSpan={4} className="text-center">
                <span className="text-muted small">
                  No cron triggers configured.
                </span>
              </td>
            </tr>
          )}

          {cronTriggers?.map((trigger, index) => (
            <tr key={index}>
              <td className="p-1">
                <FormInput
                  className="form-control form-control-sm border-0 bg-light-subtle"
                  placeholder="0 * * * *"
                  value={trigger.cronExpression}
                  onRealChange={(value) => {
                    updateCronTrigger(index, { cronExpression: value });
                  }}
                  type="text"
                />
              </td>

              <td className="p-1">
                <FormInput
                  className="form-control form-control-sm border-0 bg-light-subtle"
                  value={trigger.assetId}
                  onRealChange={(value) => {
                    updateCronTrigger(index, { assetId: value });
                  }}
                  type="text"
                />
              </td>

              <td className="p-1">
                <FormInput
                  className="form-control form-control-sm border-0 bg-light-subtle"
                  value={trigger.handler}
                  onRealChange={(value) => {
                    updateCronTrigger(index, { handler: value });
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
                    const updatedTriggers = cronTriggers.filter(
                      (_, i) => i !== index,
                    );

                    setCronTriggers(updatedTriggers);
                    markDirty();
                  }}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </>
  );
}

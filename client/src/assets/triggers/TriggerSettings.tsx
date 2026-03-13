import { useContentManager } from "../cm/contentManager";
import { ShowCronTriggers } from "./ShowCronTriggers";
import { ShowHttpTriggers } from "./ShowHttpTriggers";

// List of requirements
// - UI sections for HTTP and Cron triggers
// - Add a shortcut in the file dropdowns to add a new trigger
// - parse files with tree-sitter to get the exported functions for the handler inputs
// - Use input / dropdown hybrids for function selection
// - Add a File Selection component to pick the asset we are targeting

/**
 * Renders a demo trigger settings UI split into HTTP and Cron trigger sections.
 */
export default function TriggerSettings() {
  const { tabs, projectDetails } = useContentManager();

  const defaultTriggers = projectDetails.data
    ? {
        httpTriggers: projectDetails.data.featureFlags.routines.httpTriggers,
        cronTriggers: projectDetails.data.featureFlags.routines.cronTriggers,
      }
    : undefined;

  const [triggers, setTriggers] = tabs.useState(
    tabs.activeTab?.tabId,
    defaultTriggers,
  );

  return (
    <div className="h-100 overflow-auto p-3 d-flex flex-column gap-3 w-100">
      <section className="px-1 py-1">
        {triggers && (
          <ShowHttpTriggers
            httpTriggers={triggers.httpTriggers}
            setHttpTriggers={(httpTriggers) =>
              setTriggers((prev) => ({ ...prev, httpTriggers }))
            }
          />
        )}
      </section>

      <hr className="my-2" />

      <section className="px-1 py-1">
        {triggers && (
          <ShowCronTriggers
            cronTriggers={triggers.cronTriggers}
            setCronTriggers={(cronTriggers) =>
              setTriggers((prev) => ({ ...prev, cronTriggers }))
            }
          />
        )}
      </section>
    </div>
  );
}

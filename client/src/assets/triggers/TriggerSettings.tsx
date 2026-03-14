import { CronTrigger, HttpTrigger } from "common/models/projects/Triggers";
import { useCallback, useRef } from "react";
import { useContentManager } from "../cm/contentManager";
import { ShowCronTriggers } from "./ShowCronTriggers";
import { ShowHttpTriggers } from "./ShowHttpTriggers";
import { saveTriggers } from "./saveTriggers";

// List of requirements
// - UI sections for HTTP and Cron triggers
// - Add a shortcut in the file dropdowns to add a new trigger
// - parse files with tree-sitter to get the exported functions for the handler inputs
// - Use input / dropdown hybrids for function selection
// - Add a File Selection component to pick the asset we are targeting

interface Triggers {
  httpTriggers: HttpTrigger[];
  cronTriggers: CronTrigger[];
}

/**
 * Renders a demo trigger settings UI split into HTTP and Cron trigger sections.
 */
export default function TriggerSettings() {
  const { tabs, projectDetails, project, commands } = useContentManager();

  const defaultTriggers: Triggers | undefined = projectDetails.data
    ? {
        httpTriggers: projectDetails.data.featureFlags.routines.httpTriggers,
        cronTriggers: projectDetails.data.featureFlags.routines.cronTriggers,
      }
    : undefined;

  // This state is only set once changes have been made.
  // If there are no pending changes, we want to show the triggers from the project details.
  const [triggers, setTriggers] = tabs.useState<Triggers | null>(
    tabs.activeTab?.tabId,
    null,
  );

  const renderedTriggers = triggers ? triggers : defaultTriggers;

  const saveTimeout = useRef<NodeJS.Timeout | null>(null);

  // Auto-save changes after 5 second of inactivity
  const handleChange = useCallback((change: Partial<Triggers>) => {
    setTriggers((prev) => {
      const updatedTriggers = prev
        ? { ...prev, ...change }
        : ({ ...defaultTriggers, ...change } as Triggers);

      if (saveTimeout.current) {
        clearTimeout(saveTimeout.current);
      }

      saveTimeout.current = setTimeout(async () => {
        // Save the updated triggers to the project details
        // This is a placeholder for the actual save logic, which would involve an API call or similar
        const result = await saveTriggers(project.projectId, updatedTriggers);

        commands.trigger("update:project-details", result.details);
      }, 5000);

      return updatedTriggers;
    });
  }, []);

  return (
    <div className="h-100 overflow-auto p-3 d-flex flex-column gap-3 w-100">
      <section className="px-1 py-1">
        {renderedTriggers && (
          <ShowHttpTriggers
            httpTriggers={renderedTriggers.httpTriggers}
            setHttpTriggers={(httpTriggers) => {
              handleChange({ httpTriggers });
            }}
          />
        )}
      </section>

      <hr className="my-2" />

      <section className="px-1 py-1">
        {renderedTriggers && (
          <ShowCronTriggers
            cronTriggers={renderedTriggers.cronTriggers}
            setCronTriggers={(cronTriggers) => {
              handleChange({ cronTriggers });
            }}
          />
        )}
      </section>
    </div>
  );
}

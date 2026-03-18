import { useLoadAsync } from "client/api/useLoadAsync";
import IconButton from "client/components/IconButton";
import { ShowError } from "client/components/ShowError";
import { useAsyncCallback } from "client/components/useAsyncCallback";
import { getRoutineEnvList } from "client/dashboard/admin/routines/routineEnvApi";
import {
  createCronTrigger,
  createHttpTrigger,
  CronTrigger,
  HttpTrigger,
} from "common/models/projects/Triggers";
import { useCallback, useEffect, useRef, useState } from "react";
import Spinner from "react-bootstrap/Spinner";
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

export interface TriggerSettingsTabState extends Partial<Triggers> {
  ready: boolean;
}

/**
 * Renders a demo trigger settings UI split into HTTP and Cron trigger sections.
 */
export default function TriggerSettings() {
  const { tabs, projectDetails, project, commands } = useContentManager();

  const {
    response: allEnvs,
    isLoading: envsLoading,
    error: envsError,
  } = useLoadAsync(() => getRoutineEnvList(), []);

  const routines = projectDetails.data?.featureFlags.routines;
  const isLoading = projectDetails.loading || envsLoading;
  const error = projectDetails.error || envsError;

  // This state is only set once changes have been made.
  // If there are no pending changes, we want to show the triggers from the project details.
  const [triggers, setTriggers] = tabs.useState<TriggerSettingsTabState>(
    tabs.activeTab?.tabId,
    { ready: false },
  );

  useEffect(() => {
    if (!isLoading) {
      setTriggers((prev) => {
        if (prev.ready) {
          return prev;
        }
        return { ...prev, ready: true };
      });
    }
  }, [isLoading]);

  const renderedTriggers: Triggers = {
    httpTriggers: triggers?.httpTriggers || routines?.httpTriggers || [],
    cronTriggers: triggers?.cronTriggers || routines?.cronTriggers || [],
  };
  const _renderedTriggers = useRef(renderedTriggers);
  _renderedTriggers.current = renderedTriggers;

  const saveCb = useAsyncCallback(async (triggers) => {
    const result = await saveTriggers(project.projectId, triggers);

    commands.trigger("update:project-details", result.details);
    tabs.markClean(tabs.activeTab?.tabId ?? "");
    setTriggers({ ready: true });
  }, {});

  const [highlightHttpIndex, setHighlightHttpIndex] = useState<number | null>(
    null,
  );
  const [highlightCronIndex, setHighlightCronIndex] = useState<number | null>(
    null,
  );

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setHighlightHttpIndex(null);
    }, 3000);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [highlightHttpIndex]);
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setHighlightCronIndex(null);
    }, 3000);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [highlightCronIndex]);

  const saveTimeout = useRef<NodeJS.Timeout | null>(null);
  // Auto-save changes after 5 second of inactivity
  const handleChange = useCallback((change: Partial<Triggers>) => {
    setTriggers((prev) => {
      const updatedTriggers = prev
        ? { ...prev, ...change }
        : { ...change, ready: true };
      // TODO: Ensure that the triggers are valid before saving, and show errors if not

      if (saveTimeout.current) {
        clearTimeout(saveTimeout.current);
      }

      saveTimeout.current = setTimeout(() => {
        saveCb.callback(updatedTriggers);
      }, 5000);

      return updatedTriggers;
    });
  }, []);

  // listen for add trigger command
  useEffect(() => {
    return commands.on("settings:triggers:add:internal", (data) => {
      const httpProps = Object.keys(createHttpTrigger({}));
      const cronProps = Object.keys(createCronTrigger({}));
      const sharedProps = httpProps.filter((prop) => cronProps.includes(prop));

      // determine what type of trigger to add based on the presence of certain properties
      const isHttpTrigger = Object.keys(data).some(
        (key) => httpProps.includes(key) && !sharedProps.includes(key),
      );
      const isCronTrigger = Object.keys(data).some(
        (key) => cronProps.includes(key) && !sharedProps.includes(key),
      );

      if (isHttpTrigger === isCronTrigger) {
        // in this case, we need to show a window for the user to select the type of trigger they want to create
        console.error("Unable to determine trigger type for data", data);
        return;
      }

      const triggers = _renderedTriggers.current;

      if (isHttpTrigger) {
        const newTrigger: HttpTrigger = createHttpTrigger(data);

        handleChange({
          httpTriggers: [...triggers.httpTriggers, newTrigger],
        });
        setHighlightHttpIndex(triggers.httpTriggers.length);
        return;
      }

      if (isCronTrigger) {
        const newTrigger: CronTrigger = createCronTrigger(data);

        handleChange({
          cronTriggers: [...triggers.cronTriggers, newTrigger],
        });
        setHighlightCronIndex(triggers.cronTriggers.length);
        return;
      }
    });
  }, [commands]);

  const hasChanges =
    triggers && (triggers.httpTriggers || triggers.cronTriggers);

  return (
    <div className="h-100 overflow-auto p-3 d-flex flex-column gap-3 w-100">
      {/* Add a status bar to show the current save and loading states */}
      <div className="d-flex align-items-center gap-2 justify-content-between">
        <h3 className="m-0">Entrypoints</h3>

        <div>
          {isLoading && <Spinner animation="border" size="sm" />}
          <span className="small text-muted">
            {isLoading && "Loading..."}
            {!isLoading && !saveCb.isLoading && hasChanges && "Unsaved changes"}
          </span>

          <IconButton
            icon="save"
            size="sm"
            variant="outline-success"
            className="ms-2"
            disabled={saveCb.isLoading || !hasChanges}
            spinner={saveCb.isLoading}
            onClick={() => saveCb.callback(renderedTriggers)}
          >
            Save
          </IconButton>
        </div>
      </div>

      <hr className="mb-1 mt-0" />

      <ShowError error={error} />
      <ShowError error={saveCb.error} />

      <section className="px-1 py-1">
        <ShowHttpTriggers
          httpTriggers={renderedTriggers.httpTriggers}
          setHttpTriggers={(httpTriggers) => {
            handleChange({ httpTriggers });
          }}
          environments={allEnvs || []}
          highlightIndex={highlightHttpIndex}
        />
      </section>

      <hr className="my-2" />

      <section className="px-1 py-1">
        <ShowCronTriggers
          cronTriggers={renderedTriggers.cronTriggers}
          setCronTriggers={(cronTriggers) => {
            handleChange({ cronTriggers });
          }}
          environments={allEnvs || []}
          highlightIndex={highlightCronIndex}
        />
      </section>
    </div>
  );
}

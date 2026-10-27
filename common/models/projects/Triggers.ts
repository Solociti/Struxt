import { DeepPartial, mergeDeep } from "../utils";

export interface HttpTrigger {
  /**
   * The public endpoint for the trigger.
   */
  endpoint: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

  /**
   * The id of the asset this trigger calls.
   */
  assetId: string;

  /**
   * The exported function from the asset that this trigger calls.
   */
  handler: string;

  /**
   * The routine environment this trigger is associated with.
   */
  environmentId: string;
}

/**
 * Setup the default values for a new HttpTrigger
 *
 * @param overrides
 */
export function createHttpTrigger(
  overrides?: DeepPartial<HttpTrigger>,
): HttpTrigger {
  const defaultTrigger: HttpTrigger = {
    endpoint: "",
    method: "GET",
    assetId: "",
    handler: "",
    environmentId: "",
  };

  return mergeDeep<HttpTrigger>(defaultTrigger, overrides ?? {});
}

/**
 * Validates that a HttpTrigger has all required properties filled out.
 *
 * @param trigger
 */
export function getHttpTriggerInvalid(trigger: HttpTrigger): string[] {
  const invalidProps = [];

  if (!trigger.environmentId) {
    invalidProps.push("environmentId");
  }

  if (!trigger.endpoint) {
    invalidProps.push("endpoint");
  }
  if (!["GET", "POST", "PUT", "PATCH", "DELETE"].includes(trigger.method)) {
    invalidProps.push("method");
  }

  if (!trigger.assetId) {
    invalidProps.push("assetId");
  }

  return invalidProps;
}

export interface CronTrigger {
  /**
   * The cron expression for the trigger.
   */
  cronExpression: string;

  /**
   * The id of the asset this trigger calls.
   */
  assetId: string;

  /**
   * The exported function from the asset that this trigger calls.
   */
  handler: string;

  /**
   * The routine environment this trigger is associated with.
   */
  environmentId: string;
}

/**
 * Setup the default values for a new CronTrigger
 *
 * @param overrides
 */
export function createCronTrigger(
  overrides?: DeepPartial<CronTrigger>,
): CronTrigger {
  const defaultTrigger: CronTrigger = {
    cronExpression: "",
    assetId: "",
    handler: "",
    environmentId: "",
  };

  return mergeDeep<CronTrigger>(defaultTrigger, overrides ?? {});
}

/**
 * Validates that a CronTrigger has all required properties filled out.
 *
 * @param trigger
 */
export function getCronTriggerInvalid(trigger: CronTrigger): string[] {
  const invalidProps = [];

  if (!trigger.environmentId) {
    invalidProps.push("environmentId");
  }

  if (!trigger.cronExpression) {
    invalidProps.push("cronExpression");
  }

  if (!trigger.assetId) {
    invalidProps.push("assetId");
  }

  return invalidProps;
}

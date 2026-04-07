import { mergeDeep } from "../utils";
import { HttpTrigger } from "./Triggers";

export interface PublishedProjectStaticConfig {
  /**
   * The unique id for the publish this config belongs to.
   */
  publishUuid: string;

  /**
   * ISO date string of when this project was published
   */
  publishedDateISO: string;

  /**
   * List of endpoints we need to forward to fission.
   */
  endpoints: {
    /**
     * The uuid of the routine environment this endpoint belongs to.
     *
     * Used for metrics and logging
     */
    routineUuid: string;

    /**
     * Trigger method
     */
    method: HttpTrigger["method"];

    /**
     * The http endpoint to listen for.
     *
     * This can be a wildcard endpoint like express.
     */
    httpTrigger: string;

    /**
     * The fission endpoint to forward requests to.
     */
    fissionEndpoint: string;
  }[];
}

/**
 * Setup the published project config with default values for any missing fields.
 *
 * @param config
 * @returns
 */
export function setupPublishedProjectStaticConfig(
  config: Partial<PublishedProjectStaticConfig>,
): PublishedProjectStaticConfig {
  const defaultConfig: PublishedProjectStaticConfig = {
    publishUuid: "",
    publishedDateISO: new Date().toISOString(),
    endpoints: [],
  };

  if (config.endpoints) {
    for (const endpoint of config.endpoints) {
      const defaultEndpoint: PublishedProjectStaticConfig["endpoints"][number] =
        {
          routineUuid: "",
          method: "GET",
          httpTrigger: "",
          fissionEndpoint: "",
        };

      defaultConfig.endpoints.push(mergeDeep(defaultEndpoint, endpoint));
    }
  }

  return mergeDeep(defaultConfig, config, ["endpoints"]);
}

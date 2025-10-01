interface DebounceOptions {
  delayMs?: number;
  maxDelayMs?: number;
}

interface DebounceResult<Params extends any[]> {
  trigger: (...args: Params) => void;
}

/**
 * Debounce a function call, ensuring it's only called after a certain delay
 *
 * @param callback
 * @param options
 * @returns
 */
export default function debounce<Cb extends (...args: any[]) => any>(
  callback: Cb,
  options: DebounceOptions = {}
): DebounceResult<Parameters<Cb>> {
  const { delayMs = 250, maxDelayMs = Infinity } = options;

  let timeoutId: NodeJS.Timeout | null = null;
  let maxTimeoutId: NodeJS.Timeout | null = null;

  let lastArgs: Parameters<Cb> | [] = [];

  const trigger = (...args: Parameters<Cb>) => {
    lastArgs = args;

    // Clear existing timeout
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    // Set up max delay timeout if not already set and maxDelayMs is finite
    if (!maxTimeoutId && maxDelayMs !== Infinity) {
      maxTimeoutId = setTimeout(() => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }

        callback(...lastArgs);

        lastArgs = [];
        timeoutId = null;
        maxTimeoutId = null;
      }, maxDelayMs);
    }

    timeoutId = setTimeout(() => {
      if (maxTimeoutId) {
        clearTimeout(maxTimeoutId);
        maxTimeoutId = null;
      }

      callback(...lastArgs);
      lastArgs = [];
      timeoutId = null;
    }, delayMs);
  };

  return { trigger };
}

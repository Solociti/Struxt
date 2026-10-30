import { once } from "node:events";
import { type WriteStream } from "node:fs";
import { Writable } from "node:stream";
import { finished } from "node:stream/promises";

/**
 * Writable that targets `inner` and runs `commit` (e.g. a rename) as part of
 * the stream's own completion. `finish` is only emitted after `commit`
 * succeeds, and a commit error is surfaced as a stream error, so
 * `pipeline()` / `finished()` observe both.
 */
export default class CommitOnFinishStream extends Writable {
  private committed = false;

  constructor(
    private readonly inner: WriteStream,
    private readonly commit: () => Promise<void>,
    private readonly cleanup: () => Promise<void>,
    encoding?: BufferEncoding,
  ) {
    super({ defaultEncoding: encoding ?? "utf8" });
    inner.on("error", (err) => this.destroy(err));
  }

  _write(
    chunk: Buffer,
    _encoding: BufferEncoding,
    callback: (error?: Error | null) => void,
  ) {
    // inner.write's callback fires once the chunk is flushed -> backpressure
    this.inner.write(chunk, callback);
  }

  _final(callback: (error?: Error | null) => void) {
    this.inner.end();
    // finished() on a write stream resolves after 'close', so the fd is
    // released before the rename (matters on Windows)
    finished(this.inner)
      .then(() => this.commit())
      .then(() => {
        this.committed = true;
        callback();
      })
      .catch(callback);
  }

  _destroy(err: Error | null, callback: (error?: Error | null) => void) {
    const done = async () => {
      this.inner.destroy();
      if (this.committed) {
        // normal completion, nothing to clean up
        return;
      }

      if (!this.inner.closed) {
        await once(this.inner, "close");
      }
      await this.cleanup();
    };
    done().then(
      () => callback(err),
      (cleanupErr) => callback(err ?? cleanupErr),
    );
  }
}

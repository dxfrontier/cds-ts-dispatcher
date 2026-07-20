import util from '../util';

import type { Readable } from 'stream';
import type { ServerResponse } from 'http';

/**
 * Utility object for handling `@Stream` streaming operations (`@sap/cds` 10 streaming reads).
 */
const streamUtil = {
  /**
   * Duck-type check whether a value is a `Readable` stream (an object exposing a `.pipe` function).
   * @param value The value to check.
   * @returns True if the value is a readable stream, otherwise false.
   */
  isReadableStream(value: unknown): value is Readable {
    return (
      !util.lodash.isNil(value) && typeof value === 'object' && typeof (value as { pipe?: unknown }).pipe === 'function'
    );
  },

  /**
   * Pipes a `Readable` stream to the HTTP response, setting the content type and wiring up error handling.
   *
   * Headers are flushed `synchronously` (so the protocol adapter observes `res.headersSent` and does not
   * write its own response), and the returned promise resolves only once the stream has been fully piped -
   * this keeps the handler's promise pending until streaming completes.
   *
   * `Source teardown is guaranteed`: `stream.pipe(res)` does NOT propagate destination `close` / `error`
   * back to the source, so the source is destroyed explicitly on both a stream `'error'` (which also
   * destroys the response, so a broken producer does not hang the connection) and a response `'close'`
   * (e.g. the client disconnected mid-stream) - otherwise a long-running database stream would keep its
   * cursor/connection open on every aborted download.
   * @param res The HTTP (express) response object.
   * @param stream The readable stream to pipe.
   * @param contentType The `Content-Type` header to set on the response.
   * @returns A promise that resolves when the response finishes (or rejects on stream error).
   */
  pipeToResponse(res: ServerResponse, stream: Readable, contentType: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      res.setHeader('Content-Type', contentType);
      res.flushHeaders();

      stream.on('error', (error) => {
        stream.destroy();
        res.destroy();
        reject(error);
      });

      // `finish` = response fully sent.
      res.on('finish', () => resolve());

      // `close` = connection closed (e.g. client disconnected mid-stream). Destroy the source to free
      // its underlying resource (e.g. a database cursor); resolving keeps the handler promise from hanging.
      res.on('close', () => {
        stream.destroy();
        resolve();
      });

      stream.pipe(res);
    });
  },
};

export default streamUtil;
